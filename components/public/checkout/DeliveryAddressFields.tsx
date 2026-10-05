"use client";

import {
  Building2,
  MapPin,
  Navigation,
  PackageCheck,
} from "lucide-react";

import {
  CHECKOUT_COUNTRIES,
  CHECKOUT_LIMITS,
  type CheckoutFieldErrors,
  type CheckoutShippingAddress,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — DELIVERY ADDRESS FIELDS
   components/public/checkout/DeliveryAddressFields.tsx

   Adresse de livraison du checkout.

   Champs :
   - Land / Region
   - Straße und Hausnummer
   - Adresszusatz
   - Postleitzahl
   - Ort

   Le champ "state" existe dans l'architecture des données
   mais n'est pas affiché ici car il ne fait pas partie de
   l'interface de livraison actuellement définie.

   RESPONSABILITÉS :
   - afficher l'adresse de livraison
   - gérer les pays autorisés
   - mettre à jour CheckoutShippingAddress
   - afficher les erreurs serveur/client
   - rester responsive mobile / desktop
   - fournir les bons autocomplete
   - ne gérer ni Prisma ni la commande
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type DeliveryAddressFieldsProps = {
  value: CheckoutShippingAddress;

  onChange: (
    value: CheckoutShippingAddress
  ) => void;

  errors?: CheckoutFieldErrors;

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

function getInputClassName(
  hasError: boolean,
  hasLeftIcon = false
): string {
  return joinClassNames(
    [
      "block",
      "h-12",
      "w-full",
      "rounded-xl",
      "border",
      "bg-white",
      "text-[15px]",
      "font-medium",
      "text-slate-950",
      "outline-none",
      "transition",
      "duration-200",
      "placeholder:text-slate-400",
      "disabled:cursor-not-allowed",
      "disabled:bg-slate-100",
      "disabled:text-slate-500",
      "disabled:opacity-80",
    ].join(" "),

    hasLeftIcon
      ? "pl-11 pr-4"
      : "px-4",

    hasError
      ? [
          "border-red-400",
          "focus:border-red-500",
          "focus:ring-4",
          "focus:ring-red-100",
        ].join(" ")
      : [
          "border-slate-200",
          "hover:border-slate-300",
          "focus:border-[#1769e0]",
          "focus:ring-4",
          "focus:ring-blue-100/80",
        ].join(" ")
  );
}

/* =========================================================
   LABEL
   ========================================================= */

function FieldLabel({
  htmlFor,
  children,
  required = false,
  optional = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="
        mb-2
        flex
        items-center
        gap-1.5
        text-[13px]
        font-extrabold
        leading-5
        text-slate-800
      "
    >
      <span>{children}</span>

      {required ? (
        <>
          <span
            aria-hidden="true"
            className="text-red-500"
          >
            *
          </span>

          <span className="sr-only">
            Pflichtfeld
          </span>
        </>
      ) : null}

      {optional ? (
        <span
          className="
            text-[11px]
            font-medium
            text-slate-400
          "
        >
          (optional)
        </span>
      ) : null}
    </label>
  );
}

/* =========================================================
   ERREUR
   ========================================================= */

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      role="alert"
      className="
        mt-1.5
        text-xs
        font-semibold
        leading-5
        text-red-600
      "
    >
      {message}
    </p>
  );
}

/* =========================================================
   COMPOSANT
   ========================================================= */

export default function DeliveryAddressFields({
  value,
  onChange,
  errors = {},
  disabled = false,
  className,
}: DeliveryAddressFieldsProps) {
  /* =======================================================
     UPDATE
     ======================================================= */

  function updateField<
    K extends keyof CheckoutShippingAddress,
  >(
    field: K,
    fieldValue:
      CheckoutShippingAddress[K]
  ) {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  }

  /* =======================================================
     ERREURS
     ======================================================= */

  const countryError =
    errors.shippingCountryCode;

  const addressError =
    errors.shippingAddress;

  const address2Error =
    errors.shippingAddress2;

  const postalCodeError =
    errors.shippingPostalCode;

  const cityError =
    errors.shippingCity;

  return (
    <section
      className={joinClassNames(
        "w-full",
        className
      )}
      aria-labelledby="checkout-delivery-address-title"
    >
      {/* ===================================================
          HEADER
         =================================================== */}

      <div className="mb-5">
        <div
          className="
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
            <MapPin
              className="h-5 w-5"
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0">
            <h2
              id="checkout-delivery-address-title"
              className="
                text-lg
                font-black
                tracking-[-0.02em]
                text-slate-950
                sm:text-xl
              "
            >
              Lieferadresse
            </h2>

            <p
              className="
                mt-0.5
                text-xs
                font-medium
                leading-5
                text-slate-500
                sm:text-[13px]
              "
            >
              Wohin dürfen wir Ihre
              Bestellung liefern?
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================
          PAYS
         =================================================== */}

      <div>
        <FieldLabel
          htmlFor="checkout-shipping-country"
          required
        >
          Land / Region
        </FieldLabel>

        <div className="relative">
          <Navigation
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              z-10
              h-[18px]
              w-[18px]
              -translate-y-1/2
              text-slate-400
            "
            strokeWidth={2}
          />

          <select
            id="checkout-shipping-country"
            name="shippingCountry"
            value={value.countryCode}
            onChange={(event) => {
              const country =
                CHECKOUT_COUNTRIES.find(
                  (item) =>
                    item.code ===
                    event.target.value
                );

              if (!country) {
                return;
              }

              updateField(
                "countryCode",
                country.code
              );
            }}
            autoComplete="country"
            disabled={disabled}
            required
            aria-invalid={
              Boolean(countryError)
            }
            aria-describedby={
              countryError
                ? "checkout-shipping-country-error"
                : undefined
            }
            className={joinClassNames(
              [
                getInputClassName(
                  Boolean(
                    countryError
                  ),
                  true
                ),
                "appearance-none",
                "cursor-pointer",
                "pr-11",
              ].join(" "),

              disabled &&
                "cursor-not-allowed"
            )}
          >
            {CHECKOUT_COUNTRIES.map(
              (country) => (
                <option
                  key={country.code}
                  value={country.code}
                >
                  {country.name}
                </option>
              )
            )}
          </select>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="
              pointer-events-none
              absolute
              right-4
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-slate-400
            "
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <FieldError
          id="checkout-shipping-country-error"
          message={countryError}
        />
      </div>

      {/* ===================================================
          RUE + NUMÉRO
         =================================================== */}

      <div className="mt-4">
        <FieldLabel
          htmlFor="checkout-shipping-address"
          required
        >
          Straße und Hausnummer
        </FieldLabel>

        <div className="relative">
          <MapPin
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              h-[18px]
              w-[18px]
              -translate-y-1/2
              text-slate-400
            "
            strokeWidth={2}
          />

          <input
            id="checkout-shipping-address"
            name="shippingAddress"
            type="text"
            value={value.address}
            onChange={(event) =>
              updateField(
                "address",
                event.target.value
              )
            }
            placeholder="Musterstraße 12"
            autoComplete="address-line1"
            maxLength={
              CHECKOUT_LIMITS
                .addressMaxLength
            }
            disabled={disabled}
            required
            aria-invalid={
              Boolean(addressError)
            }
            aria-describedby={
              addressError
                ? "checkout-shipping-address-error"
                : undefined
            }
            className={getInputClassName(
              Boolean(addressError),
              true
            )}
          />
        </div>

        <FieldError
          id="checkout-shipping-address-error"
          message={addressError}
        />
      </div>

      {/* ===================================================
          COMPLÉMENT D'ADRESSE
         =================================================== */}

      <div className="mt-4">
        <FieldLabel
          htmlFor="checkout-shipping-address2"
          optional
        >
          Adresszusatz
        </FieldLabel>

        <div className="relative">
          <Building2
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              h-[18px]
              w-[18px]
              -translate-y-1/2
              text-slate-400
            "
            strokeWidth={2}
          />

          <input
            id="checkout-shipping-address2"
            name="shippingAddress2"
            type="text"
            value={value.address2}
            onChange={(event) =>
              updateField(
                "address2",
                event.target.value
              )
            }
            placeholder="Wohnung, Etage, Hinterhaus ..."
            autoComplete="address-line2"
            maxLength={
              CHECKOUT_LIMITS
                .address2MaxLength
            }
            disabled={disabled}
            aria-invalid={
              Boolean(address2Error)
            }
            aria-describedby={
              address2Error
                ? "checkout-shipping-address2-error"
                : undefined
            }
            className={getInputClassName(
              Boolean(
                address2Error
              ),
              true
            )}
          />
        </div>

        <FieldError
          id="checkout-shipping-address2-error"
          message={address2Error}
        />
      </div>

      {/* ===================================================
          CODE POSTAL + VILLE
         =================================================== */}

      <div
        className="
          mt-4
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]
        "
      >
        {/* =================================================
            CODE POSTAL
           ================================================= */}

        <div className="min-w-0">
          <FieldLabel
            htmlFor="checkout-shipping-postal-code"
            required
          >
            Postleitzahl
          </FieldLabel>

          <input
            id="checkout-shipping-postal-code"
            name="shippingPostalCode"
            type="text"
            value={value.postalCode}
            onChange={(event) =>
              updateField(
                "postalCode",
                event.target.value
              )
            }
            placeholder={
              value.countryCode ===
              "DE"
                ? "10115"
                : value.countryCode ===
                    "IT"
                  ? "00100"
                  : value.countryCode === "AT"
                    ? "1010"
                    : "8000"
            }
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={
              CHECKOUT_LIMITS
                .postalCodeMaxLength
            }
            disabled={disabled}
            required
            spellCheck={false}
            aria-invalid={
              Boolean(
                postalCodeError
              )
            }
            aria-describedby={
              postalCodeError
                ? "checkout-shipping-postal-code-error"
                : undefined
            }
            className={getInputClassName(
              Boolean(
                postalCodeError
              )
            )}
          />

          <FieldError
            id="checkout-shipping-postal-code-error"
            message={
              postalCodeError
            }
          />
        </div>

        {/* =================================================
            VILLE
           ================================================= */}

        <div className="min-w-0">
          <FieldLabel
            htmlFor="checkout-shipping-city"
            required
          >
            Ort
          </FieldLabel>

          <div className="relative">
            <Building2
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                h-[18px]
                w-[18px]
                -translate-y-1/2
                text-slate-400
              "
              strokeWidth={2}
            />

            <input
              id="checkout-shipping-city"
              name="shippingCity"
              type="text"
              value={value.city}
              onChange={(event) =>
                updateField(
                  "city",
                  event.target.value
                )
              }
              placeholder="Berlin"
              autoComplete="address-level2"
              maxLength={
                CHECKOUT_LIMITS
                  .cityMaxLength
              }
              disabled={disabled}
              required
              aria-invalid={
                Boolean(cityError)
              }
              aria-describedby={
                cityError
                  ? "checkout-shipping-city-error"
                  : undefined
              }
              className={getInputClassName(
                Boolean(cityError),
                true
              )}
            />
          </div>

          <FieldError
            id="checkout-shipping-city-error"
            message={cityError}
          />
        </div>
      </div>

      {/* ===================================================
          INFORMATION
         =================================================== */}

      <div
        className="
          mt-5
          flex
          items-start
          gap-3
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-4
          py-3.5
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

        <p
          className="
            m-0
            text-xs
            font-medium
            leading-5
            text-slate-600
          "
        >
          Bitte überprüfen Sie Ihre
          Lieferadresse sorgfältig, damit
          Ihre Bestellung korrekt
          zugestellt werden kann.
        </p>
      </div>
    </section>
  );
}