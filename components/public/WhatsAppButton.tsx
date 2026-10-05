"use client";

import { useState } from "react";

import { WHATSAPP_URL_WITH_MESSAGE } from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — WHATSAPP BUTTON
   components/public/WhatsAppButton.tsx

   Bouton WhatsApp flottant disponible sur toutes
   les pages publiques.

   Mobile :
   - positionné au-dessus de la barre de navigation
   - compact
   - ne masque pas le contenu

   Desktop :
   - positionné en bas à droite
   - affiche le texte "WhatsApp"

   Numéro :
   +49 1590 5493267

   L'URL et le message sont centralisés dans :
   lib/public-navigation.ts
   ========================================================= */

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="
        fixed
        bottom-[84px]
        right-4
        z-[55]
        sm:right-5
        lg:bottom-6
        lg:right-6
      "
    >
      <a
        href={WHATSAPP_URL_WITH_MESSAGE}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="NACHTKRONE über WhatsApp kontaktieren"
        title="WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="
          group
          flex
          h-14
          items-center
          justify-center
          overflow-hidden
          rounded-full
          bg-[#25D366]
          text-white
          shadow-[0_10px_30px_rgba(0,0,0,0.22)]
          ring-1
          ring-black/5
          transition-all
          duration-300
          hover:-translate-y-0.5
          hover:bg-[#20bd5a]
          hover:shadow-[0_14px_36px_rgba(0,0,0,0.28)]
          focus:outline-none
          focus-visible:ring-4
          focus-visible:ring-[#25D366]/30
          active:translate-y-0
          lg:min-w-14
        "
      >
        {/* =================================================
            LOGO WHATSAPP
            SVG intégré : aucun fichier image supplémentaire.
           ================================================= */}

        <span
          className="
            flex
            h-14
            w-14
            shrink-0
            items-center
            justify-center
          "
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 32 32"
            className="h-7 w-7"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16.004 3C8.832 3 3 8.832 3 16c0 2.293.6 4.535 1.738 6.508L3 29l6.656-1.746A12.95 12.95 0 0 0 16 29h.004C23.172 29 29 23.168 29 16S23.172 3 16.004 3Zm0 23.813h-.004a10.8 10.8 0 0 1-5.504-1.508l-.395-.235-3.949 1.035 1.055-3.847-.258-.406A10.77 10.77 0 0 1 5.188 16c0-5.965 4.851-10.813 10.816-10.813 5.961 0 10.809 4.848 10.809 10.813 0 5.96-4.848 10.813-10.809 10.813Z" />

            <path d="M21.934 18.105c-.325-.164-1.922-.949-2.219-1.058-.297-.11-.516-.164-.73.164-.215.324-.84 1.055-1.028 1.273-.191.215-.379.243-.703.082-.324-.164-1.371-.504-2.61-1.61-.964-.859-1.617-1.922-1.804-2.246-.188-.324-.02-.5.14-.66.145-.145.325-.379.489-.57.16-.188.215-.325.324-.54.106-.218.055-.406-.027-.57-.082-.164-.73-1.758-1-2.406-.266-.633-.535-.547-.73-.559h-.625c-.215 0-.57.082-.867.406-.297.325-1.137 1.11-1.137 2.707 0 1.598 1.164 3.141 1.328 3.36.16.215 2.289 3.496 5.547 4.902.773.336 1.379.535 1.851.684.778.246 1.485.21 2.043.129.625-.094 1.922-.785 2.192-1.543.27-.758.27-1.406.187-1.543-.082-.137-.297-.219-.621-.383Z" />
          </svg>
        </span>

        {/* =================================================
            TEXTE DESKTOP

            Mobile :
            seulement le logo.

            Desktop :
            le texte accompagne le logo.
           ================================================= */}

        <span
          className="
            hidden
            whitespace-nowrap
            pr-5
            text-sm
            font-bold
            tracking-[0.01em]
            lg:block
          "
        >
          WhatsApp
        </span>

        {/* =================================================
            PETIT INDICATEUR VISUEL DESKTOP
           ================================================= */}

        <span
          aria-hidden="true"
          className={[
            "absolute right-1 top-1 hidden h-2.5 w-2.5",
            "rounded-full border-2 border-white bg-[#128C7E]",
            "transition-transform duration-300 lg:block",
            hovered ? "scale-110" : "scale-100",
          ].join(" ")}
        />
      </a>

      {/* ===================================================
          INFO ACCESSIBILITÉ

          Le texte est invisible visuellement mais permet
          de conserver une description complète du bouton.
         =================================================== */}

      <span className="sr-only">
        WhatsApp: +49 1590 5493267
      </span>
    </div>
  );
}