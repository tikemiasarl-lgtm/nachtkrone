import type { Metadata, Viewport } from "next";
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
  /* -------------------------------------------------------
     TITRE
     ------------------------------------------------------- */

  title: {
    default: "NACHTKRONE",
    template: "%s | NACHTKRONE",
  },

  /* -------------------------------------------------------
     DESCRIPTION
     ------------------------------------------------------- */

  description:
    "NACHTKRONE — Premium Krampus Masken, Kostüme und ausgewählte Accessoires.",

  applicationName: "NACHTKRONE",

  /* -------------------------------------------------------
     AUTEUR / MARQUE
     ------------------------------------------------------- */

  authors: [
    {
      name: "NACHTKRONE",
    },
  ],

  creator: "NACHTKRONE",
  publisher: "NACHTKRONE",

  /* -------------------------------------------------------
     ICÔNES

     app/icon.png est également reconnu automatiquement
     par Next.js. La déclaration explicite permet de garder
     les métadonnées du projet claires.
     ------------------------------------------------------- */

  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },

  /* -------------------------------------------------------
     OPEN GRAPH

     Utilisé notamment lors du partage du site sur :
     - Facebook
     - WhatsApp
     - LinkedIn
     - Telegram
     - autres plateformes compatibles Open Graph

     L'image se trouve dans :
     app/reseaux.png
     ------------------------------------------------------- */

  openGraph: {
    type: "website",

    locale: "de_DE",

    siteName: "NACHTKRONE",

    title: "NACHTKRONE",

    description:
      "Premium Krampus Masken, Kostüme und ausgewählte Accessoires.",

    images: [
      {
        url: "/reseaux.png",
        width: 1200,
        height: 630,
        alt: "NACHTKRONE — Krampus Masken und Kostüme",
      },
    ],
  },

  /* -------------------------------------------------------
     X / TWITTER
     ------------------------------------------------------- */

  twitter: {
    card: "summary_large_image",

    title: "NACHTKRONE",

    description:
      "Premium Krampus Masken, Kostüme und ausgewählte Accessoires.",

    images: ["/reseaux.png"],
  },

  /* -------------------------------------------------------
     ROBOTS
     ------------------------------------------------------- */

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  /* -------------------------------------------------------
     DÉTECTION AUTOMATIQUE
     ------------------------------------------------------- */

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

/* =========================================================
   VIEWPORT
   ========================================================= */

export const viewport: Viewport = {
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
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}