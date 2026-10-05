import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

/* =========================================================
   NACHTKRONE — SUPABASE ADMIN
   lib/supabase-admin.ts

   Client Supabase exclusivement côté serveur.

   Utilisations :
   - Supabase Storage
   - Upload des images produits
   - Suppression des images
   - Génération des URLs publiques
   - Opérations serveur nécessitant la clé secrète

   IMPORTANT :
   - Ne jamais importer ce fichier dans un composant "use client".
   - Ne jamais exposer SUPABASE_SECRET_KEY au navigateur.
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

export const SUPABASE_PRODUCTS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
  "products";

/* =========================================================
   VARIABLES D'ENVIRONNEMENT
   ========================================================= */

/**
 * Retourne l'URL serveur du projet Supabase.
 */
function getSupabaseUrl(): string {
  const value =
    process.env.SUPABASE_URL?.trim();

  if (!value) {
    throw new Error(
      "SUPABASE_URL est introuvable dans le fichier .env."
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "SUPABASE_URL n'est pas une URL valide."
    );
  }

  const isHttps =
    url.protocol === "https:";

  const isLocalhost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1";

  if (!isHttps && !isLocalhost) {
    throw new Error(
      "SUPABASE_URL doit utiliser HTTPS."
    );
  }

  /*
   * Supprime les éventuels "/" placés
   * à la fin de l'URL.
   *
   * Exemple :
   * https://example.supabase.co/
   *
   * devient :
   * https://example.supabase.co
   */

  return value.replace(/\/+$/, "");
}

/**
 * Retourne la clé secrète Supabase utilisée
 * exclusivement côté serveur.
 *
 * Cette clé ne doit jamais être :
 * - envoyée au navigateur ;
 * - utilisée avec NEXT_PUBLIC_;
 * - affichée dans les logs ;
 * - envoyée dans une réponse API.
 */
function getSupabaseSecretKey(): string {
  const value =
    process.env.SUPABASE_SECRET_KEY?.trim();

  if (!value) {
    throw new Error(
      "SUPABASE_SECRET_KEY est introuvable dans le fichier .env."
    );
  }

  return value;
}

/* =========================================================
   CRÉATION DU CLIENT SUPABASE ADMIN
   ========================================================= */

/**
 * Crée le client Supabase privilégié de NACHTKRONE.
 *
 * Ce client est réservé au serveur Next.js.
 */
function createSupabaseAdminClient(): SupabaseClient {
  return createClient(
    getSupabaseUrl(),
    getSupabaseSecretKey(),
    {
      auth: {
        /*
         * Il s'agit d'un client serveur.
         *
         * Nous ne voulons donc :
         * - aucune session persistante ;
         * - aucun rafraîchissement automatique ;
         * - aucune détection de session dans l'URL.
         */

        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },

      global: {
        headers: {
          "X-Client-Info":
            "nachtkrone-server",
        },
      },
    }
  );
}

/* =========================================================
   INSTANCE UNIQUE
   ========================================================= */

/*
 * En développement, Next.js peut recharger les modules
 * plusieurs fois.
 *
 * On conserve donc le client dans globalThis afin d'éviter
 * de recréer inutilement plusieurs instances.
 */

const globalForSupabase =
  globalThis as unknown as {
    nachtkroneSupabaseAdmin:
      | SupabaseClient
      | undefined;
  };

export const supabaseAdmin =
  globalForSupabase.nachtkroneSupabaseAdmin ??
  createSupabaseAdminClient();

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.nachtkroneSupabaseAdmin =
    supabaseAdmin;
}

/* =========================================================
   STORAGE — PRODUITS
   ========================================================= */

/**
 * Retourne le client Storage du bucket
 * contenant les images des produits NACHTKRONE.
 *
 * Exemple :
 *
 * const storage = getProductStorage();
 *
 * const { data, error } = await storage.upload(
 *   path,
 *   buffer
 * );
 */
export function getProductStorage() {
  return supabaseAdmin.storage.from(
    SUPABASE_PRODUCTS_BUCKET
  );
}

/* =========================================================
   URL PUBLIQUE D'UNE IMAGE
   ========================================================= */

/**
 * Génère l'URL publique d'un fichier déjà stocké
 * dans le bucket produits.
 *
 * Le bucket "products" doit être PUBLIC.
 *
 * Exemple de chemin :
 *
 * catalog/2026/10/image.webp
 */
export function getProductPublicUrl(
  path: string
): string {
  if (typeof path !== "string") {
    throw new Error(
      "Le chemin de l'image Supabase est invalide."
    );
  }

  /*
   * Nettoyage :
   *
   * "/catalog/image.webp"
   *
   * devient :
   *
   * "catalog/image.webp"
   */

  const cleanPath = path
    .trim()
    .replace(/^\/+/, "");

  if (!cleanPath) {
    throw new Error(
      "Le chemin de l'image Supabase est vide."
    );
  }

  const { data } =
    getProductStorage().getPublicUrl(
      cleanPath
    );

  if (
    !data ||
    !data.publicUrl
  ) {
    throw new Error(
      "Impossible de générer l'URL publique de l'image."
    );
  }

  return data.publicUrl;
}

/* =========================================================
   VALIDATION DE LA CONFIGURATION
   ========================================================= */

/**
 * Vérifie que les variables indispensables au client
 * Supabase Admin sont présentes.
 *
 * Cette fonction :
 * - ne fait aucune requête réseau ;
 * - ne révèle aucune clé ;
 * - échoue immédiatement si la configuration manque.
 */
export function assertSupabaseAdminConfigured(): void {
  getSupabaseUrl();
  getSupabaseSecretKey();

  if (
    !SUPABASE_PRODUCTS_BUCKET.trim()
  ) {
    throw new Error(
      "SUPABASE_STORAGE_BUCKET est introuvable."
    );
  }
}

/* =========================================================
   EXPORT PAR DÉFAUT
   ========================================================= */

export default supabaseAdmin;