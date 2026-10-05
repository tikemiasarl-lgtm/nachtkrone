"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — PRODUCT GALLERY
   components/public/product/ProductGallery.tsx

   Galerie de la fiche produit.

   Fonctionnalités :
   - image principale
   - images secondaires
   - miniatures
   - suppression automatique des doublons
   - changement d'image
   - navigation précédente / suivante
   - zoom plein écran
   - navigation clavier dans le zoom
   - responsive mobile / desktop
   - aucune image produit inventée
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type ProductGalleryImage = {
  url: string;
  alt?: string | null;
};

type ProductGalleryProps = {
  productName: string;
  mainImage: string;
  images?: ProductGalleryImage[];
};

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeText(
  value: string | null | undefined
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function buildGalleryImages(
  productName: string,
  mainImage: string,
  images: ProductGalleryImage[]
): ProductGalleryImage[] {
  const normalizedProductName =
    normalizeText(productName) || "NACHTKRONE Produkt";

  const allImages: ProductGalleryImage[] = [
    {
      url: mainImage,
      alt: normalizedProductName,
    },
    ...images,
  ];

  const uniqueImages = new Map<
    string,
    ProductGalleryImage
  >();

  for (const image of allImages) {
    const url = normalizeText(image.url);

    if (!url || uniqueImages.has(url)) {
      continue;
    }

    uniqueImages.set(url, {
      url,
      alt:
        normalizeText(image.alt) ||
        normalizedProductName,
    });
  }

  return Array.from(uniqueImages.values());
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function ProductGallery({
  productName,
  mainImage,
  images = [],
}: ProductGalleryProps) {
  const galleryImages = useMemo(
    () =>
      buildGalleryImages(
        productName,
        mainImage,
        images
      ),
    [productName, mainImage, images]
  );

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [isZoomOpen, setIsZoomOpen] =
    useState(false);

  const hasImages =
    galleryImages.length > 0;

  const hasMultipleImages =
    galleryImages.length > 1;

  const activeImage =
    galleryImages[activeIndex] ??
    galleryImages[0];

  /* =======================================================
     SÉCURITÉ INDEX

     Si la liste des images change, on évite de conserver
     un index qui n'existe plus.
     ======================================================= */

  if (activeIndex >= galleryImages.length && activeIndex !== 0) {
    setActiveIndex(0);
  }

  /* =======================================================
     IMAGE PRÉCÉDENTE
     ======================================================= */

  function showPreviousImage() {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex((current) =>
      current === 0
        ? galleryImages.length - 1
        : current - 1
    );
  }

  /* =======================================================
     IMAGE SUIVANTE
     ======================================================= */

  function showNextImage() {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex((current) =>
      current ===
      galleryImages.length - 1
        ? 0
        : current + 1
    );
  }

  /* =======================================================
     OUVRIR LE ZOOM
     ======================================================= */

  function openZoom() {
    if (!activeImage) {
      return;
    }

    setIsZoomOpen(true);
  }

  /* =======================================================
     FERMER LE ZOOM
     ======================================================= */

  function closeZoom() {
    setIsZoomOpen(false);
  }

  /* =======================================================
     CLAVIER + BLOCAGE DU SCROLL
     ======================================================= */

  useEffect(() => {
    if (!isZoomOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setIsZoomOpen(false);
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => {
          if (
            galleryImages.length <= 1
          ) {
            return current;
          }

          return current === 0
            ? galleryImages.length - 1
            : current - 1;
        });

        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => {
          if (
            galleryImages.length <= 1
          ) {
            return current;
          }

          return current ===
            galleryImages.length - 1
            ? 0
            : current + 1;
        });
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isZoomOpen,
    galleryImages.length,
  ]);

  /* =======================================================
     AUCUNE IMAGE
     ======================================================= */

  if (!hasImages || !activeImage) {
    return (
      <section
        aria-label="Produktbilder"
        className="w-full"
      >
        <div
          className="
            flex
            aspect-square
            w-full
            items-center
            justify-center
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            px-6
            text-center
          "
        >
          <p
            className="
              text-sm
              font-semibold
              text-slate-400
            "
          >
            Kein Produktbild verfügbar
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        aria-label="Produktbilder"
        className="w-full"
      >
        {/* =================================================
            GRANDE IMAGE
           ================================================= */}

        <div
          className="
            group
            relative
            aspect-square
            w-full
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
          "
        >
          <button
            type="button"
            onClick={openZoom}
            aria-label="Produktbild vergrößern"
            className="
              absolute
              inset-0
              z-10
              cursor-zoom-in
              focus:outline-none
              focus-visible:ring-4
              focus-visible:ring-inset
              focus-visible:ring-[#1769e0]/30
            "
          >
            <span className="sr-only">
              Produktbild vergrößern
            </span>
          </button>

          <Image
            src={activeImage.url}
            alt={
              activeImage.alt ||
              productName
            }
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 620px"
            className="
              object-contain
              p-2
              transition-transform
              duration-500
              ease-out
              group-hover:scale-[1.015]
              sm:p-3
            "
          />

          {/* ===============================================
              ZOOM
             =============================================== */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              right-3
              top-3
              z-20
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white/95
              text-slate-800
              shadow-sm
              backdrop-blur
              sm:right-4
              sm:top-4
            "
          >
            <ZoomIn
              className="h-[18px] w-[18px]"
              strokeWidth={2}
            />
          </div>

          {/* ===============================================
              FLÈCHE GAUCHE
             =============================================== */}

          {hasMultipleImages ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousImage();
              }}
              aria-label="Vorheriges Produktbild"
              className="
                absolute
                left-3
                top-1/2
                z-30
                flex
                h-10
                w-10
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                bg-white/95
                text-slate-800
                shadow-md
                backdrop-blur
                transition
                hover:bg-white
                hover:text-black
                focus:outline-none
                focus-visible:ring-4
                focus-visible:ring-[#1769e0]/20
                sm:left-4
              "
            >
              <ChevronLeft
                className="h-5 w-5"
                strokeWidth={2.2}
              />
            </button>
          ) : null}

          {/* ===============================================
              FLÈCHE DROITE
             =============================================== */}

          {hasMultipleImages ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
              aria-label="Nächstes Produktbild"
              className="
                absolute
                right-3
                top-1/2
                z-30
                flex
                h-10
                w-10
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                bg-white/95
                text-slate-800
                shadow-md
                backdrop-blur
                transition
                hover:bg-white
                hover:text-black
                focus:outline-none
                focus-visible:ring-4
                focus-visible:ring-[#1769e0]/20
                sm:right-4
              "
            >
              <ChevronRight
                className="h-5 w-5"
                strokeWidth={2.2}
              />
            </button>
          ) : null}

          {/* ===============================================
              COMPTEUR
             =============================================== */}

          {hasMultipleImages ? (
            <div
              className="
                pointer-events-none
                absolute
                bottom-3
                right-3
                z-20
                rounded-full
                bg-slate-950/75
                px-3
                py-1.5
                text-[11px]
                font-bold
                tabular-nums
                text-white
                backdrop-blur
                sm:bottom-4
                sm:right-4
              "
            >
              {activeIndex + 1} /{" "}
              {galleryImages.length}
            </div>
          ) : null}
        </div>

        {/* =================================================
            MINIATURES

            On n'affiche cette zone que si le produit
            possède réellement plusieurs images.
           ================================================= */}

        {hasMultipleImages ? (
          <div
            className="
              mt-3
              flex
              w-full
              gap-2.5
              overflow-x-auto
              pb-1
              sm:mt-4
              sm:gap-3
            "
            role="list"
            aria-label="Produktbilder auswählen"
          >
            {galleryImages.map(
              (image, index) => {
                const isActive =
                  index === activeIndex;

                return (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() =>
                      setActiveIndex(index)
                    }
                    aria-label={`Produktbild ${
                      index + 1
                    } anzeigen`}
                    aria-current={
                      isActive
                        ? "true"
                        : undefined
                    }
                    className={[
                      "relative",
                      "h-[72px] w-[72px]",
                      "shrink-0",
                      "overflow-hidden",
                      "rounded-xl",
                      "border-2",
                      "bg-white",
                      "transition-all",
                      "duration-200",
                      "focus:outline-none",
                      "focus-visible:ring-4",
                      "focus-visible:ring-[#1769e0]/20",
                      "sm:h-20 sm:w-20",
                      isActive
                        ? [
                            "border-[#1769e0]",
                            "shadow-sm",
                          ].join(" ")
                        : [
                            "border-slate-200",
                            "hover:border-slate-400",
                          ].join(" "),
                    ].join(" ")}
                  >
                    <Image
                      src={image.url}
                      alt={
                        image.alt ||
                        productName
                      }
                      fill
                      sizes="80px"
                      className="
                        object-contain
                        p-1.5
                      "
                    />
                  </button>
                );
              }
            )}
          </div>
        ) : null}
      </section>

      {/* ===================================================
          MODAL ZOOM
         =================================================== */}

      {isZoomOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vergrößerte Produktansicht"
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/90
            p-3
            backdrop-blur-sm
            sm:p-6
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeZoom();
            }
          }}
        >
          {/* ===============================================
              FERMER
             =============================================== */}

          <button
            type="button"
            onClick={closeZoom}
            aria-label="Bildansicht schließen"
            className="
              absolute
              right-4
              top-4
              z-[110]
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-white
              text-slate-950
              shadow-lg
              transition
              hover:bg-slate-100
              focus:outline-none
              focus-visible:ring-4
              focus-visible:ring-white/30
              sm:right-6
              sm:top-6
            "
          >
            <X
              className="h-5 w-5"
              strokeWidth={2.3}
            />
          </button>

          {/* ===============================================
              IMAGE ZOOMÉE
             =============================================== */}

          <div
            className="
              relative
              h-[82vh]
              w-full
              max-w-6xl
            "
          >
            <Image
              src={activeImage.url}
              alt={
                activeImage.alt ||
                productName
              }
              fill
              loading="eager"
            fetchPriority="high"
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {/* ===============================================
              NAVIGATION ZOOM
             =============================================== */}

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                aria-label="Vorheriges Produktbild"
                className="
                  absolute
                  left-3
                  top-1/2
                  z-[110]
                  flex
                  h-11
                  w-11
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-slate-950
                  shadow-lg
                  transition
                  hover:bg-slate-100
                  focus:outline-none
                  focus-visible:ring-4
                  focus-visible:ring-white/30
                  sm:left-6
                  sm:h-12
                  sm:w-12
                "
              >
                <ChevronLeft
                  className="h-6 w-6"
                  strokeWidth={2.2}
                />
              </button>

              <button
                type="button"
                onClick={showNextImage}
                aria-label="Nächstes Produktbild"
                className="
                  absolute
                  right-3
                  top-1/2
                  z-[110]
                  flex
                  h-11
                  w-11
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-slate-950
                  shadow-lg
                  transition
                  hover:bg-slate-100
                  focus:outline-none
                  focus-visible:ring-4
                  focus-visible:ring-white/30
                  sm:right-6
                  sm:h-12
                  sm:w-12
                "
              >
                <ChevronRight
                  className="h-6 w-6"
                  strokeWidth={2.2}
                />
              </button>

              <div
                className="
                  absolute
                  bottom-4
                  left-1/2
                  z-[110]
                  -translate-x-1/2
                  rounded-full
                  bg-white
                  px-4
                  py-2
                  text-xs
                  font-black
                  tabular-nums
                  text-slate-950
                  shadow-lg
                  sm:bottom-6
                "
              >
                {activeIndex + 1} /{" "}
                {galleryImages.length}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}