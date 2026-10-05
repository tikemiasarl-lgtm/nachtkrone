/* =========================================================
   NACHTKRONE — NAVIGATION PUBLIQUE
   lib/public-navigation.ts

   Centralise uniquement les informations communes
   nécessaires à l'espace public :

   - identité NACHTKRONE
   - navigation desktop
   - navigation mobile
   - coordonnées
   - WhatsApp
   - chemins des images publiques
   - libellés allemands communs

   Toute l'interface publique reste en allemand.
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type PublicNavigationItem = {
  label: string;
  href: string;
};

export type MobileNavigationItemId =
  | "home"
  | "products"
  | "cart"
  | "contact";

export type MobileNavigationItem = PublicNavigationItem & {
  id: MobileNavigationItemId;
};

export type PublicProductCategory =
  | "MASK"
  | "COSTUME"
  | "MASK_AND_COSTUME";

/* =========================================================
   IDENTITÉ DE LA MARQUE
   ========================================================= */

export const PUBLIC_BRAND = {
  name: "NACHTKRONE",

  logo: "/logo/logo.png",

  language: "de",

  currency: "EUR",

  locale: "de-DE",
} as const;

/* =========================================================
   IMAGES PUBLIQUES
   ========================================================= */

export const PUBLIC_IMAGES = {
  logo: "/logo/logo.png",

  cover: "/image/couverture.png",

  paymentMethods: "/image/paiement.png",
} as const;

/* =========================================================
   COORDONNÉES
   ========================================================= */

export const PUBLIC_CONTACT = {
  phoneDisplay: "+49 1590 5493267",

  /*
   * Version destinée aux liens tel:
   */
  phoneHref: "tel:+4915905493267",

  email: "contact@nachtkrone-shop.com",

  emailHref:
    "mailto:contact@nachtkrone-shop.com",

  whatsappDisplay: "+49 1590 5493267",

  /*
   * WhatsApp demande le numéro international
   * sans espace et sans caractère "+".
   */
  whatsappNumber: "4915905493267",

  whatsappUrl:
    "https://wa.me/4915905493267",
} as const;

/* =========================================================
   NAVIGATION DESKTOP
   ========================================================= */

/*
 * Navigation volontairement simple.
 *
 * Les routes pourront être créées progressivement.
 * Ce fichier permet aux composants de navigation
 * d'utiliser une seule source de vérité.
 */

export const DESKTOP_NAVIGATION: readonly PublicNavigationItem[] =
  [
    {
      label: "Startseite",
      href: "/",
    },

    {
      label: "Produkte",
      href: "/produkte",
    },

    {
      label: "Masken",
      href: "/produkte?category=MASK",
    },

    {
      label: "Kostüme",
      href: "/produkte?category=COSTUME",
    },

    {
      label: "Masken & Kostüme",
      href: "/produkte?category=MASK_AND_COSTUME",
    },
  ] as const;

/* =========================================================
   NAVIGATION MOBILE
   ========================================================= */

/*
 * Barre inférieure fixe.
 *
 * Le bouton WhatsApp n'est volontairement pas placé
 * dans cette liste.
 *
 * WhatsApp sera un bouton flottant indépendant,
 * positionné au-dessus de la barre mobile.
 */

export const MOBILE_NAVIGATION: readonly MobileNavigationItem[] =
  [
    {
      id: "home",
      label: "Startseite",
      href: "/",
    },

    {
      id: "products",
      label: "Produkte",
      href: "/produkte",
    },

    {
      id: "cart",
      label: "Warenkorb",
      href: "/warenkorb",
    },

    {
      id: "contact",
      label: "Kontakt",
      href: "/kontakt",
    },
  ] as const;

/* =========================================================
   CATÉGORIES PRODUITS
   ========================================================= */

/*
 * Correspondance directe avec Prisma :
 *
 * MASK
 * COSTUME
 * MASK_AND_COSTUME
 */

export const PUBLIC_CATEGORY_LABELS: Record<
  PublicProductCategory,
  string
> = {
  MASK: "Masken",

  COSTUME: "Kostüme",

  MASK_AND_COSTUME:
    "Masken & Kostüme",
};

/* =========================================================
   CATÉGORIES DE L'ACCUEIL
   ========================================================= */

export const HOME_CATEGORIES = [
  {
    id: "MASK" as const,

    label: "Masken",

    href: "/produkte?category=MASK",
  },

  {
    id: "COSTUME" as const,

    label: "Kostüme",

    href: "/produkte?category=COSTUME",
  },

  {
    id: "MASK_AND_COSTUME" as const,

    label: "Masken & Kostüme",

    href:
      "/produkte?category=MASK_AND_COSTUME",
  },
] as const;

/* =========================================================
   LIENS PRINCIPAUX
   ========================================================= */

export const PUBLIC_ROUTES = {
  home: "/",

  products: "/produkte",

  masks: "/produkte?category=MASK",

  costumes:
    "/produkte?category=COSTUME",

  sets:
    "/produkte?category=MASK_AND_COSTUME",

  cart: "/warenkorb",

  contact: "/kontakt",
} as const;

/* =========================================================
   TEXTES COMMUNS DE NAVIGATION
   ========================================================= */

export const PUBLIC_NAVIGATION_TEXT = {
  searchPlaceholder:
    "Produkte suchen...",

  searchLabel:
    "Produkte suchen",

  cartLabel:
    "Warenkorb",

  menuLabel:
    "Menü",

  closeMenuLabel:
    "Menü schließen",

  openMenuLabel:
    "Menü öffnen",

  whatsappLabel:
    "WhatsApp",

  contactLabel:
    "Kontakt",

  productsLabel:
    "Produkte",

  homeLabel:
    "Startseite",
} as const;

/* =========================================================
   WHATSAPP
   ========================================================= */

export const WHATSAPP_CONFIG = {
  number:
    PUBLIC_CONTACT.whatsappNumber,

  displayNumber:
    PUBLIC_CONTACT.whatsappDisplay,

  url:
    PUBLIC_CONTACT.whatsappUrl,

  ariaLabel:
    "NACHTKRONE über WhatsApp kontaktieren",

  title:
    "WhatsApp",

  /*
   * Message allemand prérempli.
   *
   * Le composant WhatsAppButton pourra utiliser
   * directement whatsappUrlWithMessage.
   */
  message:
    "Hallo NACHTKRONE, ich habe eine Frage zu Ihren Produkten.",
} as const;

/* =========================================================
   URL WHATSAPP AVEC MESSAGE
   ========================================================= */

export const WHATSAPP_URL_WITH_MESSAGE =
  `${WHATSAPP_CONFIG.url}?text=${encodeURIComponent(
    WHATSAPP_CONFIG.message
  )}`;

/* =========================================================
   FOOTER DESKTOP
   ========================================================= */

/*
 * Le footer restera volontairement compact.
 *
 * Il ne sera pas affiché sur mobile.
 *
 * Les moyens de paiement utiliseront :
 * /image/paiement.png
 */

export const PUBLIC_FOOTER = {
  brand: PUBLIC_BRAND.name,

  productsLink: {
    label: "Produkte",
    href: PUBLIC_ROUTES.products,
  },

  phone: {
    label:
      PUBLIC_CONTACT.phoneDisplay,

    href:
      PUBLIC_CONTACT.phoneHref,
  },

  email: {
    label:
      PUBLIC_CONTACT.email,

    href:
      PUBLIC_CONTACT.emailHref,
  },

  whatsapp: {
    label: "WhatsApp",

    href:
      WHATSAPP_URL_WITH_MESSAGE,
  },

  paymentImage:
    PUBLIC_IMAGES.paymentMethods,

  paymentImageAlt:
    "Akzeptierte Zahlungsmethoden",

  copyright:
    `© ${new Date().getFullYear()} NACHTKRONE. Alle Rechte vorbehalten.`,
} as const;

/* =========================================================
   INFORMATIONS DE CONFIANCE
   ========================================================= */

/*
 * Utilisées plus tard par HomeTrustBar.tsx.
 *
 * On reste volontairement sur des textes généraux
 * afin de ne pas promettre de délais ou services
 * qui n'ont pas encore été configurés.
 */

export const PUBLIC_TRUST_ITEMS = [
  {
    id: "quality",
    title: "Ausgewählte Produkte",
    description:
      "Krampus-Masken und Kostüme für einen eindrucksvollen Auftritt.",
  },

  {
    id: "payment",
    title: "Sicher bezahlen",
    description:
      "Bequeme und sichere Zahlungsmöglichkeiten.",
  },

  {
    id: "support",
    title: "Persönlicher Kontakt",
    description:
      "Bei Fragen erreichen Sie NACHTKRONE direkt per WhatsApp.",
  },
] as const;

/* =========================================================
   HELPERS
   ========================================================= */

export function getPublicCategoryLabel(
  category: PublicProductCategory
): string {
  return PUBLIC_CATEGORY_LABELS[
    category
  ];
}

export function getWhatsAppUrl(
  message?: string
): string {
  const normalizedMessage =
    message?.trim();

  if (!normalizedMessage) {
    return WHATSAPP_URL_WITH_MESSAGE;
  }

  return `${WHATSAPP_CONFIG.url}?text=${encodeURIComponent(
    normalizedMessage
  )}`;
}