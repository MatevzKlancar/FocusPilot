import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FocusPilot - AI Productivity Coach",
  description:
    "Transform your productivity with AI-powered goal setting, task management, and streak tracking.",
  keywords: ["productivity", "goals", "tasks", "AI coach", "habits", "focus"],
  authors: [{ name: "FocusPilot Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
