import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

import {
  assertSupabaseAdminConfigured,
  getProductPublicUrl,
  getProductStorage,
  SUPABASE_PRODUCTS_BUCKET,
} from "@/lib/supabase-admin";

/* =========================================================
   NACHTKRONE — UPLOAD IMAGES PRODUITS
   app/api/admin/products/upload/route.ts

   Stockage :
   Supabase Storage → bucket "products"

   Sécurité :
   - Session admin obligatoire
   - 16 images maximum par requête
   - 8 Mo maximum par image
   - JPEG / PNG / WEBP / AVIF uniquement
   - Noms générés côté serveur
   - Nettoyage automatique si l'upload échoue
   ========================================================= */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const MAX_FILES_PER_REQUEST = 16;

const MAX_FILE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map<
  string,
  string
>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

/* =========================================================
   TYPES
   ========================================================= */

type UploadedImage = {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
};

/* =========================================================
   RÉPONSES
   ========================================================= */

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  });
}

function errorResponse(
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return jsonResponse(
    {
      success: false,
      message,
      ...(details ?? {}),
    },
    status
  );
}

/* =========================================================
   AUTHENTIFICATION ADMIN
   ========================================================= */

async function authenticateAdmin(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      ADMIN_SESSION_COOKIE
    )?.value ?? null;

  return verifyAdminSessionToken(
    token
  );
}

/* =========================================================
   VALIDATION DU FICHIER
   ========================================================= */

function validateFile(
  file: File,
  index: number
): string | null {
  const displayNumber =
    index + 1;

  if (!file.name) {
    return `Le fichier ${displayNumber} n'a pas de nom valide.`;
  }

  if (file.size <= 0) {
    return `L'image ${displayNumber} est vide.`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `L'image "${file.name}" dépasse la taille maximale de 8 Mo.`;
  }

  if (
    !ALLOWED_IMAGE_TYPES.has(
      file.type
    )
  ) {
    return `Le format de "${file.name}" n'est pas autorisé. Formats acceptés : JPEG, PNG, WEBP et AVIF.`;
  }

  return null;
}

/* =========================================================
   NOM / CHEMIN SUPABASE
   ========================================================= */

function createStoragePath(
  extension: string
) {
  /*
   * Exemple :
   *
   * catalog/2026/10/
   * 1728130000000-uuid.webp
   *
   * Le produit n'existe pas forcément encore au moment
   * de l'upload, donc on ne dépend pas d'un productId.
   */

  const now = new Date();

  const year =
    now.getUTCFullYear();

  const month = String(
    now.getUTCMonth() + 1
  ).padStart(2, "0");

  const filename =
    `${Date.now()}-${randomUUID()}.${extension}`;

  return {
    filename,
    path: `catalog/${year}/${month}/${filename}`,
  };
}

/* =========================================================
   SUPPRESSION EN CAS D'ÉCHEC
   ========================================================= */

async function cleanupUploadedFiles(
  paths: string[]
) {
  if (paths.length === 0) {
    return;
  }

  try {
    const storage =
      getProductStorage();

    const { error } =
      await storage.remove(paths);

    if (error) {
      console.error(
        "[NACHTKRONE][PRODUCT_UPLOAD][CLEANUP]",
        error.message
      );
    }
  } catch (error) {
    console.error(
      "[NACHTKRONE][PRODUCT_UPLOAD][CLEANUP]",
      error instanceof Error
        ? error.message
        : error
    );
  }
}

/* =========================================================
   POST
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  /* -------------------------------------------------------
     1. AUTHENTIFICATION
     ------------------------------------------------------- */

  const session =
    await authenticateAdmin(
      request
    );

  if (!session) {
    return errorResponse(
      "Session administrateur invalide ou expirée.",
      401
    );
  }

  /* -------------------------------------------------------
     2. CONFIGURATION SUPABASE
     ------------------------------------------------------- */

  try {
    assertSupabaseAdminConfigured();
  } catch (error) {
    console.error(
      "[NACHTKRONE][PRODUCT_UPLOAD][CONFIG]",
      error instanceof Error
        ? error.message
        : error
    );

    return errorResponse(
      "Le stockage des images n'est pas correctement configuré.",
      500
    );
  }

  /* -------------------------------------------------------
     3. CONTENT-TYPE
     ------------------------------------------------------- */

  const contentType =
    request.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType
      .toLowerCase()
      .includes(
        "multipart/form-data"
      )
  ) {
    return errorResponse(
      "Le contenu de la requête doit être de type multipart/form-data.",
      415
    );
  }

  /* -------------------------------------------------------
     4. LECTURE FORMDATA
     ------------------------------------------------------- */

  let formData: FormData;

  try {
    formData =
      await request.formData();
  } catch {
    return errorResponse(
      "Impossible de lire les images envoyées.",
      400
    );
  }

  /*
   * Notre page new/page.tsx envoie :
   *
   * formData.append("files", file)
   */

  const entries =
    formData.getAll("files");

  const files =
    entries.filter(
      (
        value
      ): value is File =>
        value instanceof File
    );

  if (files.length === 0) {
    return errorResponse(
      "Aucune image n'a été envoyée.",
      400
    );
  }

  if (
    entries.length !==
    files.length
  ) {
    return errorResponse(
      "La requête contient un fichier invalide.",
      400
    );
  }

  if (
    files.length >
    MAX_FILES_PER_REQUEST
  ) {
    return errorResponse(
      `Vous pouvez envoyer au maximum ${MAX_FILES_PER_REQUEST} images par produit.`,
      400
    );
  }

  /* -------------------------------------------------------
     5. VALIDATION DE TOUTES LES IMAGES AVANT UPLOAD
     ------------------------------------------------------- */

  for (
    let index = 0;
    index < files.length;
    index += 1
  ) {
    const validationError =
      validateFile(
        files[index],
        index
      );

    if (validationError) {
      return errorResponse(
        validationError,
        400
      );
    }
  }

  /* -------------------------------------------------------
     6. UPLOAD SUPABASE
     ------------------------------------------------------- */

  const storage =
    getProductStorage();

  const uploadedImages:
    UploadedImage[] = [];

  const uploadedPaths:
    string[] = [];

  try {
    /*
     * Upload séquentiel volontaire :
     *
     * - comportement prévisible ;
     * - nettoyage simple ;
     * - évite de lancer 16 gros uploads simultanément ;
     * - convient parfaitement à l'admin NACHTKRONE.
     */

    for (
      const file of files
    ) {
      const extension =
        ALLOWED_IMAGE_TYPES.get(
          file.type
        );

      if (!extension) {
        throw new Error(
          "Format d'image invalide."
        );
      }

      const {
        filename,
        path,
      } = createStoragePath(
        extension
      );

      const arrayBuffer =
        await file.arrayBuffer();

      const buffer =
        Buffer.from(
          arrayBuffer
        );

      const {
        data,
        error,
      } =
        await storage.upload(
          path,
          buffer,
          {
            contentType:
              file.type,

            /*
             * Chaque chemin est unique.
             * On refuse donc tout écrasement.
             */

            upsert: false,

            /*
             * Les noms étant uniques,
             * les images peuvent être
             * mises en cache longtemps.
             */

            cacheControl:
              "31536000",
          }
        );

      if (error) {
        throw new Error(
          `Supabase Storage : ${error.message}`
        );
      }

      /*
       * data.path représente le chemin réellement
       * enregistré par Supabase.
       */

      const uploadedPath =
        data.path || path;

      uploadedPaths.push(
        uploadedPath
      );

      const publicUrl =
        getProductPublicUrl(
          uploadedPath
        );

      uploadedImages.push({
        url: publicUrl,
        path: uploadedPath,
        name: filename,
        size: file.size,
        type: file.type,
      });
    }

    /* -----------------------------------------------------
       7. SUCCÈS
       ----------------------------------------------------- */

    return jsonResponse(
      {
        success: true,

        message:
          files.length === 1
            ? "Image envoyée avec succès."
            : `${files.length} images envoyées avec succès.`,

        bucket:
          SUPABASE_PRODUCTS_BUCKET,

        count:
          uploadedImages.length,

        images:
          uploadedImages,
      },
      201
    );
  } catch (error) {
    /*
     * Si :
     *
     * image 1 → OK
     * image 2 → OK
     * image 3 → erreur
     *
     * on supprime automatiquement
     * image 1 et image 2.
     */

    await cleanupUploadedFiles(
      uploadedPaths
    );

    console.error(
      "[NACHTKRONE][PRODUCT_UPLOAD]",
      error instanceof Error
        ? error.message
        : error
    );

    return errorResponse(
      "Impossible d'enregistrer les images du produit. Aucun fichier partiellement envoyé n'a été conservé.",
      500
    );
  }
}

/* =========================================================
   MÉTHODES NON AUTORISÉES
   ========================================================= */

export async function GET() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}

export async function PUT() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}

export async function PATCH() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}

export async function DELETE() {
  return errorResponse(
    "Méthode non autorisée.",
    405
  );
}