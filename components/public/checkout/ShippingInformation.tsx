"use client";

import {
  CheckCircle2,
  Info,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  CHECKOUT_COUNTRIES,
  getCheckoutCountry,
  type CheckoutCountryCode,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — SHIPPING INFORMATION
   components/public/checkout/ShippingInformation.tsx

   Bloc d'information concernant la livraison.

   OBJECTIFS :
   - informer clairement le client
   - afficher le pays de livraison sélectionné
   - ne jamais inventer de frais de livraison
   - ne jamais annoncer une livraison gratuite
   - ne jamais annoncer un délai non configuré
   - rester responsive mobile / desktop
   - rester purement visuel

   IMPORTANT :
   Les vrais frais de livraison devront être calculés
   côté serveur lorsque les règles tarifaires seront
   définies.

   Le navigateur ne doit jamais décider seul du montant
   final de livraison.
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type ShippingInformationProps = {
  countryCode?: CheckoutCountryCode;

  shippingAmount?: number | null;

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
   FORMAT PRICE

   Ce formatage n'est utilisé que lorsqu'un montant réel
   a déjà été fourni au composant.

   Aucun tarif n'est calculé ici.
   ========================================================= */

function formatPrice(
  amount: number
): string {
  return new Intl.NumberFormat(
    "de-DE",
    {
      style: "currency",
      currency: "EUR",
    }
  ).format(amount);
}

/* =========================================================
   VALID SHIPPING AMOUNT
   ========================================================= */

function normalizeShippingAmount(
  value: number | null | undefined
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null;
  }

  return (
    Math.round(value * 100) /
    100
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function ShippingInformation({
  countryCode,
  shippingAmount,
  disabled = false,
  className,
}: ShippingInformationProps) {
  /* =======================================================
     COUNTRY
     ======================================================= */

  const selectedCountry =
    countryCode
      ? getCheckoutCountry(
          countryCode
        )
      : null;

  /*
   * Protection supplémentaire :
   * on s'assure que le pays reçu appartient réellement
   * aux pays actuellement autorisés dans checkout.ts.
   */

  const isAllowedCountry =
    Boolean(
      selectedCountry &&
        CHECKOUT_COUNTRIES.some(
          (country) =>
            country.code ===
            selectedCountry.code
        )
    );

  const countryName =
    isAllowedCountry &&
    selectedCountry
      ? selectedCountry.name
      : null;

  /* =======================================================
     SHIPPING PRICE

     null :
     le serveur n'a pas encore fourni de tarif.

     0 :
     un vrai tarif serveur de 0 € a été fourni.

     > 0 :
     un vrai tarif serveur a été fourni.
     ======================================================= */

  const normalizedShippingAmount =
    normalizeShippingAmount(
      shippingAmount
    );

  const hasCalculatedShipping =
    normalizedShippingAmount !==
    null;

  return (
    <section
      aria-labelledby="checkout-shipping-information-title"
      className={joinClassNames(
        [
          "w-full",
          "overflow-hidden",
          "rounded-2xl",
          "border",
          "border-slate-200",
          "bg-white",
          "shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        ].join(" "),

        disabled &&
          "opacity-70",

        className
      )}
    >
      {/* ===================================================
          HEADER
         =================================================== */}

      <div
        className="
          flex
          items-start
          gap-3
          border-b
          border-slate-100
          px-4
          py-4
          sm:px-5
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
          <Truck
            className="h-5 w-5"
            strokeWidth={2.2}
          />
        </div>

        <div className="min-w-0">
          <h2
            id="checkout-shipping-information-title"
            className="
              m-0
              text-[16px]
              font-black
              tracking-[-0.02em]
              text-slate-950
              sm:text-[17px]
            "
          >
            Versandinformationen
          </h2>

          <p
            className="
              mt-1
              text-xs
              font-medium
              leading-5
              text-slate-500
            "
          >
            Die Versandkosten richten
            sich nach Ihrer
            Lieferadresse.
          </p>
        </div>
      </div>

      {/* ===================================================
          CONTENT
         =================================================== */}

      <div
        className="
          space-y-3
          p-4
          sm:p-5
        "
      >
        {/* =================================================
            SHIPPING PRICE
           ================================================= */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-4
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3.5
          "
        >
          <div
            className="
              flex
              min-w-0
              items-start
              gap-3
            "
          >
            <PackageCheck
              aria-hidden="true"
              className="
                mt-0.5
                h-[18px]
                w-[18px]
                shrink-0
                text-[#1769e0]
              "
              strokeWidth={2.1}
            />

            <div className="min-w-0">
              <div
                className="
                  text-[13px]
                  font-extrabold
                  text-slate-900
                "
              >
                Versandkosten
              </div>

              <div
                className="
                  mt-0.5
                  text-xs
                  font-medium
                  leading-5
                  text-slate-500
                "
              >
                Basierend auf Ihrer
                Lieferadresse.
              </div>
            </div>
          </div>

          <div
            className="
              shrink-0
              text-right
            "
          >
            {hasCalculatedShipping ? (
              <span
                className="
                  text-sm
                  font-black
                  text-slate-950
                "
              >
                {formatPrice(
                  normalizedShippingAmount
                )}
              </span>
            ) : (
              <span
                className="
                  inline-flex
                  rounded-full
                  bg-slate-200/70
                  px-2.5
                  py-1
                  text-[11px]
                  font-extrabold
                  text-slate-600
                "
              >
                Nach Adresseingabe
              </span>
            )}
          </div>
        </div>

        {/* =================================================
            COUNTRY
           ================================================= */}

        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-slate-200
            px-4
            py-3.5
          "
        >
          <MapPin
            aria-hidden="true"
            className="
              mt-0.5
              h-[18px]
              w-[18px]
              shrink-0
              text-slate-500
            "
            strokeWidth={2}
          />

          <div className="min-w-0">
            <div
              className="
                text-[13px]
                font-extrabold
                text-slate-900
              "
            >
              Lieferland
            </div>

            <div
              className="
                mt-0.5
                text-xs
                font-medium
                leading-5
                text-slate-500
              "
            >
              {countryName
                ? countryName
                : "Bitte wählen Sie Ihre Lieferadresse aus."}
            </div>
          </div>
        </div>

        {/* =================================================
            ORDER HANDLING
           ================================================= */}

        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-emerald-100
            bg-emerald-50/60
            px-4
            py-3.5
          "
        >
          <CheckCircle2
            aria-hidden="true"
            className="
              mt-0.5
              h-[18px]
              w-[18px]
              shrink-0
              text-emerald-600
            "
            strokeWidth={2.1}
          />

          <div className="min-w-0">
            <div
              className="
                text-[13px]
                font-extrabold
                text-slate-900
              "
            >
              Sichere Bestellübermittlung
            </div>

            <p
              className="
                m-0
                mt-0.5
                text-xs
                font-medium
                leading-5
                text-slate-600
              "
            >
              Ihre Bestelldaten werden
              zur Bearbeitung Ihrer
              Bestellung übermittelt.
            </p>
          </div>
        </div>

        {/* =================================================
            IMPORTANT INFORMATION
           ================================================= */}

        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-blue-100
            bg-blue-50/60
            px-4
            py-3.5
          "
        >
          <Info
            aria-hidden="true"
            className="
              mt-0.5
              h-[18px]
              w-[18px]
              shrink-0
              text-[#1769e0]
            "
            strokeWidth={2.1}
          />

          <p
            className="
              m-0
              text-xs
              font-medium
              leading-5
              text-slate-600
            "
          >
            Der endgültige Versandbetrag
            wird anhand der angegebenen
            Lieferadresse bestimmt und in
            Ihrer Bestellübersicht
            berücksichtigt.
          </p>
        </div>

        {/* =================================================
            SECURITY
           ================================================= */}

        <div
          className="
            flex
            items-center
            gap-2
            px-1
            pt-1
            text-[11px]
            font-semibold
            leading-5
            text-slate-500
          "
        >
          <ShieldCheck
            aria-hidden="true"
            className="
              h-4
              w-4
              shrink-0
              text-slate-400
            "
            strokeWidth={2}
          />

          <span>
            Versandinformationen werden
            nicht zur Berechnung im
            Browser vertraut.
          </span>
        </div>
      </div>
    </section>
  );
}