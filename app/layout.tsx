import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LoggerInit } from "@/components/shared/LoggerInit";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
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
  title: {
    default: 'FormaCPV - Plateforme de Formation',
    template: '%s | FormaCPV',
  },
  description: 'Plateforme de formation interne — parcours, quiz et suivi de progression',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: 'FormaCPV - Plateforme de Formation',
    description: 'Plateforme de formation interne — parcours, quiz et suivi de progression',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'FormaCPV',
  },
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL) : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('forma-cpv-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoggerInit />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
