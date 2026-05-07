// Tiny WebAudio engine. We synthesize:
//   - engine hum (low triangle + slow LFO)
//   - wind (filtered noise)
//   - rain (filtered noise + crackle)
//   - thunder (rare low rumble)
//   - radio static (white noise gated by station)
//   - station "music" (a few sine notes per station — ambient drone, not real music)
//
// Everything is procedural so we never ship audio assets.
// We keep nodes long-lived; gain envelopes do all the smooth ducking.

import type {
  RadioStationId,
  Settings,
  WeatherId,
  World,
} from "../engine/types";

type AudioRefs = {
  ctx: AudioContext;
  master: GainNode;
  // ambience
  engine: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode };
  wind: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode };
  rain: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode };
  // radio
  radio: {
    static: { src: AudioBufferSourceNode; gain: GainNode };
    pad1: OscillatorNode;
    pad1Gain: GainNode;
    pad2: OscillatorNode;
    pad2Gain: GainNode;
    pad3: OscillatorNode;
    pad3Gain: GainNode;
    bus: GainNode;
  };
};

let refs: AudioRefs | null = null;
let started = false;

function makeNoiseBuffer(ctx: AudioContext, seconds = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export async function ensureAudio(settings: Settings): Promise<void> {
  if (refs) return;
  // @ts-expect-error vendor prefix fallback
  const Ctx: typeof AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* swallow */
    }
  }

  const master = ctx.createGain();
  master.gain.value = settings.muted ? 0 : 0.45;
  master.connect(ctx.destination);

  // Engine hum
  const eg = ctx.createGain();
  eg.gain.value = 0.0;
  const eo = ctx.createOscillator();
  eo.type = "triangle";
  eo.frequency.value = 70;
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.4;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 6;
  lfo.connect(lfoGain).connect(eo.frequency);
  eo.connect(eg).connect(master);
  eo.start();
  lfo.start();

  // Wind
  const noiseBuf = makeNoiseBuffer(ctx, 4);
  const ws = ctx.createBufferSource();
  ws.buffer = noiseBuf;
  ws.loop = true;
  const wf = ctx.createBiquadFilter();
  wf.type = "lowpass";
  wf.frequency.value = 800;
  wf.Q.value = 0.4;
  const wg = ctx.createGain();
  wg.gain.value = 0;
  ws.connect(wf).connect(wg).connect(master);
  ws.start();

  // Rain
  const rs = ctx.createBufferSource();
  rs.buffer = noiseBuf;
  rs.loop = true;
  const rf = ctx.createBiquadFilter();
  rf.type = "highpass";
  rf.frequency.value = 1800;
  const rg = ctx.createGain();
  rg.gain.value = 0;
  rs.connect(rf).connect(rg).connect(master);
  rs.start();

  // Radio bus
  const radioBus = ctx.createGain();
  radioBus.gain.value = 0.6;
  radioBus.connect(master);

  // Static
  const staticSrc = ctx.createBufferSource();
  staticSrc.buffer = noiseBuf;
  staticSrc.loop = true;
  const staticFilter = ctx.createBiquadFilter();
  staticFilter.type = "bandpass";
  staticFilter.frequency.value = 2400;
  staticFilter.Q.value = 0.7;
  const staticGain = ctx.createGain();
  staticGain.gain.value = 0;
  staticSrc.connect(staticFilter).connect(staticGain).connect(radioBus);
  staticSrc.start();

  // Three-voice ambient pad. Voice frequencies retuned per station.
  const pad1 = ctx.createOscillator();
  const pad2 = ctx.createOscillator();
  const pad3 = ctx.createOscillator();
  pad1.type = "sine";
  pad2.type = "sine";
  pad3.type = "triangle";
  const p1g = ctx.createGain();
  const p2g = ctx.createGain();
  const p3g = ctx.createGain();
  p1g.gain.value = 0;
  p2g.gain.value = 0;
  p3g.gain.value = 0;
  // Soft lowpass for pad
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 1200;
  pad1.connect(p1g).connect(padFilter);
  pad2.connect(p2g).connect(padFilter);
  pad3.connect(p3g).connect(padFilter);
  padFilter.connect(radioBus);
  pad1.start();
  pad2.start();
  pad3.start();

  refs = {
    ctx,
    master,
    engine: { osc: eo, gain: eg, lfo, lfoGain },
    wind: { src: ws, filter: wf, gain: wg },
    rain: { src: rs, filter: rf, gain: rg },
    radio: {
      static: { src: staticSrc, gain: staticGain },
      pad1,
      pad1Gain: p1g,
      pad2,
      pad2Gain: p2g,
      pad3,
      pad3Gain: p3g,
      bus: radioBus,
    },
  };
}

export function disposeAudio() {
  if (!refs) return;
  try {
    refs.ctx.close();
  } catch {
    /* ignore */
  }
  refs = null;
}

// Smooth-set (ramp) helper
function ramp(g: AudioParam, target: number, ctx: AudioContext, time = 0.4) {
  const now = ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(target, now + time);
}

const STATION_FREQS: Record<RadioStationId, number[]> = {
  // Three frequencies per station chosen to sound vaguely tonal.
  synthwave: [110, 165, 220], // A2, E3, A3
  lofi: [98, 146.83, 196], // G2, D3, G3
  survival: [82.4, 123.47, 164.81], // E2, B2, E3 — tense
  emergency: [220, 220, 220], // unison drone
  static: [100, 100, 100],
  off: [0, 0, 0],
};

export function syncAudioFromWorld(world: World) {
  if (!refs) return;
  const { ctx } = refs;
  if (!started) {
    started = true;
  }
  const settings = world.settings;
  ramp(refs.master.gain, settings.muted ? 0 : 0.45, ctx, 0.5);

  // Engine ramps with speed
  const engineGain = 0.06 + settings.speed * 0.18;
  ramp(refs.engine.gain.gain, engineGain, ctx, 0.6);
  refs.engine.osc.frequency.setTargetAtTime(
    60 + settings.speed * 90,
    ctx.currentTime,
    0.4
  );

  // Wind: scales with speed and sandstorm/snow weather
  const w = world.resolvedWeather;
  const windBoost: Record<WeatherId, number> = {
    clear: 0.05,
    rain: 0.1,
    thunder: 0.16,
    snow: 0.12,
    fog: 0.08,
    ash: 0.12,
    meteors: 0.05,
    neon_rain: 0.1,
    sandstorm: 0.3,
  };
  ramp(refs.wind.gain.gain, windBoost[w] + settings.speed * 0.05, ctx, 0.7);

  // Rain
  const rainBoost: Record<WeatherId, number> = {
    clear: 0,
    rain: 0.22,
    thunder: 0.28,
    snow: 0.0,
    fog: 0.0,
    ash: 0.05,
    meteors: 0.0,
    neon_rain: 0.2,
    sandstorm: 0.06,
  };
  ramp(refs.rain.gain.gain, rainBoost[w], ctx, 0.7);

  // Radio routing
  const station = settings.station;
  const apoc = settings.reality / 100;
  // Static gain: high on "static" station, low elsewhere; rises with apoc.
  let staticG = 0;
  if (station === "static") staticG = 0.18;
  else if (station === "emergency") staticG = 0.05;
  else if (station === "off") staticG = 0;
  else staticG = 0.025;
  staticG += apoc * 0.08;
  ramp(refs.radio.static.gain.gain, staticG, ctx, 0.4);

  // Pad voices: muted when off/static, otherwise station-dependent.
  const freqs = STATION_FREQS[station];
  const padOn = station !== "off" && station !== "static";
  // gentle detune wobble for warmth
  const wob = Math.sin(world.t * 0.3) * 1.5;
  refs.radio.pad1.frequency.setTargetAtTime(
    freqs[0] + wob,
    ctx.currentTime,
    0.6
  );
  refs.radio.pad2.frequency.setTargetAtTime(
    freqs[1] - wob,
    ctx.currentTime,
    0.6
  );
  refs.radio.pad3.frequency.setTargetAtTime(
    freqs[2] + wob * 0.5,
    ctx.currentTime,
    0.6
  );
  const padBaseGain = padOn ? (station === "emergency" ? 0.05 : 0.07) : 0.0;
  // Slow tremolo
  const trem = (Math.sin(world.t * 0.5) + 1) * 0.5;
  ramp(refs.radio.pad1Gain.gain, padBaseGain * (0.7 + 0.3 * trem), ctx, 0.7);
  ramp(refs.radio.pad2Gain.gain, padBaseGain * (0.7 + 0.3 * (1 - trem)), ctx, 0.7);
  ramp(refs.radio.pad3Gain.gain, padBaseGain * 0.6, ctx, 0.7);

  // Apocalypse warps the radio bus pitch slowly
  if (apoc > 0.4) {
    refs.radio.pad1.detune.setTargetAtTime(
      Math.sin(world.t * 0.7) * apoc * 80,
      ctx.currentTime,
      0.3
    );
    refs.radio.pad2.detune.setTargetAtTime(
      Math.sin(world.t * 1.1 + 1) * apoc * 80,
      ctx.currentTime,
      0.3
    );
  } else {
    refs.radio.pad1.detune.setTargetAtTime(0, ctx.currentTime, 0.5);
    refs.radio.pad2.detune.setTargetAtTime(0, ctx.currentTime, 0.5);
  }
}

// Trigger a short low-frequency rumble for thunder.
export function thunderBoom(intensity = 1) {
  if (!refs) return;
  const { ctx, master } = refs;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.value = 50;
  const g = ctx.createGain();
  g.gain.value = 0;
  o.connect(g).connect(master);
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.35 * intensity, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
  o.frequency.setValueAtTime(80, now);
  o.frequency.exponentialRampToValueAtTime(35, now + 1.5);
  o.start();
  o.stop(now + 1.7);
}
