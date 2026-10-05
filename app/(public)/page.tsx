import type { Metadata } from "next";

import HomeHero from "@/components/public/home/HomeHero";
import HomeProducts, {
  type HomeProduct,
} from "@/components/public/home/HomeProducts";
import HomeTrustBar from "@/components/public/home/HomeTrustBar";

import { prisma } from "@/lib/prisma";

/* =========================================================
   NACHTKRONE — PAGE D'ACCUEIL PUBLIQUE
   app/(public)/page.tsx

   Responsabilités :
   - page d'accueil de la boutique
   - récupération des produits publiés depuis Prisma
   - aucun fetch côté navigateur
   - conversion propre des Decimal Prisma
   - Hero
   - Produits
   - Trust Bar

   Important :
   - seuls les produits PUBLISHED sont affichés
   - les produits les plus récents apparaissent en premier
   - aucun produit DRAFT n'est exposé
   ========================================================= */

/* =========================================================
   MÉTADONNÉES
   ========================================================= */

export const metadata: Metadata = {
  title: "NACHTKRONE | Krampus Masken & Kostüme",
  description:
    "Entdecke ausgewählte Krampus-Masken, Kostüme und komplette Sets bei NACHTKRONE.",
};

/* =========================================================
   REVALIDATION

   La page peut être régénérée régulièrement afin que
   les nouveaux produits publiés apparaissent sans rendre
   toute la page inutilement dynamique à chaque visite.
   ========================================================= */

export const revalidate = 60;

/* =========================================================
   NOMBRE DE PRODUITS SUR L'ACCUEIL
   ========================================================= */

const HOME_PRODUCT_LIMIT = 8;

/* =========================================================
   CHARGEMENT DES PRODUITS
   ========================================================= */

async function getHomeProducts(): Promise<HomeProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
    },

    orderBy: {
      createdAt: "desc",
    },

    take: HOME_PRODUCT_LIMIT,

    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      price: true,
      promotionalPrice: true,
      stock: true,
      mainImage: true,
    },
  });

  /* =======================================================
     SÉRIALISATION

     Les Decimal Prisma ne doivent pas être transmis tels
     quels aux composants.

     On les convertit donc en chaînes afin de conserver
     correctement leur valeur monétaire.
     ======================================================= */

  return products.map((product) => ({
    id: product.id,

    name: product.name,

    slug: product.slug,

    category: product.category,

    price: product.price.toString(),

    promotionalPrice:
      product.promotionalPrice !== null
        ? product.promotionalPrice.toString()
        : null,

    stock: product.stock,

    mainImage: product.mainImage,
  }));
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function HomePage() {
  const products = await getHomeProducts();

  return (
    <>
      {/* =====================================================
          HERO

          Image utilisée :
          public/image/couverture.png
         ===================================================== */}

      <HomeHero />

      {/* =====================================================
          PRODUITS

          Produits réels récupérés depuis la base de données.
          Seuls les produits PUBLISHED sont présents.
         ===================================================== */}

      <HomeProducts products={products} />

      {/* =====================================================
          CONFIANCE

          - produits sélectionnés
          - paiement
          - contact WhatsApp
         ===================================================== */}

      <HomeTrustBar />
    </>
  );
}