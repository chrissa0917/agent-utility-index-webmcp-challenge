import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chrissaautomates.com"),
  title: {
    default: "Agent Utility Index WebMCP Demo",
    template: "%s | Agent Utility Index WebMCP Demo"
  },
  description:
    "A WebMCP challenge demo where humans control research rules and agents update source-backed evidence in a shared browser board.",
  robots: {
    index: false,
    follow: true
  },
  openGraph: {
    title: "Agent Utility Index WebMCP Demo",
    description:
      "Humans control the rules. Agents control the research. Every verified claim needs a source.",
    url: "https://chrissaautomates.com/agent-utility-index/demo",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#0B0B0B"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
