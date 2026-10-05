"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingBag,
  Store,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import {
  MOBILE_NAVIGATION,
  type MobileNavigationItemId,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — MOBILE BOTTOM NAVIGATION
   components/public/MobileBottomNavigation.tsx

   Navigation principale mobile fixe en bas de l'écran.

   Boutons :
   - Startseite
   - Produkte
   - Warenkorb
   - Kontakt

   Important :
   - uniquement mobile / tablette
   - aucun footer mobile
   - WhatsApp reste un bouton flottant séparé
   - compatible avec lib/public-navigation.ts
   ========================================================= */

/* =========================================================
   ICÔNES
   ========================================================= */

const NAVIGATION_ICONS: Record<
  MobileNavigationItemId,
  LucideIcon
> = {
  home: Home,
  products: Store,
  cart: ShoppingBag,
  contact: MessageCircle,
};

/* =========================================================
   DÉTECTION DE LA PAGE ACTIVE
   ========================================================= */

function isNavigationItemActive(
  id: MobileNavigationItemId,
  pathname: string
): boolean {
  switch (id) {
    case "home":
      return pathname === "/";

    case "products":
      return (
        pathname === "/produkte" ||
        pathname.startsWith("/produkte/")
      );

    case "cart":
      return (
        pathname === "/warenkorb" ||
        pathname.startsWith("/warenkorb/")
      );

    case "contact":
      return (
        pathname === "/kontakt" ||
        pathname.startsWith("/kontakt/")
      );

    default:
      return false;
  }
}

/* =========================================================
   COMPOSANT
   ========================================================= */

export default function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* =====================================================
          ESPACE DE SÉCURITÉ

          Cette zone évite que le dernier contenu d'une page
          soit caché derrière la navigation fixe.

          Le layout possède déjà un padding inférieur.
          Ce composant reste donc visuellement indépendant.
         ===================================================== */}

      <nav
        aria-label="Mobile Hauptnavigation"
        className="
          fixed
          inset-x-0
          bottom-0
          z-[60]
          border-t
          border-slate-200/90
          bg-white/95
          shadow-[0_-8px_30px_rgba(15,23,42,0.10)]
          backdrop-blur-xl
          lg:hidden
        "
      >
        {/* ===================================================
            NAVIGATION
           =================================================== */}

        <div
          className="
            mx-auto
            grid
            h-[68px]
            w-full
            max-w-xl
            grid-cols-4
            items-stretch
            px-1
          "
        >
          {MOBILE_NAVIGATION.map((item) => {
            const Icon = NAVIGATION_ICONS[item.id];

            const active = isNavigationItemActive(
              item.id,
              pathname
            );

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative flex min-w-0 flex-col",
                  "items-center justify-center gap-1",
                  "rounded-xl px-1",
                  "transition-colors duration-200",
                  "focus:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-inset",
                  "focus-visible:ring-[#1769e0]/40",
                  active
                    ? "text-[#1769e0]"
                    : "text-slate-500 hover:text-slate-900",
                ].join(" ")}
              >
                {/* ===========================================
                    INDICATEUR ACTIF
                   =========================================== */}

                <span
                  aria-hidden="true"
                  className={[
                    "absolute left-1/2 top-0",
                    "h-[3px] -translate-x-1/2",
                    "rounded-b-full",
                    "transition-all duration-200",
                    active
                      ? "w-8 bg-[#1769e0] opacity-100"
                      : "w-0 bg-transparent opacity-0",
                  ].join(" ")}
                />

                {/* ===========================================
                    ICÔNE
                   =========================================== */}

                <span
                  className={[
                    "relative flex h-7 w-10",
                    "items-center justify-center",
                    "rounded-xl",
                    "transition-all duration-200",
                    active
                      ? "bg-[#1769e0]/10"
                      : "bg-transparent group-hover:bg-slate-100",
                  ].join(" ")}
                >
                  <Icon
                    aria-hidden="true"
                    strokeWidth={active ? 2.4 : 2}
                    className={[
                      "h-[21px] w-[21px]",
                      "transition-transform duration-200",
                      active
                        ? "scale-105"
                        : "scale-100",
                    ].join(" ")}
                  />

                  {/* =========================================
                      FUTUR COMPTEUR PANIER

                      Le compteur sera connecté au véritable
                      panier quand cette fonctionnalité sera
                      construite.

                      Aucun faux nombre n'est affiché.
                     ========================================= */}
                </span>

                {/* ===========================================
                    TEXTE
                   =========================================== */}

                <span
                  className={[
                    "max-w-full truncate",
                    "text-[10px] leading-none",
                    "sm:text-[11px]",
                    active
                      ? "font-bold"
                      : "font-semibold",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ===================================================
            SAFE AREA iPHONE / APPAREILS MOBILES

            env(safe-area-inset-bottom) permet d'éviter que
            la navigation soit collée sous la zone système
            sur les appareils compatibles.
           =================================================== */}

        <div
          aria-hidden="true"
          className="bg-white"
          style={{
            height: "env(safe-area-inset-bottom)",
          }}
        />
      </nav>
    </>
  );
}