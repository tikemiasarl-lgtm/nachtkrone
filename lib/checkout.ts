/* =========================================================
   NACHTKRONE — CHECKOUT
   lib/checkout.ts

   Configuration et types communs du parcours de commande.

   Ce fichier centralise :
   - les pays de livraison autorisés
   - les codes pays
   - les données du formulaire
   - les articles transmis au checkout
   - les types de résumé de commande
   - les helpers d'affichage
   - les constantes du parcours

   IMPORTANT :
   Ce fichier ne crée aucune commande.
   Ce fichier n'envoie aucun e-mail.
   Ce fichier ne fait aucune écriture Prisma.

   Le prix définitif d'une commande devra toujours être
   recalculé côté serveur depuis Prisma.
   ========================================================= */

/* =========================================================
   MARQUE
   ========================================================= */

export const CHECKOUT_BRAND = {
  name: "NACHTKRONE",
  currency: "EUR",
  locale: "de-DE",
} as const;

/* =========================================================
   CONTACT NACHTKRONE
   ========================================================= */

export const CHECKOUT_CONTACT = {
  phoneDisplay: "+49 1590 5493267",
  phoneHref: "tel:+4915905493267",

  whatsappDisplay: "+49 1590 5493267",
  whatsappNumber: "4915905493267",
  whatsappHref:
    "https://wa.me/4915905493267",

  email:
    "contact@nachtkrone-shop.com",

  emailHref:
    "mailto:contact@nachtkrone-shop.com",
} as const;

/* =========================================================
   PAYS DE LIVRAISON

   Pays actuellement autorisés :

   DE = Allemagne
   AT = ?sterreich
   CH = Suisse
   IT = Italie
   LI = Liechtenstein

   Les valeurs sont conservées en allemand car
   l'interface publique NACHTKRONE est en allemand.
   ========================================================= */

export const CHECKOUT_COUNTRIES = [
  {
    code: "DE",
    name: "Deutschland",
    callingCode: "+49",
  },

  {
    code: "AT",
    name: "Österreich",
    callingCode: "+43",
  },

  {
    code: "CH",
    name: "Schweiz",
    callingCode: "+41",
  },

  {
    code: "IT",
    name: "Italien",
    callingCode: "+39",
  },

  {
    code: "LI",
    name: "Liechtenstein",
    callingCode: "+423",
  },
] as const;

/* =========================================================
   TYPES PAYS
   ========================================================= */

export type CheckoutCountryCode =
  (typeof CHECKOUT_COUNTRIES)[number]["code"];

export type CheckoutCountryName =
  (typeof CHECKOUT_COUNTRIES)[number]["name"];

export type CheckoutCallingCode =
  (typeof CHECKOUT_COUNTRIES)[number]["callingCode"];

export type CheckoutCountry =
  (typeof CHECKOUT_COUNTRIES)[number];

/* =========================================================
   PAYS PAR DÉFAUT

   La maquette utilise Deutschland comme sélection initiale.
   ========================================================= */

export const DEFAULT_CHECKOUT_COUNTRY_CODE:
  CheckoutCountryCode = "DE";

/* =========================================================
   INDICATIFS TÉLÉPHONIQUES

   Générés directement depuis les pays autorisés afin
   d'éviter de maintenir deux listes différentes.
   ========================================================= */

export const CHECKOUT_CALLING_CODES =
  CHECKOUT_COUNTRIES.map(
    (country) => ({
      countryCode: country.code,
      countryName: country.name,
      callingCode: country.callingCode,
    })
  );

/* =========================================================
   ÉTAPES CHECKOUT

   Le site ne réalise pas de paiement directement.

   On conserve une architecture en 3 étapes :

   1. Warenkorb
   2. Lieferung
   3. Bestätigung

   Cela évite d'afficher "Zahlung" alors qu'aucun
   paiement n'est effectué sur le site.
   ========================================================= */

export type CheckoutStepId =
  | "cart"
  | "delivery"
  | "confirmation";

export type CheckoutStep = {
  id: CheckoutStepId;
  number: 1 | 2 | 3;
  label: string;
};

export const CHECKOUT_STEPS: readonly CheckoutStep[] =
  [
    {
      id: "cart",
      number: 1,
      label: "Warenkorb",
    },

    {
      id: "delivery",
      number: 2,
      label: "Lieferung",
    },

    {
      id: "confirmation",
      number: 3,
      label: "Bestätigung",
    },
  ];

/* =========================================================
   ROUTES CHECKOUT
   ========================================================= */

export const CHECKOUT_ROUTES = {
  cart: "/warenkorb",

  delivery:
    "/bestellung/lieferung",

  home: "/",

  products: "/produkte",
} as const;

/* =========================================================
   INFORMATIONS DE CONTACT CLIENT
   ========================================================= */

export type CheckoutContactData = {
  firstName: string;
  lastName: string;
  email: string;

  /*
   * Exemple :
   * +49
   */
  phoneCountryCode: string;

  /*
   * Numéro saisi par le client sans imposer ici
   * un format international définitif.
   */
  phone: string;
};

/* =========================================================
   ADRESSE DE LIVRAISON
   ========================================================= */

export type CheckoutShippingAddress = {
  countryCode: CheckoutCountryCode;

  address: string;

  /*
   * Complément facultatif :
   * Hinterhaus, Wohnung, Etage, etc.
   */
  address2: string;

  postalCode: string;

  city: string;

  /*
   * Région / canton / province facultatif.
   *
   * Le formulaire actuel de la maquette ne l'affiche pas,
   * mais Prisma possède shippingState.
   */
  state: string;
};

/* =========================================================
   ADRESSE DE FACTURATION
   ========================================================= */

export type CheckoutBillingAddress = {
  firstName: string;
  lastName: string;

  countryCode: CheckoutCountryCode;

  address: string;
  address2: string;

  postalCode: string;
  city: string;

  state: string;
};

/* =========================================================
   FORMULAIRE COMPLET
   ========================================================= */

export type CheckoutFormData = {
  contact: CheckoutContactData;

  shippingAddress:
    CheckoutShippingAddress;

  hasDifferentBillingAddress:
    boolean;

  billingAddress:
    CheckoutBillingAddress;

  /*
   * Prévu par Order.customerNote.
   *
   * Aucun champ note n'est affiché dans la maquette actuelle.
   * La valeur restera donc vide tant que ce champ
   * n'est pas ajouté à l'interface.
   */
  customerNote: string;
};

/* =========================================================
   ARTICLE TRANSMIS AU CHECKOUT

   ATTENTION :
   Ces données servent au rendu de l'interface.

   L'API ne devra JAMAIS accepter unitPrice ou totalPrice
   comme vérité provenant du navigateur.

   Le serveur récupérera le produit depuis Prisma
   et recalculera le prix.
   ========================================================= */

export type CheckoutItem = {
  productId: string;
  productSlug: string;

  productName: string;
  productImage: string;

  quantity: number;

  /*
   * Valeurs d'affichage uniquement.
   */
  unitPrice: number;
  totalPrice: number;
};

/* =========================================================
   DONNÉES MINIMALES ENVOYÉES À L'API

   Le navigateur transmet seulement :
   - les identifiants produits
   - les quantités
   - les coordonnées du client

   Il ne décide jamais du prix définitif.
   ========================================================= */

export type CheckoutOrderItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  contact: CheckoutContactData;

  shippingAddress:
    CheckoutShippingAddress;

  hasDifferentBillingAddress:
    boolean;

  billingAddress:
    CheckoutBillingAddress | null;

  customerNote: string;

  items: CheckoutOrderItemInput[];
};

/* =========================================================
   RÉSUMÉ DE COMMANDE

   Structure utilisable après recalcul côté serveur.
   ========================================================= */

export type CheckoutOrderSummary = {
  items: CheckoutItem[];

  subtotal: number;

  shippingAmount: number;

  total: number;

  currency: "EUR";
};

/* =========================================================
   RÉPONSE API APRÈS CRÉATION
   ========================================================= */

export type CreateOrderSuccessResponse = {
  success: true;

  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
  };
};

export type CreateOrderErrorResponse = {
  success: false;

  error: {
    code: string;
    message: string;
  };
};

export type CreateOrderResponse =
  | CreateOrderSuccessResponse
  | CreateOrderErrorResponse;

/* =========================================================
   ÉTAT DU FORMULAIRE
   ========================================================= */

export type CheckoutSubmitStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

/* =========================================================
   ERREURS DE VALIDATION
   ========================================================= */

export type CheckoutFieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;

  phoneCountryCode?: string;
  phone?: string;

  shippingCountryCode?: string;
  shippingAddress?: string;
  shippingAddress2?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
  shippingState?: string;

  billingFirstName?: string;
  billingLastName?: string;
  billingCountryCode?: string;
  billingAddress?: string;
  billingAddress2?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingState?: string;

  customerNote?: string;

  items?: string;

  form?: string;
};

/* =========================================================
   VALEURS INITIALES DU FORMULAIRE
   ========================================================= */

export function createInitialCheckoutFormData():
  CheckoutFormData {
  return {
    contact: {
      firstName: "",
      lastName: "",
      email: "",

      phoneCountryCode:
        getCallingCodeForCountry(
          DEFAULT_CHECKOUT_COUNTRY_CODE
        ),

      phone: "",
    },

    shippingAddress: {
      countryCode:
        DEFAULT_CHECKOUT_COUNTRY_CODE,

      address: "",
      address2: "",
      postalCode: "",
      city: "",
      state: "",
    },

    hasDifferentBillingAddress:
      false,

    billingAddress: {
      firstName: "",
      lastName: "",

      countryCode:
        DEFAULT_CHECKOUT_COUNTRY_CODE,

      address: "",
      address2: "",
      postalCode: "",
      city: "",
      state: "",
    },

    customerNote: "",
  };
}

/* =========================================================
   RECHERCHE D'UN PAYS
   ========================================================= */

export function getCheckoutCountry(
  countryCode: string
): CheckoutCountry | undefined {
  const normalizedCode =
    countryCode
      .trim()
      .toUpperCase();

  return CHECKOUT_COUNTRIES.find(
    (country) =>
      country.code ===
      normalizedCode
  );
}

/* =========================================================
   VÉRIFICATION PAYS AUTORISÉ
   ========================================================= */

export function isCheckoutCountryCode(
  value: unknown
): value is CheckoutCountryCode {
  if (typeof value !== "string") {
    return false;
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  return CHECKOUT_COUNTRIES.some(
    (country) =>
      country.code ===
      normalized
  );
}

/* =========================================================
   NOM DU PAYS
   ========================================================= */

export function getCheckoutCountryName(
  countryCode: CheckoutCountryCode
): CheckoutCountryName {
  const country =
    CHECKOUT_COUNTRIES.find(
      (item) =>
        item.code ===
        countryCode
    );

  /*
   * Cette situation ne devrait jamais arriver puisque
   * CheckoutCountryCode est limité aux codes autorisés.
   */

  if (!country) {
    return "Deutschland";
  }

  return country.name;
}

/* =========================================================
   INDICATIF D'UN PAYS
   ========================================================= */

export function getCallingCodeForCountry(
  countryCode: CheckoutCountryCode
): CheckoutCallingCode {
  const country =
    CHECKOUT_COUNTRIES.find(
      (item) =>
        item.code ===
        countryCode
    );

  if (!country) {
    return "+49";
  }

  return country.callingCode;
}

/* =========================================================
   NORMALISATION QUANTITÉ

   Utilisé uniquement pour l'interface.

   La validation serveur définitive sera réalisée
   dans order-validation.ts et dans l'API.
   ========================================================= */

export function normalizeCheckoutQuantity(
  quantity: unknown
): number {
  const numericQuantity =
    Number(quantity);

  if (
    !Number.isFinite(
      numericQuantity
    )
  ) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(
      numericQuantity
    )
  );
}

/* =========================================================
   FORMATAGE EUR
   ========================================================= */

const EUR_FORMATTER =
  new Intl.NumberFormat(
    CHECKOUT_BRAND.locale,
    {
      style: "currency",
      currency:
        CHECKOUT_BRAND.currency,

      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

export function formatCheckoutPrice(
  amount: number
): string {
  const safeAmount =
    Number.isFinite(amount)
      ? amount
      : 0;

  return EUR_FORMATTER.format(
    safeAmount
  );
}

/* =========================================================
   CALCUL D'AFFICHAGE D'UN ARTICLE

   ATTENTION :
   ce helper ne remplace jamais le calcul sécurisé serveur.
   ========================================================= */

export function calculateCheckoutItemTotal(
  unitPrice: number,
  quantity: number
): number {
  const safePrice =
    Number.isFinite(unitPrice)
      ? Math.max(
          0,
          unitPrice
        )
      : 0;

  const safeQuantity =
    normalizeCheckoutQuantity(
      quantity
    );

  return (
    Math.round(
      safePrice *
        safeQuantity *
        100
    ) / 100
  );
}

/* =========================================================
   SOUS-TOTAL D'AFFICHAGE
   ========================================================= */

export function calculateCheckoutSubtotal(
  items: readonly CheckoutItem[]
): number {
  const subtotal =
    items.reduce(
      (total, item) => {
        const itemTotal =
          Number.isFinite(
            item.totalPrice
          )
            ? Math.max(
                0,
                item.totalPrice
              )
            : 0;

        return (
          total +
          itemTotal
        );
      },
      0
    );

  return (
    Math.round(
      subtotal * 100
    ) / 100
  );
}

/* =========================================================
   TOTAL D'AFFICHAGE
   ========================================================= */

export function calculateCheckoutTotal(
  subtotal: number,
  shippingAmount: number
): number {
  const safeSubtotal =
    Number.isFinite(subtotal)
      ? Math.max(
          0,
          subtotal
        )
      : 0;

  const safeShipping =
    Number.isFinite(
      shippingAmount
    )
      ? Math.max(
          0,
          shippingAmount
        )
      : 0;

  return (
    Math.round(
      (
        safeSubtotal +
        safeShipping
      ) * 100
    ) / 100
  );
}

/* =========================================================
   TÉLÉPHONE COMPLET

   Ce helper prépare l'affichage / transmission du numéro.

   La validation stricte sera effectuée séparément.
   ========================================================= */

export function buildCheckoutPhoneNumber(
  callingCode: string,
  phone: string
): string {
  const cleanCallingCode =
    callingCode
      .trim()
      .replace(
        /[^\d+]/g,
        ""
      );

  let cleanPhone =
    phone
      .trim()
      .replace(
        /[^\d]/g,
        ""
      );

  /*
   * Lorsqu'un indicatif international est séparé,
   * le zéro national initial n'est pas conservé.
   */

  cleanPhone =
    cleanPhone.replace(
      /^0+/,
      ""
    );

  if (
    !cleanCallingCode ||
    !cleanPhone
  ) {
    return "";
  }

  const normalizedCallingCode =
    cleanCallingCode.startsWith(
      "+"
    )
      ? cleanCallingCode
      : `+${cleanCallingCode}`;

  return `${normalizedCallingCode}${cleanPhone}`;
}

/* =========================================================
   CONVERSION FORMULAIRE → REQUÊTE API

   On ne transmet volontairement :
   - aucun prix
   - aucun total
   - aucune image comme donnée de confiance

   Ces informations seront récupérées depuis Prisma.
   ========================================================= */

export function createOrderInputFromCheckout(
  form: CheckoutFormData,
  items: readonly CheckoutOrderItemInput[]
): CreateOrderInput {
  return {
    contact: {
      firstName:
        form.contact.firstName,

      lastName:
        form.contact.lastName,

      email:
        form.contact.email,

      phoneCountryCode:
        form.contact
          .phoneCountryCode,

      phone:
        form.contact.phone,
    },

    shippingAddress: {
      countryCode:
        form.shippingAddress
          .countryCode,

      address:
        form.shippingAddress
          .address,

      address2:
        form.shippingAddress
          .address2,

      postalCode:
        form.shippingAddress
          .postalCode,

      city:
        form.shippingAddress
          .city,

      state:
        form.shippingAddress
          .state,
    },

    hasDifferentBillingAddress:
      form.hasDifferentBillingAddress,

    billingAddress:
      form.hasDifferentBillingAddress
        ? {
            firstName:
              form.billingAddress
                .firstName,

            lastName:
              form.billingAddress
                .lastName,

            countryCode:
              form.billingAddress
                .countryCode,

            address:
              form.billingAddress
                .address,

            address2:
              form.billingAddress
                .address2,

            postalCode:
              form.billingAddress
                .postalCode,

            city:
              form.billingAddress
                .city,

            state:
              form.billingAddress
                .state,
          }
        : null,

    customerNote:
      form.customerNote,

    /*
     * Seuls productId et quantity sont envoyés.
     *
     * L'API retrouvera :
     * - nom
     * - image
     * - prix
     * - promotion
     * - stock
     *
     * directement depuis Prisma.
     */

    items: items.map(
      (item) => ({
        productId:
          item.productId,

        quantity:
          normalizeCheckoutQuantity(
            item.quantity
          ),
      })
    ),
  };
}

/* =========================================================
   TEXTES CHECKOUT

   Centralisés ici pour éviter les variations entre
   les différents composants.
   ========================================================= */

export const CHECKOUT_TEXT = {
  pageTitle:
    "Lieferinformationen",

  pageSubtitle:
    "Wohin dürfen wir Ihre Bestellung liefern?",

  requiredFields:
    "* Pflichtfelder",

  contactTitle:
    "Kontaktdaten",

  shippingAddressTitle:
    "Lieferadresse",

  differentBillingAddress:
    "Abweichende Rechnungsadresse",

  billingAddressTitle:
    "Rechnungsadresse",

  shippingTitle:
    "Versand",

  shippingCalculationMessage:
    "Versandkosten werden anhand Ihrer Adresse berechnet.",

  orderSummaryTitle:
    "Ihre Bestellung",

  subtotal:
    "Zwischensumme",

  shipping:
    "Versand",

  total:
    "Gesamt",

  quantity:
    "Menge",

  submitOrder:
    "Bestellung absenden",

  submittingOrder:
    "Bestellung wird gesendet...",

  backToCart:
    "Zurück zum Warenkorb",

  questionsTitle:
    "Fragen zu Ihrer Bestellung?",

  phoneHelp:
    "Für Rückfragen zur Lieferung.",

  orderSuccess:
    "Ihre Bestellung wurde erfolgreich übermittelt.",

  orderError:
    "Ihre Bestellung konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.",
} as const;

/* =========================================================
   LIMITES DE FORMULAIRE

   Ces limites seront également appliquées côté serveur
   dans order-validation.ts.
   ========================================================= */

export const CHECKOUT_LIMITS = {
  firstNameMaxLength: 80,
  lastNameMaxLength: 80,

  emailMaxLength: 254,

  phoneMaxLength: 30,

  addressMaxLength: 160,
  address2MaxLength: 160,

  postalCodeMaxLength: 20,

  cityMaxLength: 100,

  stateMaxLength: 100,

  customerNoteMaxLength: 1000,

  /*
   * Protection applicative.
   * Ce nombre pourra être ajusté lorsque le véritable
   * panier sera finalisé.
   */
  maxDifferentProductsPerOrder: 50,

  maxQuantityPerItem: 99,
} as const;