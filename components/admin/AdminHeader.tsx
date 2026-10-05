"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

/* =========================================================
   NACHTKRONE — HEADER ADMIN
   components/admin/AdminHeader.tsx
   ========================================================= */

type AdminHeaderProps = {
  onMenuOpen: () => void;
};

type PageInformation = {
  title: string;
  description: string;
};

/* =========================================================
   INFORMATIONS DES PAGES
   ========================================================= */

function getPageInformation(pathname: string): PageInformation {
  /*
   * On teste les routes les plus précises en premier.
   */

  if (pathname === "/admin/products/new") {
    return {
      title: "Ajouter un produit",
      description: "Ajoutez un nouveau masque ou costume à la boutique.",
    };
  }

  if (pathname === "/admin/products") {
    return {
      title: "Produits",
      description: "Consultez et gérez les produits de la boutique.",
    };
  }

  if (pathname.startsWith("/admin/products/")) {
    return {
      title: "Produit",
      description: "Consultez et gérez les informations du produit.",
    };
  }

  if (pathname === "/admin/orders") {
    return {
      title: "Commandes",
      description: "Suivez les commandes passées sur la boutique.",
    };
  }

  if (pathname.startsWith("/admin/orders/")) {
    return {
      title: "Commande",
      description: "Consultez les informations de la commande.",
    };
  }

  if (pathname === "/admin/customers") {
    return {
      title: "Clients",
      description: "Consultez les clients et leurs coordonnées.",
    };
  }

  if (pathname.startsWith("/admin/customers/")) {
    return {
      title: "Client",
      description: "Consultez les informations du client.",
    };
  }

  return {
    title: "Dashboard",
    description: "Vue d’ensemble de l’activité NACHTKRONE.",
  };
}

/* =========================================================
   COMPOSANT
   ========================================================= */

export default function AdminHeader({
  onMenuOpen,
}: AdminHeaderProps) {
  const pathname = usePathname();

  const pageInformation = getPageInformation(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex min-h-[78px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* =================================================
            BOUTON MENU MOBILE
            ================================================= */}

        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Ouvrir le menu administrateur"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#071b3a] shadow-sm transition hover:border-[#087cff]/30 hover:bg-[#f7faff] hover:text-[#087cff] focus:outline-none focus:ring-4 focus:ring-[#087cff]/10 lg:hidden"
        >
          <Menu
            className="h-5 w-5"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </button>

        {/* =================================================
            TITRE
            ================================================= */}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black tracking-[-0.025em] text-[#071b3a] sm:text-xl">
            {pageInformation.title}
          </h1>

          <p className="mt-0.5 hidden truncate text-xs font-medium text-slate-500 sm:block">
            {pageInformation.description}
          </p>
        </div>

        {/* =================================================
            ADMINISTRATEUR
            ================================================= */}

        <div className="flex shrink-0 items-center">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] px-2.5 py-2 sm:px-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf3ff] text-[#087cff]">
              <ShieldCheck
                className="h-[19px] w-[19px]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-extrabold leading-4 text-[#071b3a]">
                Administrateur
              </p>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                NACHTKRONE
              </p>
            </div>

            <span
              className="ml-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
              title="Session active"
              aria-label="Session active"
            />
          </div>
        </div>
      </div>
    </header>
  );
}