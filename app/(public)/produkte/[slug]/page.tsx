import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Truck,
} from "lucide-react";

import ProductGallery, {
  type ProductGalleryImage,
} from "@/components/public/product/ProductGallery";
import ProductInfo from "@/components/public/product/ProductInfo";
import ProductPurchase from "@/components/public/product/ProductPurchase";
import ProductDescription from "@/components/public/product/ProductDescription";
import ProductDetails, {
  type ProductDetailItem,
} from "@/components/public/product/ProductDetails";
import ProductShipping from "@/components/public/product/ProductShipping";

import {
  getPublicCategoryLabel,
  type PublicProductCategory,
} from "@/lib/public-navigation";

import { prisma } from "@/lib/prisma";

/* =========================================================
   NACHTKRONE — PRODUCT DETAIL PAGE
   app/(public)/produkte/[slug]/page.tsx

   Fiche produit publique.

   - produit PUBLISHED uniquement
   - image principale
   - toutes les images secondaires
   - prix normal
   - prix promotionnel
   - stock réel
   - quantité
   - panier
   - commande WhatsApp
   - description
   - détails
   - livraison / retour
   - SEO
   - responsive mobile / desktop
   ========================================================= */

export const revalidate = 60;

/* =========================================================
   TYPES
   ========================================================= */

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type RawProductImage = Record<
  string,
  unknown
>;

type PublicProduct = {
  id: string;
  name: string;
  slug: string;

  shortDescription: string;
  description: string;

  category: PublicProductCategory;

  price: string;
  promotionalPrice: string | null;

  stock: number;

  mainImage: string;

  images: ProductGalleryImage[];
};

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeText(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeSlug(
  slug: string
): string {
  try {
    return decodeURIComponent(
      slug
    ).trim();
  } catch {
    return slug.trim();
  }
}

function normalizeStock(
  stock: unknown
): number {
  const value = Number(stock);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(value)
  );
}

/* =========================================================
   IMAGE SECONDAIRE — URL
   ========================================================= */

function getImageUrl(
  image: RawProductImage
): string {
  const preferredKeys = [
    "url",
    "imageUrl",
    "src",
    "path",
    "image",
  ];

  for (const key of preferredKeys) {
    const value =
      normalizeText(image[key]);

    if (value) {
      return value;
    }
  }

  /*
   * Sécurité supplémentaire :
   * si le champ image porte un autre nom,
   * on cherche une véritable URL ou un chemin public
   * parmi les valeurs retournées par Prisma.
   */

  for (
    const value of
    Object.values(image)
  ) {
    const normalized =
      normalizeText(value);

    if (!normalized) {
      continue;
    }

    if (
      normalized.startsWith("/") ||
      normalized.startsWith(
        "http://"
      ) ||
      normalized.startsWith(
        "https://"
      )
    ) {
      return normalized;
    }
  }

  return "";
}

/* =========================================================
   IMAGE SECONDAIRE — ALT
   ========================================================= */

function getImageAlt(
  image: RawProductImage,
  productName: string
): string {
  const possibleAlt =
    normalizeText(image.alt) ||
    normalizeText(
      image.altText
    ) ||
    normalizeText(
      image.title
    );

  return (
    possibleAlt ||
    productName
  );
}

/* =========================================================
   SÉRIALISATION DES IMAGES

   - conserve toutes les images valides
   - supprime les doublons
   - prépare les données pour ProductGallery
   ========================================================= */

function serializeProductImages(
  images: RawProductImage[],
  productName: string
): ProductGalleryImage[] {
  const result:
    ProductGalleryImage[] = [];

  const seen =
    new Set<string>();

  for (const image of images) {
    const url =
      getImageUrl(image);

    if (
      !url ||
      seen.has(url)
    ) {
      continue;
    }

    seen.add(url);

    result.push({
      url,

      alt: getImageAlt(
        image,
        productName
      ),
    });
  }

  return result;
}

/* =========================================================
   RÉCUPÉRATION PRODUIT
   ========================================================= */

async function getProductBySlug(
  slug: string
): Promise<PublicProduct | null> {
  const normalizedSlug =
    normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const product =
    await prisma.product.findFirst({
      where: {
        slug: normalizedSlug,
        status: "PUBLISHED",
      },

      include: {
        images: true,
      },
    });

  if (!product) {
    return null;
  }

  const rawImages =
    Array.isArray(
      product.images
    )
      ? (
          product.images as unknown as RawProductImage[]
        )
      : [];

  return {
    id: product.id,

    name: product.name,

    slug: product.slug,

    shortDescription:
      product.shortDescription,

    description:
      product.description,

    category:
      product.category as PublicProductCategory,

    price:
      product.price.toString(),

    promotionalPrice:
      product.promotionalPrice
        ?.toString() ??
      null,

    stock:
      normalizeStock(
        product.stock
      ),

    mainImage:
      product.mainImage,

    images:
      serializeProductImages(
        rawImages,
        product.name
      ),
  };
}

/* =========================================================
   SEO
   ========================================================= */

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } =
    await params;

  const product =
    await getProductBySlug(
      slug
    );

  if (!product) {
    return {
      title:
        "Produkt nicht gefunden | NACHTKRONE",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    normalizeText(
      product.shortDescription
    ) ||
    normalizeText(
      product.description
    );

  /*
   * Image principale + images secondaires.
   */

  const seoImages = [
    product.mainImage,

    ...product.images.map(
      (image) =>
        image.url
    ),
  ].filter(Boolean);

  return {
    title:
      `${product.name} | NACHTKRONE`,

    description:
      description ||
      undefined,

    openGraph: {
      title:
        `${product.name} | NACHTKRONE`,

      description:
        description ||
        undefined,

      images:
        seoImages.length > 0
          ? seoImages.map(
              (url) => ({
                url,
                alt:
                  product.name,
              })
            )
          : undefined,
    },
  };
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } =
    await params;

  const product =
    await getProductBySlug(
      slug
    );

  /* =======================================================
     404

     Un produit non publié ne doit jamais être visible
     publiquement.
     ======================================================= */

  if (!product) {
    notFound();
  }

  /* =======================================================
     CATÉGORIE
     ======================================================= */

  const categoryLabel =
    getPublicCategoryLabel(
      product.category
    );

  /* =======================================================
     DÉTAILS PRODUIT

     Seulement les données réellement disponibles.

     Aucun matériau, poids ou dimension inventé.
     ======================================================= */

  const productDetails:
    ProductDetailItem[] = [
      {
        label:
          "Kategorie",

        value:
          categoryLabel,
      },

      {
        label:
          "Verfügbarkeit",

        value:
          product.stock > 0
            ? "Auf Lager"
            : "Nicht auf Lager",
      },
    ];

  /* =======================================================
     RENDU
     ======================================================= */

  return (
    <div className="bg-white">
      <div
        className="
          mx-auto
          w-full
          max-w-[1400px]
          px-4
          pb-10
          pt-4

          sm:px-6
          sm:pb-12
          sm:pt-5

          lg:px-8
          lg:pb-16
          lg:pt-6

          xl:px-10
        "
      >
        {/* =================================================
            FIL D'ARIANE
           ================================================= */}

        <nav
          aria-label="Breadcrumb"
          className="
            mb-5
            overflow-hidden

            sm:mb-6
          "
        >
          <ol
            className="
              flex
              min-w-0
              items-center
              gap-1.5
              overflow-hidden

              text-xs
              font-semibold
              text-slate-500

              sm:text-sm
            "
          >
            {/* STARTSEITE */}

            <li className="shrink-0">
              <Link
                href="/"
                className="
                  transition-colors
                  hover:text-[#1769e0]
                "
              >
                Startseite
              </Link>
            </li>

            <li
              aria-hidden="true"
              className="
                flex
                shrink-0
                items-center
                text-slate-300
              "
            >
              <ChevronRight
                className="
                  h-3.5
                  w-3.5
                "
                strokeWidth={2}
              />
            </li>

            {/* PRODUKTE */}

            <li className="shrink-0">
              <Link
                href="/produkte"
                className="
                  transition-colors
                  hover:text-[#1769e0]
                "
              >
                Produkte
              </Link>
            </li>

            <li
              aria-hidden="true"
              className="
                flex
                shrink-0
                items-center
                text-slate-300
              "
            >
              <ChevronRight
                className="
                  h-3.5
                  w-3.5
                "
                strokeWidth={2}
              />
            </li>

            {/* CATÉGORIE */}

            <li
              className="
                hidden
                shrink-0

                sm:block
              "
            >
              {categoryLabel}
            </li>

            <li
              aria-hidden="true"
              className="
                hidden
                shrink-0
                items-center
                text-slate-300

                sm:flex
              "
            >
              <ChevronRight
                className="
                  h-3.5
                  w-3.5
                "
                strokeWidth={2}
              />
            </li>

            {/* PRODUIT */}

            <li
              aria-current="page"
              className="
                min-w-0
                truncate
                font-bold
                text-slate-900
              "
            >
              {product.name}
            </li>
          </ol>
        </nav>

        {/* =================================================
            SECTION PRODUIT PRINCIPALE

            Desktop :
            - galerie gauche
            - informations / achat droite

            Mobile :
            - galerie
            - informations
            - achat
           ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            items-start
            gap-7

            md:gap-8

            lg:grid-cols-[minmax(0,1.03fr)_minmax(400px,0.97fr)]
            lg:gap-10

            xl:grid-cols-[minmax(0,1.06fr)_minmax(430px,0.94fr)]
            xl:gap-14
          "
        >
          {/* ===============================================
              GALERIE PRODUIT
             =============================================== */}

          <div className="min-w-0">
            <ProductGallery
              productName={
                product.name
              }
              mainImage={
                product.mainImage
              }
              images={
                product.images
              }
            />
          </div>

          {/* ===============================================
              INFORMATIONS PRODUIT
             =============================================== */}

          <div className="min-w-0">
            <ProductInfo
              name={
                product.name
              }
              category={
                product.category
              }
              price={
                product.price
              }
              promotionalPrice={
                product.promotionalPrice
              }
              stock={
                product.stock
              }
              shortDescription={
                product.shortDescription
              }
            />

            {/* =============================================
                ACHAT

                Ici on transmet maintenant :
                - produit
                - prix
                - promotion
                - stock

                ProductPurchase possède la quantité
                sélectionnée par le client.

                ProductActions peut donc générer la
                commande WhatsApp complète.
               ============================================= */}

            <div className="mt-6">
              <ProductPurchase
                productId={
                  product.id
                }
                productName={
                  product.name
                }
                productSlug={
                  product.slug
                }
                price={
                  product.price
                }
                promotionalPrice={
                  product.promotionalPrice
                }
                stock={
                  product.stock
                }
              />
            </div>

            {/* =============================================
                LIEN LIVRAISON
               ============================================= */}

            <div
              className="
                mt-5
                flex
                items-center
                gap-2

                text-sm
                font-semibold
              "
            >
              <Truck
                aria-hidden="true"
                className="
                  h-[18px]
                  w-[18px]
                  shrink-0
                  text-slate-600
                "
                strokeWidth={2}
              />

              <a
                href="#versand-rueckgabe"
                className="
                  text-[#1769e0]
                  underline
                  decoration-[#1769e0]/30
                  underline-offset-4
                  transition-colors

                  hover:text-[#0f5fcf]
                "
              >
                Versandinformationen
              </a>
            </div>
          </div>
        </div>

        {/* =================================================
            INFORMATIONS COMPLÉMENTAIRES
           ================================================= */}

        <div
          className="
            mt-9
            border-t
            border-slate-200
            pt-7

            sm:mt-11
            sm:pt-9

            lg:mt-14
            lg:pt-10
          "
        >
          {/* ===============================================
              TABLETTE / DESKTOP

              Gauche :
              description

              Droite :
              détails + livraison
             =============================================== */}

          <div
            className="
              hidden

              md:grid
              md:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]
              md:items-start
              md:gap-8

              lg:gap-12
            "
          >
            <ProductDescription
              description={
                product.description
              }
            />

            <div className="space-y-5">
              <ProductDetails
                details={
                  productDetails
                }
              />

              <div
                id="versand-rueckgabe"
                className="
                  scroll-mt-28
                "
              >
                <ProductShipping />
              </div>
            </div>
          </div>

          {/* ===============================================
              MOBILE

              Accordéons :
              - description
              - détails
              - livraison / retour
             =============================================== */}

          <div
            className="
              space-y-3
              md:hidden
            "
          >
            <ProductDescription
              description={
                product.description
              }
            />

            <ProductDetails
              details={
                productDetails
              }
            />

            <div
              id="versand-rueckgabe"
              className="
                scroll-mt-24
              "
            >
              <ProductShipping />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}