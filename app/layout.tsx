import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

/* =========================================================
   NACHTKRONE — ROOT LAYOUT
   app/layout.tsx
   ========================================================= */

/* =========================================================
   POLICES
   ========================================================= */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/* =========================================================
   MÉTADONNÉES GLOBALES
   ========================================================= */

export const metadata: Metadata = {
  title: {
    default: "NACHTKRONE",
    template: "%s | NACHTKRONE",
  },

  description:
    "NACHTKRONE — Boutique premium de masques, costumes et accessoires Krampus.",

  applicationName: "NACHTKRONE",

  authors: [
    {
      name: "NACHTKRONE",
    },
  ],

  creator: "NACHTKRONE",
  publisher: "NACHTKRONE",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

/* =========================================================
   VIEWPORT
   ========================================================= */

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/* =========================================================
   TYPES
   ========================================================= */

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

/* =========================================================
   ROOT LAYOUT
   ========================================================= */

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}