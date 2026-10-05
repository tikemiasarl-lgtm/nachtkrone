"use client";

import {
  useEffect,
  useRef,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ChevronRight,
  Home,
  Search,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";

import {
  PUBLIC_IMAGES,
  PUBLIC_ROUTES,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — MOBILE MENU
   components/public/MobileMenu.tsx

   RESPONSABILITÉS
   ---------------------------------------------------------
   - Menu latéral mobile
   - Overlay sombre
   - Navigation principale
   - Navigation catégories
   - Accès panier
   - Accès recherche
   - Contact WhatsApp
   - Détection de la route active
   - Fermeture automatique au changement de page
   - Fermeture avec Escape
   - Fermeture en cliquant sur l'overlay
   - Blocage du scroll arrière
   - Gestion basique du focus
   - Accessibilité ARIA

   IMPORTANT
   ---------------------------------------------------------
   L'état open / close appartient à MobileHeader.

   MobileMenu reçoit :
   - open
   - onClose
   - onSearchRequest

   MobileBottomNavigation reste totalement indépendant.
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type MobileMenuProps = {
  open: boolean;

  onClose: () => void;

  onSearchRequest?: () => void;
};

type MenuItemProps = {
  href: string;

  label: string;

  active: boolean;

  onClick: () => void;

  icon?: React.ReactNode;
};

/* =========================================================
   CONTACT
   ========================================================= */

const NACHTKRONE_WHATSAPP_DISPLAY =
  "+49 1590 5493267";

const NACHTKRONE_WHATSAPP_URL =
  "https://wa.me/4915905493267";

const NACHTKRONE_EMAIL =
  "contact@nachtkrone-shop.com";

/* =========================================================
   MENU ITEM
   ========================================================= */

function MobileMenuItem({
  href,
  label,
  active,
  onClick,
  icon,
}: MenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={[
        "group flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors duration-200",
        active
          ? "bg-[#edf5ff] text-[#075fc7]"
          : "text-slate-800 hover:bg-slate-50 active:bg-slate-100",
      ].join(" ")}
    >
      {icon ? (
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            active
              ? "bg-[#dcecff] text-[#075fc7]"
              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
          ].join(" ")}
        >
          {icon}
        </span>
      ) : (
        <span
          className={[
            "ml-[14px] h-2 w-2 shrink-0 rounded-full",
            active
              ? "bg-[#1769e0]"
              : "bg-slate-300 group-hover:bg-slate-400",
          ].join(" ")}
          aria-hidden="true"
        />
      )}

      <span className="min-w-0 flex-1 text-left text-[14px] font-bold leading-5">
        {label}
      </span>

      <ChevronRight
        className={[
          "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
          active
            ? "text-[#1769e0]"
            : "text-slate-400",
        ].join(" ")}
        strokeWidth={2}
        aria-hidden="true"
      />
    </Link>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function MobileMenu({
  open,
  onClose,
  onSearchRequest,
}: MobileMenuProps) {
  const pathname = usePathname();

  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  const previousPathnameRef =
    useRef(pathname);

  /* =======================================================
     ROUTE ACTIVE
     ======================================================= */

  function isActiveRoute(
    href: string
  ): boolean {
    if (
      href === PUBLIC_ROUTES.home
    ) {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  /* =======================================================
     FERMETURE AU CHANGEMENT DE ROUTE
     ======================================================= */

  useEffect(() => {
    if (
      pathname ===
      previousPathnameRef.current
    ) {
      return;
    }

    previousPathnameRef.current =
      pathname;

    onClose();
  }, [pathname, onClose]);

  /* =======================================================
     BLOCAGE DU SCROLL
     ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    const previousPaddingRight =
      document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth -
      document.documentElement.clientWidth;

    document.body.style.overflow =
      "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight =
        `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.style.paddingRight =
        previousPaddingRight;
    };
  }, [open]);

  /* =======================================================
     ESCAPE
     ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        event.preventDefault();

        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose]);

  /* =======================================================
     FOCUS À L'OUVERTURE
     ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [open]);

  /* =======================================================
     RECHERCHE
     ======================================================= */

  function handleSearchRequest() {
    onClose();

    if (!onSearchRequest) {
      return;
    }

    window.setTimeout(() => {
      onSearchRequest();
    }, 220);
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* ===================================================
          OVERLAY
         =================================================== */}

      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 ease-out lg:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* ===================================================
          PANNEAU
         =================================================== */}

      <aside
        id="nachtkrone-mobile-menu"
        role="dialog"
        aria-modal={
          open
            ? "true"
            : undefined
        }
        aria-label="NACHTKRONE Menü"
        aria-hidden={!open}
        className={[
          "fixed inset-y-0 left-0 z-[80] flex w-[86%] max-w-[360px] flex-col bg-white text-slate-900 shadow-[18px_0_50px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-out will-change-transform lg:hidden",
          open
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        {/* =================================================
            HEADER DU MENU
           ================================================= */}

        <div className="flex min-h-[72px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#07111f] px-4">
          {/* LOGO */}

          <Link
            href={PUBLIC_ROUTES.home}
            onClick={onClose}
            aria-label="NACHTKRONE Startseite"
            className="min-w-0 flex-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <div className="relative h-[42px] w-[165px] max-w-full">
              <Image
                src={
                  PUBLIC_IMAGES.logo
                }
                alt="NACHTKRONE"
                fill
                priority
                sizes="165px"
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* FERMETURE */}

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Menü schließen"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white transition-colors hover:bg-white/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X
              className="h-5 w-5"
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* =================================================
            CONTENU
           ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pb-8 pt-5">
            {/* =============================================
                NAVIGATION PRINCIPALE
               ============================================= */}

            <div className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Navigation
            </div>

            <nav
              aria-label="Mobile Hauptnavigation"
              className="space-y-1"
            >
              <MobileMenuItem
                href={
                  PUBLIC_ROUTES.home
                }
                label="Startseite"
                active={isActiveRoute(
                  PUBLIC_ROUTES.home
                )}
                onClick={onClose}
                icon={
                  <Home
                    className="h-[18px] w-[18px]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                }
              />

              <MobileMenuItem
                href={
                  PUBLIC_ROUTES.products
                }
                label="Alle Produkte"
                active={isActiveRoute(
                  PUBLIC_ROUTES.products
                )}
                onClick={onClose}
                icon={
                  <Store
                    className="h-[18px] w-[18px]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                }
              />
            </nav>

            {/* =============================================
                CATÉGORIES
               ============================================= */}

            <div className="my-5 border-t border-slate-200" />

            <div className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Kategorien
            </div>

            <nav
              aria-label="Produktkategorien"
              className="space-y-1"
            >
              <MobileMenuItem
                href={
                  PUBLIC_ROUTES.masks
                }
                label="Krampusmasken"
                active={isActiveRoute(
                  PUBLIC_ROUTES.masks
                )}
                onClick={onClose}
              />

              <MobileMenuItem
                href={
                  PUBLIC_ROUTES.costumes
                }
                label="Krampuskostüme"
                active={isActiveRoute(
                  PUBLIC_ROUTES.costumes
                )}
                onClick={onClose}
              />

              <MobileMenuItem
                href={
                  PUBLIC_ROUTES.sets
                }
                label="Masken & Kostüme"
                active={isActiveRoute(
                  PUBLIC_ROUTES.sets
                )}
                onClick={onClose}
              />
            </nav>

            {/* =============================================
                SHOP
               ============================================= */}

            <div className="my-5 border-t border-slate-200" />

            <div className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Shop
            </div>

            <div className="space-y-1">
              {/* RECHERCHE */}

              <button
                type="button"
                onClick={
                  handleSearchRequest
                }
                className="group flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-slate-800 transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-200">
                  <Search
                    className="h-[18px] w-[18px]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </span>

                <span className="min-w-0 flex-1 text-[14px] font-bold">
                  Produkt suchen
                </span>

                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>

              {/* PANIER */}

              <MobileMenuItem
                href={
                  PUBLIC_ROUTES.cart
                }
                label="Warenkorb"
                active={isActiveRoute(
                  PUBLIC_ROUTES.cart
                )}
                onClick={onClose}
                icon={
                  <ShoppingBag
                    className="h-[18px] w-[18px]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                }
              />
            </div>

            {/* =============================================
                CONTACT
               ============================================= */}

            <div className="my-5 border-t border-slate-200" />

            <div className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Kontakt
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="p-4">
                <div className="text-[14px] font-extrabold text-[#07111f]">
                  Fragen?
                </div>

                <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                  Wir helfen Ihnen bei Fragen zu unseren Produkten oder Ihrer Bestellung.
                </p>

                {/* WHATSAPP */}

                <a
                  href={
                    NACHTKRONE_WHATSAPP_URL
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#25D366] px-4 text-center text-[13px] font-extrabold text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/40"
                >
                  WhatsApp
                </a>

                <div className="mt-2 text-center text-[11px] font-semibold text-slate-500">
                  {
                    NACHTKRONE_WHATSAPP_DISPLAY
                  }
                </div>

                {/* EMAIL */}

                <a
                  href={`mailto:${NACHTKRONE_EMAIL}`}
                  onClick={onClose}
                  className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-center text-[12px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {
                    NACHTKRONE_EMAIL
                  }
                </a>
              </div>
            </div>

            {/* =============================================
                PETIT RAPPEL DE MARQUE
               ============================================= */}

            <div className="mt-6 rounded-xl bg-[#07111f] px-4 py-3">
              <p className="m-0 text-center text-[11px] font-semibold leading-5 text-slate-300">
                Krampusmasken, Kostüme &amp; Zubehör
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            FOOTER DU MENU
           ================================================= */}

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <p className="m-0 text-center text-[10px] leading-4 text-slate-400">
            © NACHTKRONE · Krampus Masken &amp; Kostüme
          </p>
        </div>
      </aside>
    </>
  );
}