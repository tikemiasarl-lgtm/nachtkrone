"use client";

import {
  ChevronDown,
  ChevronUp,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import {
  formatCheckoutPrice,
  type CheckoutOrderSummary,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — ORDER SUMMARY
   components/public/checkout/OrderSummary.tsx

   Résumé visuel de la commande.

   Affiche :
   - produits
   - images
   - quantités
   - prix unitaires
   - total par produit
   - sous-total
   - livraison
   - total

   IMPORTANT :
   Ce composant ne constitue PAS une source de vérité
   concernant les prix.

   La route serveur devra toujours :
   - récupérer les produits depuis Prisma
   - vérifier qu'ils sont PUBLISHED
   - vérifier le stock
   - récupérer le vrai prix
   - appliquer le vrai prix promotionnel
   - recalculer le sous-total
   - calculer les frais de livraison
   - recalculer le total

   Aucun prix envoyé par le navigateur ne devra être
   accepté comme source de vérité.
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type OrderSummaryProps = {
  summary: CheckoutOrderSummary;

  /*
   * null / undefined :
   * les frais ne sont pas encore définitivement calculés.
   *
   * number :
   * montant réellement connu.
   *
   * 0 est donc différent de null.
   */
  shippingAmount?: number | null;

  /*
   * Sur mobile, le résumé peut être repliable.
   */
  collapsible?: boolean;

  /*
   * État initial du résumé mobile.
   */
  defaultOpen?: boolean;

  /*
   * Permet de bloquer les interactions pendant
   * l'envoi de la commande.
   */
  disabled?: boolean;

  className?: string;
};

/* =========================================================
   HELPERS
   ========================================================= */

function joinClassNames(
  ...classes: Array<
    string | false | null | undefined
  >
): string {
  return classes
    .filter(Boolean)
    .join(" ");
}

/* =========================================================
   MONEY
   ========================================================= */

function normalizeMoney(
  value: number
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return (
    Math.round(
      Math.max(0, value) * 100
    ) / 100
  );
}

function formatMoney(
  value: number
): string {
  return formatCheckoutPrice(
    normalizeMoney(value)
  );
}

/* =========================================================
   QUANTITY
   ========================================================= */

function normalizeQuantity(
  value: number
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(value)
  );
}

/* =========================================================
   IMAGE
   ========================================================= */

function normalizeImageSource(
  value: string
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const image =
    value.trim();

  if (!image) {
    return null;
  }

  /*
   * Les images locales Next.js restent acceptées.
   */

  if (
    image.startsWith("/")
  ) {
    return image;
  }

  /*
   * Les images Supabase / CDN utilisent normalement HTTPS.
   */

  if (
    image.startsWith(
      "https://"
    ) ||
    image.startsWith(
      "http://"
    )
  ) {
    return image;
  }

  return null;
}

/* =========================================================
   PRODUCT IMAGE
   ========================================================= */

function ProductImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const image =
    normalizeImageSource(src);

  if (!image) {
    return (
      <div
        aria-hidden="true"
        className="
          flex
          h-full
          w-full
          items-center
          justify-center
          bg-slate-100
          text-slate-400
        "
      >
        <Package
          className="h-7 w-7"
          strokeWidth={1.7}
        />
      </div>
    );
  }

  /*
   * On utilise volontairement <img> ici.
   *
   * Les URLs produits peuvent provenir du stockage Supabase.
   * Cela évite de rendre ce composant dépendant d'une
   * configuration next/image distante spécifique.
   */

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="
        h-full
        w-full
        object-contain
        p-1
      "
    />
  );
}

/* =========================================================
   SUMMARY CONTENT
   ========================================================= */

function SummaryContent({
  summary,
  shippingAmount,
}: {
  summary: CheckoutOrderSummary;
  shippingAmount:
    | number
    | null
    | undefined;
}) {
  const items =
    Array.isArray(summary.items)
      ? summary.items
      : [];

  /* =======================================================
     SHIPPING

     La prop shippingAmount est volontairement prioritaire.

     Cela permet au checkout de conserver :
     null = pas encore calculé
     0    = réellement 0 €
     > 0  = montant calculé

     Si aucune prop n'est fournie, on ne transforme pas
     automatiquement summary.shippingAmount === 0 en
     "livraison gratuite", car notre backend final n'est
     pas encore configuré avec les tarifs de livraison.
     ======================================================= */

  const hasExplicitShippingAmount =
    typeof shippingAmount ===
      "number" &&
    Number.isFinite(
      shippingAmount
    ) &&
    shippingAmount >= 0;

  const normalizedShippingAmount =
    hasExplicitShippingAmount
      ? normalizeMoney(
          shippingAmount
        )
      : null;

  /* =======================================================
     DISPLAY TOTAL

     Tant que les frais de livraison ne sont pas connus,
     on affiche le total des produits avec "+ Versand".

     Quand les frais sont réellement connus, le montant
     affiché utilise le total du summary s'il est cohérent.
     Sinon, on reconstruit uniquement l'affichage à partir
     du sous-total + shipping connu.

     Cela reste VISUEL.
     Le serveur demeure la source de vérité.
     ======================================================= */

  const subtotal =
    normalizeMoney(
      summary.subtotal
    );

  const summaryTotal =
    normalizeMoney(
      summary.total
    );

  const calculatedDisplayTotal =
    normalizedShippingAmount !==
    null
      ? normalizeMoney(
          subtotal +
            normalizedShippingAmount
        )
      : subtotal;

  const displayTotal =
    normalizedShippingAmount !==
      null &&
    Math.abs(
      summaryTotal -
        calculatedDisplayTotal
    ) < 0.01
      ? summaryTotal
      : calculatedDisplayTotal;

  return (
    <>
      {/* ===================================================
          PRODUCTS
         =================================================== */}

      <div>
        {items.length > 0 ? (
          <ul
            className="
              divide-y
              divide-slate-100
            "
          >
            {items.map(
              (item, index) => {
                const quantity =
                  normalizeQuantity(
                    item.quantity
                  );

                return (
                  <li
                    key={`${item.productId}-${index}`}
                    className="
                      flex
                      gap-3
                      py-4
                      first:pt-0
                    "
                  >
                    {/* =====================================
                        IMAGE
                       ===================================== */}

                    <div
                      className="
                        relative
                        h-[74px]
                        w-[74px]
                        shrink-0
                      "
                    >
                      <div
                        className="
                          h-full
                          w-full
                          overflow-hidden
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                        "
                      >
                        <ProductImage
                          src={
                            item.productImage
                          }
                          alt={
                            item.productName
                          }
                        />
                      </div>

                      {/* ===================================
                          QUANTITY BADGE
                         =================================== */}

                      <span
                        aria-label={`Menge ${quantity}`}
                        className="
                          absolute
                          -right-2
                          -top-2
                          flex
                          h-6
                          min-w-6
                          items-center
                          justify-center
                          rounded-full
                          border-2
                          border-white
                          bg-slate-800
                          px-1.5
                          text-[10px]
                          font-black
                          text-white
                          shadow-sm
                        "
                      >
                        {quantity}
                      </span>
                    </div>

                    {/* =====================================
                        PRODUCT INFO
                       ===================================== */}

                    <div
                      className="
                        flex
                        min-w-0
                        flex-1
                        justify-between
                        gap-3
                      "
                    >
                      <div
                        className="
                          min-w-0
                          py-0.5
                        "
                      >
                        <p
                          className="
                            m-0
                            line-clamp-2
                            text-[13px]
                            font-extrabold
                            leading-5
                            text-slate-950
                            sm:text-sm
                          "
                        >
                          {
                            item.productName
                          }
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            font-medium
                            text-slate-500
                          "
                        >
                          Menge:{" "}
                          {quantity}
                        </p>

                        <p
                          className="
                            mt-0.5
                            text-[11px]
                            font-medium
                            text-slate-400
                          "
                        >
                          {formatMoney(
                            item.unitPrice
                          )}{" "}
                          / Stück
                        </p>
                      </div>

                      <div
                        className="
                          shrink-0
                          py-0.5
                          text-right
                        "
                      >
                        <span
                          className="
                            text-[13px]
                            font-black
                            text-slate-950
                            sm:text-sm
                          "
                        >
                          {formatMoney(
                            item.totalPrice
                          )}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              }
            )}
          </ul>
        ) : (
          /* =================================================
             EMPTY STATE

             Ce cas ne doit normalement jamais atteindre
             l'API de création de commande.
             ================================================= */

          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              rounded-xl
              border
              border-dashed
              border-slate-300
              bg-slate-50
              px-4
              py-8
              text-center
            "
          >
            <ShoppingBag
              aria-hidden="true"
              className="
                h-8
                w-8
                text-slate-300
              "
              strokeWidth={1.7}
            />

            <p
              className="
                mt-3
                text-sm
                font-extrabold
                text-slate-700
              "
            >
              Keine Produkte
            </p>

            <p
              className="
                mt-1
                max-w-[260px]
                text-xs
                font-medium
                leading-5
                text-slate-500
              "
            >
              Ihre Bestellübersicht ist
              derzeit leer.
            </p>
          </div>
        )}
      </div>

      {/* ===================================================
          TOTALS
         =================================================== */}

      <div
        className="
          mt-4
          border-t
          border-slate-200
          pt-4
        "
      >
        {/* =================================================
            SUBTOTAL
           ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            py-1.5
          "
        >
          <span
            className="
              text-[13px]
              font-medium
              text-slate-600
            "
          >
            Zwischensumme
          </span>

          <span
            className="
              text-[13px]
              font-extrabold
              text-slate-900
            "
          >
            {formatMoney(
              subtotal
            )}
          </span>
        </div>

        {/* =================================================
            SHIPPING
           ================================================= */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-4
            py-1.5
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <Truck
              aria-hidden="true"
              className="
                h-4
                w-4
                shrink-0
                text-slate-400
              "
              strokeWidth={2}
            />

            <span
              className="
                text-[13px]
                font-medium
                text-slate-600
              "
            >
              Versand
            </span>
          </div>

          <span
            className="
              max-w-[180px]
              text-right
              text-[12px]
              font-bold
              leading-5
              text-slate-600
            "
          >
            {normalizedShippingAmount !==
            null
              ? formatMoney(
                  normalizedShippingAmount
                )
              : "Nach Adresseingabe"}
          </span>
        </div>

        {/* =================================================
            TOTAL
           ================================================= */}

        <div
          className="
            mt-3
            flex
            items-end
            justify-between
            gap-4
            border-t
            border-slate-200
            pt-4
          "
        >
          <div>
            <span
              className="
                block
                text-[16px]
                font-black
                text-slate-950
              "
            >
              Gesamt
            </span>

            <span
              className="
                mt-0.5
                block
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.08em]
                text-slate-400
              "
            >
              EUR
            </span>
          </div>

          <div className="text-right">
            <span
              className="
                block
                text-xl
                font-black
                tracking-[-0.03em]
                text-slate-950
              "
            >
              {formatMoney(
                displayTotal
              )}
            </span>

            {normalizedShippingAmount ===
            null ? (
              <span
                className="
                  mt-0.5
                  block
                  text-[10px]
                  font-semibold
                  text-slate-500
                "
              >
                + Versand
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ===================================================
          SECURITY / PAYMENT NOTICE
         =================================================== */}

      <div
        className="
          mt-5
          flex
          items-start
          gap-2.5
          rounded-xl
          border
          border-blue-100
          bg-blue-50/60
          px-3.5
          py-3
        "
      >
        <ShieldCheck
          aria-hidden="true"
          className="
            mt-0.5
            h-[17px]
            w-[17px]
            shrink-0
            text-[#1769e0]
          "
          strokeWidth={2.1}
        />

        <p
          className="
            m-0
            text-[11px]
            font-medium
            leading-[18px]
            text-slate-600
          "
        >
          Ihre Bestellung wird sicher
          übermittelt. Diese Übersicht
          stellt keine
          Zahlungsbestätigung dar.
        </p>
      </div>
    </>
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function OrderSummary({
  summary,
  shippingAmount,
  collapsible = true,
  defaultOpen = false,
  disabled = false,
  className,
}: OrderSummaryProps) {
  /*
   * Aucun useState n'est nécessaire.
   *
   * <details> fournit un comportement natif,
   * accessible et robuste pour la version mobile.
   *
   * Sur desktop, le contenu est toujours visible.
   */

  const itemCount =
    Array.isArray(summary.items)
      ? summary.items.reduce(
          (
            total,
            item
          ) =>
            total +
            normalizeQuantity(
              item.quantity
            ),
          0
        )
      : 0;

  const subtotal =
    normalizeMoney(
      summary.subtotal
    );

  /* =======================================================
     NON COLLAPSIBLE VERSION
     ======================================================= */

  if (!collapsible) {
    return (
      <aside
        aria-labelledby="checkout-order-summary-title"
        className={joinClassNames(
          [
            "w-full",
            "rounded-2xl",
            "border",
            "border-slate-200",
            "bg-white",
            "p-4",
            "shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
            "sm:p-5",
          ].join(" "),

          disabled &&
            "opacity-70",

          className
        )}
      >
        <div
          className="
            mb-5
            flex
            items-center
            gap-3
          "
        >
          <div
            aria-hidden="true"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-50
              text-[#1769e0]
            "
          >
            <ReceiptText
              className="h-5 w-5"
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0">
            <h2
              id="checkout-order-summary-title"
              className="
                m-0
                text-[17px]
                font-black
                tracking-[-0.02em]
                text-slate-950
              "
            >
              Bestellübersicht
            </h2>

            <p
              className="
                mt-0.5
                text-xs
                font-medium
                text-slate-500
              "
            >
              {itemCount}{" "}
              {itemCount === 1
                ? "Artikel"
                : "Artikel"}
            </p>
          </div>
        </div>

        <SummaryContent
          summary={summary}
          shippingAmount={
            shippingAmount
          }
        />
      </aside>
    );
  }

  return (
    <aside
      aria-label="Bestellübersicht"
      className={joinClassNames(
        "w-full",
        disabled &&
          "opacity-70",
        className
      )}
    >
      {/* ===================================================
          MOBILE VERSION

          Repliable en haut du checkout.
         =================================================== */}

      <details
        open={
          defaultOpen
            ? true
            : undefined
        }
        className="
          group
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-[0_8px_25px_rgba(15,23,42,0.05)]
          lg:hidden
        "
      >
        <summary
          className={joinClassNames(
            [
              "flex",
              "cursor-pointer",
              "list-none",
              "items-center",
              "justify-between",
              "gap-4",
              "px-4",
              "py-4",
              "[&::-webkit-details-marker]:hidden",
            ].join(" "),

            disabled &&
              "pointer-events-none"
          )}
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              aria-hidden="true"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-[#1769e0]
              "
            >
              <ShoppingBag
                className="h-[18px] w-[18px]"
                strokeWidth={2.2}
              />
            </div>

            <div className="min-w-0">
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    truncate
                    text-sm
                    font-black
                    text-slate-950
                  "
                >
                  Bestellübersicht
                </span>

                <span
                  className="
                    rounded-full
                    bg-slate-100
                    px-2
                    py-0.5
                    text-[10px]
                    font-black
                    text-slate-600
                  "
                >
                  {itemCount}
                </span>
              </div>

              <span
                className="
                  mt-0.5
                  block
                  text-[11px]
                  font-semibold
                  text-[#1769e0]
                "
              >
                <span className="group-open:hidden">
                  Anzeigen
                </span>

                <span className="hidden group-open:inline">
                  Ausblenden
                </span>
              </span>
            </div>
          </div>

          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
            "
          >
            <div className="text-right">
              <span
                className="
                  block
                  text-sm
                  font-black
                  text-slate-950
                "
              >
                {formatMoney(
                  subtotal
                )}
              </span>

              {shippingAmount ==
              null ? (
                <span
                  className="
                    block
                    text-[9px]
                    font-semibold
                    text-slate-400
                  "
                >
                  + Versand
                </span>
              ) : null}
            </div>

            <ChevronDown
              aria-hidden="true"
              className="
                h-5
                w-5
                text-slate-500
                group-open:hidden
              "
              strokeWidth={2}
            />

            <ChevronUp
              aria-hidden="true"
              className="
                hidden
                h-5
                w-5
                text-slate-500
                group-open:block
              "
              strokeWidth={2}
            />
          </div>
        </summary>

        <div
          className="
            border-t
            border-slate-100
            px-4
            pb-4
            pt-4
          "
        >
          <SummaryContent
            summary={summary}
            shippingAmount={
              shippingAmount
            }
          />
        </div>
      </details>

      {/* ===================================================
          DESKTOP VERSION

          Toujours visible dans la colonne droite.
         =================================================== */}

      <div
        className="
          hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-[0_12px_35px_rgba(15,23,42,0.06)]
          lg:block
        "
      >
        <div
          className="
            mb-5
            flex
            items-center
            gap-3
          "
        >
          <div
            aria-hidden="true"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-50
              text-[#1769e0]
            "
          >
            <ReceiptText
              className="h-5 w-5"
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0">
            <h2
              className="
                m-0
                text-[17px]
                font-black
                tracking-[-0.02em]
                text-slate-950
              "
            >
              Bestellübersicht
            </h2>

            <p
              className="
                mt-0.5
                text-xs
                font-medium
                text-slate-500
              "
            >
              {itemCount}{" "}
              {itemCount === 1
                ? "Artikel"
                : "Artikel"}
            </p>
          </div>
        </div>

        <SummaryContent
          summary={summary}
          shippingAmount={
            shippingAmount
          }
        />
      </div>
    </aside>
  );
}