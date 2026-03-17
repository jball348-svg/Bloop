import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "reactflow/dist/style.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });


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
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
