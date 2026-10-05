"use client";

import { useState } from "react";
import {
  ChevronDown,
  FileText,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — PRODUCT DESCRIPTION
   components/public/product/ProductDescription.tsx

   Description complète du produit.

   Comportement :
   - Desktop : description directement visible
   - Mobile : accordéon compact
   - conserve correctement les paragraphes
   - conserve les retours à la ligne
   - aucun contenu inventé
   - interface entièrement en allemand
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type ProductDescriptionProps = {
  description?: string | null;
};

/* =========================================================
   NORMALISATION
   ========================================================= */

function normalizeDescription(
  description?: string | null
): string {
  if (typeof description !== "string") {
    return "";
  }

  return description.trim();
}

/* =========================================================
   CONTENU DE LA DESCRIPTION
   ========================================================= */

function DescriptionContent({
  description,
}: {
  description: string;
}) {
  if (!description) {
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
        <FileText
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
          Für dieses Produkt ist derzeit keine ausführliche
          Beschreibung verfügbar.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        whitespace-pre-line
        break-words
        text-[14px]
        leading-7
        text-slate-600
        sm:text-[15px]
        sm:leading-7
        lg:text-[15px]
        lg:leading-7
      "
    >
      {description}
    </div>
  );
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function ProductDescription({
  description,
}: ProductDescriptionProps) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const normalizedDescription =
    normalizeDescription(description);

  return (
    <section
      aria-labelledby="product-description-title"
      className="w-full"
    >
      {/* =====================================================
          DESKTOP

          La description reste directement visible sur PC.
         ===================================================== */}

      <div className="hidden md:block">
        <h2
          id="product-description-title"
          className="
            mb-4
            text-xl
            font-black
            tracking-[-0.02em]
            text-slate-950
          "
        >
          Produktbeschreibung
        </h2>

        <DescriptionContent
          description={normalizedDescription}
        />
      </div>

      {/* =====================================================
          MOBILE

          Accordéon compact comme sur l'architecture
          de référence.
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
        {/* ===================================================
            BOUTON
           =================================================== */}

        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              (current) => !current
            )
          }
          aria-expanded={mobileOpen}
          aria-controls="mobile-product-description-content"
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
            duration-200
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
              <FileText
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
              Produktbeschreibung
            </span>
          </span>

          <ChevronDown
            aria-hidden="true"
            className={[
              "h-5 w-5 shrink-0",
              "text-slate-500",
              "transition-transform duration-200",
              mobileOpen
                ? "rotate-180"
                : "rotate-0",
            ].join(" ")}
            strokeWidth={2}
          />
        </button>

        {/* ===================================================
            CONTENU MOBILE
           =================================================== */}

        <div
          id="mobile-product-description-content"
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
                px-4
                py-5
              "
            >
              <DescriptionContent
                description={
                  normalizedDescription
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}