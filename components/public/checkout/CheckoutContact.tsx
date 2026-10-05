"use client";

import {
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import {
  CHECKOUT_CONTACT,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — CHECKOUT CONTACT
   components/public/checkout/CheckoutContact.tsx

   Bloc d'assistance affiché dans le checkout.

   OBJECTIFS :
   - rassurer le client
   - donner accès à WhatsApp
   - donner accès au téléphone
   - donner accès à l'e-mail
   - utiliser uniquement les coordonnées centralisées
     dans lib/checkout.ts
   - fonctionner sur mobile et desktop

   AUCUNE logique :
   - Prisma
   - commande
   - prix
   - paiement
   - formulaire
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type CheckoutContactProps = {
  className?: string;

  compact?: boolean;
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
   WHATSAPP URL

   On utilise la valeur centralisée du checkout.

   Si whatsappUrl existe déjà dans CHECKOUT_CONTACT,
   elle sera utilisée.

   Sinon, on construit l'URL depuis whatsappNumber.

   Le fallback final utilise whatsappDisplay afin que
   le composant reste robuste avec la structure actuelle.
   ========================================================= */

function getWhatsAppUrl(): string {
  const contact =
    CHECKOUT_CONTACT as typeof CHECKOUT_CONTACT & {
      whatsappUrl?: string;
      whatsappNumber?: string;
    };

  if (
    typeof contact.whatsappUrl === "string" &&
    contact.whatsappUrl.trim()
  ) {
    return contact.whatsappUrl.trim();
  }

  if (
    typeof contact.whatsappNumber === "string" &&
    contact.whatsappNumber.trim()
  ) {
    const number =
      contact.whatsappNumber.replace(
        /\D/g,
        ""
      );

    if (number) {
      return `https://wa.me/${number}`;
    }
  }

  const fallbackNumber =
    CHECKOUT_CONTACT.whatsappDisplay.replace(
      /\D/g,
      ""
    );

  return `https://wa.me/${fallbackNumber}`;
}

/* =========================================================
   PHONE URL
   ========================================================= */

function getPhoneUrl(): string {
  const contact =
    CHECKOUT_CONTACT as typeof CHECKOUT_CONTACT & {
      phone?: string;
    };

  const rawPhone =
    typeof contact.phone === "string" &&
    contact.phone.trim()
      ? contact.phone
      : CHECKOUT_CONTACT.whatsappDisplay;

  const normalized =
    rawPhone
      .trim()
      .replace(/[^\d+]/g, "");

  return `tel:${normalized}`;
}

/* =========================================================
   EMAIL URL
   ========================================================= */

function getEmailUrl(): string {
  return `mailto:${CHECKOUT_CONTACT.email}`;
}

/* =========================================================
   CONTACT ROW
   ========================================================= */

function ContactRow({
  href,
  icon,
  label,
  value,
  external = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={
        external
          ? "_blank"
          : undefined
      }
      rel={
        external
          ? "noopener noreferrer"
          : undefined
      }
      className="
        group
        flex
        min-w-0
        items-center
        gap-3
        rounded-xl
        border
        border-slate-200
        bg-white
        px-3.5
        py-3
        text-left
        no-underline
        transition
        duration-200
        hover:border-slate-300
        hover:bg-slate-50
        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-blue-100
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
          rounded-lg
          bg-slate-100
          text-slate-600
          transition
          duration-200
          group-hover:bg-blue-50
          group-hover:text-[#1769e0]
        "
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="
            text-[11px]
            font-bold
            leading-4
            text-slate-500
          "
        >
          {label}
        </div>

        <div
          className="
            mt-0.5
            break-words
            text-[13px]
            font-extrabold
            leading-5
            text-slate-900
          "
        >
          {value}
        </div>
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="
          h-4
          w-4
          shrink-0
          text-slate-300
          transition
          duration-200
          group-hover:translate-x-0.5
          group-hover:text-[#1769e0]
        "
      >
        <path
          d="M7.5 4.5L13 10l-5.5 5.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function CheckoutContact({
  className,
  compact = false,
}: CheckoutContactProps) {
  const whatsappUrl =
    getWhatsAppUrl();

  const phoneUrl =
    getPhoneUrl();

  const emailUrl =
    getEmailUrl();

  return (
    <section
      aria-labelledby="checkout-contact-help-title"
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

        className
      )}
    >
      {/* ===================================================
          HEADER
         =================================================== */}

      <div
        className={joinClassNames(
          [
            "flex",
            "items-start",
            "gap-3",
            "border-b",
            "border-slate-100",
          ].join(" "),

          compact
            ? "px-4 py-3.5"
            : "px-4 py-4 sm:px-5"
        )}
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
          <Headphones
            className="h-5 w-5"
            strokeWidth={2.2}
          />
        </div>

        <div className="min-w-0">
          <h2
            id="checkout-contact-help-title"
            className="
              m-0
              text-[16px]
              font-black
              tracking-[-0.02em]
              text-slate-950
              sm:text-[17px]
            "
          >
            Fragen zur Bestellung?
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
            Kontaktieren Sie
            NACHTKRONE direkt, wenn Sie
            Hilfe bei Ihrer Bestellung
            benötigen.
          </p>
        </div>
      </div>

      {/* ===================================================
          CONTACT METHODS
         =================================================== */}

      <div
        className={joinClassNames(
          "space-y-2.5",

          compact
            ? "p-3.5"
            : "p-4 sm:p-5"
        )}
      >
        {/* =================================================
            WHATSAPP
           ================================================= */}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`NACHTKRONE über WhatsApp kontaktieren: ${CHECKOUT_CONTACT.whatsappDisplay}`}
          className="
            group
            flex
            min-w-0
            items-center
            gap-3
            rounded-xl
            border
            border-emerald-200
            bg-emerald-50/70
            px-3.5
            py-3
            text-left
            no-underline
            transition
            duration-200
            hover:border-emerald-300
            hover:bg-emerald-50
            focus-visible:outline-none
            focus-visible:ring-4
            focus-visible:ring-emerald-100
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
              rounded-lg
              bg-emerald-100
              text-emerald-700
            "
          >
            <MessageCircle
              className="h-[18px] w-[18px]"
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="
                text-[11px]
                font-bold
                leading-4
                text-emerald-700
              "
            >
              WhatsApp
            </div>

            <div
              className="
                mt-0.5
                break-words
                text-[13px]
                font-extrabold
                leading-5
                text-slate-900
              "
            >
              {
                CHECKOUT_CONTACT
                  .whatsappDisplay
              }
            </div>
          </div>

          <span
            className="
              shrink-0
              rounded-full
              bg-emerald-600
              px-2.5
              py-1
              text-[10px]
              font-black
              text-white
              transition
              duration-200
              group-hover:bg-emerald-700
            "
          >
            Chat
          </span>
        </a>

        {/* =================================================
            PHONE
           ================================================= */}

        <ContactRow
          href={phoneUrl}
          label="Telefon"
          value={
            CHECKOUT_CONTACT
              .whatsappDisplay
          }
          icon={
            <Phone
              className="h-[18px] w-[18px]"
              strokeWidth={2.1}
            />
          }
        />

        {/* =================================================
            EMAIL
           ================================================= */}

        <ContactRow
          href={emailUrl}
          label="E-Mail"
          value={
            CHECKOUT_CONTACT.email
          }
          icon={
            <Mail
              className="h-[18px] w-[18px]"
              strokeWidth={2.1}
            />
          }
        />

        {/* =================================================
            SECURITY MESSAGE
           ================================================= */}

        <div
          className="
            flex
            items-start
            gap-2.5
            px-1
            pt-2
          "
        >
          <ShieldCheck
            aria-hidden="true"
            className="
              mt-0.5
              h-4
              w-4
              shrink-0
              text-slate-400
            "
            strokeWidth={2}
          />

          <p
            className="
              m-0
              text-[11px]
              font-medium
              leading-[18px]
              text-slate-500
            "
          >
            Geben Sie sensible
            Zahlungsdaten niemals per
            WhatsApp, Telefon oder
            E-Mail weiter.
          </p>
        </div>
      </div>
    </section>
  );
}