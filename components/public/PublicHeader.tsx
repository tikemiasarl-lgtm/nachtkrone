"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

import DesktopNavigation from "@/components/public/DesktopNavigation";
import MobileHeader from "@/components/public/MobileHeader";

import {
  PUBLIC_IMAGES,
  PUBLIC_NAVIGATION_TEXT,
  PUBLIC_ROUTES,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — PUBLIC HEADER
   components/public/PublicHeader.tsx

   Responsabilités :
   - Header principal de l'espace public
   - Header desktop
   - Header mobile
   - Logo NACHTKRONE
   - Navigation desktop
   - Recherche produits desktop
   - Accès au panier
   - Intégration du MobileHeader
   - Fermeture automatique de la recherche
     lors d'un changement de page

   IMPORTANT :
   - Le menu hamburger mobile est géré dans MobileHeader.tsx
   - PublicHeader ne duplique pas la logique mobile
   ========================================================= */

export default function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  /* =======================================================
     FERMETURE AUTOMATIQUE DE LA RECHERCHE
     AU CHANGEMENT DE PAGE

     On utilise useEffect au lieu de modifier un state
     directement pendant le rendu React.
     ======================================================= */

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  /* =======================================================
     RECHERCHE
     ======================================================= */

  function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query =
      searchValue.trim();

    if (!query) {
      return;
    }

    setSearchOpen(false);

    router.push(
      `${PUBLIC_ROUTES.products}?search=${encodeURIComponent(
        query
      )}`
    );
  }

  /* =======================================================
     OUVERTURE / FERMETURE RECHERCHE DESKTOP
     ======================================================= */

  function handleSearchToggle() {
    setSearchOpen(
      (current) => !current
    );
  }

  return (
    <>
      {/* ===================================================
          HEADER DESKTOP
         =================================================== */}

      <header className="sticky top-0 z-50 hidden border-b border-white/10 bg-[#07111f] text-white shadow-sm lg:block">
        {/* =================================================
            LIGNE PRINCIPALE
           ================================================= */}

        <div className="mx-auto flex h-[78px] w-full max-w-[1500px] items-center gap-6 px-6 xl:px-8 2xl:px-10">
          {/* ===============================================
              LOGO
             =============================================== */}

          <Link
            href={PUBLIC_ROUTES.home}
            aria-label="NACHTKRONE Startseite"
            className="relative flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <div className="relative h-[46px] w-[190px]">
              <Image
                src={PUBLIC_IMAGES.logo}
                alt="NACHTKRONE"
                fill
                priority
                sizes="190px"
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* ===============================================
              NAVIGATION DESKTOP
             =============================================== */}

          <div className="min-w-0 flex-1">
            <DesktopNavigation />
          </div>

          {/* ===============================================
              ACTIONS DESKTOP
             =============================================== */}

          <div className="flex shrink-0 items-center gap-2">
            {/* =============================================
                RECHERCHE
               ============================================= */}

            <button
              type="button"
              onClick={handleSearchToggle}
              aria-label={
                PUBLIC_NAVIGATION_TEXT.searchLabel
              }
              aria-expanded={searchOpen}
              aria-controls="nachtkrone-desktop-search-panel"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-white/20 hover:bg-white/[0.09] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {searchOpen ? (
                <X
                  className="h-5 w-5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : (
                <Search
                  className="h-5 w-5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
            </button>

            {/* =============================================
                PANIER
               ============================================= */}

            <Link
              href={PUBLIC_ROUTES.cart}
              aria-label={
                PUBLIC_NAVIGATION_TEXT.cartLabel
              }
              className="group relative flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.09] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <span className="relative flex items-center justify-center">
                <ShoppingBag
                  className="h-5 w-5"
                  strokeWidth={2}
                  aria-hidden="true"
                />

                {/*
                  Le badge avec le nombre réel d'articles
                  sera branché au moment de la création
                  du vrai système de panier.
                */}
              </span>

              <span>
                Warenkorb
              </span>
            </Link>
          </div>
        </div>

        {/* =================================================
            PANNEAU DE RECHERCHE DESKTOP
           ================================================= */}

        <div
          id="nachtkrone-desktop-search-panel"
          aria-hidden={!searchOpen}
          className={
            searchOpen
              ? "grid grid-rows-[1fr] border-t border-white/10 opacity-100 transition-[grid-template-rows,opacity,border-color] duration-200"
              : "pointer-events-none grid grid-rows-[0fr] border-t border-transparent opacity-0 transition-[grid-template-rows,opacity,border-color] duration-200"
          }
        >
          <div className="overflow-hidden">
            <div className="bg-[#091727]">
              <div className="mx-auto w-full max-w-[1500px] px-6 py-4 xl:px-8 2xl:px-10">
                {/* =========================================
                    FORMULAIRE DE RECHERCHE
                   ========================================= */}

                <form
                  onSubmit={handleSearchSubmit}
                  role="search"
                  className="relative mx-auto max-w-3xl"
                >
                  <label
                    htmlFor="nachtkrone-desktop-search"
                    className="sr-only"
                  >
                    {
                      PUBLIC_NAVIGATION_TEXT.searchLabel
                    }
                  </label>

                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <input
                    id="nachtkrone-desktop-search"
                    type="search"
                    value={searchValue}
                    onChange={(event) =>
                      setSearchValue(
                        event.target.value
                      )
                    }
                    placeholder={
                      PUBLIC_NAVIGATION_TEXT.searchPlaceholder
                    }
                    autoComplete="off"
                    spellCheck={false}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white px-12 pr-28 text-[15px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2f7df4] focus:ring-2 focus:ring-[#2f7df4]/20"
                  />

                  <button
                    type="submit"
                    disabled={
                      !searchValue.trim()
                    }
                    className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-[#1769e0] px-4 text-sm font-bold text-white transition hover:bg-[#0f5fcf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7df4]/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suchen
                  </button>
                </form>

                {/* =========================================
                    SUGGESTIONS CATÉGORIES
                   ========================================= */}

                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-400">
                  <span>
                    Masken
                  </span>

                  <span aria-hidden="true">
                    •
                  </span>

                  <span>
                    Kostüme
                  </span>

                  <span aria-hidden="true">
                    •
                  </span>

                  <span>
                    Masken &amp; Kostüme
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================
          HEADER MOBILE

          Le bouton hamburger ☰ que tu veux ajouter
          sera placé dans MobileHeader.tsx.

          PublicHeader affiche simplement MobileHeader
          sur les écrans inférieurs à lg.

          De cette manière le menu sera disponible sur
          toutes les pages publiques utilisant PublicHeader.
         =================================================== */}

      <div className="sticky top-0 z-50 lg:hidden">
        <MobileHeader />
      </div>
    </>
  );
}