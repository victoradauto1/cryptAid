import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CryptoAidProvider } from "@/context/cryptoAidProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CryptoAid",
  description:
    "Platform for creating campaigns and providing support via crypto.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
          min-h-screen
          flex
          flex-col
          bg-background
          text-foreground
        `}
      >
        <Header />

        <main className="flex-1">
          <CryptoAidProvider>{children}</CryptoAidProvider>
        </main>

        <Footer />
      </body>
    </html>
  );
}
