
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

import EditProductForm from "@/components/admin/EditProductForm";

/* =========================================================
   NACHTKRONE — ADMIN
   MODIFICATION D'UN PRODUIT
========================================================= */

export const dynamic = "force-dynamic";

/* =========================================================
   MÉTADONNÉES
========================================================= */

export const metadata: Metadata = {
  title: "Modifier un produit",
  robots: {
    index: false,
    follow: false,
  },
};

/* =========================================================
   TYPES
========================================================= */

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   PAGE
========================================================= */

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  /* -------------------------------------------------------
     1. VÉRIFICATION DE LA SESSION ADMINISTRATEUR
  ------------------------------------------------------- */

  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;

  const session = await verifyAdminSessionToken(
    sessionToken,
  );

  if (!session) {
    redirect("/admin/login");
  }

  /* -------------------------------------------------------
     2. RÉCUPÉRATION DE L'IDENTIFIANT
  ------------------------------------------------------- */

  const { id } = await params;

  if (!id) {
    notFound();
  }

  /* -------------------------------------------------------
     3. CHARGEMENT DU PRODUIT ET DE SES IMAGES
  ------------------------------------------------------- */

  const product = await prisma.product.findUnique({
    where: {
      id,
    },

    include: {
      images: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  /* -------------------------------------------------------
     4. PRÉPARATION DES DONNÉES DU FORMULAIRE
  ------------------------------------------------------- */

  const editableProduct = {
    id: product.id,

    name: product.name,

    slug: product.slug,

    shortDescription: product.shortDescription,

    description: product.description,

    category: product.category,

    subcategory: product.subcategory ?? "",

    price: product.price.toString(),

    promotionalPrice:
      product.promotionalPrice?.toString() ?? "",

    stock: String(product.stock),

    mainImage: product.mainImage,

    images: product.images.map((image) => image.url),

    status: product.status,

    updatedAt: product.updatedAt.toISOString(),
  };

  /* -------------------------------------------------------
     5. AFFICHAGE DU FORMULAIRE EXISTANT
  ------------------------------------------------------- */

  return (
    <EditProductForm
      key={product.id}
      product={editableProduct}
    />
  );
}
