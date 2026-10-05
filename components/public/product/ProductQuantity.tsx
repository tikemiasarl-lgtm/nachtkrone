"use client";

import {
  Minus,
  Plus,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — PRODUCT QUANTITY
   components/public/product/ProductQuantity.tsx

   Sélecteur de quantité de la fiche produit.

   Fonctionnement :
   - bouton moins
   - quantité actuelle
   - bouton plus
   - minimum = 1
   - maximum = stock disponible
   - blocage automatique si stock = 0
   - aucune quantité supérieure au stock
   - accessible clavier / lecteur d'écran
   - responsive mobile / desktop
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type ProductQuantityProps = {
  quantity: number;
  stock: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
};

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeStock(stock: number): number {
  if (!Number.isFinite(stock)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(stock)
  );
}

function normalizeQuantity(
  quantity: number,
  stock: number
): number {
  if (stock <= 0) {
    return 0;
  }

  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.min(
    Math.max(1, Math.floor(quantity)),
    stock
  );
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function ProductQuantity({
  quantity,
  stock,
  onChange,
  disabled = false,
}: ProductQuantityProps) {
  const normalizedStock =
    normalizeStock(stock);

  const normalizedQuantity =
    normalizeQuantity(
      quantity,
      normalizedStock
    );

  const isOutOfStock =
    normalizedStock <= 0;

  const isDisabled =
    disabled || isOutOfStock;

  const canDecrease =
    !isDisabled &&
    normalizedQuantity > 1;

  const canIncrease =
    !isDisabled &&
    normalizedQuantity <
      normalizedStock;

  /* =======================================================
     DIMINUER
     ======================================================= */

  function handleDecrease() {
    if (!canDecrease) {
      return;
    }

    onChange(
      normalizedQuantity - 1
    );
  }

  /* =======================================================
     AUGMENTER
     ======================================================= */

  function handleIncrease() {
    if (!canIncrease) {
      return;
    }

    onChange(
      normalizedQuantity + 1
    );
  }

  return (
    <div className="w-full">
      {/* =====================================================
          LABEL
         ===================================================== */}

      <div
        className="
          mb-2.5
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <label
          htmlFor="product-quantity"
          className="
            text-sm
            font-bold
            text-slate-900
          "
        >
          Menge
        </label>

        {!isOutOfStock ? (
          <span
            className="
              text-xs
              font-medium
              text-slate-500
            "
          >
            Max. {normalizedStock}
          </span>
        ) : null}
      </div>

      {/* =====================================================
          SÉLECTEUR
         ===================================================== */}

      <div
        className={[
          "inline-flex",
          "h-[50px]",
          "items-stretch",
          "overflow-hidden",
          "rounded-xl",
          "border",
          "bg-white",
          "transition-colors",
          isDisabled
            ? [
                "border-slate-200",
                "bg-slate-50",
              ].join(" ")
            : "border-slate-300",
        ].join(" ")}
      >
        {/* ===================================================
            MOINS
           =================================================== */}

        <button
          type="button"
          onClick={handleDecrease}
          disabled={!canDecrease}
          aria-label="Menge verringern"
          className="
            flex
            w-12
            shrink-0
            items-center
            justify-center
            border-r
            border-slate-200
            text-slate-700
            transition-colors
            duration-150
            hover:bg-slate-100
            hover:text-slate-950
            focus:outline-none
            focus-visible:z-10
            focus-visible:ring-2
            focus-visible:ring-inset
            focus-visible:ring-[#1769e0]
            disabled:cursor-not-allowed
            disabled:bg-slate-50
            disabled:text-slate-300
          "
        >
          <Minus
            aria-hidden="true"
            className="h-[18px] w-[18px]"
            strokeWidth={2.2}
          />
        </button>

        {/* ===================================================
            QUANTITÉ
           =================================================== */}

        <input
          id="product-quantity"
          type="text"
          inputMode="numeric"
          value={
            isOutOfStock
              ? "0"
              : String(
                  normalizedQuantity
                )
          }
          readOnly
          disabled={isDisabled}
          aria-label="Produktmenge"
          aria-live="polite"
          className="
            h-full
            w-14
            border-0
            bg-white
            px-1
            text-center
            text-sm
            font-black
            tabular-nums
            text-slate-950
            outline-none
            disabled:bg-slate-50
            disabled:text-slate-400
          "
        />

        {/* ===================================================
            PLUS
           =================================================== */}

        <button
          type="button"
          onClick={handleIncrease}
          disabled={!canIncrease}
          aria-label="Menge erhöhen"
          className="
            flex
            w-12
            shrink-0
            items-center
            justify-center
            border-l
            border-slate-200
            text-slate-700
            transition-colors
            duration-150
            hover:bg-slate-100
            hover:text-slate-950
            focus:outline-none
            focus-visible:z-10
            focus-visible:ring-2
            focus-visible:ring-inset
            focus-visible:ring-[#1769e0]
            disabled:cursor-not-allowed
            disabled:bg-slate-50
            disabled:text-slate-300
          "
        >
          <Plus
            aria-hidden="true"
            className="h-[18px] w-[18px]"
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* =====================================================
          STOCK ÉPUISÉ
         ===================================================== */}

      {isOutOfStock ? (
        <p
          role="status"
          className="
            mt-2
            text-xs
            font-semibold
            text-red-600
          "
        >
          Derzeit nicht auf Lager.
        </p>
      ) : null}
    </div>
  );
}