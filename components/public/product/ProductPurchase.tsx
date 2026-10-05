"use client";

import {
  useCallback,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { addCartItem } from "@/lib/cart";

import ProductActions from "@/components/public/product/ProductActions";
import ProductQuantity from "@/components/public/product/ProductQuantity";

/* =========================================================
   NACHTKRONE — PRODUCT PURCHASE
   components/public/product/ProductPurchase.tsx

   Zone d'achat de la fiche produit.

   Responsabilités :
   - gérer la quantité sélectionnée
   - respecter le stock réel
   - synchroniser quantité + actions
   - transmettre le prix réel
   - transmettre le prix promotionnel
   - permettre la commande WhatsApp
   - rester compatible avec le futur panier
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type ProductPriceValue =
  | string
  | number
  | null
  | undefined;

export type ProductPurchaseAddToCartHandler = (
  productId: string,
  quantity: number
) => void | Promise<void>;

type ProductPurchaseProps = {
  productId: string;
  productName: string;
  productSlug: string;

  price: ProductPriceValue;
  promotionalPrice?: ProductPriceValue;

  stock: number;

  onAddToCart?: ProductPurchaseAddToCartHandler;
};

/* =========================================================
   HELPERS
   ========================================================= */

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
    Math.max(
      1,
      Math.floor(quantity)
    ),
    stock
  );
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function ProductPurchase({
  productId,
  productName,
  productSlug,
  price,
  promotionalPrice,
  stock,
  onAddToCart,
}: ProductPurchaseProps) {
  const router = useRouter();
  /* =======================================================
     STOCK
     ======================================================= */

  const normalizedStock =
    normalizeStock(stock);

  const isOutOfStock =
    normalizedStock <= 0;

  /* =======================================================
     QUANTITÉ

     - stock disponible : quantité initiale = 1
     - stock épuisé : quantité = 0
     ======================================================= */

  const [selectedQuantity, setQuantity] =
    useState<number>(() =>
      normalizedStock > 0
        ? 1
        : 0
    );

  /* =======================================================
     SYNCHRONISATION DU STOCK

     Si le stock change :
     - 0 si épuisé
     - minimum 1 si disponible
     - maximum = stock réel

     Important :
     on ne fait jamais setState directement pendant
     le rendu du composant.
     ======================================================= */

  const quantity = normalizeQuantity(selectedQuantity, normalizedStock);

  /* =======================================================
     CHANGEMENT DE QUANTITÉ
     ======================================================= */

  function handleQuantityChange(nextQuantity: number) {
        if (normalizedStock <= 0) {
          setQuantity(0);
          return;
        }

        const nextSafeQuantity =
          normalizeQuantity(
            nextQuantity,
            normalizedStock
          );

        setQuantity(
          nextSafeQuantity
        );
  }

  /* =======================================================
     QUANTITÉ UTILISÉE PAR LES ACTIONS

     ProductActions utilise toujours au minimum 1.

     Si stock = 0, les actions de commande sont
     automatiquement désactivées grâce à stock={0}.
     ======================================================= */

  const actionQuantity =
    isOutOfStock
      ? 1
      : normalizeQuantity(
          quantity,
          normalizedStock
        );

  /* =======================================================
     AJOUT AU PANIER

     Cette partie reste prête pour le véritable panier.

     Aucun faux panier n'est créé ici.
     ======================================================= */

  const handleAddToCart =
    useCallback(
      async (
        requestedProductId: string,
        requestedQuantity: number
      ) => {
        if (normalizedStock <= 0) {
          return;
        }

        if (
          requestedProductId !==
          productId
        ) {
          return;
        }

        const safeRequestedQuantity =
          normalizeQuantity(
            requestedQuantity,
            normalizedStock
          );

        if (
          safeRequestedQuantity < 1 ||
          safeRequestedQuantity >
            normalizedStock
        ) {
          return;
        }

        if (onAddToCart) {
          await onAddToCart(productId, safeRequestedQuantity);
        } else {
          addCartItem(productId, safeRequestedQuantity, normalizedStock);
        }

        const checkoutParams = new URLSearchParams({
          productId,
          quantity: String(safeRequestedQuantity),
        });

        router.push("/bestellung/lieferung?" + checkoutParams.toString());
      },
      [
        onAddToCart,
        normalizedStock,
        productId,
        router,
      ]
    );

  /* =======================================================
     RENDU
     ======================================================= */

  return (
    <section
      aria-label="Produkt kaufen"
      className="w-full"
    >
      {/* =====================================================
          QUANTITÉ
         ===================================================== */}

      <ProductQuantity
        quantity={quantity}
        stock={normalizedStock}
        onChange={
          handleQuantityChange
        }
        disabled={
          isOutOfStock
        }
      />

      {/* =====================================================
          ACTIONS

          ProductActions reçoit maintenant :
          - produit
          - slug
          - prix normal
          - prix promotionnel
          - quantité sélectionnée
          - stock

          Il peut donc construire automatiquement
          la commande WhatsApp.
         ===================================================== */}

      <div className="mt-5">
        <ProductActions
          productId={
            productId
          }
          productName={
            productName
          }
          productSlug={
            productSlug
          }
          price={
            price
          }
          promotionalPrice={
            promotionalPrice
          }
          quantity={
            actionQuantity
          }
          stock={
            normalizedStock
          }
          onAddToCart={handleAddToCart}
        />
      </div>
    </section>
  );
}