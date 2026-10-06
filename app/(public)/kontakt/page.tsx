import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — KONTAKT
   app/(public)/kontakt/page.tsx
========================================================= */

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktiere NACHTKRONE per WhatsApp, Telefon oder E-Mail. Wir helfen dir gerne bei Fragen zu Produkten und Bestellungen.",
};

/* =========================================================
   KONTAKTDATEN
========================================================= */

const PHONE_DISPLAY = "+49 1590 5493267";
const PHONE_LINK = "tel:+4915905493267";

const EMAIL = "contact@nachtkrone-shop.com";

const WHATSAPP_URL =
  "https://wa.me/4915905493267";

/* =========================================================
   PAGE
========================================================= */

export default function KontaktPage() {
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        {/* =================================================
            FIL D'ARIANE
        ================================================= */}

        <nav
          aria-label="Breadcrumb"
          className="mb-7 flex items-center gap-2 text-sm text-slate-500"
        >
          <Link
            href="/"
            className="transition hover:text-slate-950"
          >
            Startseite
          </Link>

          <span aria-hidden="true">/</span>

          <span className="font-medium text-slate-900">
            Kontakt
          </span>
        </nav>

        {/* =================================================
            INTRODUCTION
        ================================================= */}

        <section className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 sm:text-sm">
            NACHTKRONE
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Kontakt
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            Du hast eine Frage zu einem Produkt, deiner
            Bestellung oder benötigst weitere Informationen?
            Kontaktiere uns direkt. Wir helfen dir gerne weiter.
          </p>
        </section>

        {/* =================================================
            CARTES CONTACT
        ================================================= */}

        <section className="mt-9 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* WHATSAPP */}

          <ContactCard
            icon={<MessageCircle size={24} strokeWidth={1.9} />}
            title="WhatsApp"
            description="Schreib uns direkt über WhatsApp."
            value={PHONE_DISPLAY}
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="
                mt-5
                inline-flex
                min-h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-emerald-600
                px-4
                py-2.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-emerald-700
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-emerald-600
                focus-visible:ring-offset-2
              "
            >
              <MessageCircle
                size={18}
                strokeWidth={2}
                aria-hidden="true"
              />

              WhatsApp öffnen
            </a>
          </ContactCard>

          {/* TÉLÉPHONE */}

          <ContactCard
            icon={<Phone size={24} strokeWidth={1.9} />}
            title="Telefon"
            description="Du möchtest direkt mit uns sprechen?"
            value={PHONE_DISPLAY}
          >
            <a
              href={PHONE_LINK}
              className="
                mt-5
                inline-flex
                min-h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-slate-950
                px-4
                py-2.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-blue-700
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-blue-600
                focus-visible:ring-offset-2
              "
            >
              <Phone
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />

              Jetzt anrufen
            </a>
          </ContactCard>

          {/* EMAIL */}

          <ContactCard
            icon={<Mail size={24} strokeWidth={1.9} />}
            title="E-Mail"
            description="Sende uns deine Anfrage per E-Mail."
            value={EMAIL}
            className="sm:col-span-2 lg:col-span-1"
          >
            <a
              href={`mailto:${EMAIL}`}
              className="
                mt-5
                inline-flex
                min-h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-blue-600
                px-4
                py-2.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-blue-700
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-blue-600
                focus-visible:ring-offset-2
              "
            >
              <Mail
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />

              E-Mail senden
            </a>
          </ContactCard>
        </section>

        {/* =================================================
            INFORMATION
        ================================================= */}

        <section className="mx-auto mt-8 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 px-5 py-5 sm:mt-10 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-800 shadow-sm">
              <Clock3
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">
                Kundenservice
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Bei Fragen zu Produkten oder Bestellungen
                kannst du uns jederzeit eine Nachricht senden.
                Wir beantworten deine Anfrage so schnell wie
                möglich.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            RETOUR SHOP
        ================================================= */}

        <div className="mt-9 flex justify-center sm:mt-10">
          <Link
            href="/produkte"
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-slate-300
              bg-white
              px-5
              py-2.5
              text-sm
              font-bold
              text-slate-900
              transition
              hover:border-slate-400
              hover:bg-slate-50
            "
          >
            <ArrowLeft
              size={17}
              strokeWidth={2}
              aria-hidden="true"
            />

            Zurück zum Shop
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   CONTACT CARD
========================================================= */

type ContactCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  children: React.ReactNode;
  className?: string;
};

function ContactCard({
  icon,
  title,
  description,
  value,
  children,
  className = "",
}: ContactCardProps) {
  return (
    <article
      className={`
        flex
        min-w-0
        flex-col
        rounded-xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        sm:p-6
        ${className}
      `}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-950">
        {icon}
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-950">
        {title}
      </h2>

      <p className="mt-1.5 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <p className="mt-3 break-words text-sm font-bold text-slate-950">
        {value}
      </p>

      <div className="mt-auto">
        {children}
      </div>
    </article>
  );
}