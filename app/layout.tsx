import type { Metadata } from "next";
import "reactflow/dist/style.css";
import "./globals.css";
import ThemeController from "@/components/ThemeController";


export const metadata: Metadata = {
  title: "BLOOP | Visual Modular Sandbox",
  description: "A playful visual audio sandbox built for intuition.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeController />
        {children}
      </body>
    </html>
  );
}
