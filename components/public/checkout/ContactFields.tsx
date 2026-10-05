"use client";

import {
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import {
  CHECKOUT_CALLING_CODES,
  CHECKOUT_LIMITS,
  type CheckoutContactData,
  type CheckoutFieldErrors,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — CONTACT FIELDS
   components/public/checkout/ContactFields.tsx

   Champs de contact du checkout :

   - Vorname
   - Nachname
   - E-Mail-Adresse
   - Telefonvorwahl
   - Telefonnummer

   RESPONSABILITÉS :

   - afficher les champs
   - mettre à jour CheckoutContactData
   - afficher les erreurs
   - rester responsive PC / mobile
   - fournir les bons attributs autocomplete
   - ne jamais gérer directement la commande
   - ne jamais gérer Prisma
   - ne jamais calculer un prix
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type ContactFieldsProps = {
  value: CheckoutContactData;

  onChange: (
    value: CheckoutContactData
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
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="
        mb-2
        block
        text-[13px]
        font-extrabold
        leading-5
        text-slate-800
      "
    >
      {children}

      {required ? (
        <>
          <span
            aria-hidden="true"
            className="
              ml-1
              text-red-500
            "
          >
            *
          </span>

          <span className="sr-only">
            Pflichtfeld
          </span>
        </>
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

export default function ContactFields({
  value,
  onChange,
  errors = {},
  disabled = false,
  className,
}: ContactFieldsProps) {
  /* =======================================================
     UPDATE GÉNÉRIQUE
     ======================================================= */

  function updateField<
    K extends keyof CheckoutContactData,
  >(
    field: K,
    fieldValue:
      CheckoutContactData[K]
  ) {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  }

  /* =======================================================
     ERREURS
     ======================================================= */

  const firstNameError =
    errors.firstName;

  const lastNameError =
    errors.lastName;

  const emailError =
    errors.email;

  const phoneCountryCodeError =
    errors.phoneCountryCode;

  const phoneError =
    errors.phone;

  const hasPhoneError =
    Boolean(
      phoneCountryCodeError ||
        phoneError
    );

  return (
    <section
      className={joinClassNames(
        "w-full",
        className
      )}
      aria-labelledby="checkout-contact-title"
    >
      {/* ===================================================
          TITRE
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
            <UserRound
              className="h-5 w-5"
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0">
            <h2
              id="checkout-contact-title"
              className="
                text-lg
                font-black
                tracking-[-0.02em]
                text-slate-950
                sm:text-xl
              "
            >
              Kontaktdaten
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
              Für Bestellbestätigung und
              Rückfragen zur Lieferung.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================
          PRÉNOM + NOM
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
            PRÉNOM
           ================================================= */}

        <div className="min-w-0">
          <FieldLabel
            htmlFor="checkout-first-name"
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
              id="checkout-first-name"
              name="firstName"
              type="text"
              value={value.firstName}
              onChange={(event) =>
                updateField(
                  "firstName",
                  event.target.value
                )
              }
              placeholder="Max"
              autoComplete="given-name"
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
                  ? "checkout-first-name-error"
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
            id="checkout-first-name-error"
            message={
              firstNameError
            }
          />
        </div>

        {/* =================================================
            NOM
           ================================================= */}

        <div className="min-w-0">
          <FieldLabel
            htmlFor="checkout-last-name"
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
              id="checkout-last-name"
              name="lastName"
              type="text"
              value={value.lastName}
              onChange={(event) =>
                updateField(
                  "lastName",
                  event.target.value
                )
              }
              placeholder="Mustermann"
              autoComplete="family-name"
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
                  ? "checkout-last-name-error"
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
            id="checkout-last-name-error"
            message={
              lastNameError
            }
          />
        </div>
      </div>

      {/* ===================================================
          EMAIL
         =================================================== */}

      <div className="mt-4">
        <FieldLabel
          htmlFor="checkout-email"
          required
        >
          E-Mail-Adresse
        </FieldLabel>

        <div className="relative">
          <Mail
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
            id="checkout-email"
            name="email"
            type="email"
            value={value.email}
            onChange={(event) =>
              updateField(
                "email",
                event.target.value
              )
            }
            placeholder="max@beispiel.de"
            autoComplete="email"
            inputMode="email"
            maxLength={
              CHECKOUT_LIMITS
                .emailMaxLength
            }
            disabled={disabled}
            required
            spellCheck={false}
            autoCapitalize="none"
            aria-invalid={
              Boolean(emailError)
            }
            aria-describedby={
              emailError
                ? "checkout-email-error"
                : undefined
            }
            className={getInputClassName(
              Boolean(emailError),
              true
            )}
          />
        </div>

        <FieldError
          id="checkout-email-error"
          message={emailError}
        />
      </div>

      {/* ===================================================
          TÉLÉPHONE
         =================================================== */}

      <div className="mt-4">
        <FieldLabel
          htmlFor="checkout-phone"
          required
        >
          Telefonnummer
        </FieldLabel>

        <div
          className={joinClassNames(
            [
              "flex",
              "min-h-12",
              "w-full",
              "overflow-hidden",
              "rounded-xl",
              "border",
              "bg-white",
              "transition",
              "duration-200",
              "focus-within:ring-4",
            ].join(" "),

            hasPhoneError
              ? [
                  "border-red-400",
                  "focus-within:border-red-500",
                  "focus-within:ring-red-100",
                ].join(" ")
              : [
                  "border-slate-200",
                  "hover:border-slate-300",
                  "focus-within:border-[#1769e0]",
                  "focus-within:ring-blue-100/80",
                ].join(" "),

            disabled &&
              [
                "cursor-not-allowed",
                "bg-slate-100",
                "opacity-80",
              ].join(" ")
          )}
        >
          {/* ===============================================
              INDICATIF
             =============================================== */}

          <div
            className="
              relative
              shrink-0
              border-r
              border-slate-200
            "
          >
            <label
              htmlFor="checkout-phone-country-code"
              className="sr-only"
            >
              Telefonvorwahl
            </label>

            <select
              id="checkout-phone-country-code"
              name="phoneCountryCode"
              value={
                value.phoneCountryCode
              }
              onChange={(event) =>
                updateField(
                  "phoneCountryCode",
                  event.target.value
                )
              }
              disabled={disabled}
              required
              aria-invalid={
                Boolean(
                  phoneCountryCodeError
                )
              }
              aria-describedby={
                phoneCountryCodeError
                  ? "checkout-phone-country-code-error"
                  : undefined
              }
              className="
                h-full
                min-h-[46px]
                cursor-pointer
                appearance-none
                bg-transparent
                py-2
                pl-3
                pr-8
                text-sm
                font-extrabold
                text-slate-800
                outline-none
                disabled:cursor-not-allowed
              "
            >
              {CHECKOUT_CALLING_CODES.map(
                (country) => (
                  <option
                    key={
                      country.countryCode
                    }
                    value={
                      country.callingCode
                    }
                  >
                    {
                      country.callingCode
                    }
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
                right-2
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

          {/* ===============================================
              NUMÉRO
             =============================================== */}

          <div
            className="
              relative
              min-w-0
              flex-1
            "
          >
            <Phone
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                h-[18px]
                w-[18px]
                -translate-y-1/2
                text-slate-400
              "
              strokeWidth={2}
            />

            <input
              id="checkout-phone"
              name="phone"
              type="tel"
              value={value.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              placeholder="1590 5493267"
              autoComplete="tel-national"
              inputMode="tel"
              maxLength={
                CHECKOUT_LIMITS
                  .phoneMaxLength
              }
              disabled={disabled}
              required
              aria-invalid={
                Boolean(phoneError)
              }
              aria-describedby={
                phoneError
                  ? "checkout-phone-error"
                  : undefined
              }
              className="
                h-full
                min-h-[46px]
                w-full
                border-0
                bg-transparent
                py-2
                pl-10
                pr-4
                text-[15px]
                font-medium
                text-slate-950
                outline-none
                placeholder:text-slate-400
                disabled:cursor-not-allowed
                disabled:text-slate-500
              "
            />
          </div>
        </div>

        {/* =================================================
            ERREUR INDICATIF
           ================================================= */}

        <FieldError
          id="checkout-phone-country-code-error"
          message={
            phoneCountryCodeError
          }
        />

        {/* =================================================
            ERREUR NUMÉRO
           ================================================= */}

        <FieldError
          id="checkout-phone-error"
          message={phoneError}
        />

        {!hasPhoneError ? (
          <p
            className="
              mt-1.5
              text-xs
              font-medium
              leading-5
              text-slate-500
            "
          >
            Für Rückfragen zu Ihrer
            Bestellung oder Lieferung.
          </p>
        ) : null}
      </div>
    </section>
  );
}