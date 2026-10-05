import "server-only";

import bcrypt from "bcryptjs";
import {
  SignJWT,
  jwtVerify,
  type JWTPayload,
} from "jose";

/* =========================================================
   NACHTKRONE — AUTHENTIFICATION ADMIN
   lib/admin-auth.ts

   Authentification privée de l'administration.

   - Un seul administrateur
   - E-mail configuré dans .env
   - Mot de passe stocké avec bcrypt
   - Session JWT signée
   - Cookie HTTP-only
   - Session de 24 heures

   IMPORTANT :
   - Aucun mot de passe n'est stocké ici.
   - Aucun hash n'est écrit ici.
   - Aucun secret n'est envoyé au navigateur.
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

export const ADMIN_SESSION_COOKIE =
  "nachtkrone_admin_session";

export const ADMIN_SESSION_DURATION_SECONDS =
  60 * 60 * 24;

const ADMIN_SESSION_ISSUER =
  "nachtkrone";

const ADMIN_SESSION_AUDIENCE =
  "nachtkrone-admin";

/* =========================================================
   TYPES
   ========================================================= */

export type AdminSession = {
  email: string;
  role: "ADMIN";
  issuedAt?: number;
  expiresAt?: number;
};

type AdminJwtPayload =
  JWTPayload & {
    email: string;
    role: "ADMIN";
  };

/* =========================================================
   NORMALISATION E-MAIL
   ========================================================= */

export function normalizeAdminEmail(
  email: string
): string {
  return email
    .trim()
    .toLowerCase();
}

/* =========================================================
   VARIABLES D'ENVIRONNEMENT
   ========================================================= */

function getAdminEmail(): string {
  const value =
    process.env.ADMIN_EMAIL;

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      "ADMIN_EMAIL est introuvable dans le fichier .env."
    );
  }

  return normalizeAdminEmail(
    value
  );
}

function getAdminPasswordHash(): string {
  // Base64 contains no dollar signs, so Next.js cannot expand the bcrypt hash.
  const encoded = process.env.ADMIN_PASSWORD_HASH_BASE64?.trim();
  if (!encoded) {
    throw new Error("ADMIN_PASSWORD_HASH_BASE64 est introuvable dans la configuration.");
  }

  const decoded = Buffer.from(encoded, "base64");
  const hash = decoded.toString("utf8");
  if (
    decoded.toString("base64") !== encoded ||
    !/^\$2[aby]\$(0[4-9]|[12][0-9]|3[01])\$[./A-Za-z0-9]{53}$/.test(hash)
  ) {
    throw new Error("ADMIN_PASSWORD_HASH_BASE64 est invalide.");
  }
  return hash;
}

function getAuthSecret(): Uint8Array {
  const value =
    process.env.AUTH_SECRET;

  if (
    typeof value !== "string" ||
    !value
  ) {
    throw new Error(
      "AUTH_SECRET est introuvable dans le fichier .env."
    );
  }

  /*
   * AUTH_SECRET est une valeur cryptographique.
   * On conserve exactement sa valeur.
   */

  if (value.length < 32) {
    throw new Error(
      "AUTH_SECRET doit contenir au minimum 32 caractères."
    );
  }

  return new TextEncoder().encode(
    value
  );
}

/* =========================================================
   VALIDATION DE LA CONFIGURATION
   ========================================================= */

export function assertAdminAuthConfigured(): void {
  getAdminEmail();
  getAdminPasswordHash();
  getAuthSecret();
}

/* =========================================================
   VÉRIFICATION DES IDENTIFIANTS
   ========================================================= */

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  /*
   * Vérification défensive des paramètres.
   */

  if (
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return false;
  }

  const normalizedEmail =
    normalizeAdminEmail(email);

  /*
   * Champs obligatoires.
   *
   * Le mot de passe n'est PAS trim().
   * Il doit être comparé exactement à celui
   * qui a servi à produire le hash.
   */

  if (
    !normalizedEmail ||
    !password
  ) {
    return false;
  }

  /*
   * Limites raisonnables.
   */

  if (
    normalizedEmail.length > 254 ||
    password.length > 256
  ) {
    return false;
  }

  const configuredEmail =
    getAdminEmail();

  /*
   * Vérification de l'e-mail administrateur.
   */

  if (
    normalizedEmail !==
    configuredEmail
  ) {
    return false;
  }

  /*
   * Récupération du hash exact stocké dans .env.
   */

  const passwordHash =
    getAdminPasswordHash();

  try {
    /*
     * bcrypt.compare() reçoit :
     *
     * 1. le mot de passe reçu du formulaire ;
     * 2. le hash décodé depuis ADMIN_PASSWORD_HASH_BASE64.
     *
     * Aucun nouveau hash n'est généré pendant
     * la connexion.
     */

    return await bcrypt.compare(
      password,
      passwordHash
    );
  } catch (error) {
    /*
     * On ne journalise jamais :
     * - le mot de passe ;
     * - le hash ;
     * - AUTH_SECRET.
     */

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.error(
        "[NACHTKRONE][AUTH] Erreur bcrypt :",
        error instanceof Error
          ? error.message
          : "Erreur inconnue."
      );
    }

    return false;
  }
}

/* =========================================================
   CRÉATION DU TOKEN DE SESSION
   ========================================================= */

export async function createAdminSessionToken(
  email: string
): Promise<string> {
  const normalizedEmail =
    normalizeAdminEmail(email);

  const configuredEmail =
    getAdminEmail();

  if (
    normalizedEmail !==
    configuredEmail
  ) {
    throw new Error(
      "Adresse e-mail administrateur invalide."
    );
  }

  const secret =
    getAuthSecret();

  return new SignJWT({
    email: normalizedEmail,
    role: "ADMIN",
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuer(
      ADMIN_SESSION_ISSUER
    )
    .setAudience(
      ADMIN_SESSION_AUDIENCE
    )
    .setSubject(
      normalizedEmail
    )
    .setIssuedAt()
    .setExpirationTime(
      `${ADMIN_SESSION_DURATION_SECONDS}s`
    )
    .sign(secret);
}

/* =========================================================
   VÉRIFICATION DU TOKEN DE SESSION
   ========================================================= */

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<AdminSession | null> {
  if (
    typeof token !== "string" ||
    !token
  ) {
    return null;
  }

  try {
    const { payload } =
      await jwtVerify<AdminJwtPayload>(
        token,
        getAuthSecret(),
        {
          algorithms: [
            "HS256",
          ],

          issuer:
            ADMIN_SESSION_ISSUER,

          audience:
            ADMIN_SESSION_AUDIENCE,
        }
      );

    /*
     * Vérification du contenu du JWT.
     */

    if (
      typeof payload.email !==
        "string" ||
      payload.role !== "ADMIN"
    ) {
      return null;
    }

    const normalizedEmail =
      normalizeAdminEmail(
        payload.email
      );

    /*
     * Le JWT doit appartenir à l'administrateur
     * actuellement configuré dans .env.
     */

    if (
      normalizedEmail !==
      getAdminEmail()
    ) {
      return null;
    }

    return {
      email:
        normalizedEmail,

      role:
        "ADMIN",

      issuedAt:
        payload.iat,

      expiresAt:
        payload.exp,
    };
  } catch {
    /*
     * Token :
     * - expiré ;
     * - falsifié ;
     * - invalide ;
     * - signé avec un autre secret ;
     * - mauvais issuer/audience.
     */

    return null;
  }
}

/* =========================================================
   COOKIE DE SESSION
   ========================================================= */

export function getAdminSessionCookieOptions() {
  return {
    name:
      ADMIN_SESSION_COOKIE,

    httpOnly:
      true,

    secure:
      process.env.NODE_ENV ===
      "production",

    sameSite:
      "lax" as const,

    path:
      "/",

    maxAge:
      ADMIN_SESSION_DURATION_SECONDS,
  };
}

/* =========================================================
   SUPPRESSION DU COOKIE
   ========================================================= */

export function getAdminSessionDeleteCookieOptions() {
  return {
    name:
      ADMIN_SESSION_COOKIE,

    value:
      "",

    httpOnly:
      true,

    secure:
      process.env.NODE_ENV ===
      "production",

    sameSite:
      "lax" as const,

    path:
      "/",

    maxAge:
      0,
  };
}