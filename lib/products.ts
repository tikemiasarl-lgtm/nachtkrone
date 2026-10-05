/* =========================================================
   NACHTKRONE — PRODUITS
   lib/products.ts

   Règles et utilitaires centralisés pour :
   - validation
   - normalisation
   - catégories
   - statuts
   - prix
   - prix promotionnel
   - stock
   - slug
   - images
   ========================================================= */

/* =========================================================
   CONSTANTES
   ========================================================= */

export const PRODUCT_CATEGORIES = [
  "MASK",
  "COSTUME",
  "MASK_AND_COSTUME",
] as const;

export type ProductCategoryValue =
  (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type ProductStatusValue =
  (typeof PRODUCT_STATUSES)[number];

/*
 * 1 image principale
 * +
 * maximum 15 images supplémentaires
 *
 * = maximum 16 images par produit.
 */

export const MAX_ADDITIONAL_PRODUCT_IMAGES = 15;

export const MAX_TOTAL_PRODUCT_IMAGES =
  MAX_ADDITIONAL_PRODUCT_IMAGES + 1;

/* =========================================================
   LIMITES
   ========================================================= */

export const PRODUCT_LIMITS = {
  name: {
    min: 2,
    max: 160,
  },

  slug: {
    min: 2,
    max: 180,
  },

  shortDescription: {
    min: 10,
    max: 350,
  },

  description: {
    min: 20,
    max: 10_000,
  },

  price: {
    min: 0.01,
    max: 999_999.99,
  },

  promotionalPrice: {
    min: 0.01,
    max: 999_999.99,
  },

  stock: {
    min: 0,
    max: 1_000_000,
  },

  imageUrl: {
    max: 2_000,
  },
} as const;

/* =========================================================
   LABELS POUR L'INTERFACE
   ========================================================= */

export const PRODUCT_CATEGORY_LABELS: Record<
  ProductCategoryValue,
  string
> = {
  MASK: "Masque",
  COSTUME: "Costume",
  MASK_AND_COSTUME: "Masque et costume",
};

export const PRODUCT_STATUS_LABELS: Record<
  ProductStatusValue,
  string
> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

/* =========================================================
   TYPES D'ENTRÉE
   ========================================================= */

export type ProductInput = {
  name?: unknown;
  slug?: unknown;
  shortDescription?: unknown;
  description?: unknown;
  category?: unknown;
  price?: unknown;
  promotionalPrice?: unknown;
  stock?: unknown;
  mainImage?: unknown;
  images?: unknown;
  status?: unknown;
};

export type NormalizedProductInput = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: ProductCategoryValue;
  price: string;
  promotionalPrice: string | null;
  stock: number;
  mainImage: string;
  images: string[];
  status: ProductStatusValue;
};

export type ProductValidationField =
  | "name"
  | "slug"
  | "shortDescription"
  | "description"
  | "category"
  | "price"
  | "promotionalPrice"
  | "stock"
  | "mainImage"
  | "images"
  | "status"
  | "general";

export type ProductValidationError = {
  field: ProductValidationField;
  message: string;
};

export type ProductValidationResult =
  | {
      success: true;
      data: NormalizedProductInput;
      errors: [];
    }
  | {
      success: false;
      data: null;
      errors: ProductValidationError[];
    };

/* =========================================================
   UTILITAIRES INTERNES
   ========================================================= */

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMultilineText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUppercaseString(value: unknown): string {
  return normalizeString(value).toUpperCase();
}

/* =========================================================
   CATÉGORIE
   ========================================================= */

export function isProductCategory(
  value: unknown
): value is ProductCategoryValue {
  return (
    typeof value === "string" &&
    PRODUCT_CATEGORIES.includes(
      value.toUpperCase() as ProductCategoryValue
    )
  );
}

export function normalizeProductCategory(
  value: unknown
): ProductCategoryValue | null {
  const normalized = normalizeUppercaseString(value);

  if (!isProductCategory(normalized)) {
    return null;
  }

  return normalized;
}

/* =========================================================
   STATUT
   ========================================================= */

export function isProductStatus(
  value: unknown
): value is ProductStatusValue {
  return (
    typeof value === "string" &&
    PRODUCT_STATUSES.includes(
      value.toUpperCase() as ProductStatusValue
    )
  );
}

export function normalizeProductStatus(
  value: unknown
): ProductStatusValue | null {
  const normalized = normalizeUppercaseString(value);

  if (!isProductStatus(normalized)) {
    return null;
  }

  return normalized;
}

/* =========================================================
   SLUG
   ========================================================= */

export function createProductSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, PRODUCT_LIMITS.slug.max)
    .replace(/-+$/g, "");
}

export function normalizeProductSlug(
  slug: unknown,
  productName: string
): string {
  const providedSlug = normalizeString(slug);

  if (providedSlug) {
    return createProductSlug(providedSlug);
  }

  return createProductSlug(productName);
}

/* =========================================================
   PRIX
   ========================================================= */

function normalizePriceValue(
  value: unknown,
  min: number,
  max: number
): string | null {
  let rawValue: string;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    rawValue = String(value);
  } else if (typeof value === "string") {
    rawValue = value.trim();
  } else {
    return null;
  }

  if (!rawValue) {
    return null;
  }

  /*
   * L'administration peut saisir :
   *
   * 199
   * 199.99
   * 199,99
   * 1 299,99
   */

  const cleanedValue = rawValue
    .replace(/\s/g, "")
    .replace(",", ".");

  /*
   * Maximum 2 décimales.
   */

  if (!/^\d+(?:\.\d{1,2})?$/.test(cleanedValue)) {
    return null;
  }

  const numericValue = Number(cleanedValue);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (numericValue < min || numericValue > max) {
    return null;
  }

  /*
   * Retour sous forme de chaîne décimale exacte.
   *
   * Prisma Decimal pourra recevoir directement cette valeur.
   */

  return numericValue.toFixed(2);
}

export function normalizeProductPrice(
  value: unknown
): string | null {
  return normalizePriceValue(
    value,
    PRODUCT_LIMITS.price.min,
    PRODUCT_LIMITS.price.max
  );
}

/*
 * Le prix promotionnel est facultatif.
 *
 * - undefined
 * - null
 * - chaîne vide
 *
 * signifient tous : aucune promotion.
 */

export function normalizeProductPromotionalPrice(
  value: unknown
): string | null {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  return normalizePriceValue(
    value,
    PRODUCT_LIMITS.promotionalPrice.min,
    PRODUCT_LIMITS.promotionalPrice.max
  );
}

/* =========================================================
   STOCK
   ========================================================= */

export function normalizeProductStock(
  value: unknown
): number | null {
  let numericValue: number;

  if (typeof value === "number") {
    numericValue = value;
  } else if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    numericValue = Number(value.trim());
  } else {
    return null;
  }

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (!Number.isInteger(numericValue)) {
    return null;
  }

  if (
    numericValue < PRODUCT_LIMITS.stock.min ||
    numericValue > PRODUCT_LIMITS.stock.max
  ) {
    return null;
  }

  return numericValue;
}

/* =========================================================
   IMAGES
   ========================================================= */

/*
 * NACHTKRONE accepte :
 *
 * - chemins locaux :
 *   /uploads/products/...
 *
 * - URLs HTTPS :
 *   https://...
 *
 * - URLs HTTP uniquement en développement local :
 *   http://localhost...
 *   http://127.0.0.1...
 *
 * Les data:image base64 ne sont volontairement pas acceptées.
 */

export function isValidProductImageUrl(
  value: unknown
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const imageUrl = value.trim();

  if (!imageUrl) {
    return false;
  }

  if (imageUrl.length > PRODUCT_LIMITS.imageUrl.max) {
    return false;
  }

  /*
   * Image stockée localement dans public/uploads...
   * ou autre chemin public interne.
   */

  if (
    imageUrl.startsWith("/") &&
    !imageUrl.startsWith("//")
  ) {
    return true;
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.protocol === "https:") {
      return true;
    }

    if (
      parsedUrl.protocol === "http:" &&
      (parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function normalizeProductImageUrl(
  value: unknown
): string {
  return normalizeString(value);
}

export function normalizeAdditionalProductImages(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedImages: string[] = [];

  const seenImages = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const imageUrl = item.trim();

    if (!imageUrl) {
      continue;
    }

    /*
     * Suppression des doublons.
     */

    if (seenImages.has(imageUrl)) {
      continue;
    }

    seenImages.add(imageUrl);
    normalizedImages.push(imageUrl);
  }

  return normalizedImages;
}

/* =========================================================
   VALIDATION COMPLÈTE
   ========================================================= */

export function validateProductInput(
  input: ProductInput
): ProductValidationResult {
  const errors: ProductValidationError[] = [];

  /* =======================================================
     NOM
     ======================================================= */

  const name =
    typeof input.name === "string"
      ? normalizeWhitespace(input.name)
      : "";

  if (!name) {
    errors.push({
      field: "name",
      message: "Le nom du produit est obligatoire.",
    });
  } else if (name.length < PRODUCT_LIMITS.name.min) {
    errors.push({
      field: "name",
      message: `Le nom doit contenir au minimum ${PRODUCT_LIMITS.name.min} caractères.`,
    });
  } else if (name.length > PRODUCT_LIMITS.name.max) {
    errors.push({
      field: "name",
      message: `Le nom ne peut pas dépasser ${PRODUCT_LIMITS.name.max} caractères.`,
    });
  }

  /* =======================================================
     SLUG
     ======================================================= */

  const slug = normalizeProductSlug(input.slug, name);

  if (!slug) {
    errors.push({
      field: "slug",
      message:
        "Impossible de générer une URL valide pour ce produit.",
    });
  } else if (slug.length < PRODUCT_LIMITS.slug.min) {
    errors.push({
      field: "slug",
      message: "L'URL du produit est trop courte.",
    });
  } else if (slug.length > PRODUCT_LIMITS.slug.max) {
    errors.push({
      field: "slug",
      message: `L'URL du produit ne peut pas dépasser ${PRODUCT_LIMITS.slug.max} caractères.`,
    });
  }

  /* =======================================================
     DESCRIPTION COURTE
     ======================================================= */

  const shortDescription =
    typeof input.shortDescription === "string"
      ? normalizeWhitespace(input.shortDescription)
      : "";

  if (!shortDescription) {
    errors.push({
      field: "shortDescription",
      message: "La description courte est obligatoire.",
    });
  } else if (
    shortDescription.length <
    PRODUCT_LIMITS.shortDescription.min
  ) {
    errors.push({
      field: "shortDescription",
      message: `La description courte doit contenir au minimum ${PRODUCT_LIMITS.shortDescription.min} caractères.`,
    });
  } else if (
    shortDescription.length >
    PRODUCT_LIMITS.shortDescription.max
  ) {
    errors.push({
      field: "shortDescription",
      message: `La description courte ne peut pas dépasser ${PRODUCT_LIMITS.shortDescription.max} caractères.`,
    });
  }

  /* =======================================================
     DESCRIPTION COMPLÈTE
     ======================================================= */

  const description =
    typeof input.description === "string"
      ? normalizeMultilineText(input.description)
      : "";

  if (!description) {
    errors.push({
      field: "description",
      message: "La description complète est obligatoire.",
    });
  } else if (
    description.length < PRODUCT_LIMITS.description.min
  ) {
    errors.push({
      field: "description",
      message: `La description complète doit contenir au minimum ${PRODUCT_LIMITS.description.min} caractères.`,
    });
  } else if (
    description.length > PRODUCT_LIMITS.description.max
  ) {
    errors.push({
      field: "description",
      message: `La description complète ne peut pas dépasser ${PRODUCT_LIMITS.description.max} caractères.`,
    });
  }

  /* =======================================================
     CATÉGORIE
     ======================================================= */

  const category = normalizeProductCategory(input.category);

  if (!category) {
    errors.push({
      field: "category",
      message:
        "Sélectionne une catégorie valide : Masque, Costume ou Masque et costume.",
    });
  }

  /* =======================================================
     PRIX RÉEL
     ======================================================= */

  const price = normalizeProductPrice(input.price);

  if (!price) {
    errors.push({
      field: "price",
      message:
        "Renseigne un prix réel valide supérieur à 0 avec maximum 2 décimales.",
    });
  }

  /* =======================================================
     PRIX PROMOTIONNEL
     ======================================================= */

  const promotionalPriceWasProvided =
    input.promotionalPrice !== undefined &&
    input.promotionalPrice !== null &&
    !(
      typeof input.promotionalPrice === "string" &&
      input.promotionalPrice.trim() === ""
    );

  const promotionalPrice =
    normalizeProductPromotionalPrice(
      input.promotionalPrice
    );

  /*
   * Si aucune valeur n'est renseignée :
   * promotionalPrice reste null.
   *
   * Si une valeur est renseignée :
   * elle doit être un prix valide.
   */

  if (
    promotionalPriceWasProvided &&
    promotionalPrice === null
  ) {
    errors.push({
      field: "promotionalPrice",
      message:
        "Renseigne un prix promotionnel valide supérieur à 0 avec maximum 2 décimales.",
    });
  }

  /*
   * Une promotion n'a de sens que si son prix
   * est strictement inférieur au prix réel.
   */

  if (
    price !== null &&
    promotionalPrice !== null &&
    Number(promotionalPrice) >= Number(price)
  ) {
    errors.push({
      field: "promotionalPrice",
      message:
        "Le prix promotionnel doit être strictement inférieur au prix réel.",
    });
  }

  /* =======================================================
     STOCK
     ======================================================= */

  const stock = normalizeProductStock(input.stock);

  if (stock === null) {
    errors.push({
      field: "stock",
      message:
        "Le stock doit être un nombre entier positif ou égal à 0.",
    });
  }

  /* =======================================================
     IMAGE PRINCIPALE
     ======================================================= */

  const mainImage = normalizeProductImageUrl(
    input.mainImage
  );

  if (!mainImage) {
    errors.push({
      field: "mainImage",
      message: "L'image principale est obligatoire.",
    });
  } else if (!isValidProductImageUrl(mainImage)) {
    errors.push({
      field: "mainImage",
      message: "L'image principale n'est pas valide.",
    });
  }

  /* =======================================================
     IMAGES SUPPLÉMENTAIRES
     ======================================================= */

  let images: string[] = [];

  if (
    input.images !== undefined &&
    input.images !== null &&
    !Array.isArray(input.images)
  ) {
    errors.push({
      field: "images",
      message:
        "Les images supplémentaires doivent être envoyées sous forme de liste.",
    });
  } else {
    images = normalizeAdditionalProductImages(
      input.images
    );

    /*
     * Vérification du nombre AVANT insertion.
     */

    if (
      images.length > MAX_ADDITIONAL_PRODUCT_IMAGES
    ) {
      errors.push({
        field: "images",
        message: `Un produit peut contenir au maximum ${MAX_ADDITIONAL_PRODUCT_IMAGES} images supplémentaires.`,
      });
    }

    /*
     * Validation de chaque URL.
     */

    const invalidImage = images.find(
      (imageUrl) => !isValidProductImageUrl(imageUrl)
    );

    if (invalidImage) {
      errors.push({
        field: "images",
        message:
          "Une ou plusieurs images supplémentaires ne sont pas valides.",
      });
    }

    /*
     * L'image principale ne doit pas être répétée
     * dans les images supplémentaires.
     */

    if (
      mainImage &&
      images.some((imageUrl) => imageUrl === mainImage)
    ) {
      errors.push({
        field: "images",
        message:
          "L'image principale ne doit pas être ajoutée une seconde fois dans les images supplémentaires.",
      });
    }
  }

  /* =======================================================
     STATUT
     ======================================================= */

  /*
   * Si aucun statut n'est fourni :
   * le produit est créé en brouillon.
   */

  const rawStatus =
    input.status === undefined ||
    input.status === null ||
    normalizeString(input.status) === ""
      ? "DRAFT"
      : input.status;

  const status = normalizeProductStatus(rawStatus);

  if (!status) {
    errors.push({
      field: "status",
      message: "Le statut du produit n'est pas valide.",
    });
  }

  /* =======================================================
     ERREURS
     ======================================================= */

  if (
    errors.length > 0 ||
    !category ||
    !price ||
    stock === null ||
    !status
  ) {
    return {
      success: false,
      data: null,
      errors,
    };
  }

  /* =======================================================
     DONNÉES PROPRES
     ======================================================= */

  return {
    success: true,
    errors: [],
    data: {
      name,
      slug,
      shortDescription,
      description,
      category,
      price,
      promotionalPrice,
      stock,
      mainImage,
      images,
      status,
    },
  };
}

/* =========================================================
   PREMIÈRE ERREUR
   ========================================================= */

export function getFirstProductValidationError(
  errors: ProductValidationError[]
): string {
  return (
    errors[0]?.message ??
    "Les informations du produit ne sont pas valides."
  );
}

/* =========================================================
   ERREURS PAR CHAMP
   ========================================================= */

export function getProductErrorsByField(
  errors: ProductValidationError[]
): Partial<Record<ProductValidationField, string[]>> {
  const result: Partial<
    Record<ProductValidationField, string[]>
  > = {};

  for (const error of errors) {
    if (!result[error.field]) {
      result[error.field] = [];
    }

    result[error.field]?.push(error.message);
  }

  return result;
}

/* =========================================================
   NOM DE CATÉGORIE
   ========================================================= */

export function getProductCategoryLabel(
  category: string
): string {
  if (isProductCategory(category)) {
    return PRODUCT_CATEGORY_LABELS[
      category.toUpperCase() as ProductCategoryValue
    ];
  }

  return category;
}

/* =========================================================
   NOM DU STATUT
   ========================================================= */

export function getProductStatusLabel(
  status: string
): string {
  if (isProductStatus(status)) {
    return PRODUCT_STATUS_LABELS[
      status.toUpperCase() as ProductStatusValue
    ];
  }

  return status;
}

/* =========================================================
   DISPONIBILITÉ
   ========================================================= */

export function productIsInStock(stock: number): boolean {
  return Number.isInteger(stock) && stock > 0;
}

export function productCanBePurchased(product: {
  stock: number;
  status: string;
}): boolean {
  return (
    product.status === "PUBLISHED" &&
    productIsInStock(product.stock)
  );
}