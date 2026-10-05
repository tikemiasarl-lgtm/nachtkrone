import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  PUBLIC_IMAGES,
  PUBLIC_ROUTES,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — HOME HERO
   components/public/home/HomeHero.tsx

   Hero principal de la page d'accueil publique.

   Objectifs :
   - Utiliser l'image :
     public/image/couverture.png
   - Présenter immédiatement l'univers NACHTKRONE
   - Interface entièrement en allemand
   - Responsive PC / mobile
   - CTA vers les produits
   - Aucun faux prix
   - Aucun faux avis
   - Aucun faux chiffre commercial
   ========================================================= */

export default function HomeHero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-[#050b14]"
      aria-labelledby="nachtkrone-hero-title"
    >
      {/* =====================================================
          IMAGE DE COUVERTURE
         ===================================================== */}

      <div className="absolute inset-0 -z-30">
        <Image
          src={PUBLIC_IMAGES.cover}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* =====================================================
          OVERLAY PRINCIPAL

          Plus sombre sur desktop à gauche afin de conserver
          une excellente lisibilité du texte.

          Sur mobile, le dégradé est principalement vertical.
         ===================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          -z-20
          bg-[linear-gradient(to_bottom,rgba(3,8,15,0.18)_0%,rgba(3,8,15,0.40)_45%,rgba(3,8,15,0.94)_100%)]
          lg:bg-[linear-gradient(90deg,rgba(3,8,15,0.96)_0%,rgba(3,8,15,0.84)_34%,rgba(3,8,15,0.42)_64%,rgba(3,8,15,0.18)_100%)]
        "
      />

      {/* =====================================================
          ASSOMBRISSEMENT SUPPLÉMENTAIRE MOBILE
         ===================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          inset-x-0
          bottom-0
          -z-10
          h-[70%]
          bg-gradient-to-t
          from-[#050b14]
          via-[#050b14]/65
          to-transparent
          lg:hidden
        "
      />

      {/* =====================================================
          LÉGÈRE LUMIÈRE D'AMBIANCE
         ===================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          -left-32
          top-1/3
          -z-10
          h-[360px]
          w-[360px]
          rounded-full
          bg-[#1769e0]/10
          blur-[110px]
          lg:h-[500px]
          lg:w-[500px]
        "
      />

      {/* =====================================================
          CONTENU
         ===================================================== */}

      <div
        className="
          mx-auto
          flex
          min-h-[620px]
          w-full
          max-w-[1500px]
          items-end
          px-4
          pb-10
          pt-32
          sm:min-h-[680px]
          sm:px-5
          sm:pb-12
          lg:min-h-[620px]
          lg:items-center
          lg:px-6
          lg:py-20
          xl:min-h-[670px]
          xl:px-8
          2xl:px-10
        "
      >
        <div className="w-full max-w-[720px]">
          {/* =================================================
              BADGE
             ================================================= */}

          <div
            className="
              mb-5
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-white/15
              bg-black/25
              px-3.5
              py-2
              text-[11px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-white
              shadow-sm
              backdrop-blur-md
              sm:text-xs
            "
          >
            <Sparkles
              aria-hidden="true"
              className="h-4 w-4 text-[#e7b84b]"
              strokeWidth={2}
            />

            <span>Krampus Kollektion</span>
          </div>

          {/* =================================================
              TITRE
             ================================================= */}

          <h1
            id="nachtkrone-hero-title"
            className="
              max-w-[680px]
              text-[38px]
              font-black
              leading-[0.98]
              tracking-[-0.035em]
              text-white
              sm:text-[48px]
              lg:text-[58px]
              xl:text-[68px]
            "
          >
            Die Nacht
            <span className="block text-[#e7b84b]">
              gehört dir.
            </span>
          </h1>

          {/* =================================================
              DESCRIPTION
             ================================================= */}

          <p
            className="
              mt-5
              max-w-[600px]
              text-[15px]
              font-medium
              leading-7
              text-slate-200
              sm:text-base
              lg:mt-6
              lg:text-[17px]
              lg:leading-8
            "
          >
            Entdecke ausgewählte Krampus-Masken, Kostüme und
            komplette Sets für einen kraftvollen und
            unvergesslichen Auftritt.
          </p>

          {/* =================================================
              ACTIONS
             ================================================= */}

          <div
            className="
              mt-7
              flex
              w-full
              flex-col
              gap-3
              sm:w-auto
              sm:flex-row
              sm:items-center
              lg:mt-8
            "
          >
            {/* PRODUITS */}

            <Link
              href={PUBLIC_ROUTES.products}
              className="
                group
                inline-flex
                min-h-12
                w-full
                items-center
                justify-center
                gap-2.5
                rounded-xl
                bg-[#1769e0]
                px-6
                py-3
                text-sm
                font-bold
                text-white
                shadow-[0_10px_30px_rgba(23,105,224,0.30)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-[#0f5fcf]
                hover:shadow-[0_14px_34px_rgba(23,105,224,0.38)]
                focus:outline-none
                focus-visible:ring-4
                focus-visible:ring-[#1769e0]/35
                sm:w-auto
              "
            >
              <span>Produkte entdecken</span>

              <ArrowRight
                aria-hidden="true"
                className="
                  h-[18px]
                  w-[18px]
                  transition-transform
                  duration-200
                  group-hover:translate-x-1
                "
                strokeWidth={2.2}
              />
            </Link>

            {/* MASQUES */}

            <Link
              href={PUBLIC_ROUTES.masks}
              className="
                inline-flex
                min-h-12
                w-full
                items-center
                justify-center
                rounded-xl
                border
                border-white/20
                bg-black/25
                px-6
                py-3
                text-sm
                font-bold
                text-white
                backdrop-blur-md
                transition-all
                duration-200
                hover:border-white/35
                hover:bg-white/10
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-white/60
                sm:w-auto
              "
            >
              Masken ansehen
            </Link>
          </div>

          {/* =================================================
              INDICATION DE CONFIANCE
             ================================================= */}

          <div
            className="
              mt-6
              flex
              items-start
              gap-2.5
              text-xs
              font-medium
              leading-5
              text-slate-300
              sm:items-center
              sm:text-sm
              lg:mt-7
            "
          >
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#e7b84b] sm:mt-0"
              strokeWidth={2}
            />

            <span>
              Masken, Kostüme und Sets für deine
              Krampus-Saison.
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          TRANSITION VERS LA SECTION SUIVANTE
         ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-20
          bg-gradient-to-t
          from-[#050b14]/55
          to-transparent
        "
      />
    </section>
  );
}