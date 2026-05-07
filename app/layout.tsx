import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiny Procedural Roadtrip",
  description:
    "A tiny lonely journey through infinite realities. An ambient procedural roadtrip simulation toy.",
  applicationName: "Tiny Procedural Roadtrip",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#06050d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-mono antialiased select-none">{children}</body>
    </html>
  );
}
