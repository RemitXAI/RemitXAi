import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemitX AI - AI-Powered Cross-Border Payments",
  description: "Voice and text-powered AI agent for seamless cross-border payments. Send money and convert currencies with natural language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}