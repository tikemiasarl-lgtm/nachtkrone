"use client";

import { useState } from "react";
import {
  ChevronDown,
  PackageCheck,
  RotateCcw,
  Truck,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — PRODUCT SHIPPING
   components/public/product/ProductShipping.tsx

   Section livraison & retour de la fiche produit.

   Principes :
   - interface entièrement en allemand
   - aucune fausse promesse de délai
   - aucun transporteur inventé
   - aucun tarif de livraison inventé
   - accordéon propre
   - responsive mobile / desktop
   ========================================================= */

export default function ProductShipping() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      className="
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
      aria-labelledby="product-shipping-title"
    >
      {/* =====================================================
          BOUTON DE L'ACCORDÉON
         ===================================================== */}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="product-shipping-content"
        className="
          group
          flex
          min-h-[54px]
          w-full
          items-center
          justify-between
          gap-4
          px-4
          py-3
          text-left
          transition-colors
          duration-200
          hover:bg-slate-50
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-inset
          focus-visible:ring-[#1769e0]/30
          sm:px-5
        "
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-slate-100
              text-slate-700
            "
          >
            <Truck
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              strokeWidth={2}
            />
          </span>

          <span
            id="product-shipping-title"
            className="
              text-sm
              font-black
              text-slate-950
              sm:text-[15px]
            "
          >
            Versand &amp; Rückgabe
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className={[
            "h-5 w-5 shrink-0 text-slate-500",
            "transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0",
          ].join(" ")}
        />
      </button>

      {/* =====================================================
          CONTENU
         ===================================================== */}

      <div
        id="product-shipping-content"
        className={[
          "grid transition-all duration-300 ease-out",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="
              border-t
              border-slate-200
              px-4
              py-5
              sm:px-5
              sm:py-6
            "
          >
            <div
              className="
                grid
                grid-cols-1
                gap-5
                md:grid-cols-2
                md:gap-6
              "
            >
              {/* =============================================
                  LIVRAISON
                 ============================================= */}

              <div className="flex items-start gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#1769e0]/10
                    text-[#1769e0]
                  "
                >
                  <PackageCheck
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </div>

                <div className="min-w-0">
                  <h3
                    className="
                      text-sm
                      font-black
                      text-slate-950
                    "
                  >
                    Versand
                  </h3>

                  <p
                    className="
                      mt-1.5
                      text-[13px]
                      leading-6
                      text-slate-600
                    "
                  >
                    Die verfügbaren Versandoptionen und
                    Versandkosten werden während des
                    Bestellvorgangs angezeigt.
                  </p>
                </div>
              </div>

              {/* =============================================
                  RETOUR
                 ============================================= */}

              <div className="flex items-start gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-slate-100
                    text-slate-700
                  "
                >
                  <RotateCcw
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </div>

                <div className="min-w-0">
                  <h3
                    className="
                      text-sm
                      font-black
                      text-slate-950
                    "
                  >
                    Rückgabe
                  </h3>

                  <p
                    className="
                      mt-1.5
                      text-[13px]
                      leading-6
                      text-slate-600
                    "
                  >
                    Informationen zu Rückgabe und Widerruf
                    werden gemäß den geltenden
                    Rückgabebedingungen bereitgestellt.
                  </p>
                </div>
              </div>
            </div>

            {/* ===============================================
                INFORMATION COMPLÉMENTAIRE
               =============================================== */}

            <div
              className="
                mt-5
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-3.5
              "
            >
              <p
                className="
                  text-[12px]
                  leading-5
                  text-slate-500
                  sm:text-[13px]
                "
              >
                Die endgültigen Versandinformationen werden
                vor Abschluss der Bestellung angezeigt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}