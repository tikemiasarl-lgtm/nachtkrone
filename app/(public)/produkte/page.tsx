import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import ProductsPage from "@/components/public/products/ProductsPage";

import type { ProductCardData } from "@/components/public/products/ProductCard";

/* =========================================================
   CONFIGURATION NEXT.JS

   Cette page utilise Prisma et la base PostgreSQL.

   force-dynamic évite que Next.js tente de récupérer
   les produits pendant la génération statique du build.
========================================================= */

export const dynamic = "force-dynamic";

/* =========================================================
   MÉTADONNÉES
========================================================= */

export const metadata: Metadata = {
  title: "Alle Produkte | NACHTKRONE",
  description:
    "Entdecke Krampusmasken, Kostüme und komplette Krampus-Sets bei NACHTKRONE.",
};

/* =========================================================
   PAGE
========================================================= */

export default async function ProductsRoutePage() {
  const products = await getPublishedProducts();

  return <ProductsPage products={products} />;
}

/* =========================================================
   RÉCUPÉRATION DES PRODUITS

   IMPORTANT :
   - uniquement les produits PUBLISHED
   - aucun produit DRAFT
   - aucun produit ARCHIVED
   - les plus récents en premier
   - uniquement les champs nécessaires au catalogue
========================================================= */

async function getPublishedProducts(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        category: true,

        price: true,
        promotionalPrice: true,

        stock: true,
        mainImage: true,
      },
    });

    /* =====================================================
       CONVERSION PRISMA -> DONNÉES SÉRIALISABLES

       Prisma Decimal ne doit pas être envoyé directement
       à notre composant client.

       On convertit donc price et promotionalPrice
       en nombres JavaScript.
    ===================================================== */

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,

      category: product.category,

      price: product.price.toNumber(),

      promotionalPrice:
        product.promotionalPrice !== null
          ? product.promotionalPrice.toNumber()
          : null,

      stock: product.stock,
      mainImage: product.mainImage,
    }));
  } catch (error) {
    /* =====================================================
       LOG SERVEUR

       On garde un message clair dans les logs Hostinger
       sans exposer DATABASE_URL ni aucun secret.
    ===================================================== */

    console.error("[NACHTKRONE_PRODUCTS_PAGE_ERROR]", {
      model: "Product",
      operation: "findMany",
      error:
        error instanceof Error
          ? error.message
          : "Unknown database error",
    });

    /*
     * Le catalogue reste affichable même si la base
     * rencontre temporairement un problème.
     *
     * ProductsPage recevra simplement [] et affichera
     * son état "Keine Produkte gefunden".
     *
     * Cela évite qu'une panne temporaire PostgreSQL
     * transforme toute la page /produkte en erreur 500.
     */

    return [];
  }
}