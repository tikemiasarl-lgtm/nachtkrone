import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DeliveryCheckout from "@/components/public/checkout/DeliveryCheckout";

import { prisma } from "@/lib/prisma";

import {
  calculateCheckoutItemTotal,
  calculateCheckoutSubtotal,
  calculateCheckoutTotal,
  normalizeCheckoutQuantity,
  type CheckoutItem,
  type CheckoutOrderItemInput,
  type CheckoutOrderSummary,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — DELIVERY CHECKOUT PAGE
   app/(public)/bestellung/lieferung/page.tsx

   RESPONSABILITÉS :
   - page serveur
   - lire productId + quantity
   - récupérer le produit depuis Prisma
   - vérifier Product.status === PUBLISHED
   - vérifier le stock
   - calculer le prix effectif côté serveur
   - préparer le résumé initial
   - alimenter DeliveryCheckout

   IMPORTANT :
   Cette page ne crée PAS la commande.

   La création définitive sera faite uniquement dans :

   app/api/public/orders/route.ts

   Cette route API devra de nouveau :
   - recharger les produits
   - vérifier PUBLISHED
   - vérifier le stock
   - recalculer les prix
   - calculer les frais de livraison
   - créer la commande
   - générer la confirmation
   - envoyer les e-mails

   Le calcul réalisé ici sert à construire l'affichage
   initial du checkout. Il ne remplace jamais la validation
   finale côté API.
   ========================================================= */

/* =========================================================
   RUNTIME

   Prisma nécessite un runtime Node.js.
   ========================================================= */

export const runtime = "nodejs";

/* =========================================================
   DYNAMIC

   Le checkout dépend des paramètres de la requête et de
   l'état actuel du produit / stock.

   On évite donc de générer cette page statiquement.
   ========================================================= */

export const dynamic = "force-dynamic";

/* =========================================================
   METADATA
   ========================================================= */

export const metadata: Metadata = {
  title: "Lieferung | NACHTKRONE",
  description:
    "Geben Sie Ihre Lieferdaten ein und senden Sie Ihre NACHTKRONE Bestellung sicher ab.",
  robots: {
    index: false,
    follow: false,
  },
};

/* =========================================================
   TYPES
   ========================================================= */

type CheckoutDeliveryPageProps = {
  searchParams: Promise<{
    productId?: string | string[];
    quantity?: string | string[];
  }>;
};

/* =========================================================
   SEARCH PARAM
   ========================================================= */

function getSingleSearchParam(
  value: string | string[] | undefined
): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();

    return normalized || null;
  }

  if (Array.isArray(value)) {
    const firstValue = value[0];

    if (typeof firstValue !== "string") {
      return null;
    }

    const normalized = firstValue.trim();

    return normalized || null;
  }

  return null;
}

/* =========================================================
   QUANTITY
   ========================================================= */

function getRequestedQuantity(
  value: string | string[] | undefined
): number {
  const rawValue = getSingleSearchParam(value);

  if (!rawValue) {
    return 1;
  }

  /*
   * On refuse les formats ambigus comme :
   *
   * 1.5
   * 1abc
   * +2
   * -1
   *
   * Seuls les chiffres sont acceptés.
   */

  if (!/^\d+$/.test(rawValue)) {
    return 1;
  }

  const parsed = Number(rawValue);

  if (!Number.isSafeInteger(parsed)) {
    return 1;
  }

  return normalizeCheckoutQuantity(parsed);
}

/* =========================================================
   DECIMAL -> NUMBER

   Prisma Decimal est converti explicitement.

   Ce nombre sert uniquement au rendu du résumé initial.

   La route POST /api/public/orders recalculera encore
   les montants depuis la base de données.
   ========================================================= */

function decimalToNumber(
  value: {
    toString(): string;
  } | number | string | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw =
    typeof value === "object"
      ? value.toString()
      : String(value);

  const numberValue = Number(raw);

  if (
    !Number.isFinite(numberValue) ||
    numberValue < 0
  ) {
    return null;
  }

  return Math.round(numberValue * 100) / 100;
}

/* =========================================================
   EFFECTIVE PRICE

   Règle :
   - promotionalPrice valide et inférieur au prix normal
     => promotion
   - sinon => prix normal

   Cette logique devra être reproduite côté API.
   ========================================================= */

function getEffectivePrice(
  priceValue: {
    toString(): string;
  } | number | string,
  promotionalPriceValue:
    | {
        toString(): string;
      }
    | number
    | string
    | null
    | undefined
): number | null {
  const price = decimalToNumber(priceValue);

  if (price === null) {
    return null;
  }

  const promotionalPrice = decimalToNumber(
    promotionalPriceValue
  );

  if (
    promotionalPrice !== null &&
    promotionalPrice < price
  ) {
    return promotionalPrice;
  }

  return price;
}

/* =========================================================
   EMPTY CHECKOUT

   Tant que le projet n'a pas de vrai panier persistant,
   une ouverture directe de /bestellung/lieferung sans
   productId ne doit pas fabriquer une commande fictive.

   On affiche donc un état vide propre.
   ========================================================= */

function EmptyCheckoutState() {
  return (
    <main className="min-h-[70vh] bg-slate-50/60">
      <div className="mx-auto flex w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:px-10 sm:py-14">
          {/* Icon */}

          <div
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-slate-500"
            >
              <path
                d="M6.5 8.5h11l-1 10h-9l-1-10Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M9 9V7a3 3 0 0 1 6 0v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Keine Bestellung vorhanden
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-6 text-slate-600">
            Wählen Sie zuerst ein Produkt aus, bevor Sie Ihre
            Lieferdaten eingeben.
          </p>

          <Link
            href="/produkte"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[#071a33] px-6 text-sm font-black text-white no-underline transition hover:bg-[#0b274a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            Produkte entdecken
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   UNAVAILABLE PRODUCT
   ========================================================= */

function UnavailableProductState() {
  return (
    <main className="min-h-[70vh] bg-slate-50/60">
      <div className="mx-auto flex w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8"
            >
              <path
                d="M12 8v5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M12 17.25v.01"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              <path
                d="M10.3 4.9 3.6 17a2 2 0 0 0 1.75 3h13.3a2 2 0 0 0 1.75-3L13.7 4.9a1.95 1.95 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Produkt derzeit nicht verfügbar
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-6 text-slate-600">
            Dieses Produkt kann momentan nicht bestellt werden.
            Bitte wählen Sie ein anderes Produkt aus unserem
            Sortiment.
          </p>

          <Link
            href="/produkte"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[#071a33] px-6 text-sm font-black text-white no-underline transition hover:bg-[#0b274a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            Andere Produkte ansehen
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function CheckoutDeliveryPage({
  searchParams,
}: CheckoutDeliveryPageProps) {
  const params = await searchParams;

  /* =======================================================
     PRODUCT ID
     ======================================================= */

  const productId = getSingleSearchParam(
    params.productId
  );

  if (!productId) {
    return <EmptyCheckoutState />;
  }

  /* =======================================================
     QUANTITY
     ======================================================= */

  const requestedQuantity = getRequestedQuantity(
    params.quantity
  );

  /* =======================================================
     DATABASE

     On récupère uniquement les données nécessaires.

     La condition status: PUBLISHED empêche un produit
     DRAFT / ARCHIVED d'être commandé via une URL forgée.
     ======================================================= */

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "PUBLISHED",
    },

    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      promotionalPrice: true,
      stock: true,
      mainImage: true,
    },
  });

  /* =======================================================
     PRODUCT NOT FOUND

     On utilise un état propre plutôt qu'une erreur brute.
     ======================================================= */

  if (!product) {
    return <UnavailableProductState />;
  }

  /* =======================================================
     STOCK
     ======================================================= */

  if (
    !Number.isInteger(product.stock) ||
    product.stock <= 0
  ) {
    return <UnavailableProductState />;
  }

  /*
   * La quantité affichée ne peut pas dépasser le stock
   * actuellement connu.
   *
   * L'API vérifiera de nouveau le stock au moment exact
   * de la création de la commande.
   */

  const quantity = Math.min(
    requestedQuantity,
    product.stock
  );

  /* =======================================================
     PRICE
     ======================================================= */

  const unitPrice = getEffectivePrice(
    product.price,
    product.promotionalPrice
  );

  if (unitPrice === null) {
    /*
     * Une donnée prix invalide dans la base ne doit pas
     * produire une commande à 0 €.
     */

    notFound();
  }

  /* =======================================================
     CHECKOUT ITEM
     ======================================================= */

  const totalPrice =
    calculateCheckoutItemTotal(
      unitPrice,
      quantity
    );

  const checkoutItem: CheckoutItem = {
    productId: product.id,

    productSlug: product.slug,

    productName: product.name,

    productImage:
      product.mainImage,

    quantity,

    unitPrice,

    totalPrice,
  };

  /* =======================================================
     SUMMARY

     IMPORTANT :
     Les frais de livraison ne sont PAS encore configurés.

     On ne décide donc pas ici que la livraison est gratuite.

     Pour l'objet technique CheckoutOrderSummary, la valeur
     reste 0 car le type actuel exige un number.

     DeliveryCheckout reçoit séparément :
     shippingAmount={null}

     Ce null signifie explicitement :
     "pas encore calculé".
     ======================================================= */

  const items: CheckoutItem[] = [
    checkoutItem,
  ];

  const subtotal =
    calculateCheckoutSubtotal(
      items
    );

  const technicalShippingAmount = 0;

  const total =
    calculateCheckoutTotal(
      subtotal,
      technicalShippingAmount
    );

  const summary: CheckoutOrderSummary = {
    items,

    subtotal,

    shippingAmount:
      technicalShippingAmount,

    total,

    currency: "EUR",
  };

  /* =======================================================
     API ITEMS

     Seuls productId et quantity seront envoyés.

     PAS DE :
     - unitPrice
     - totalPrice
     - subtotal
     - promotionalPrice
     - shippingAmount
     - total

     L'API devra recalculer absolument tout.
     ======================================================= */

  const orderItems: CheckoutOrderItemInput[] = [
    {
      productId:
        product.id,

      quantity,
    },
  ];

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main className="min-h-screen bg-slate-50/60">
      <DeliveryCheckout
        summary={summary}
        orderItems={orderItems}
        shippingAmount={null}
      />
    </main>
  );
}