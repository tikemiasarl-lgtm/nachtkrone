import {
  CHECKOUT_COUNTRIES,
  CHECKOUT_LIMITS,
  type CheckoutBillingAddress,
  type CheckoutContactData,
  type CheckoutCountryCode,
  type CheckoutFieldErrors,
  type CheckoutOrderItemInput,
  type CheckoutShippingAddress,
  type CreateOrderInput,
  isCheckoutCountryCode,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — ORDER VALIDATION
   lib/order-validation.ts

   Validation serveur des données reçues lors de
   l'envoi d'une commande.

   RESPONSABILITÉS :

   - vérifier la structure JSON reçue
   - nettoyer les chaînes
   - valider prénom / nom
   - valider l'e-mail
   - valider le téléphone
   - valider les pays autorisés
   - valider l'adresse de livraison
   - valider l'adresse de facturation
   - valider les produits
   - valider les quantités
   - empêcher les doublons de produits
   - appliquer les limites du checkout

   IMPORTANT :

   Ce fichier ne valide volontairement AUCUN prix.

   Le navigateur ne décide jamais :
   - du prix unitaire
   - du prix promotionnel
   - du sous-total
   - du coût de livraison
   - du total

   Ces montants devront être calculés côté serveur
   depuis les données Prisma.
   ========================================================= */

/* =========================================================
   TYPES INTERNES
   ========================================================= */

type UnknownRecord = Record<
  string,
  unknown
>;

export type OrderValidationSuccess = {
  success: true;

  data: CreateOrderInput;
};

export type OrderValidationFailure = {
  success: false;

  errors: CheckoutFieldErrors;
};

export type OrderValidationResult =
  | OrderValidationSuccess
  | OrderValidationFailure;

/* =========================================================
   HELPERS GÉNÉRAUX
   ========================================================= */

function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeString(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/* =========================================================
   NETTOYAGE TEXTE SIMPLE

   Supprime les caractères de contrôle invisibles qui
   n'ont rien à faire dans les données d'une commande.

   Les caractères normaux internationaux restent autorisés :
   - ä
   - ö
   - ü
   - ß
   - accents
   - apostrophes
   - tirets
   etc.
   ========================================================= */

function sanitizeText(
  value: unknown
): string {
  return normalizeString(value)
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ""
    )
    .trim();
}

/* =========================================================
   BOOLÉEN
   ========================================================= */

function normalizeBoolean(
  value: unknown
): boolean {
  return value === true;
}

/* =========================================================
   EMAIL
   ========================================================= */

function normalizeEmail(
  value: unknown
): string {
  return sanitizeText(value)
    .toLowerCase();
}

function isValidEmail(
  email: string
): boolean {
  if (
    !email ||
    email.length >
      CHECKOUT_LIMITS.emailMaxLength
  ) {
    return false;
  }

  /*
   * Validation volontairement raisonnable.
   *
   * On ne tente pas de reproduire toute la RFC des
   * adresses e-mail avec une regex extrêmement complexe.
   */

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/* =========================================================
   TÉLÉPHONE
   ========================================================= */

function normalizeCallingCode(
  value: unknown
): string {
  const input =
    sanitizeText(value);

  if (!input) {
    return "";
  }

  const digits =
    input.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return `+${digits}`;
}

function normalizePhone(
  value: unknown
): string {
  return sanitizeText(value)
    .replace(
      /[^\d\s()+\-./]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function countPhoneDigits(
  value: string
): number {
  return (
    value.match(/\d/g) ?? []
  ).length;
}

function isAllowedCallingCode(
  callingCode: string
): boolean {
  return CHECKOUT_COUNTRIES.some(
    (country) =>
      country.callingCode ===
      callingCode
  );
}

function isValidPhone(
  phone: string
): boolean {
  if (
    !phone ||
    phone.length >
      CHECKOUT_LIMITS.phoneMaxLength
  ) {
    return false;
  }

  const digits =
    countPhoneDigits(phone);

  /*
   * Minimum raisonnable pour éviter des valeurs comme
   * "12" ou "123".
   *
   * La validation ne bloque pas les différents formats
   * nationaux des quatre pays pris en charge.
   */

  return (
    digits >= 5 &&
    digits <= 20
  );
}

/* =========================================================
   CODE PAYS
   ========================================================= */

function normalizeCountryCode(
  value: unknown
): CheckoutCountryCode | null {
  if (typeof value !== "string") {
    return null;
  }

  const code =
    value
      .trim()
      .toUpperCase();

  if (
    !isCheckoutCountryCode(code)
  ) {
    return null;
  }

  return code;
}

/* =========================================================
   NOM / PRÉNOM
   ========================================================= */

function isValidName(
  value: string,
  maxLength: number
): boolean {
  if (
    !value ||
    value.length > maxLength
  ) {
    return false;
  }

  /*
   * Au moins un caractère réellement visible.
   */

  return /[\p{L}\p{N}]/u.test(
    value
  );
}

/* =========================================================
   ADRESSE
   ========================================================= */

function isValidRequiredText(
  value: string,
  maxLength: number
): boolean {
  return (
    value.length > 0 &&
    value.length <= maxLength
  );
}

function isValidOptionalText(
  value: string,
  maxLength: number
): boolean {
  return (
    value.length === 0 ||
    value.length <= maxLength
  );
}

/* =========================================================
   CODE POSTAL

   Les formats sont différents entre :
   - Allemagne
   - Suisse
   - Italie
   - Liechtenstein

   On applique une validation adaptée au pays sans
   transformer arbitrairement la valeur du client.
   ========================================================= */

function isValidPostalCode(
  postalCode: string,
  countryCode: CheckoutCountryCode
): boolean {
  if (
    !postalCode ||
    postalCode.length >
      CHECKOUT_LIMITS.postalCodeMaxLength
  ) {
    return false;
  }

  switch (countryCode) {
    case "DE":
      return /^\d{5}$/.test(
        postalCode
      );

    case "AT":
    case "CH":
      return /^\d{4}$/.test(
        postalCode
      );

    case "IT":
      return /^\d{5}$/.test(
        postalCode
      );

    case "LI":
      return /^\d{4}$/.test(
        postalCode
      );

    default:
      return false;
  }
}

/* =========================================================
   QUANTITÉ
   ========================================================= */

function normalizeInteger(
  value: unknown
): number | null {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return null;
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return null;
  }

  const numeric =
    Number(value);

  if (
    !Number.isFinite(numeric) ||
    !Number.isInteger(numeric)
  ) {
    return null;
  }

  return numeric;
}

function isValidQuantity(
  quantity: number
): boolean {
  return (
    quantity >= 1 &&
    quantity <=
      CHECKOUT_LIMITS.maxQuantityPerItem
  );
}

/* =========================================================
   VALIDATION CONTACT
   ========================================================= */

function validateContact(
  value: unknown,
  errors: CheckoutFieldErrors
): CheckoutContactData | null {
  if (!isRecord(value)) {
    errors.form =
      "Die Kontaktdaten sind ungültig.";

    return null;
  }

  const firstName =
    sanitizeText(
      value.firstName
    );

  const lastName =
    sanitizeText(
      value.lastName
    );

  const email =
    normalizeEmail(
      value.email
    );

  const phoneCountryCode =
    normalizeCallingCode(
      value.phoneCountryCode
    );

  const phone =
    normalizePhone(
      value.phone
    );

  /* -------------------------------------------------------
     PRÉNOM
     ------------------------------------------------------- */

  if (
    !isValidName(
      firstName,
      CHECKOUT_LIMITS
        .firstNameMaxLength
    )
  ) {
    errors.firstName =
      "Bitte geben Sie Ihren Vornamen ein.";
  }

  /* -------------------------------------------------------
     NOM
     ------------------------------------------------------- */

  if (
    !isValidName(
      lastName,
      CHECKOUT_LIMITS
        .lastNameMaxLength
    )
  ) {
    errors.lastName =
      "Bitte geben Sie Ihren Nachnamen ein.";
  }

  /* -------------------------------------------------------
     EMAIL
     ------------------------------------------------------- */

  if (!email) {
    errors.email =
      "Bitte geben Sie Ihre E-Mail-Adresse ein.";
  } else if (
    !isValidEmail(email)
  ) {
    errors.email =
      "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  }

  /* -------------------------------------------------------
     INDICATIF
     ------------------------------------------------------- */

  if (!phoneCountryCode) {
    errors.phoneCountryCode =
      "Bitte wählen Sie eine Vorwahl.";
  } else if (
    !isAllowedCallingCode(
      phoneCountryCode
    )
  ) {
    errors.phoneCountryCode =
      "Diese Telefonvorwahl wird nicht unterstützt.";
  }

  /* -------------------------------------------------------
     TÉLÉPHONE
     ------------------------------------------------------- */

  if (!phone) {
    errors.phone =
      "Bitte geben Sie Ihre Telefonnummer ein.";
  } else if (
    !isValidPhone(phone)
  ) {
    errors.phone =
      "Bitte geben Sie eine gültige Telefonnummer ein.";
  }

  if (
    errors.firstName ||
    errors.lastName ||
    errors.email ||
    errors.phoneCountryCode ||
    errors.phone
  ) {
    return null;
  }

  return {
    firstName,
    lastName,
    email,
    phoneCountryCode,
    phone,
  };
}

/* =========================================================
   VALIDATION ADRESSE DE LIVRAISON
   ========================================================= */

function validateShippingAddress(
  value: unknown,
  errors: CheckoutFieldErrors
): CheckoutShippingAddress | null {
  if (!isRecord(value)) {
    errors.form =
      "Die Lieferadresse ist ungültig.";

    return null;
  }

  const countryCode =
    normalizeCountryCode(
      value.countryCode
    );

  const address =
    sanitizeText(
      value.address
    );

  const address2 =
    sanitizeText(
      value.address2
    );

  const postalCode =
    sanitizeText(
      value.postalCode
    );

  const city =
    sanitizeText(
      value.city
    );

  const state =
    sanitizeText(
      value.state
    );

  /* -------------------------------------------------------
     PAYS
     ------------------------------------------------------- */

  if (!countryCode) {
    errors.shippingCountryCode =
      "Bitte wählen Sie ein gültiges Lieferland.";
  }

  /* -------------------------------------------------------
     RUE + NUMÉRO
     ------------------------------------------------------- */

  if (
    !isValidRequiredText(
      address,
      CHECKOUT_LIMITS
        .addressMaxLength
    )
  ) {
    errors.shippingAddress =
      "Bitte geben Sie Straße und Hausnummer ein.";
  }

  /* -------------------------------------------------------
     COMPLÉMENT
     ------------------------------------------------------- */

  if (
    !isValidOptionalText(
      address2,
      CHECKOUT_LIMITS
        .address2MaxLength
    )
  ) {
    errors.shippingAddress2 =
      "Der Adresszusatz ist zu lang.";
  }

  /* -------------------------------------------------------
     CODE POSTAL
     ------------------------------------------------------- */

  if (!postalCode) {
    errors.shippingPostalCode =
      "Bitte geben Sie Ihre Postleitzahl ein.";
  } else if (
    countryCode &&
    !isValidPostalCode(
      postalCode,
      countryCode
    )
  ) {
    errors.shippingPostalCode =
      "Bitte geben Sie eine gültige Postleitzahl ein.";
  }

  /* -------------------------------------------------------
     VILLE
     ------------------------------------------------------- */

  if (
    !isValidRequiredText(
      city,
      CHECKOUT_LIMITS
        .cityMaxLength
    )
  ) {
    errors.shippingCity =
      "Bitte geben Sie Ihren Ort ein.";
  }

  /* -------------------------------------------------------
     RÉGION
     ------------------------------------------------------- */

  if (
    !isValidOptionalText(
      state,
      CHECKOUT_LIMITS
        .stateMaxLength
    )
  ) {
    errors.shippingState =
      "Die Region ist zu lang.";
  }

  if (
    !countryCode ||
    errors.shippingCountryCode ||
    errors.shippingAddress ||
    errors.shippingAddress2 ||
    errors.shippingPostalCode ||
    errors.shippingCity ||
    errors.shippingState
  ) {
    return null;
  }

  return {
    countryCode,
    address,
    address2,
    postalCode,
    city,
    state,
  };
}

/* =========================================================
   VALIDATION ADRESSE DE FACTURATION
   ========================================================= */

function validateBillingAddress(
  value: unknown,
  errors: CheckoutFieldErrors
): CheckoutBillingAddress | null {
  if (!isRecord(value)) {
    errors.form =
      "Die Rechnungsadresse ist ungültig.";

    return null;
  }

  const firstName =
    sanitizeText(
      value.firstName
    );

  const lastName =
    sanitizeText(
      value.lastName
    );

  const countryCode =
    normalizeCountryCode(
      value.countryCode
    );

  const address =
    sanitizeText(
      value.address
    );

  const address2 =
    sanitizeText(
      value.address2
    );

  const postalCode =
    sanitizeText(
      value.postalCode
    );

  const city =
    sanitizeText(
      value.city
    );

  const state =
    sanitizeText(
      value.state
    );

  /* -------------------------------------------------------
     PRÉNOM
     ------------------------------------------------------- */

  if (
    !isValidName(
      firstName,
      CHECKOUT_LIMITS
        .firstNameMaxLength
    )
  ) {
    errors.billingFirstName =
      "Bitte geben Sie den Vornamen für die Rechnungsadresse ein.";
  }

  /* -------------------------------------------------------
     NOM
     ------------------------------------------------------- */

  if (
    !isValidName(
      lastName,
      CHECKOUT_LIMITS
        .lastNameMaxLength
    )
  ) {
    errors.billingLastName =
      "Bitte geben Sie den Nachnamen für die Rechnungsadresse ein.";
  }

  /* -------------------------------------------------------
     PAYS
     ------------------------------------------------------- */

  if (!countryCode) {
    errors.billingCountryCode =
      "Bitte wählen Sie ein gültiges Rechnungsland.";
  }

  /* -------------------------------------------------------
     ADRESSE
     ------------------------------------------------------- */

  if (
    !isValidRequiredText(
      address,
      CHECKOUT_LIMITS
        .addressMaxLength
    )
  ) {
    errors.billingAddress =
      "Bitte geben Sie Straße und Hausnummer ein.";
  }

  /* -------------------------------------------------------
     COMPLÉMENT
     ------------------------------------------------------- */

  if (
    !isValidOptionalText(
      address2,
      CHECKOUT_LIMITS
        .address2MaxLength
    )
  ) {
    errors.billingAddress2 =
      "Der Adresszusatz ist zu lang.";
  }

  /* -------------------------------------------------------
     CODE POSTAL
     ------------------------------------------------------- */

  if (!postalCode) {
    errors.billingPostalCode =
      "Bitte geben Sie die Postleitzahl ein.";
  } else if (
    countryCode &&
    !isValidPostalCode(
      postalCode,
      countryCode
    )
  ) {
    errors.billingPostalCode =
      "Bitte geben Sie eine gültige Postleitzahl ein.";
  }

  /* -------------------------------------------------------
     VILLE
     ------------------------------------------------------- */

  if (
    !isValidRequiredText(
      city,
      CHECKOUT_LIMITS
        .cityMaxLength
    )
  ) {
    errors.billingCity =
      "Bitte geben Sie den Ort ein.";
  }

  /* -------------------------------------------------------
     RÉGION
     ------------------------------------------------------- */

  if (
    !isValidOptionalText(
      state,
      CHECKOUT_LIMITS
        .stateMaxLength
    )
  ) {
    errors.billingState =
      "Die Region ist zu lang.";
  }

  if (
    !countryCode ||
    errors.billingFirstName ||
    errors.billingLastName ||
    errors.billingCountryCode ||
    errors.billingAddress ||
    errors.billingAddress2 ||
    errors.billingPostalCode ||
    errors.billingCity ||
    errors.billingState
  ) {
    return null;
  }

  return {
    firstName,
    lastName,
    countryCode,
    address,
    address2,
    postalCode,
    city,
    state,
  };
}

/* =========================================================
   VALIDATION DES ARTICLES
   ========================================================= */

function validateItems(
  value: unknown,
  errors: CheckoutFieldErrors
): CheckoutOrderItemInput[] | null {
  if (!Array.isArray(value)) {
    errors.items =
      "Der Warenkorb ist ungültig.";

    return null;
  }

  if (value.length === 0) {
    errors.items =
      "Ihr Warenkorb ist leer.";

    return null;
  }

  if (
    value.length >
    CHECKOUT_LIMITS
      .maxDifferentProductsPerOrder
  ) {
    errors.items =
      "Der Warenkorb enthält zu viele verschiedene Produkte.";

    return null;
  }

  const result:
    CheckoutOrderItemInput[] = [];

  const productIds =
    new Set<string>();

  for (const rawItem of value) {
    if (!isRecord(rawItem)) {
      errors.items =
        "Ein Artikel im Warenkorb ist ungültig.";

      return null;
    }

    const productId =
      sanitizeText(
        rawItem.productId
      );

    const quantity =
      normalizeInteger(
        rawItem.quantity
      );

    if (!productId) {
      errors.items =
        "Ein Produkt im Warenkorb ist ungültig.";

      return null;
    }

    /*
     * Un produit ne doit apparaître qu'une fois.
     *
     * Le panier doit augmenter quantity au lieu
     * d'envoyer plusieurs lignes identiques.
     */

    if (
      productIds.has(productId)
    ) {
      errors.items =
        "Ein Produkt ist mehrfach im Warenkorb vorhanden.";

      return null;
    }

    if (
      quantity === null ||
      !isValidQuantity(quantity)
    ) {
      errors.items =
        `Die Menge muss zwischen 1 und ${CHECKOUT_LIMITS.maxQuantityPerItem} liegen.`;

      return null;
    }

    productIds.add(productId);

    result.push({
      productId,
      quantity,
    });
  }

  return result;
}

/* =========================================================
   NOTE CLIENT
   ========================================================= */

function validateCustomerNote(
  value: unknown,
  errors: CheckoutFieldErrors
): string {
  /*
   * Le champ est facultatif.
   */

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (typeof value !== "string") {
    errors.customerNote =
      "Die Bestellnotiz ist ungültig.";

    return "";
  }

  const note =
    sanitizeText(value);

  if (
    note.length >
    CHECKOUT_LIMITS
      .customerNoteMaxLength
  ) {
    errors.customerNote =
      "Die Bestellnotiz ist zu lang.";

    return "";
  }

  return note;
}

/* =========================================================
   VÉRIFICATION ERREURS
   ========================================================= */

function hasValidationErrors(
  errors: CheckoutFieldErrors
): boolean {
  return Object.values(
    errors
  ).some(
    (value) =>
      typeof value === "string" &&
      value.length > 0
  );
}

/* =========================================================
   VALIDATION PRINCIPALE

   C'est cette fonction que la future API :

   app/api/public/orders/route.ts

   appellera après :

   const body = await request.json();

   Exemple :

   const validation =
     validateCreateOrderInput(body);

   if (!validation.success) {
     ...
   }

   IMPORTANT :
   Une validation réussie signifie seulement que
   la structure de la requête est correcte.

   L'API devra ENCORE vérifier dans Prisma :
   - existence du produit
   - status === PUBLISHED
   - stock disponible
   - prix réel
   - prix promotionnel réel
   ========================================================= */

export function validateCreateOrderInput(
  input: unknown
): OrderValidationResult {
  const errors:
    CheckoutFieldErrors = {};

  /* -------------------------------------------------------
     OBJET PRINCIPAL
     ------------------------------------------------------- */

  if (!isRecord(input)) {
    return {
      success: false,

      errors: {
        form:
          "Die Bestelldaten sind ungültig.",
      },
    };
  }

  /* -------------------------------------------------------
     CONTACT
     ------------------------------------------------------- */

  const contact =
    validateContact(
      input.contact,
      errors
    );

  /* -------------------------------------------------------
     LIVRAISON
     ------------------------------------------------------- */

  const shippingAddress =
    validateShippingAddress(
      input.shippingAddress,
      errors
    );

  /* -------------------------------------------------------
     FACTURATION DIFFÉRENTE
     ------------------------------------------------------- */

  const hasDifferentBillingAddress =
    normalizeBoolean(
      input.hasDifferentBillingAddress
    );

  let billingAddress:
    CheckoutBillingAddress | null =
      null;

  if (
    hasDifferentBillingAddress
  ) {
    billingAddress =
      validateBillingAddress(
        input.billingAddress,
        errors
      );
  }

  /* -------------------------------------------------------
     NOTE
     ------------------------------------------------------- */

  const customerNote =
    validateCustomerNote(
      input.customerNote,
      errors
    );

  /* -------------------------------------------------------
     ARTICLES
     ------------------------------------------------------- */

  const items =
    validateItems(
      input.items,
      errors
    );

  /* -------------------------------------------------------
     ERREURS
     ------------------------------------------------------- */

  if (
    hasValidationErrors(errors) ||
    !contact ||
    !shippingAddress ||
    !items ||
    (
      hasDifferentBillingAddress &&
      !billingAddress
    )
  ) {
    return {
      success: false,
      errors,
    };
  }

  /* -------------------------------------------------------
     DONNÉES NETTOYÉES ET VALIDÉES
     ------------------------------------------------------- */

  return {
    success: true,

    data: {
      contact,

      shippingAddress,

      hasDifferentBillingAddress,

      billingAddress:
        hasDifferentBillingAddress
          ? billingAddress
          : null,

      customerNote,

      items,
    },
  };
}

/* =========================================================
   VALIDATION D'UN SEUL PRODUCT ID

   Helper disponible pour les traitements serveur.
   ========================================================= */

export function isValidOrderProductId(
  value: unknown
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalized =
    value.trim();

  return (
    normalized.length > 0 &&
    normalized.length <= 191
  );
}

/* =========================================================
   VALIDATION QUANTITÉ PUBLIQUE

   Utile dans l'API lorsqu'elle doit revérifier chaque
   quantité avant de consulter le stock Prisma.
   ========================================================= */

export function isValidOrderQuantity(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <=
      CHECKOUT_LIMITS
        .maxQuantityPerItem
  );
}

/* =========================================================
   PAYS AUTORISÉS — HELPER SERVEUR
   ========================================================= */

export function isAllowedShippingCountry(
  value: unknown
): value is CheckoutCountryCode {
  return isCheckoutCountryCode(
    value
  );
}