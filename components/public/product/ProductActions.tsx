"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  Loader2,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";

import {
  getWhatsAppUrl,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — PRODUCT ACTIONS
   components/public/product/ProductActions.tsx

   Actions principales de la fiche produit :

   - ajout au panier
   - commande directe par WhatsApp
   - lecture du produit réel
   - lecture du prix réel
   - prise en compte du prix promotionnel
   - lecture de la quantité sélectionnée
   - calcul automatique du total
   - contrôle du stock
   - responsive mobile / desktop
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type ProductPriceValue =
  | string
  | number
  | null
  | undefined;

type ProductActionsProps = {
  productId: string;
  productName: string;
  productSlug: string;

  price: ProductPriceValue;
  promotionalPrice?: ProductPriceValue;

  quantity: number;
  stock: number;

  onAddToCart?: (
    productId: string,
    quantity: number
  ) => void | Promise<void>;
};

/* =========================================================
   FORMATTER
   ========================================================= */

const EURO_FORMATTER =
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* =========================================================
   HELPERS
   ========================================================= */

function toPriceNumber(
  value: ProductPriceValue
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
}

function formatPrice(
  value: number
): string {
  return EURO_FORMATTER.format(value);
}

function normalizeStock(
  stock: number
): number {
  if (!Number.isFinite(stock)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(stock)
  );
}

function normalizeQuantity(
  quantity: number
): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(quantity)
  );
}

/* =========================================================
   COMPOSANT
   ========================================================= */

function subscribeToOrigin() {
  return () => {};
}

function getBrowserOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return "";
}

export default function ProductActions({
  productId,
  productName,
  productSlug,
  price,
  promotionalPrice,
  quantity,
  stock,
  onAddToCart,
}: ProductActionsProps) {
  const [isAdding, setIsAdding] =
    useState(false);

  const [added, setAdded] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     STOCK + QUANTITÉ
     ======================================================= */

  const normalizedStock =
    normalizeStock(stock);

  const normalizedQuantity =
    normalizeQuantity(quantity);

  const inStock =
    normalizedStock > 0;

  const quantityAvailable =
    normalizedQuantity <=
    normalizedStock;

  const canPurchase =
    inStock &&
    quantityAvailable;

  const canAddToCart =
    canPurchase &&
    !isAdding;

  /* =======================================================
     PRIX
     ======================================================= */

  const basePrice =
    toPriceNumber(price);

  const promoPrice =
    toPriceNumber(
      promotionalPrice
    );

  /*
   * Le prix promotionnel est utilisé uniquement
   * lorsqu'il est réellement inférieur au prix normal.
   */

  const hasPromotion =
    basePrice !== null &&
    promoPrice !== null &&
    basePrice > 0 &&
    promoPrice >= 0 &&
    promoPrice < basePrice;

  const unitPrice =
    hasPromotion
      ? promoPrice
      : basePrice;

  const totalPrice =
    unitPrice !== null
      ? unitPrice *
        normalizedQuantity
      : null;

  // Le serveur et le premier rendu client utilisent le m?me lien.
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getBrowserOrigin,
    getServerOrigin,
  );
  const productUrl = `${origin}/produkte/${encodeURIComponent(productSlug)}`;

  /* =======================================================
     MESSAGE WHATSAPP DE COMMANDE

     Le message utilise automatiquement :
     - titre
     - prix unitaire
     - quantité
     - total
     - lien du produit
     ======================================================= */

  const whatsappUrl =
    useMemo(() => {
      if (!canPurchase) {
        return "#";
      }

      const lines: string[] = [
        "Hallo NACHTKRONE,",
        "",
        "ich möchte folgendes Produkt bestellen:",
        "",
        `Produkt: ${productName}`,
      ];

      if (unitPrice !== null) {
        lines.push(
          `Preis: ${formatPrice(
            unitPrice
          )}`
        );
      }

      lines.push(
        `Menge: ${normalizedQuantity}`
      );

      if (totalPrice !== null) {
        lines.push(
          `Gesamt: ${formatPrice(
            totalPrice
          )}`
        );
      }

      lines.push(
        "",
        `Produktlink: ${productUrl}`,
        "",
        "Bitte bestätigen Sie meine Bestellung."
      );

      return getWhatsAppUrl(
        lines.join("\n")
      );
    }, [
      canPurchase,
      productName,
      unitPrice,
      normalizedQuantity,
      totalPrice,
      productUrl,
    ]);

  /* =======================================================
     AJOUT AU PANIER
     ======================================================= */

  async function handleAddToCart() {
    if (!canAddToCart) {
      return;
    }

    /*
     * Tant que le véritable panier n'est pas connecté,
     * on ne simule pas un faux ajout.
     */
    if (!onAddToCart) {
      return;
    }

    setError(null);
    setAdded(false);
    setIsAdding(true);

    try {
      await onAddToCart(
        productId,
        normalizedQuantity
      );

      setAdded(true);

      window.setTimeout(() => {
        setAdded(false);
      }, 2200);
    } catch {
      setError(
        "Das Produkt konnte nicht zum Warenkorb hinzugefügt werden."
      );
    } finally {
      setIsAdding(false);
    }
  }

  /* =======================================================
     TEXTE BOUTON PANIER
     ======================================================= */

  function getCartButtonLabel() {
    if (!inStock) {
      return "Ausverkauft";
    }

    if (!quantityAvailable) {
      return "Menge nicht verfügbar";
    }

    if (isAdding) {
      return "Wird hinzugefügt...";
    }

    if (added) {
      return "Zum Warenkorb hinzugefügt";
    }

    return "In den Warenkorb";
  }

  /* =======================================================
     RENDU
     ======================================================= */

  return (
    <div className="w-full">
      {/* =====================================================
          ACTIONS
         ===================================================== */}

      <div
        className="
          grid
          w-full
          grid-cols-1
          gap-3
        "
      >
        {/* ===================================================
            PANIER
           =================================================== */}

        <button
          type="button"
          onClick={
            handleAddToCart
          }
          disabled={
            !canAddToCart ||
            !onAddToCart
          }
          aria-disabled={
            !canAddToCart ||
            !onAddToCart
          }
          className={[
            "flex",
            "min-h-[58px]",
            "w-full",
            "items-center",
            "justify-center",
            "gap-2.5",
            "rounded-xl",
            "px-5",
            "py-3",
            "text-sm",
            "font-black",
            "transition-all",
            "duration-200",
            "focus:outline-none",
            "focus-visible:ring-4",

            added
              ? [
                  "bg-emerald-600",
                  "text-white",
                  "shadow-[0_8px_24px_rgba(5,150,105,0.22)]",
                  "focus-visible:ring-emerald-600/20",
                ].join(" ")
              : canAddToCart &&
                  onAddToCart
                ? [
                    "bg-[#101c2c]",
                    "text-white",
                    "shadow-[0_8px_24px_rgba(16,28,44,0.2)]",
                    "hover:-translate-y-0.5",
                    "hover:bg-[#26364c]",
                    "hover:shadow-[0_12px_30px_rgba(16,28,44,0.28)]",
                    "active:translate-y-0",
                    "focus-visible:ring-[#1769e0]/25",
                  ].join(" ")
                : [
                    "cursor-not-allowed",
                    "bg-slate-200",
                    "text-slate-500",
                    "shadow-none",
                  ].join(" "),
          ].join(" ")}
        >
          {isAdding ? (
            <Loader2
              aria-hidden="true"
              className="
                h-5
                w-5
                animate-spin
              "
              strokeWidth={2.2}
            />
          ) : added ? (
            <Check
              aria-hidden="true"
              className="
                h-5
                w-5
              "
              strokeWidth={2.4}
            />
          ) : (
            <ShoppingBag
              aria-hidden="true"
              className="
                h-5
                w-5
              "
              strokeWidth={2.2}
            />
          )}

          <span>
            {getCartButtonLabel()}
          </span>
        </button>

        {/* ===================================================
            COMMANDE WHATSAPP
           =================================================== */}

        {canPurchase ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${productName} über WhatsApp bestellen`}
            className="
              flex
              min-h-[54px]
              w-full
              items-center
              justify-center
              gap-2.5
              rounded-xl
              border
              border-[#25D366]
              bg-white
              px-5
              py-3
              text-sm
              font-black
              text-[#128C4A]
              transition-all
              duration-200

              hover:-translate-y-0.5
              hover:bg-[#25D366]
              hover:text-white
              hover:shadow-[0_10px_26px_rgba(37,211,102,0.20)]

              focus:outline-none
              focus-visible:ring-4
              focus-visible:ring-[#25D366]/20

              active:translate-y-0
            "
          >
            <MessageCircle
              aria-hidden="true"
              className="
                h-5
                w-5
                shrink-0
              "
              strokeWidth={2.2}
            />

            <span>
              Bestellung per WhatsApp
            </span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="
              flex
              min-h-[54px]
              w-full
              cursor-not-allowed
              items-center
              justify-center
              gap-2.5
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-5
              py-3
              text-sm
              font-black
              text-slate-400
            "
          >
            <MessageCircle
              aria-hidden="true"
              className="
                h-5
                w-5
              "
              strokeWidth={2.2}
            />

            <span>
              Bestellung per WhatsApp
            </span>
          </button>
        )}
      </div>

      {/* =====================================================
          RÉSUMÉ COMMANDE WHATSAPP

          Petit résumé utile au client.
         ===================================================== */}

      {canPurchase &&
      unitPrice !== null &&
      totalPrice !== null ? (
        <div
          className="
            mt-3
            flex
            flex-wrap
            items-center
            justify-between
            gap-x-4
            gap-y-1
            rounded-lg
            bg-slate-50
            px-3.5
            py-2.5
            text-xs
          "
        >
          <span
            className="
              font-medium
              text-slate-500
            "
          >
            {normalizedQuantity} ×{" "}
            {formatPrice(unitPrice)}
          </span>

          <span
            className="
              font-black
              text-slate-900
            "
          >
            Gesamt:{" "}
            {formatPrice(
              totalPrice
            )}
          </span>
        </div>
      ) : null}

      {/* =====================================================
          STOCK
         ===================================================== */}

      {!inStock ? (
        <p
          role="status"
          className="
            mt-3
            text-center
            text-xs
            font-semibold
            leading-5
            text-slate-500

            sm:text-left
          "
        >
          Dieses Produkt ist derzeit
          nicht verfügbar.
        </p>
      ) : !quantityAvailable ? (
        <p
          role="alert"
          className="
            mt-3
            text-center
            text-xs
            font-semibold
            leading-5
            text-amber-700

            sm:text-left
          "
        >
          Die gewünschte Menge ist
          nicht verfügbar. Aktueller
          Bestand: {normalizedStock}.
        </p>
      ) : null}

      {/* =====================================================
          ERREUR PANIER
         ===================================================== */}

      {error ? (
        <div
          role="alert"
          className="
            mt-3
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
          "
        >
          <p
            className="
              text-xs
              font-semibold
              leading-5
              text-red-700
            "
          >
            {error}
          </p>
        </div>
      ) : null}
    </div>
  );
}