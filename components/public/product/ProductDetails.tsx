"use client";

import { useState } from "react";
import {
  ChevronDown,
  Info,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — PRODUCT DETAILS
   components/public/product/ProductDetails.tsx

   Affiche les caractéristiques réelles du produit.

   Exemples :
   - Material
   - Abmessungen
   - Lieferumfang
   - Gewicht
   - Farbe
   - etc.

   Important :
   - aucune caractéristique inventée
   - les données viennent de la page produit
   - les valeurs vides ne sont pas affichées
   - responsive mobile / desktop
   - accordéon mobile
   - contenu directement visible sur desktop
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type ProductDetailItem = {
  label: string;
  value: string | null | undefined;
};

type ProductDetailsProps = {
  details?: ProductDetailItem[];
};

/* =========================================================
   NORMALISATION
   ========================================================= */

function normalizeDetails(
  details: ProductDetailItem[]
): ProductDetailItem[] {
  return details
    .map((detail) => ({
      label: detail.label.trim(),
      value:
        typeof detail.value === "string"
          ? detail.value.trim()
          : detail.value,
    }))
    .filter(
      (
        detail
      ): detail is {
        label: string;
        value: string;
      } =>
        detail.label.length > 0 &&
        typeof detail.value === "string" &&
        detail.value.length > 0
    );
}

/* =========================================================
   TABLEAU DES CARACTÉRISTIQUES
   ========================================================= */

function DetailsContent({
  details,
}: {
  details: ProductDetailItem[];
}) {
  if (details.length === 0) {
    return (
      <div
        className="
          flex
          items-start
          gap-3
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-4
          py-4
        "
      >
        <Info
          aria-hidden="true"
          className="
            mt-0.5
            h-5
            w-5
            shrink-0
            text-slate-400
          "
          strokeWidth={2}
        />

        <p
          className="
            text-[13px]
            leading-6
            text-slate-500
          "
        >
          Für dieses Produkt sind derzeit keine weiteren
          Produktdetails verfügbar.
        </p>
      </div>
    );
  }

  return (
    <dl
      className="
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
      "
    >
      {details.map((detail, index) => (
        <div
          key={`${detail.label}-${index}`}
          className={[
            "grid grid-cols-1",
            "sm:grid-cols-[160px_minmax(0,1fr)]",
            index > 0
              ? "border-t border-slate-200"
              : "",
          ].join(" ")}
        >
          {/* ===============================================
              NOM DE LA CARACTÉRISTIQUE
             =============================================== */}

          <dt
            className="
              bg-slate-50
              px-4
              pb-1
              pt-3
              text-[12px]
              font-bold
              leading-5
              text-slate-700
              sm:px-4
              sm:py-3
              sm:text-[13px]
            "
          >
            {detail.label}
          </dt>

          {/* ===============================================
              VALEUR
             =============================================== */}

          <dd
            className="
              px-4
              pb-3
              pt-1
              text-[13px]
              leading-5
              text-slate-600
              sm:px-4
              sm:py-3
              sm:text-[13px]
            "
          >
            {detail.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function ProductDetails({
  details = [],
}: ProductDetailsProps) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const normalizedDetails =
    normalizeDetails(details);

  return (
    <section
      aria-labelledby="product-details-title"
      className="w-full"
    >
      {/* =====================================================
          DESKTOP
          
          Sur ordinateur :
          le titre et les caractéristiques sont directement
          visibles comme sur l'architecture de référence.
         ===================================================== */}

      <div className="hidden md:block">
        <h2
          id="product-details-title"
          className="
            mb-4
            text-xl
            font-black
            tracking-[-0.02em]
            text-slate-950
          "
        >
          Produktdetails
        </h2>

        <DetailsContent
          details={normalizedDetails}
        />
      </div>

      {/* =====================================================
          MOBILE
          
          Sur mobile :
          accordéon compact afin de garder une fiche produit
          fluide et facile à parcourir.
         ===================================================== */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-sm
          md:hidden
        "
      >
        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              (current) => !current
            )
          }
          aria-expanded={mobileOpen}
          aria-controls="mobile-product-details-content"
          className="
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
            hover:bg-slate-50
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-inset
            focus-visible:ring-[#1769e0]/30
          "
        >
          <span
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
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
              <Info
                aria-hidden="true"
                className="h-[18px] w-[18px]"
                strokeWidth={2}
              />
            </span>

            <span
              className="
                text-sm
                font-black
                text-slate-950
              "
            >
              Produktdetails
            </span>
          </span>

          <ChevronDown
            aria-hidden="true"
            strokeWidth={2}
            className={[
              "h-5 w-5 shrink-0",
              "text-slate-500",
              "transition-transform duration-200",
              mobileOpen
                ? "rotate-180"
                : "rotate-0",
            ].join(" ")}
          />
        </button>

        {/* ===================================================
            CONTENU ACCORDÉON MOBILE
           =================================================== */}

        <div
          id="mobile-product-details-content"
          className={[
            "grid transition-all duration-300 ease-out",
            mobileOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className="
                border-t
                border-slate-200
                p-4
              "
            >
              <DetailsContent
                details={normalizedDetails}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}