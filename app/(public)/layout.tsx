import type { ReactNode } from "react";

import PublicHeader from "@/components/public/PublicHeader";
import MobileBottomNavigation from "@/components/public/MobileBottomNavigation";
import WhatsAppButton from "@/components/public/WhatsAppButton";
import PublicFooter from "@/components/public/PublicFooter";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      {/* =====================================================
          HEADER PUBLIC
          - Desktop : navigation complète
          - Mobile : header compact
         ===================================================== */}
      <PublicHeader />

      {/* =====================================================
          CONTENU PRINCIPAL
          
          pb-24 sur mobile :
          réserve l'espace nécessaire pour la barre de
          navigation fixe en bas de l'écran.
          
          À partir de lg :
          aucun espace supplémentaire n'est nécessaire.
         ===================================================== */}
      <main className="min-h-[calc(100vh-64px)] pb-24 lg:pb-0">
        {children}
      </main>

      {/* =====================================================
          FOOTER
          
          Le composant PublicFooter sera affiché uniquement
          sur desktop.
          
          Aucun footer sur la version mobile.
         ===================================================== */}
      <div className="hidden lg:block">
        <PublicFooter />
      </div>

      {/* =====================================================
          WHATSAPP
          
          Bouton flottant disponible sur toutes les pages
          publiques.
          
          Sur mobile, il sera positionné au-dessus de la
          barre de navigation inférieure.
         ===================================================== */}
      <WhatsAppButton />

      {/* =====================================================
          NAVIGATION MOBILE
          
          Barre fixe en bas de l'écran.
          Elle n'existe pas sur desktop.
         ===================================================== */}
      <div className="lg:hidden">
        <MobileBottomNavigation />
      </div>
    </div>
  );
}