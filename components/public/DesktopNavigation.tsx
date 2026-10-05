"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import {
  PUBLIC_ROUTES,
  type PublicProductCategory,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — DESKTOP NAVIGATION

   Navigation principale affichée uniquement sur ordinateur.

   Structure :
   - Startseite
   - Produkte
       - Alle Produkte
       - Masken
       - Kostüme
       - Masken & Kostüme
   - Kontakt

   Le composant parent PublicHeader.tsx gère déjà
   l'affichage desktop/mobile.
   ========================================================= */

type ProductMenuItem = {
  label: string;
  href: string;
  category?: PublicProductCategory;
};

const PRODUCT_MENU_ITEMS: readonly ProductMenuItem[] = [
  {
    label: "Alle Produkte",
    href: PUBLIC_ROUTES.products,
  },
  {
    label: "Masken",
    href: PUBLIC_ROUTES.masks,
    category: "MASK",
  },
  {
    label: "Kostüme",
    href: PUBLIC_ROUTES.costumes,
    category: "COSTUME",
  },
  {
    label: "Masken & Kostüme",
    href: PUBLIC_ROUTES.sets,
    category: "MASK_AND_COSTUME",
  },
] as const;

export default function DesktopNavigation() {
  const pathname = usePathname();

  const [productsOpen, setProductsOpen] = useState(false);

  const homeActive = pathname === "/";

  const productsActive =
    pathname === PUBLIC_ROUTES.products ||
    pathname.startsWith(`${PUBLIC_ROUTES.products}/`);

  const contactActive =
    pathname === PUBLIC_ROUTES.contact ||
    pathname.startsWith(`${PUBLIC_ROUTES.contact}/`);

  function closeProductsMenu() {
    setProductsOpen(false);
  }

  return (
    <nav
      aria-label="Hauptnavigation"
      className="flex min-w-0 items-center"
    >
      <div className="flex min-w-0 items-center gap-1 xl:gap-2">
        {/* =================================================
            STARTSEITE
           ================================================= */}

        <Link
          href={PUBLIC_ROUTES.home}
          aria-current={homeActive ? "page" : undefined}
          className={[
            "relative flex h-11 items-center rounded-xl px-3.5",
            "text-sm font-semibold transition-colors duration-200",
            "focus:outline-none focus-visible:ring-2",
            "focus-visible:ring-white/60",
            homeActive
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
          ].join(" ")}
        >
          Startseite

          {homeActive ? (
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 left-3.5 right-3.5 h-0.5 rounded-full bg-[#2f7df4]"
            />
          ) : null}
        </Link>

        {/* =================================================
            PRODUKTE + SOUS-MENU
           ================================================= */}

        <div
          className="relative"
          onMouseEnter={() => setProductsOpen(true)}
          onMouseLeave={() => setProductsOpen(false)}
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={productsOpen}
            onClick={() =>
              setProductsOpen((current) => !current)
            }
            className={[
              "relative flex h-11 items-center gap-1.5 rounded-xl px-3.5",
              "text-sm font-semibold transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2",
              "focus-visible:ring-white/60",
              productsActive
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")}
          >
            <span>Produkte</span>

            <ChevronDown
              aria-hidden="true"
              strokeWidth={2}
              className={[
                "h-4 w-4 transition-transform duration-200",
                productsOpen ? "rotate-180" : "rotate-0",
              ].join(" ")}
            />

            {productsActive ? (
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-3.5 right-3.5 h-0.5 rounded-full bg-[#2f7df4]"
              />
            ) : null}
          </button>

          {/* Zone de liaison invisible entre le bouton
              et le menu afin d'éviter sa fermeture
              pendant le déplacement de la souris. */}
          {productsOpen ? (
            <div
              aria-hidden="true"
              className="absolute left-0 top-full h-3 w-full"
            />
          ) : null}

          <div
            className={[
              "absolute left-0 top-[calc(100%+8px)] z-[70]",
              "w-[260px] origin-top-left",
              "transition-all duration-150",
              productsOpen
                ? "visible translate-y-0 opacity-100"
                : "invisible -translate-y-1 opacity-0 pointer-events-none",
            ].join(" ")}
          >
            <div
              role="menu"
              aria-label="Produktkategorien"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
            >
              <div className="px-3 pb-2 pt-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Produkte
                </p>
              </div>

              <div className="space-y-1">
                {PRODUCT_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={closeProductsMenu}
                    className="group flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:bg-slate-100 focus-visible:text-slate-950"
                  >
                    <span>{item.label}</span>

                    <span
                      aria-hidden="true"
                      className="translate-x-0 text-base text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#1769e0]"
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            KONTAKT
           ================================================= */}

        <Link
          href={PUBLIC_ROUTES.contact}
          aria-current={contactActive ? "page" : undefined}
          className={[
            "relative flex h-11 items-center rounded-xl px-3.5",
            "text-sm font-semibold transition-colors duration-200",
            "focus:outline-none focus-visible:ring-2",
            "focus-visible:ring-white/60",
            contactActive
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
          ].join(" ")}
        >
          Kontakt

          {contactActive ? (
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 left-3.5 right-3.5 h-0.5 rounded-full bg-[#2f7df4]"
            />
          ) : null}
        </Link>
      </div>
    </nav>
  );
}