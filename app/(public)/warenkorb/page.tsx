
import type { Metadata } from "next";

import CartContents from "@/components/public/cart/CartContents";

/* =========================================================
   NACHTKRONE — WARENKORB
   app/(public)/warenkorb/page.tsx
========================================================= */

/* =========================================================
   MÉTADONNÉES
========================================================= */

export const metadata: Metadata = {
  title: "Warenkorb",

  description:
    "Überprüfe deine ausgewählten Krampusmasken, Kostüme und Sets im NACHTKRONE Warenkorb.",

  robots: {
    index: false,
    follow: false,
  },
};

/* =========================================================
   PAGE PANIER
========================================================= */

export default function CartPage() {
  return <CartContents />;
}
