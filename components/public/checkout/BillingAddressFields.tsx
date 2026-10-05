"use client";

import {
  Building2,
  CreditCard,
  MapPin,
  Navigation,
  UserRound,
} from "lucide-react";

import {
  CHECKOUT_COUNTRIES,
  CHECKOUT_LIMITS,
  type CheckoutBillingAddress,
  type CheckoutFieldErrors,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — BILLING ADDRESS FIELDS
   components/public/checkout/BillingAddressFields.tsx

   Adresse de facturation différente.

   Ce composant est affiché uniquement lorsque :

   hasDifferentBillingAddress === true

   Champs :
   - Vorname
   - Nachname
   - Land / Region
   - Straße und Hausnummer
   - Adresszusatz
   - Postleitzahl
   - Ort

   IMPORTANT :
   - aucune logique Prisma
   - aucun calcul de prix
   - aucun paiement
   - aucune création de commande
   - composant contrôlé par le parent
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type BillingAddressFieldsProps = {
  value: CheckoutBillingAddress;

  onChange: (
    value: CheckoutBillingAddress
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
   ERROR
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
   COMPONENT
   ========================================================= */

export default function BillingAddressFields({
  value,
  onChange,
  errors = {},
  disabled = false,
  className,
}: BillingAddressFieldsProps) {
  /* =======================================================
     UPDATE FIELD
     ======================================================= */

  function updateField<
    K extends keyof CheckoutBillingAddress,
  >(
    field: K,
    fieldValue:
      CheckoutBillingAddress[K]
  ) {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  }

  /* =======================================================
     ERRORS

     Ces clés correspondent au bloc billing de
     CheckoutFieldErrors.
     ======================================================= */

  const firstNameError =
    errors.billingFirstName;

  const lastNameError =
    errors.billingLastName;

  const countryError =
    errors.billingCountryCode;

  const addressError =
    errors.billingAddress;

  const address2Error =
    errors.billingAddress2;

  const postalCodeError =
    errors.billingPostalCode;

  const cityError =
    errors.billingCity;

  return (
    <section
      className={joinClassNames(
        "w-full",
        className
      )}
      aria-labelledby="checkout-billing-address-title"
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
              bg-amber-50
              text-amber-700
            "
          >
            <CreditCard
              className="h-5 w-5"
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0">
            <h2
              id="checkout-billing-address-title"
              className="
                text-lg
                font-black
                tracking-[-0.02em]
                text-slate-950
                sm:text-xl
              "
            >
              Rechnungsadresse
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
              Geben Sie Ihre abweichende
              Rechnungsadresse ein.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================
          FIRST NAME + LAST NAME
         =================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
        "
      >
        {/* =================================================
            FIRST NAME
           ================================================= */}

        <div className="min-w-0">
          <FieldLabel
            htmlFor="checkout-billing-first-name"
            required
          >
            Vorname
          </FieldLabel>

          <div className="relative">
            <UserRound
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
              id="checkout-billing-first-name"
              name="billingFirstName"
              type="text"
              value={value.firstName}
              onChange={(event) =>
                updateField(
                  "firstName",
                  event.target.value
                )
              }
              placeholder="Max"
              autoComplete="billing given-name"
              maxLength={
                CHECKOUT_LIMITS
                  .firstNameMaxLength
              }
              disabled={disabled}
              required
              aria-invalid={
                Boolean(
                  firstNameError
                )
              }
              aria-describedby={
                firstNameError
                  ? "checkout-billing-first-name-error"
                  : undefined
              }
              className={getInputClassName(
                Boolean(
                  firstNameError
                ),
                true
              )}
            />
          </div>

          <FieldError
            id="checkout-billing-first-name-error"
            message={
              firstNameError
            }
          />
        </div>

        {/* =================================================
            LAST NAME
           ================================================= */}

        <div className="min-w-0">
          <FieldLabel
            htmlFor="checkout-billing-last-name"
            required
          >
            Nachname
          </FieldLabel>

          <div className="relative">
            <UserRound
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
              id="checkout-billing-last-name"
              name="billingLastName"
              type="text"
              value={value.lastName}
              onChange={(event) =>
                updateField(
                  "lastName",
                  event.target.value
                )
              }
              placeholder="Mustermann"
              autoComplete="billing family-name"
              maxLength={
                CHECKOUT_LIMITS
                  .lastNameMaxLength
              }
              disabled={disabled}
              required
              aria-invalid={
                Boolean(
                  lastNameError
                )
              }
              aria-describedby={
                lastNameError
                  ? "checkout-billing-last-name-error"
                  : undefined
              }
              className={getInputClassName(
                Boolean(
                  lastNameError
                ),
                true
              )}
            />
          </div>

          <FieldError
            id="checkout-billing-last-name-error"
            message={
              lastNameError
            }
          />
        </div>
      </div>

      {/* ===================================================
          COUNTRY
         =================================================== */}

      <div className="mt-4">
        <FieldLabel
          htmlFor="checkout-billing-country"
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
            id="checkout-billing-country"
            name="billingCountry"
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
            autoComplete="billing country"
            disabled={disabled}
            required
            aria-invalid={
              Boolean(
                countryError
              )
            }
            aria-describedby={
              countryError
                ? "checkout-billing-country-error"
                : undefined
            }
            className={joinClassNames(
              getInputClassName(
                Boolean(
                  countryError
                ),
                true
              ),

              "cursor-pointer appearance-none pr-11",

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
          id="checkout-billing-country-error"
          message={
            countryError
          }
        />
      </div>

      {/* ===================================================
          STREET
         =================================================== */}

      <div className="mt-4">
        <FieldLabel
          htmlFor="checkout-billing-address"
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
            id="checkout-billing-address"
            name="billingAddress"
            type="text"
            value={value.address}
            onChange={(event) =>
              updateField(
                "address",
                event.target.value
              )
            }
            placeholder="Musterstraße 12"
            autoComplete="billing address-line1"
            maxLength={
              CHECKOUT_LIMITS
                .addressMaxLength
            }
            disabled={disabled}
            required
            aria-invalid={
              Boolean(
                addressError
              )
            }
            aria-describedby={
              addressError
                ? "checkout-billing-address-error"
                : undefined
            }
            className={getInputClassName(
              Boolean(
                addressError
              ),
              true
            )}
          />
        </div>

        <FieldError
          id="checkout-billing-address-error"
          message={
            addressError
          }
        />
      </div>

      {/* ===================================================
          ADDRESS 2
         =================================================== */}

      <div className="mt-4">
        <FieldLabel
          htmlFor="checkout-billing-address2"
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
            id="checkout-billing-address2"
            name="billingAddress2"
            type="text"
            value={value.address2}
            onChange={(event) =>
              updateField(
                "address2",
                event.target.value
              )
            }
            placeholder="Wohnung, Etage, Hinterhaus ..."
            autoComplete="billing address-line2"
            maxLength={
              CHECKOUT_LIMITS
                .address2MaxLength
            }
            disabled={disabled}
            aria-invalid={
              Boolean(
                address2Error
              )
            }
            aria-describedby={
              address2Error
                ? "checkout-billing-address2-error"
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
          id="checkout-billing-address2-error"
          message={
            address2Error
          }
        />
      </div>

      {/* ===================================================
          POSTAL CODE + CITY
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
            POSTAL CODE
           ================================================= */}

        <div className="min-w-0">
          <FieldLabel
            htmlFor="checkout-billing-postal-code"
            required
          >
            Postleitzahl
          </FieldLabel>

          <input
            id="checkout-billing-postal-code"
            name="billingPostalCode"
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
            autoComplete="billing postal-code"
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
                ? "checkout-billing-postal-code-error"
                : undefined
            }
            className={getInputClassName(
              Boolean(
                postalCodeError
              )
            )}
          />

          <FieldError
            id="checkout-billing-postal-code-error"
            message={
              postalCodeError
            }
          />
        </div>

        {/* =================================================
            CITY
           ================================================= */}

        <div className="min-w-0">
          <FieldLabel
            htmlFor="checkout-billing-city"
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
              id="checkout-billing-city"
              name="billingCity"
              type="text"
              value={value.city}
              onChange={(event) =>
                updateField(
                  "city",
                  event.target.value
                )
              }
              placeholder="Berlin"
              autoComplete="billing address-level2"
              maxLength={
                CHECKOUT_LIMITS
                  .cityMaxLength
              }
              disabled={disabled}
              required
              aria-invalid={
                Boolean(
                  cityError
                )
              }
              aria-describedby={
                cityError
                  ? "checkout-billing-city-error"
                  : undefined
              }
              className={getInputClassName(
                Boolean(
                  cityError
                ),
                true
              )}
            />
          </div>

          <FieldError
            id="checkout-billing-city-error"
            message={
              cityError
            }
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
          border-amber-100
          bg-amber-50/70
          px-4
          py-3.5
        "
      >
        <CreditCard
          aria-hidden="true"
          className="
            mt-0.5
            h-[18px]
            w-[18px]
            shrink-0
            text-amber-700
          "
          strokeWidth={2}
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
          Diese Adresse wird als
          Rechnungsadresse für Ihre
          Bestellung gespeichert.
        </p>
      </div>
    </section>
  );
}