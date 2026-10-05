import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Phone,
  ShoppingBag,
} from "lucide-react";

import {
  PUBLIC_BRAND,
  PUBLIC_CONTACT,
  PUBLIC_FOOTER,
  PUBLIC_IMAGES,
  PUBLIC_ROUTES,
  WHATSAPP_URL_WITH_MESSAGE,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — PUBLIC FOOTER
   components/public/PublicFooter.tsx

   Footer public affiché uniquement sur ordinateur.

   Contenu :
   - Logo NACHTKRONE
   - Présentation courte
   - Accès produits
   - Contact
   - WhatsApp
   - Moyens de paiement
   - Copyright

   Important :
   - Aucun footer mobile
   - L'image des paiements est :
     public/image/paiement.png
   ========================================================= */

export default function PublicFooter() {
  return (
    <footer
      className="hidden border-t border-white/10 bg-[#07111f] text-white lg:block"
      aria-label="Fußzeile"
    >
      {/* =====================================================
          CONTENU PRINCIPAL
         ===================================================== */}

      <div className="mx-auto w-full max-w-[1500px] px-6 py-10 xl:px-8 2xl:px-10">
        <div className="grid grid-cols-12 gap-x-8 gap-y-10">
          {/* =================================================
              MARQUE
             ================================================= */}

          <div className="col-span-12 lg:col-span-4 xl:col-span-4">
            <Link
              href={PUBLIC_ROUTES.home}
              aria-label={`${PUBLIC_BRAND.name} Startseite`}
              className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <div className="relative h-[48px] w-[200px]">
                <Image
                  src={PUBLIC_IMAGES.logo}
                  alt={PUBLIC_BRAND.name}
                  fill
                  sizes="200px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            <p className="mt-5 max-w-[380px] text-sm leading-6 text-slate-400">
              Ausgewählte Krampus-Masken und Kostüme für
              eindrucksvolle Auftritte, Veranstaltungen und
              die Krampus-Saison.
            </p>

            <a
              href={WHATSAPP_URL_WITH_MESSAGE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center gap-2.5 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#20bd5a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50"
            >
              <MessageCircle
                aria-hidden="true"
                className="h-[19px] w-[19px]"
                strokeWidth={2.2}
              />

              <span>WhatsApp</span>
            </a>
          </div>

          {/* =================================================
              PRODUKTE
             ================================================= */}

          <div className="col-span-4 lg:col-span-2 xl:col-span-2">
            <h2 className="text-sm font-bold tracking-wide text-white">
              Produkte
            </h2>

            <div className="mt-5 flex flex-col items-start gap-3.5">
              <Link
                href={PUBLIC_ROUTES.products}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Alle Produkte
              </Link>

              <Link
                href={PUBLIC_ROUTES.masks}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Masken
              </Link>

              <Link
                href={PUBLIC_ROUTES.costumes}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Kostüme
              </Link>

              <Link
                href={PUBLIC_ROUTES.sets}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Masken &amp; Kostüme
              </Link>
            </div>
          </div>

          {/* =================================================
              KONTAKT
             ================================================= */}

          <div className="col-span-4 lg:col-span-3 xl:col-span-3">
            <h2 className="text-sm font-bold tracking-wide text-white">
              Kontakt
            </h2>

            <div className="mt-5 space-y-4">
              {/* TÉLÉPHONE */}

              <a
                href={PUBLIC_CONTACT.phoneHref}
                className="group flex w-fit items-start gap-3 text-sm text-slate-400 transition hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition group-hover:border-white/20 group-hover:text-white">
                  <Phone
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                </span>

                <span className="pt-2">
                  {PUBLIC_CONTACT.phoneDisplay}
                </span>
              </a>

              {/* EMAIL */}

              <a
                href={PUBLIC_CONTACT.emailHref}
                className="group flex w-fit items-start gap-3 text-sm text-slate-400 transition hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition group-hover:border-white/20 group-hover:text-white">
                  <Mail
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                </span>

                <span className="break-all pt-2">
                  {PUBLIC_CONTACT.email}
                </span>
              </a>

              {/* WHATSAPP */}

              <a
                href={WHATSAPP_URL_WITH_MESSAGE}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-fit items-start gap-3 text-sm text-slate-400 transition hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition group-hover:border-[#25D366]/40 group-hover:text-[#25D366]">
                  <MessageCircle
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                </span>

                <span className="pt-2">
                  WhatsApp
                </span>
              </a>
            </div>
          </div>

          {/* =================================================
              ZAHLUNGSMETHODEN
             ================================================= */}

          <div className="col-span-4 lg:col-span-3 xl:col-span-3">
            <h2 className="text-sm font-bold tracking-wide text-white">
              Zahlungsmethoden
            </h2>

            <p className="mt-5 max-w-[280px] text-sm leading-6 text-slate-400">
              Bequem und sicher bezahlen.
            </p>

            {/* ===============================================
                IMAGE UNIQUE DES MOYENS DE PAIEMENT

                Fichier :
                public/image/paiement.png
               =============================================== */}

            <div className="mt-4 w-full max-w-[290px] overflow-hidden rounded-xl border border-white/10 bg-white p-3">
              <div className="relative h-[58px] w-full">
                <Image
                  src={PUBLIC_IMAGES.paymentMethods}
                  alt={PUBLIC_FOOTER.paymentImageAlt}
                  fill
                  sizes="290px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            SÉPARATEUR
           =================================================== */}

        <div className="my-8 h-px w-full bg-white/10" />

        {/* ===================================================
            BARRE INFÉRIEURE
           =================================================== */}

        <div className="flex items-center justify-between gap-6">
          <p className="text-xs leading-5 text-slate-500">
            {PUBLIC_FOOTER.copyright}
          </p>

          <Link
            href={PUBLIC_ROUTES.products}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            <ShoppingBag
              aria-hidden="true"
              className="h-4 w-4"
              strokeWidth={2}
            />

            <span>Produkte entdecken</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}