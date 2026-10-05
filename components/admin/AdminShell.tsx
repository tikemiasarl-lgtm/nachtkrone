"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import { usePathname } from "next/navigation";

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
   - Gestion ouverture / fermeture menu mobile
   - Blocage du scroll quand le menu mobile est ouvert
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

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /* =======================================================
     PAGE DE CONNEXION
     ======================================================= */

  const isLoginPage =
    pathname === "/admin/login" ||
    pathname.startsWith(
      "/admin/login/"
    );

  /* =======================================================
     OUVERTURE DU MENU
     ======================================================= */

  const handleMobileMenuOpen =
    useCallback(() => {
      setMobileMenuOpen(true);
    }, []);

  /* =======================================================
     FERMETURE DU MENU
     ======================================================= */

  const handleMobileMenuClose =
    useCallback(() => {
      setMobileMenuOpen(false);
    }, []);

  /* =======================================================
     BLOQUER LE SCROLL DU BODY

     Quand le menu mobile est ouvert :
     - le contenu derrière la sidebar ne doit pas défiler.

     Quand le menu se ferme :
     - on restaure exactement la valeur précédente.
     ======================================================= */

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const body =
      document.body;

    const previousOverflow =
      body.style.overflow;

    body.style.overflow =
      "hidden";

    return () => {
      body.style.overflow =
        previousOverflow;
    };
  }, [mobileMenuOpen]);

  /* =======================================================
     PAGE DE CONNEXION

     La page /admin/login doit rester indépendante :
     - pas de sidebar
     - pas de header admin
     - pas de marge desktop
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
          contrôlée par mobileMenuOpen.

          AdminSidebar appelle onMobileClose lors de la
          fermeture du panneau.
          =================================================== */}

      <AdminSidebar
        mobileOpen={
          mobileMenuOpen
        }
        onMobileClose={
          handleMobileMenuClose
        }
      />

      {/* ===================================================
          CONTENU PRINCIPAL

          Sur desktop :
          270px sont réservés à la sidebar.
          =================================================== */}

      <div className="min-h-screen lg:pl-[270px]">

        {/* =================================================
            HEADER
            ================================================= */}

        <AdminHeader
          onMenuOpen={
            handleMobileMenuOpen
          }
        />

        {/* =================================================
            CONTENU DE LA PAGE
            ================================================= */}

        <main className="min-h-[calc(100vh-78px)]">

          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>

        </main>

      </div>

    </div>
  );
}