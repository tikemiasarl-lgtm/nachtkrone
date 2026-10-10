
"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import { usePathname } from "next/navigation";

import AdminAutoRefresh from "@/components/admin/AdminAutoRefresh";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

/* =========================================================
   NACHTKRONE — ADMIN SHELL
   components/admin/AdminShell.tsx

   Responsabilités :
   - Structure générale de l'administration
   - Sidebar desktop
   - Sidebar mobile
   - Header administrateur
   - Gestion ouverture / fermeture du menu mobile
   - Blocage du scroll lorsque le menu mobile est ouvert
   - Fermeture du menu lors d'un changement de page
   - Exclusion de l'interface admin sur la page login
========================================================= */

type AdminShellProps = {
  children: ReactNode;
};

/* =========================================================
   COMPOSANT
========================================================= */

export default function AdminShell({
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  /* =======================================================
     MENU MOBILE
  ======================================================= */

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /* =======================================================
     PAGE DE CONNEXION
  ======================================================= */

  const isLoginPage =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/");

  /* =======================================================
     OUVERTURE DU MENU
  ======================================================= */

  const handleMobileMenuOpen = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  /* =======================================================
     FERMETURE DU MENU
  ======================================================= */

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  /* =======================================================
     FERMETURE AUTOMATIQUE APRÈS NAVIGATION

     Le chemin courant est conservé avec le menu ouvert.
     Si le chemin change, le menu est fermé au rendu suivant.
     Aucun setState dans useEffect.
  ======================================================= */

  const [menuPathname, setMenuPathname] =
    useState(pathname);

  const isMobileMenuVisible =
    mobileMenuOpen &&
    menuPathname === pathname &&
    !isLoginPage;

  const openMobileMenu = useCallback(() => {
    setMenuPathname(pathname);
    handleMobileMenuOpen();
  }, [pathname, handleMobileMenuOpen]);

  /* =======================================================
     BLOCAGE DU SCROLL

     Lorsque le menu mobile est ouvert :
     - le contenu derrière la sidebar ne défile pas.

     Lorsqu'il est fermé :
     - la valeur précédente est restaurée.
  ======================================================= */

  useEffect(() => {
    if (!isMobileMenuVisible) {
      return;
    }

    const body = document.body;

    const previousOverflow = body.style.overflow;

    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuVisible]);

  /* =======================================================
     PAGE DE CONNEXION

     /admin/login reste indépendante :
     - aucune sidebar
     - aucun header administrateur
     - aucune marge desktop
     - aucun rafraîchissement automatique
  ======================================================= */

  if (isLoginPage) {
    return <>{children}</>;
  }

  /* =======================================================
     ESPACE ADMINISTRATEUR
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#071b3a]">
      {/* ===================================================
          SIDEBAR

          Desktop :
          affichée en permanence.

          Mobile :
          contrôlée par isMobileMenuVisible.

          AdminSidebar utilise onMobileClose pour fermer
          le panneau.
      =================================================== */}

      <AdminSidebar
        mobileOpen={isMobileMenuVisible}
        onMobileClose={handleMobileMenuClose}
      />

      {/* ===================================================
          CONTENU PRINCIPAL

          Desktop :
          270px réservés à la sidebar.
      =================================================== */}

      <div className="min-h-screen lg:pl-[270px]">
        {/* HEADER */}

        <AdminHeader
          onMenuOpen={openMobileMenu}
        />

        {/* CONTENU */}

        <main className="min-h-[calc(100vh-78px)]">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <AdminAutoRefresh />

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
