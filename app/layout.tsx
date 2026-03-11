import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LoggerInit } from "@/components/shared/LoggerInit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FormaCPV - Plateforme de Formation",
  description: "Plateforme d'onboarding et de formation pour les employés",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoggerInit />
        {children}
      </body>
    </html>
  );
}
