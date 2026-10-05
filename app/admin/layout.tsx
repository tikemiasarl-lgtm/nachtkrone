import type { Metadata } from "next";
import type { ReactNode } from "react";

import AdminShell from "@/components/admin/AdminShell";

/* =========================================================
   NACHTKRONE — LAYOUT ADMIN
   app/admin/layout.tsx
   ========================================================= */

export const metadata: Metadata = {
  title: {
    default: "Administration | NACHTKRONE",
    template: "%s | NACHTKRONE",
  },
  description:
    "Espace d'administration de la boutique NACHTKRONE.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

/* =========================================================
   LAYOUT
   ========================================================= */

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}