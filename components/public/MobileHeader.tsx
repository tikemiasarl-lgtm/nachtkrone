"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

import MobileMenu from "@/components/public/MobileMenu";

import {
  PUBLIC_IMAGES,
  PUBLIC_NAVIGATION_TEXT,
  PUBLIC_ROUTES,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — MOBILE HEADER
   components/public/MobileHeader.tsx

   VERSION FINALE

   RESPONSABILITÉS
   ---------------------------------------------------------
   - Header mobile / tablette
   - Bouton hamburger ☰
   - Logo NACHTKRONE
   - Recherche produits
   - Accès panier
   - Raccourcis catégories dans la recherche
   - Ouverture du MobileMenu
   - Fermeture automatique au changement de page

   ARCHITECTURE
   ---------------------------------------------------------
   MobileHeader.tsx
      ↓
   MobileMenu.tsx

   IMPORTANT
   ---------------------------------------------------------
   Le panneau latéral n'est PAS dupliqué ici.

   Toute la partie :
   - overlay
   - menu latéral
   - catégories
   - contact
   - WhatsApp
   - fermeture Escape
   - blocage du scroll

   est maintenant gérée par :

   components/public/MobileMenu.tsx

   La navigation inférieure reste gérée par :

   components/public/MobileBottomNavigation.tsx
   ========================================================= */

export default function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  /* =======================================================
     FERMETURE AU CHANGEMENT DE PAGE
     ======================================================= */

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  /* =======================================================
     FOCUS AUTOMATIQUE SUR LA RECHERCHE
     ======================================================= */

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchOpen]);

  /* =======================================================
     OUVERTURE DU MENU
     ======================================================= */

  function openMenu() {
    setSearchOpen(false);
    setMenuOpen(true);
  }

  /* =======================================================
     FERMETURE DU MENU
     ======================================================= */

  function closeMenu() {
    setMenuOpen(false);
  }

  /* =======================================================
     TOGGLE MENU
     ======================================================= */

  function toggleMenu() {
    if (menuOpen) {
      closeMenu();
      return;
    }

    openMenu();
  }

  /* =======================================================
     TOGGLE RECHERCHE
     ======================================================= */

  function toggleSearch() {
    setMenuOpen(false);

    setSearchOpen(
      (current) => !current
    );
  }

  /* =======================================================
     OUVERTURE RECHERCHE DEPUIS LE MENU
     ======================================================= */

  function openSearchFromMenu() {
    setMenuOpen(false);

    window.setTimeout(() => {
      setSearchOpen(true);
    }, 220);
  }

  /* =======================================================
     FERMETURE RECHERCHE
     ======================================================= */

  function closeSearch() {
    setSearchOpen(false);
    setSearchValue("");
  }

  /* =======================================================
     SUPPRIMER UNIQUEMENT LE TEXTE RECHERCHÉ
     ======================================================= */

  function clearSearchValue() {
    setSearchValue("");

    searchInputRef.current?.focus();
  }

  /* =======================================================
     SOUMISSION RECHERCHE
     ======================================================= */

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query =
      searchValue.trim();

    if (!query) {
      searchInputRef.current?.focus();
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
     RENDER
     ======================================================= */

  return (
    <>
      {/* ===================================================
          HEADER MOBILE
         =================================================== */}

      <header className="border-b border-white/10 bg-[#07111f] text-white shadow-[0_4px_20px_rgba(0,0,0,0.14)] lg:hidden">
        {/* =================================================
            BARRE PRINCIPALE
           ================================================= */}

        <div className="mx-auto flex h-[64px] w-full items-center gap-2 px-3 sm:h-[68px] sm:px-5">
          {/* ===============================================
              BOUTON HAMBURGER
             =============================================== */}

          <button
            type="button"
            onClick={toggleMenu}
            aria-label={
              menuOpen
                ? "Menü schließen"
                : "Menü öffnen"
            }
            aria-expanded={menuOpen}
            aria-controls="nachtkrone-mobile-menu"
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-white transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              "sm:h-11 sm:w-11",
              menuOpen
                ? "border-[#2f7df4]/60 bg-[#1769e0]"
                : "border-white/10 bg-white/[0.05] hover:bg-white/[0.10]",
            ].join(" ")}
          >
            {menuOpen ? (
              <X
                className="h-[21px] w-[21px]"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            ) : (
              <Menu
                className="h-[22px] w-[22px]"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            )}
          </button>

          {/* ===============================================
              LOGO
             =============================================== */}

          <Link
            href={PUBLIC_ROUTES.home}
            aria-label="NACHTKRONE Startseite"
            className="flex min-w-0 flex-1 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <div className="relative h-[38px] w-[142px] max-w-[38vw] sm:h-[42px] sm:w-[165px]">
              <Image
                src={PUBLIC_IMAGES.logo}
                alt="NACHTKRONE"
                fill
                priority
                sizes="(max-width: 640px) 142px, 165px"
                className="object-contain object-center"
              />
            </div>
          </Link>

          {/* ===============================================
              ACTIONS
             =============================================== */}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* =============================================
                RECHERCHE
               ============================================= */}

            <button
              type="button"
              onClick={toggleSearch}
              aria-label={
                searchOpen
                  ? "Suche schließen"
                  : PUBLIC_NAVIGATION_TEXT.searchLabel
              }
              aria-expanded={searchOpen}
              aria-controls="nachtkrone-mobile-search-panel"
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl border text-white transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                "sm:h-11 sm:w-11",
                searchOpen
                  ? "border-[#2f7df4]/60 bg-[#1769e0]"
                  : "border-white/10 bg-white/[0.05] hover:bg-white/[0.10]",
              ].join(" ")}
            >
              {searchOpen ? (
                <X
                  className="h-[20px] w-[20px]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : (
                <Search
                  className="h-[20px] w-[20px]"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white transition-colors duration-200 hover:bg-white/[0.10] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-11 sm:w-11"
            >
              <ShoppingBag
                className="h-[20px] w-[20px]"
                strokeWidth={2}
                aria-hidden="true"
              />

              {/*
                Le compteur réel sera branché
                lorsque le vrai système panier
                sera connecté.
              */}
            </Link>
          </div>
        </div>

        {/* =================================================
            PANNEAU DE RECHERCHE
           ================================================= */}

        <div
          id="nachtkrone-mobile-search-panel"
          aria-hidden={!searchOpen}
          className={[
            "grid overflow-hidden border-t transition-all duration-200 ease-out",
            searchOpen
              ? "grid-rows-[1fr] border-white/10 opacity-100"
              : "pointer-events-none grid-rows-[0fr] border-transparent opacity-0",
          ].join(" ")}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="bg-[#091727] px-4 py-3 sm:px-5 sm:py-4">
              {/* ===========================================
                  FORMULAIRE
                 =========================================== */}

              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="relative mx-auto w-full max-w-2xl"
              >
                <label
                  htmlFor="nachtkrone-mobile-search"
                  className="sr-only"
                >
                  {
                    PUBLIC_NAVIGATION_TEXT.searchLabel
                  }
                </label>

                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <input
                  ref={searchInputRef}
                  id="nachtkrone-mobile-search"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  spellCheck={false}
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(
                      event.target.value
                    )
                  }
                  placeholder={
                    PUBLIC_NAVIGATION_TEXT.searchPlaceholder
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-[92px] text-[16px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2f7df4] focus:ring-2 focus:ring-[#2f7df4]/20"
                />

                {/* =========================================
                    EFFACER LE TEXTE
                   ========================================= */}

                {searchValue ? (
                  <button
                    type="button"
                    onClick={
                      clearSearchValue
                    }
                    aria-label="Suchtext löschen"
                    className="absolute right-[68px] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7df4]/30"
                  >
                    <X
                      className="h-4 w-4"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>
                ) : null}

                {/* =========================================
                    LANCER LA RECHERCHE
                   ========================================= */}

                <button
                  type="submit"
                  disabled={
                    !searchValue.trim()
                  }
                  aria-label="Suche starten"
                  className="absolute right-1.5 top-1/2 flex h-9 min-w-[58px] -translate-y-1/2 items-center justify-center rounded-lg bg-[#1769e0] px-3 text-xs font-bold text-white transition-colors hover:bg-[#0f5fcf] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suchen
                </button>
              </form>

              {/* ===========================================
                  RACCOURCIS CATÉGORIES
                 =========================================== */}

              <div className="mx-auto mt-3 flex max-w-2xl items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Link
                  href={
                    PUBLIC_ROUTES.masks
                  }
                  onClick={() =>
                    setSearchOpen(false)
                  }
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.10] hover:text-white"
                >
                  Masken
                </Link>

                <Link
                  href={
                    PUBLIC_ROUTES.costumes
                  }
                  onClick={() =>
                    setSearchOpen(false)
                  }
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.10] hover:text-white"
                >
                  Kostüme
                </Link>

                <Link
                  href={
                    PUBLIC_ROUTES.sets
                  }
                  onClick={() =>
                    setSearchOpen(false)
                  }
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.10] hover:text-white"
                >
                  Masken &amp; Kostüme
                </Link>
              </div>

              {/* ===========================================
                  FERMER RECHERCHE
                 =========================================== */}

              <div className="mx-auto mt-2 flex max-w-2xl justify-end">
                <button
                  type="button"
                  onClick={closeSearch}
                  className="rounded-md px-1 py-1 text-xs font-medium text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================
          MENU MOBILE

          Toute l'interface du menu latéral est maintenant
          centralisée dans MobileMenu.tsx.
         =================================================== */}

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        onSearchRequest={
          openSearchFromMenu
        }
      />
    </>
  );
}