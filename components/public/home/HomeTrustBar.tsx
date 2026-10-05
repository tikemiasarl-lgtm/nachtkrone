import {
  BadgeCheck,
  CreditCard,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import {
  PUBLIC_TRUST_ITEMS,
  WHATSAPP_URL_WITH_MESSAGE,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — HOME TRUST BAR
   components/public/home/HomeTrustBar.tsx

   Section de confiance de la page d'accueil.

   Objectifs :
   - rassurer le visiteur
   - rester sobre et premium
   - utiliser les textes centralisés dans
     lib/public-navigation.ts
   - responsive mobile / desktop
   - aucun faux avis
   - aucun faux chiffre
   - aucune fausse promesse de livraison
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type TrustItemId =
  (typeof PUBLIC_TRUST_ITEMS)[number]["id"];

type TrustIconMap = Record<
  TrustItemId,
  LucideIcon
>;

/* =========================================================
   ICÔNES
   ========================================================= */

const TRUST_ICONS: TrustIconMap = {
  quality: BadgeCheck,
  payment: CreditCard,
  support: MessageCircle,
};

/* =========================================================
   COMPOSANT
   ========================================================= */

export default function HomeTrustBar() {
  return (
    <section
      aria-label="NACHTKRONE Vorteile"
      className="
        border-y
        border-slate-200
        bg-[#f8fafc]
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          px-4
          sm:px-5
          lg:px-6
          xl:px-8
          2xl:px-10
        "
      >
        <div
          className="
            grid
            grid-cols-1
            divide-y
            divide-slate-200
            sm:grid-cols-3
            sm:divide-x
            sm:divide-y-0
          "
        >
          {PUBLIC_TRUST_ITEMS.map(
            (item) => {
              const Icon =
                TRUST_ICONS[item.id];

              const content = (
                <>
                  {/* =========================================
                      ICÔNE
                     ========================================= */}

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      text-[#1769e0]
                      shadow-sm
                      transition-all
                      duration-200
                      group-hover:border-[#1769e0]/20
                      group-hover:bg-[#1769e0]/5
                    "
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-[21px] w-[21px]"
                      strokeWidth={2}
                    />
                  </div>

                  {/* =========================================
                      TEXTE
                     ========================================= */}

                  <div className="min-w-0">
                    <h3
                      className="
                        text-[13px]
                        font-black
                        leading-5
                        text-slate-950
                        sm:text-sm
                      "
                    >
                      {item.title}
                    </h3>

                    <p
                      className="
                        mt-0.5
                        text-[12px]
                        leading-5
                        text-slate-500
                        sm:text-[13px]
                      "
                    >
                      {item.description}
                    </p>
                  </div>
                </>
              );

              /* =============================================
                 CONTACT WHATSAPP

                 L'élément support devient directement
                 cliquable vers WhatsApp.
                 ============================================= */

              if (item.id === "support") {
                return (
                  <a
                    key={item.id}
                    href={
                      WHATSAPP_URL_WITH_MESSAGE
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="NACHTKRONE über WhatsApp kontaktieren"
                    className="
                      group
                      flex
                      min-h-[100px]
                      items-center
                      gap-3.5
                      px-1
                      py-5
                      transition-colors
                      hover:bg-white/70
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-inset
                      focus-visible:ring-[#1769e0]/30
                      sm:min-h-[122px]
                      sm:px-5
                      sm:py-6
                      lg:gap-4
                      lg:px-7
                    "
                  >
                    {content}
                  </a>
                );
              }

              /* =============================================
                 ÉLÉMENTS NORMAUX
                 ============================================= */

              return (
                <div
                  key={item.id}
                  className="
                    group
                    flex
                    min-h-[100px]
                    items-center
                    gap-3.5
                    px-1
                    py-5
                    sm:min-h-[122px]
                    sm:px-5
                    sm:py-6
                    lg:gap-4
                    lg:px-7
                  "
                >
                  {content}
                </div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}