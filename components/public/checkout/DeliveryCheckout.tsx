"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Send,
} from "lucide-react";

import CheckoutSteps from "@/components/public/checkout/CheckoutSteps";
import ContactFields from "@/components/public/checkout/ContactFields";
import DeliveryAddressFields from "@/components/public/checkout/DeliveryAddressFields";
import BillingAddressFields from "@/components/public/checkout/BillingAddressFields";
import ShippingInformation from "@/components/public/checkout/ShippingInformation";
import OrderSummary from "@/components/public/checkout/OrderSummary";
import CheckoutContact from "@/components/public/checkout/CheckoutContact";

import {
  CHECKOUT_LIMITS,
  CHECKOUT_ROUTES,
  createInitialCheckoutFormData,
  createOrderInputFromCheckout,
  type CheckoutFieldErrors,
  type CheckoutFormData,
  type CheckoutOrderItemInput,
  type CheckoutOrderSummary,
  type CheckoutSubmitStatus,
  type CreateOrderErrorResponse,
  type CreateOrderSuccessResponse,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — DELIVERY CHECKOUT
   components/public/checkout/DeliveryCheckout.tsx

   Composant principal de la page de livraison.

   RESPONSABILITÉS :
   - gérer l'état du formulaire
   - afficher les champs de contact
   - afficher l'adresse de livraison
   - gérer l'adresse de facturation différente
   - afficher les informations de livraison
   - afficher le résumé de commande
   - préparer la requête POST /api/public/orders
   - afficher les erreurs
   - afficher la confirmation après création

   SÉCURITÉ :
   Les prix visibles ici ne sont JAMAIS une source
   de vérité.

   L'API devra impérativement :
   - valider les données
   - récupérer les produits avec Prisma
   - vérifier Product.status === PUBLISHED
   - vérifier le stock
   - récupérer les vrais prix
   - recalculer subtotal / shipping / total
   - créer la commande côté serveur
   - envoyer les e-mails côté serveur

   Le navigateur envoie uniquement :
   productId + quantity pour les produits.
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type DeliveryCheckoutProps = {
  summary: CheckoutOrderSummary;

  /*
   * Articles réellement envoyés à l'API.
   *
   * Aucun prix n'est envoyé.
   */
  orderItems: CheckoutOrderItemInput[];

  /*
   * null :
   * livraison pas encore calculée.
   *
   * number :
   * montant déjà calculé par une source de confiance.
   */
  shippingAmount?: number | null;

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

function normalizeText(
  value: string
): string {
  return value.trim();
}

function isValidEmail(
  value: string
): boolean {
  const email =
    normalizeText(value);

  if (
    !email ||
    email.length >
      CHECKOUT_LIMITS.emailMaxLength
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function hasVisibleText(
  value: string
): boolean {
  return /[\p{L}\p{N}]/u.test(
    value
  );
}

function hasValidPhone(
  value: string
): boolean {
  const digits =
    value.replace(
      /\D/g,
      ""
    );

  return (
    digits.length >= 5 &&
    digits.length <= 20
  );
}

/* =========================================================
   CLIENT VALIDATION

   Cette validation améliore uniquement l'UX.

   Elle ne remplace jamais :
   lib/order-validation.ts côté serveur.
   ========================================================= */

function validateCheckoutForm(
  form: CheckoutFormData,
  orderItems: CheckoutOrderItemInput[]
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors =
    {};

  /* =======================================================
     CONTACT
     ======================================================= */

  const firstName =
    normalizeText(
      form.contact.firstName
    );

  const lastName =
    normalizeText(
      form.contact.lastName
    );

  if (
    !firstName ||
    !hasVisibleText(
      firstName
    )
  ) {
    errors.firstName =
      "Bitte geben Sie Ihren Vornamen ein.";
  } else if (
    firstName.length >
    CHECKOUT_LIMITS.firstNameMaxLength
  ) {
    errors.firstName =
      "Der Vorname ist zu lang.";
  }

  if (
    !lastName ||
    !hasVisibleText(
      lastName
    )
  ) {
    errors.lastName =
      "Bitte geben Sie Ihren Nachnamen ein.";
  } else if (
    lastName.length >
    CHECKOUT_LIMITS.lastNameMaxLength
  ) {
    errors.lastName =
      "Der Nachname ist zu lang.";
  }

  if (
    !isValidEmail(
      form.contact.email
    )
  ) {
    errors.email =
      "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  }

  if (
    !normalizeText(
      form.contact
        .phoneCountryCode
    )
  ) {
    errors.phoneCountryCode =
      "Bitte wählen Sie eine Telefonvorwahl.";
  }

  if (
    !hasValidPhone(
      form.contact.phone
    )
  ) {
    errors.phone =
      "Bitte geben Sie eine gültige Telefonnummer ein.";
  }

  /* =======================================================
     SHIPPING ADDRESS
     ======================================================= */

  if (
    !form.shippingAddress
      .countryCode
  ) {
    errors.shippingCountryCode =
      "Bitte wählen Sie ein Lieferland.";
  }

  const shippingAddress =
    normalizeText(
      form.shippingAddress
        .address
    );

  if (
    !shippingAddress ||
    !hasVisibleText(
      shippingAddress
    )
  ) {
    errors.shippingAddress =
      "Bitte geben Sie Straße und Hausnummer ein.";
  } else if (
    shippingAddress.length >
    CHECKOUT_LIMITS.addressMaxLength
  ) {
    errors.shippingAddress =
      "Die Lieferadresse ist zu lang.";
  }

  if (
    form.shippingAddress
      .address2.length >
    CHECKOUT_LIMITS.address2MaxLength
  ) {
    errors.shippingAddress2 =
      "Der Adresszusatz ist zu lang.";
  }

  const shippingPostalCode =
    normalizeText(
      form.shippingAddress
        .postalCode
    );

  if (
    !shippingPostalCode
  ) {
    errors.shippingPostalCode =
      "Bitte geben Sie die Postleitzahl ein.";
  } else if (
    shippingPostalCode.length >
    CHECKOUT_LIMITS.postalCodeMaxLength
  ) {
    errors.shippingPostalCode =
      "Die Postleitzahl ist zu lang.";
  }

  const shippingCity =
    normalizeText(
      form.shippingAddress.city
    );

  if (
    !shippingCity ||
    !hasVisibleText(
      shippingCity
    )
  ) {
    errors.shippingCity =
      "Bitte geben Sie den Ort ein.";
  } else if (
    shippingCity.length >
    CHECKOUT_LIMITS.cityMaxLength
  ) {
    errors.shippingCity =
      "Der Ort ist zu lang.";
  }

  /* =======================================================
     BILLING ADDRESS
     ======================================================= */

  if (
    form.hasDifferentBillingAddress
  ) {
    const billingFirstName =
      normalizeText(
        form.billingAddress
          .firstName
      );

    const billingLastName =
      normalizeText(
        form.billingAddress
          .lastName
      );

    if (
      !billingFirstName ||
      !hasVisibleText(
        billingFirstName
      )
    ) {
      errors.billingFirstName =
        "Bitte geben Sie den Vornamen für die Rechnungsadresse ein.";
    }

    if (
      !billingLastName ||
      !hasVisibleText(
        billingLastName
      )
    ) {
      errors.billingLastName =
        "Bitte geben Sie den Nachnamen für die Rechnungsadresse ein.";
    }

    if (
      !form.billingAddress
        .countryCode
    ) {
      errors.billingCountryCode =
        "Bitte wählen Sie das Land der Rechnungsadresse.";
    }

    const billingAddress =
      normalizeText(
        form.billingAddress
          .address
      );

    if (
      !billingAddress ||
      !hasVisibleText(
        billingAddress
      )
    ) {
      errors.billingAddress =
        "Bitte geben Sie Straße und Hausnummer ein.";
    }

    if (
      form.billingAddress
        .address2.length >
      CHECKOUT_LIMITS.address2MaxLength
    ) {
      errors.billingAddress2 =
        "Der Adresszusatz ist zu lang.";
    }

    if (
      !normalizeText(
        form.billingAddress
          .postalCode
      )
    ) {
      errors.billingPostalCode =
        "Bitte geben Sie die Postleitzahl ein.";
    }

    if (
      !normalizeText(
        form.billingAddress.city
      )
    ) {
      errors.billingCity =
        "Bitte geben Sie den Ort ein.";
    }
  }

  /* =======================================================
     NOTE
     ======================================================= */

  if (
    form.customerNote.length >
    CHECKOUT_LIMITS.customerNoteMaxLength
  ) {
    errors.customerNote =
      "Ihre Nachricht ist zu lang.";
  }

  /* =======================================================
     ITEMS
     ======================================================= */

  if (
    !Array.isArray(
      orderItems
    ) ||
    orderItems.length === 0
  ) {
    errors.items =
      "Ihre Bestellung enthält keine Produkte.";
  } else if (
    orderItems.length >
    CHECKOUT_LIMITS.maxDifferentProductsPerOrder
  ) {
    errors.items =
      "Ihre Bestellung enthält zu viele verschiedene Produkte.";
  } else {
    const invalidItem =
      orderItems.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(
            item.quantity
          ) ||
          item.quantity < 1 ||
          item.quantity >
            CHECKOUT_LIMITS.maxQuantityPerItem
      );

    if (invalidItem) {
      errors.items =
        "Mindestens ein Produkt enthält eine ungültige Menge.";
    }
  }

  return errors;
}

/* =========================================================
   FIRST ERROR
   ========================================================= */

function getFirstErrorMessage(
  errors: CheckoutFieldErrors
): string | null {
  const values =
    Object.values(errors);

  for (
    const value of values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   SERVER ERROR MAPPING

   L'API finale pourra renvoyer :
   {
     success: false,
     error: {
       code: "...",
       message: "..."
     }
   }

   Si elle renvoie également des fieldErrors plus tard,
   le composant sait les récupérer sans casser.
   ========================================================= */

function getServerFieldErrors(
  payload: unknown
): CheckoutFieldErrors | null {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return null;
  }

  const record =
    payload as Record<
      string,
      unknown
    >;

  const possibleErrors =
    record.fieldErrors;

  if (
    !possibleErrors ||
    typeof possibleErrors !==
      "object" ||
    Array.isArray(
      possibleErrors
    )
  ) {
    return null;
  }

  return possibleErrors as CheckoutFieldErrors;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function DeliveryCheckout({
  summary,
  orderItems,
  shippingAmount = null,
  className,
}: DeliveryCheckoutProps) {
  /* =======================================================
     FORM
     ======================================================= */

  const [form, setForm] =
    useState<CheckoutFormData>(
      () =>
        createInitialCheckoutFormData()
    );

  /* =======================================================
     ERRORS
     ======================================================= */

  const [
    errors,
    setErrors,
  ] =
    useState<CheckoutFieldErrors>(
      {}
    );

  /* =======================================================
     SUBMIT STATUS
     ======================================================= */

  const [
    submitStatus,
    setSubmitStatus,
  ] =
    useState<CheckoutSubmitStatus>(
      "idle"
    );

  /* =======================================================
     GLOBAL MESSAGE
     ======================================================= */

  const [
    globalError,
    setGlobalError,
  ] = useState<string | null>(
    null
  );

  /* =======================================================
     SUCCESS ORDER
     ======================================================= */

  const [
    createdOrder,
    setCreatedOrder,
  ] = useState<
    CreateOrderSuccessResponse["order"] | null
  >(null);

  /* =======================================================
     DERIVED STATE
     ======================================================= */

  const isSubmitting =
    submitStatus ===
    "submitting";

  const hasItems =
    Array.isArray(
      orderItems
    ) &&
    orderItems.length > 0;

  const safeShippingAmount =
    typeof shippingAmount ===
      "number" &&
    Number.isFinite(
      shippingAmount
    ) &&
    shippingAmount >= 0
      ? shippingAmount
      : null;

  const mobileSummary =
    useMemo(
      () => summary,
      [summary]
    );

  /* =======================================================
     UPDATE CONTACT
     ======================================================= */

  function updateContact(
    contact: CheckoutFormData["contact"]
  ) {
    setForm(
      (current) => ({
        ...current,
        contact,
      })
    );

    setGlobalError(null);
  }

  /* =======================================================
     UPDATE SHIPPING
     ======================================================= */

  function updateShippingAddress(
    shippingAddress: CheckoutFormData["shippingAddress"]
  ) {
    setForm(
      (current) => ({
        ...current,
        shippingAddress,
      })
    );

    setGlobalError(null);
  }

  /* =======================================================
     UPDATE BILLING
     ======================================================= */

  function updateBillingAddress(
    billingAddress: CheckoutFormData["billingAddress"]
  ) {
    setForm(
      (current) => ({
        ...current,
        billingAddress,
      })
    );

    setGlobalError(null);
  }

  /* =======================================================
     TOGGLE BILLING ADDRESS
     ======================================================= */

  function handleBillingToggle(
    checked: boolean
  ) {
    setForm(
      (current) => ({
        ...current,

        hasDifferentBillingAddress:
          checked,
      })
    );

    /*
     * On retire uniquement les erreurs billing lorsque
     * l'adresse différente est désactivée.
     *
     * Les valeurs restent en mémoire localement au cas où
     * le client recocherait immédiatement la case.
     */

    if (!checked) {
      setErrors(
        (current) => {
          const next = {
            ...current,
          };

          delete next.billingFirstName;
          delete next.billingLastName;
          delete next.billingCountryCode;
          delete next.billingAddress;
          delete next.billingAddress2;
          delete next.billingPostalCode;
          delete next.billingCity;

          return next;
        }
      );
    }

    setGlobalError(null);
  }

  /* =======================================================
     SCROLL TO ERROR
     ======================================================= */

  function scrollToFirstError() {
    window.requestAnimationFrame(
      () => {
        const invalidElement =
          document.querySelector<HTMLElement>(
            '[aria-invalid="true"]'
          );

        if (
          invalidElement
        ) {
          invalidElement.scrollIntoView(
            {
              behavior:
                "smooth",
              block:
                "center",
            }
          );

          window.setTimeout(
            () => {
              invalidElement.focus();
            },
            300
          );

          return;
        }

        const errorBox =
          document.getElementById(
            "checkout-global-error"
          );

        errorBox?.scrollIntoView(
          {
            behavior:
              "smooth",
            block:
              "center",
          }
        );
      }
    );
  }

  /* =======================================================
     SUBMIT
     ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setGlobalError(null);
    setCreatedOrder(null);

    /* =====================================================
       CLIENT VALIDATION
       ===================================================== */

    const clientErrors =
      validateCheckoutForm(
        form,
        orderItems
      );

    if (
      Object.keys(
        clientErrors
      ).length > 0
    ) {
      setErrors(
        clientErrors
      );

      setSubmitStatus(
        "error"
      );

      setGlobalError(
        getFirstErrorMessage(
          clientErrors
        ) ??
          "Bitte überprüfen Sie Ihre Angaben."
      );

      scrollToFirstError();

      return;
    }

    setErrors({});
    setSubmitStatus(
      "submitting"
    );

    try {
      /* ===================================================
         CREATE PAYLOAD

         Cette fonction doit produire uniquement :
         - coordonnées
         - adresses
         - note
         - productId
         - quantity

         Aucun prix client ne doit être utilisé par l'API.
         =================================================== */

      const payload =
        createOrderInputFromCheckout(
          form,
          orderItems
        );

      /* ===================================================
         API REQUEST
         =================================================== */

      const response =
        await fetch(
          "/api/public/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            credentials:
              "same-origin",

            cache:
              "no-store",

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      let responsePayload:
        | CreateOrderSuccessResponse
        | CreateOrderErrorResponse
        | Record<
            string,
            unknown
          >
        | null = null;

      try {
        responsePayload =
          (await response.json()) as
            | CreateOrderSuccessResponse
            | CreateOrderErrorResponse
            | Record<
                string,
                unknown
              >;
      } catch {
        responsePayload =
          null;
      }

      /* ===================================================
         ERROR RESPONSE
         =================================================== */

      if (
        !response.ok ||
        !responsePayload ||
        responsePayload.success !==
          true
      ) {
        const serverFieldErrors =
          getServerFieldErrors(
            responsePayload
          );

        if (
          serverFieldErrors
        ) {
          setErrors(
            serverFieldErrors
          );
        }

        let message =
          "Ihre Bestellung konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.";

        if (
          responsePayload &&
          typeof responsePayload ===
            "object" &&
          "error" in
            responsePayload
        ) {
          const error =
            responsePayload.error;

          if (
            error &&
            typeof error ===
              "object" &&
            "message" in
              error &&
            typeof error.message ===
              "string" &&
            error.message.trim()
          ) {
            message =
              error.message;
          }
        }

        setSubmitStatus(
          "error"
        );

        setGlobalError(
          message
        );

        scrollToFirstError();

        return;
      }

      /* ===================================================
         SUCCESS
         =================================================== */

      const successResponse =
        responsePayload as CreateOrderSuccessResponse;

      setCreatedOrder(
        successResponse.order
      );

      setSubmitStatus(
        "success"
      );

      setErrors({});
      setGlobalError(null);

      window.requestAnimationFrame(
        () => {
          document
            .getElementById(
              "checkout-success"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
              block:
                "start",
            });
        }
      );
    } catch {
      setSubmitStatus(
        "error"
      );

      setGlobalError(
        "Die Verbindung zum Server konnte nicht hergestellt werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut."
      );

      scrollToFirstError();
    }
  }

  /* =======================================================
     SUCCESS SCREEN
     ======================================================= */

  if (
    submitStatus ===
      "success" &&
    createdOrder
  ) {
    return (
      <div
        id="checkout-success"
        className={joinClassNames(
          [
            "mx-auto",
            "w-full",
            "max-w-3xl",
            "px-4",
            "py-8",
            "sm:px-6",
            "sm:py-12",
          ].join(" "),

          className
        )}
      >
        <div
          className="
            rounded-3xl
            border
            border-emerald-200
            bg-white
            px-5
            py-8
            text-center
            shadow-[0_18px_60px_rgba(15,23,42,0.08)]
            sm:px-10
            sm:py-12
          "
        >
          <div
            className="
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              bg-emerald-100
              text-emerald-600
            "
          >
            <CheckCircle2
              className="h-8 w-8"
              strokeWidth={2.2}
            />
          </div>

          <div className="mt-6">
            <CheckoutSteps currentStep="confirmation" />
          </div>

          <h1
            className="
              mt-8
              text-2xl
              font-black
              tracking-[-0.03em]
              text-slate-950
              sm:text-3xl
            "
          >
            Bestellung erhalten
          </h1>

          <p
            className="
              mx-auto
              mt-3
              max-w-xl
              text-sm
              font-medium
              leading-6
              text-slate-600
            "
          >
            Vielen Dank. Ihre
            Bestellung wurde
            erfolgreich an
            NACHTKRONE übermittelt.
          </p>

          <div
            className="
              mx-auto
              mt-6
              max-w-md
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-4
            "
          >
            <div
              className="
                text-[11px]
                font-extrabold
                uppercase
                tracking-[0.08em]
                text-slate-500
              "
            >
              Bestellnummer
            </div>

            <div
              className="
                mt-1
                break-all
                text-lg
                font-black
                text-slate-950
              "
            >
              {
                createdOrder.orderNumber
              }
            </div>
          </div>

          <div
            className="
              mx-auto
              mt-5
              max-w-xl
              rounded-xl
              border
              border-blue-100
              bg-blue-50/70
              px-4
              py-3.5
              text-left
            "
          >
            <p
              className="
                m-0
                text-xs
                font-medium
                leading-5
                text-slate-600
              "
            >
              Eine Bestellbestätigung
              wird an die angegebene
              E-Mail-Adresse gesendet.
              Diese Bestätigung ist
              keine
              Zahlungsbestätigung.
            </p>
          </div>

          <a
            href={
              CHECKOUT_ROUTES.products
            }
            className="
              mt-7
              inline-flex
              h-12
              items-center
              justify-center
              rounded-xl
              bg-[#071a33]
              px-6
              text-sm
              font-black
              text-white
              no-underline
              transition
              hover:bg-[#0b274a]
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-blue-100
            "
          >
            Weiter einkaufen
          </a>
        </div>
      </div>
    );
  }

  /* =======================================================
     CHECKOUT
     ======================================================= */

  return (
    <div
      className={joinClassNames(
        [
          "w-full",
          "bg-slate-50/60",
        ].join(" "),

        className
      )}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          py-5
          sm:px-6
          sm:py-7
          lg:px-8
          lg:py-9
        "
      >
        {/* =================================================
            TOP
           ================================================= */}

        <div
          className="
            mx-auto
            max-w-3xl
          "
        >
          <CheckoutSteps currentStep="shipping" />
        </div>

        {/* =================================================
            MOBILE SUMMARY
           ================================================= */}

        <div className="mt-6 lg:hidden">
          <OrderSummary
            summary={
              mobileSummary
            }
            shippingAmount={
              safeShippingAmount
            }
            collapsible
            defaultOpen={false}
            disabled={
              isSubmitting
            }
          />
        </div>

        {/* =================================================
            GRID
           ================================================= */}

        <div
          className="
            mt-6
            grid
            grid-cols-1
            items-start
            gap-6
            lg:mt-8
            lg:grid-cols-[minmax(0,1fr)_380px]
            xl:grid-cols-[minmax(0,1fr)_420px]
            xl:gap-8
          "
        >
          {/* ===============================================
              LEFT
             =============================================== */}

          <main className="min-w-0">
            <form
              onSubmit={
                handleSubmit
              }
              noValidate
              className="space-y-5"
            >
              {/* ===========================================
                  GLOBAL ERROR
                 =========================================== */}

              {globalError ? (
                <div
                  id="checkout-global-error"
                  role="alert"
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-4
                    text-red-800
                  "
                >
                  <AlertCircle
                    aria-hidden="true"
                    className="
                      mt-0.5
                      h-5
                      w-5
                      shrink-0
                    "
                    strokeWidth={2.2}
                  />

                  <div>
                    <div
                      className="
                        text-sm
                        font-black
                      "
                    >
                      Angaben überprüfen
                    </div>

                    <p
                      className="
                        m-0
                        mt-1
                        text-xs
                        font-semibold
                        leading-5
                      "
                    >
                      {globalError}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* ===========================================
                  ITEMS ERROR
                 =========================================== */}

              {errors.items ? (
                <div
                  role="alert"
                  className="
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-xs
                    font-bold
                    leading-5
                    text-red-700
                  "
                >
                  {errors.items}
                </div>
              ) : null}

              {/* ===========================================
                  CONTACT
                 =========================================== */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-[0_8px_30px_rgba(15,23,42,0.04)]
                  sm:p-6
                "
              >
                <ContactFields
                  value={
                    form.contact
                  }
                  errors={
                    errors
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    updateContact
                  }
                />
              </div>

              {/* ===========================================
                  DELIVERY ADDRESS
                 =========================================== */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-[0_8px_30px_rgba(15,23,42,0.04)]
                  sm:p-6
                "
              >
                <DeliveryAddressFields
                  value={
                    form.shippingAddress
                  }
                  errors={
                    errors
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    updateShippingAddress
                  }
                />

                {/* =========================================
                    DIFFERENT BILLING
                   ========================================= */}

                <div
                  className="
                    mt-5
                    border-t
                    border-slate-100
                    pt-5
                  "
                >
                  <label
                    className={joinClassNames(
                      [
                        "flex",
                        "cursor-pointer",
                        "items-start",
                        "gap-3",
                        "rounded-xl",
                        "border",
                        "px-4",
                        "py-3.5",
                        "transition",
                        "duration-200",
                      ].join(" "),

                      form.hasDifferentBillingAddress
                        ? [
                            "border-blue-200",
                            "bg-blue-50/60",
                          ].join(" ")
                        : [
                            "border-slate-200",
                            "bg-white",
                            "hover:border-slate-300",
                          ].join(" "),

                      isSubmitting &&
                        "cursor-not-allowed opacity-70"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={
                        form.hasDifferentBillingAddress
                      }
                      onChange={(
                        event
                      ) =>
                        handleBillingToggle(
                          event.target.checked
                        )
                      }
                      disabled={
                        isSubmitting
                      }
                      className="
                        mt-0.5
                        h-4
                        w-4
                        shrink-0
                        accent-[#1769e0]
                      "
                    />

                    <span>
                      <span
                        className="
                          block
                          text-[13px]
                          font-extrabold
                          text-slate-900
                        "
                      >
                        Abweichende
                        Rechnungsadresse
                      </span>

                      <span
                        className="
                          mt-0.5
                          block
                          text-xs
                          font-medium
                          leading-5
                          text-slate-500
                        "
                      >
                        Aktivieren, wenn
                        die
                        Rechnungsadresse
                        von der
                        Lieferadresse
                        abweicht.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* ===========================================
                  BILLING
                 =========================================== */}

              {form.hasDifferentBillingAddress ? (
                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                    shadow-[0_8px_30px_rgba(15,23,42,0.04)]
                    sm:p-6
                  "
                >
                  <BillingAddressFields
                    value={
                      form.billingAddress
                    }
                    errors={
                      errors
                    }
                    disabled={
                      isSubmitting
                    }
                    onChange={
                      updateBillingAddress
                    }
                  />
                </div>
              ) : null}

              {/* ===========================================
                  SHIPPING
                 =========================================== */}

              <ShippingInformation
                countryCode={
                  form.shippingAddress
                    .countryCode
                }
                shippingAmount={
                  safeShippingAmount
                }
                disabled={
                  isSubmitting
                }
              />

              {/* ===========================================
                  CUSTOMER NOTE
                 =========================================== */}

              <section
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-[0_8px_30px_rgba(15,23,42,0.04)]
                  sm:p-6
                "
              >
                <label
                  htmlFor="checkout-customer-note"
                  className="
                    block
                    text-sm
                    font-black
                    text-slate-900
                  "
                >
                  Hinweis zur Bestellung
                </label>

                <p
                  className="
                    mt-1
                    text-xs
                    font-medium
                    leading-5
                    text-slate-500
                  "
                >
                  Optional können Sie
                  uns zusätzliche
                  Informationen zu Ihrer
                  Bestellung mitteilen.
                </p>

                <textarea
                  id="checkout-customer-note"
                  name="customerNote"
                  value={
                    form.customerNote
                  }
                  onChange={(
                    event
                  ) => {
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        customerNote:
                          event.target
                            .value,
                      })
                    );

                    setGlobalError(
                      null
                    );
                  }}
                  disabled={
                    isSubmitting
                  }
                  maxLength={
                    CHECKOUT_LIMITS.customerNoteMaxLength
                  }
                  rows={4}
                  placeholder="Optionaler Hinweis ..."
                  aria-invalid={
                    Boolean(
                      errors.customerNote
                    )
                  }
                  aria-describedby={
                    errors.customerNote
                      ? "checkout-customer-note-error"
                      : "checkout-customer-note-count"
                  }
                  className={joinClassNames(
                    [
                      "mt-4",
                      "block",
                      "w-full",
                      "resize-y",
                      "rounded-xl",
                      "border",
                      "bg-white",
                      "px-4",
                      "py-3",
                      "text-sm",
                      "font-medium",
                      "leading-6",
                      "text-slate-950",
                      "outline-none",
                      "transition",
                      "placeholder:text-slate-400",
                      "disabled:cursor-not-allowed",
                      "disabled:bg-slate-100",
                    ].join(" "),

                    errors.customerNote
                      ? [
                          "border-red-400",
                          "focus:border-red-500",
                          "focus:ring-4",
                          "focus:ring-red-100",
                        ].join(" ")
                      : [
                          "border-slate-200",
                          "focus:border-[#1769e0]",
                          "focus:ring-4",
                          "focus:ring-blue-100/80",
                        ].join(" ")
                  )}
                />

                <div
                  className="
                    mt-1.5
                    flex
                    items-start
                    justify-between
                    gap-3
                  "
                >
                  <div>
                    {errors.customerNote ? (
                      <p
                        id="checkout-customer-note-error"
                        role="alert"
                        className="
                          m-0
                          text-xs
                          font-semibold
                          text-red-600
                        "
                      >
                        {
                          errors.customerNote
                        }
                      </p>
                    ) : null}
                  </div>

                  <span
                    id="checkout-customer-note-count"
                    className="
                      shrink-0
                      text-[10px]
                      font-semibold
                      text-slate-400
                    "
                  >
                    {
                      form.customerNote
                        .length
                    }
                    /
                    {
                      CHECKOUT_LIMITS.customerNoteMaxLength
                    }
                  </span>
                </div>
              </section>

              {/* ===========================================
                  MOBILE CONTACT
                 =========================================== */}

              <div className="lg:hidden">
                <CheckoutContact compact />
              </div>

              {/* ===========================================
                  SUBMIT AREA
                 =========================================== */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-[0_8px_30px_rgba(15,23,42,0.04)]
                  sm:p-5
                "
              >
                <div
                  className="
                    flex
                    items-start
                    gap-2.5
                    rounded-xl
                    bg-slate-50
                    px-3.5
                    py-3
                  "
                >
                  <LockKeyhole
                    aria-hidden="true"
                    className="
                      mt-0.5
                      h-4
                      w-4
                      shrink-0
                      text-slate-500
                    "
                    strokeWidth={2}
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
                    Mit dem Absenden
                    übermitteln Sie Ihre
                    Bestelldaten an
                    NACHTKRONE. Die
                    Bestellung wird
                    dadurch nicht
                    automatisch als
                    bezahlt markiert.
                  </p>
                </div>

                <div
                  className="
                    mt-4
                    flex
                    flex-col-reverse
                    gap-3
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <a
                    href={
                      CHECKOUT_ROUTES.products
                    }
                    aria-disabled={
                      isSubmitting
                    }
                    className={joinClassNames(
                      [
                        "inline-flex",
                        "h-12",
                        "items-center",
                        "justify-center",
                        "gap-2",
                        "rounded-xl",
                        "border",
                        "border-slate-200",
                        "bg-white",
                        "px-5",
                        "text-sm",
                        "font-extrabold",
                        "text-slate-700",
                        "no-underline",
                        "transition",
                        "hover:border-slate-300",
                        "hover:bg-slate-50",
                        "focus-visible:outline-none",
                        "focus-visible:ring-4",
                        "focus-visible:ring-slate-100",
                      ].join(" "),

                      isSubmitting &&
                        "pointer-events-none opacity-60"
                    )}
                  >
                    <ArrowLeft
                      className="h-4 w-4"
                      strokeWidth={2.2}
                    />

                    Weiter einkaufen
                  </a>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !hasItems
                    }
                    className="
                      inline-flex
                      h-12
                      min-w-[210px]
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border-0
                      bg-[#1769e0]
                      px-6
                      text-sm
                      font-black
                      text-white
                      shadow-[0_8px_22px_rgba(23,105,224,0.22)]
                      transition
                      hover:bg-[#125ac2]
                      focus-visible:outline-none
                      focus-visible:ring-4
                      focus-visible:ring-blue-200
                      disabled:cursor-not-allowed
                      disabled:bg-slate-300
                      disabled:shadow-none
                    "
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="
                            h-[18px]
                            w-[18px]
                            animate-spin
                          "
                          strokeWidth={2.2}
                        />

                        Wird gesendet ...
                      </>
                    ) : (
                      <>
                        Bestellung absenden

                        <Send
                          aria-hidden="true"
                          className="h-[17px] w-[17px]"
                          strokeWidth={2.2}
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </main>

          {/* ===============================================
              RIGHT DESKTOP
             =============================================== */}

          <aside
            className="
              hidden
              min-w-0
              lg:block
            "
          >
            <div
              className="
                sticky
                top-6
                space-y-4
              "
            >
              <OrderSummary
                summary={
                  summary
                }
                shippingAmount={
                  safeShippingAmount
                }
                collapsible={
                  false
                }
                disabled={
                  isSubmitting
                }
              />

              <CheckoutContact />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}