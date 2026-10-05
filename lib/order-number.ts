/* =========================================================
   NACHTKRONE — ORDER NUMBER
   lib/order-number.ts

   Génération des numéros publics de commande.

   Exemple :

   NK-20261005-143052-A7K4P2

   Structure :

   NK
   │
   ├── 20261005 = date UTC
   ├── 143052   = heure UTC
   └── A7K4P2   = suffixe aléatoire cryptographique

   IMPORTANT :

   - Ce numéro n'est PAS l'identifiant Prisma.
   - Order.id reste l'identifiant technique interne.
   - Order.orderNumber est le numéro communiqué :
     • au client
     • dans l'e-mail administrateur
     • dans l'e-mail client
     • dans le PDF de confirmation

   - La contrainte Prisma @unique sur orderNumber reste
     l'autorité finale contre les collisions.
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

export const ORDER_NUMBER_PREFIX =
  "NK" as const;

/*
 * Alphabet volontairement sans :
 *
 * O
 * 0
 * I
 * 1
 *
 * afin d'éviter les confusions visuelles dans les
 * e-mails, PDF ou échanges avec le client.
 */

const ORDER_RANDOM_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ORDER_RANDOM_LENGTH = 6;

/* =========================================================
   TYPES
   ========================================================= */

export type OrderNumber =
  `${typeof ORDER_NUMBER_PREFIX}-${string}`;

/* =========================================================
   PADDING
   ========================================================= */

function padTwoDigits(
  value: number
): string {
  return String(value).padStart(
    2,
    "0"
  );
}

/* =========================================================
   DATE UTC

   Utilisation d'UTC pour que le format du numéro ne
   dépende pas du fuseau horaire de la machine qui exécute
   Next.js.

   Exemple :
   2026-10-05
   devient :
   20261005
   ========================================================= */

function formatOrderDate(
  date: Date
): string {
  const year =
    date.getUTCFullYear();

  const month =
    padTwoDigits(
      date.getUTCMonth() + 1
    );

  const day =
    padTwoDigits(
      date.getUTCDate()
    );

  return `${year}${month}${day}`;
}

/* =========================================================
   HEURE UTC

   Exemple :
   14:30:52
   devient :
   143052
   ========================================================= */

function formatOrderTime(
  date: Date
): string {
  const hours =
    padTwoDigits(
      date.getUTCHours()
    );

  const minutes =
    padTwoDigits(
      date.getUTCMinutes()
    );

  const seconds =
    padTwoDigits(
      date.getUTCSeconds()
    );

  return `${hours}${minutes}${seconds}`;
}

/* =========================================================
   OCTETS ALÉATOIRES

   crypto.getRandomValues est disponible dans les runtimes
   modernes utilisés par Next.js.

   Aucun Math.random() n'est utilisé pour générer le numéro.
   ========================================================= */

function getSecureRandomBytes(
  length: number
): Uint8Array {
  if (
    typeof globalThis.crypto ===
      "undefined" ||
    typeof globalThis.crypto
      .getRandomValues !== "function"
  ) {
    throw new Error(
      "Secure random number generation is not available."
    );
  }

  const bytes =
    new Uint8Array(length);

  globalThis.crypto.getRandomValues(
    bytes
  );

  return bytes;
}

/* =========================================================
   SUFFIXE ALÉATOIRE

   Rejection sampling :

   On évite le simple :
   byte % alphabet.length

   car 256 n'est pas nécessairement divisible exactement
   par la taille de l'alphabet.

   Cette méthode évite donc un biais inutile dans la
   distribution des caractères.
   ========================================================= */

function generateRandomSuffix(
  length = ORDER_RANDOM_LENGTH
): string {
  if (
    !Number.isInteger(length) ||
    length < 1 ||
    length > 32
  ) {
    throw new Error(
      "Invalid order number random suffix length."
    );
  }

  const alphabetLength =
    ORDER_RANDOM_ALPHABET.length;

  const maxValidByte =
    Math.floor(
      256 / alphabetLength
    ) *
      alphabetLength -
    1;

  let result = "";

  while (
    result.length < length
  ) {
    /*
     * On génère quelques octets supplémentaires pour
     * réduire le nombre de tours de boucle en cas de rejet.
     */

    const remaining =
      length - result.length;

    const bytes =
      getSecureRandomBytes(
        Math.max(
          remaining * 2,
          8
        )
      );

    for (const byte of bytes) {
      if (
        byte > maxValidByte
      ) {
        continue;
      }

      result +=
        ORDER_RANDOM_ALPHABET[
          byte %
            alphabetLength
        ];

      if (
        result.length === length
      ) {
        break;
      }
    }
  }

  return result;
}

/* =========================================================
   GÉNÉRATION DU NUMÉRO DE COMMANDE

   Exemple :

   NK-20261005-143052-A7K4P2

   Ce numéro est approprié pour :
   - Order.orderNumber
   - e-mail administrateur
   - confirmation client
   - PDF
   - recherche d'une commande dans l'administration

   La contrainte @unique de Prisma reste la garantie
   définitive contre une éventuelle collision.
   ========================================================= */

export function generateOrderNumber(
  date: Date = new Date()
): OrderNumber {
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid date for order number generation."
    );
  }

  const datePart =
    formatOrderDate(date);

  const timePart =
    formatOrderTime(date);

  const randomPart =
    generateRandomSuffix();

  return `${ORDER_NUMBER_PREFIX}-${datePart}-${timePart}-${randomPart}`;
}

/* =========================================================
   VALIDATION DU FORMAT

   Cette fonction vérifie uniquement le FORMAT.

   Elle ne vérifie pas si la commande existe réellement
   dans Prisma.
   ========================================================= */

export function isOrderNumber(
  value: unknown
): value is OrderNumber {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  const normalized =
    value.trim();

  /*
   * Format attendu :
   *
   * NK-
   * 8 chiffres date
   * -
   * 6 chiffres heure
   * -
   * 6 caractères issus de notre alphabet
   */

  return /^NK-\d{8}-\d{6}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(
    normalized
  );
}

/* =========================================================
   NORMALISATION

   Utile lorsqu'un numéro provient :
   - d'un champ de recherche admin
   - d'un e-mail
   - d'un paramètre d'URL

   Exemple :

   " nk-20261005-143052-a7k4p2 "

   devient :

   "NK-20261005-143052-A7K4P2"
   ========================================================= */

export function normalizeOrderNumber(
  value: unknown
): OrderNumber | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  if (
    !isOrderNumber(
      normalized
    )
  ) {
    return null;
  }

  return normalized;
}

/* =========================================================
   NUMÉRO DE DOCUMENT DE CONFIRMATION

   Ton schéma Prisma contient :

   confirmationDocumentNumber String? @unique

   Le PDF n'est PAS un reçu de paiement.

   Son numéro est donc basé sur la commande :

   Exemple :

   BEST-NK-20261005-143052-A7K4P2

   BEST = Bestellbestätigung
   ========================================================= */

export type ConfirmationDocumentNumber =
  `BEST-${OrderNumber}`;

export function createConfirmationDocumentNumber(
  orderNumber: string
): ConfirmationDocumentNumber {
  if (
    !isOrderNumber(
      orderNumber
    )
  ) {
    throw new Error(
      "Invalid order number."
    );
  }

  return `BEST-${orderNumber}`;
}

/* =========================================================
   VALIDATION NUMÉRO DOCUMENT
   ========================================================= */

export function isConfirmationDocumentNumber(
  value: unknown
): value is ConfirmationDocumentNumber {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  if (
    !normalized.startsWith(
      "BEST-"
    )
  ) {
    return false;
  }

  const orderNumber =
    normalized.slice(
      "BEST-".length
    );

  return isOrderNumber(
    orderNumber
  );
}

/* =========================================================
   EXTRACTION DU NUMÉRO DE COMMANDE DEPUIS UN DOCUMENT

   BEST-NK-20261005-143052-A7K4P2

   devient :

   NK-20261005-143052-A7K4P2
   ========================================================= */

export function getOrderNumberFromConfirmationDocument(
  value: unknown
): OrderNumber | null {
  if (
    !isConfirmationDocumentNumber(
      value
    )
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  const orderNumber =
    normalized.slice(
      "BEST-".length
    );

  return normalizeOrderNumber(
    orderNumber
  );
}