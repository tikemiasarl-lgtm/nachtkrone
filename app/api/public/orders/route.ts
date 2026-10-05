import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  buildCheckoutPhoneNumber,
  getCheckoutCountryName,
  type CreateOrderErrorResponse,
  type CreateOrderSuccessResponse,
} from "@/lib/checkout";

import { validateCreateOrderInput } from "@/lib/order-validation";

import {
  createConfirmationDocumentNumber,
  generateOrderNumber,
} from "@/lib/order-number";

import {
  sendOrderEmails,
  type OrderEmailData,
} from "@/lib/order-email";

/* =========================================================
   NACHTKRONE — PUBLIC ORDER API
   app/api/public/orders/route.ts

   VERSION FINALE MISE À JOUR

   FLUX :
   1. validation de la requête
   2. validation des informations client
   3. récupération des produits depuis Prisma
   4. vérification PUBLISHED
   5. vérification du stock
   6. recalcul des prix côté serveur
   7. application du prix promotionnel
   8. création Customer
   9. création Order
   10. création OrderItem
   11. sauvegarde automatique de mainImage dans productImage
   12. décrémentation atomique du stock
   13. création du numéro de confirmation
   14. e-mail automatique administrateur
   15. e-mail automatique client
   16. images produits automatiques dans les e-mails
   17. mise à jour des statuts d'envoi

   IMPORTANT :
   - aucun prix envoyé par le navigateur n'est accepté
   - aucun total envoyé par le navigateur n'est accepté
   - aucun statut de paiement envoyé par le navigateur
   - paymentStatus reste PENDING
   - l'échec d'un e-mail ne supprime jamais la commande
   ========================================================= */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   CONSTANTES
   ========================================================= */

const MAX_REQUEST_BYTES = 64 * 1024;

const TECHNICAL_SHIPPING_AMOUNT = 0;

const ORDER_NUMBER_MAX_ATTEMPTS = 5;

/* =========================================================
   TYPES
   ========================================================= */

type ValidatedOrderInput = Extract<
  ReturnType<typeof validateCreateOrderInput>,
  {
    success: true;
  }
>["data"];

type ProductForOrder = {
  id: string;
  name: string;
  slug: string;
  price: Prisma.Decimal;
  promotionalPrice: Prisma.Decimal | null;
  stock: number;
  mainImage: string;
};

type PreparedOrderItem = {
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  totalPrice: Prisma.Decimal;
};

type CreatedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: Date;

  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;

  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingAddress2: string | null;
  shippingPostalCode: string;
  shippingCity: string;
  shippingState: string | null;
  shippingCountry: string;

  hasDifferentBillingAddress: boolean;

  billingFirstName: string | null;
  billingLastName: string | null;
  billingAddress: string | null;
  billingAddress2: string | null;
  billingPostalCode: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingCountry: string | null;

  subtotal: Prisma.Decimal;
  shippingAmount: Prisma.Decimal;
  total: Prisma.Decimal;
  currency: string;

  confirmationDocumentNumber: string | null;

  customerNote: string | null;

  items: Array<{
    productName: string;
    productImage: string;
    unitPrice: Prisma.Decimal;
    quantity: number;
    totalPrice: Prisma.Decimal;
  }>;
};

/* =========================================================
   CUSTOM ERRORS
   ========================================================= */

class StockConflictError extends Error {
  readonly productName: string;

  constructor(productName: string) {
    super(`Insufficient stock for ${productName}`);

    this.name = "StockConflictError";
    this.productName = productName;
  }
}

/* =========================================================
   RESPONSE HELPERS
   ========================================================= */

function successResponse(
  data: CreateOrderSuccessResponse,
  status = 201
) {
  return NextResponse.json(data, {
    status,

    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number
) {
  const body: CreateOrderErrorResponse = {
    success: false,

    error: {
      code,
      message,
    },
  };

  return NextResponse.json(body, {
    status,

    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

/* =========================================================
   DECIMAL HELPERS
   ========================================================= */

function toDecimal(
  value: ConstructorParameters<typeof Prisma.Decimal>[0]
): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function roundMoney(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
  );
}

function decimalToNumber(value: Prisma.Decimal): number {
  const result = Number(value.toString());

  if (!Number.isFinite(result)) {
    return 0;
  }

  return Math.round(result * 100) / 100;
}

/* =========================================================
   EFFECTIVE PRODUCT PRICE
   ========================================================= */

function getEffectiveProductPrice(
  product: ProductForOrder
): Prisma.Decimal {
  const regularPrice = roundMoney(
    toDecimal(product.price)
  );

  if (regularPrice.isNegative()) {
    throw new Error(
      `Invalid regular price for product ${product.id}`
    );
  }

  if (product.promotionalPrice !== null) {
    const promotionalPrice = roundMoney(
      toDecimal(product.promotionalPrice)
    );

    if (
      !promotionalPrice.isNegative() &&
      promotionalPrice.lessThan(regularPrice)
    ) {
      return promotionalPrice;
    }
  }

  return regularPrice;
}

/* =========================================================
   REQUEST SIZE
   ========================================================= */

function hasOversizedContentLength(
  request: NextRequest
): boolean {
  const contentLength = request.headers.get(
    "content-length"
  );

  if (!contentLength) {
    return false;
  }

  const size = Number(contentLength);

  return (
    Number.isFinite(size) &&
    size > MAX_REQUEST_BYTES
  );
}

/* =========================================================
   CONTENT TYPE
   ========================================================= */

function hasJsonContentType(
  request: NextRequest
): boolean {
  const contentType =
    request.headers
      .get("content-type")
      ?.toLowerCase() ?? "";

  return contentType.includes("application/json");
}

/* =========================================================
   ORIGIN CHECK
   ========================================================= */

function hasInvalidOrigin(
  request: NextRequest
): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return (
      new URL(origin).origin !==
      request.nextUrl.origin
    );
  } catch {
    return true;
  }
}

/* =========================================================
   READ JSON
   ========================================================= */

async function readJsonBody(
  request: NextRequest
): Promise<
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      type: "too_large" | "invalid_json";
    }
> {
  if (hasOversizedContentLength(request)) {
    return {
      success: false,
      type: "too_large",
    };
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return {
      success: false,
      type: "invalid_json",
    };
  }

  const bodyBytes = new TextEncoder().encode(
    rawBody
  ).byteLength;

  if (bodyBytes > MAX_REQUEST_BYTES) {
    return {
      success: false,
      type: "too_large",
    };
  }

  if (!rawBody.trim()) {
    return {
      success: false,
      type: "invalid_json",
    };
  }

  try {
    return {
      success: true,
      data: JSON.parse(rawBody) as unknown,
    };
  } catch {
    return {
      success: false,
      type: "invalid_json",
    };
  }
}

/* =========================================================
   VALIDATION ERROR MESSAGE
   ========================================================= */

function findFirstValidationError(
  value: unknown
): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findFirstValidationError(item);

      if (result) {
        return result;
      }
    }

    return null;
  }

  for (const item of Object.values(value)) {
    const result = findFirstValidationError(item);

    if (result) {
      return result;
    }
  }

  return null;
}

/* =========================================================
   PREPARE ORDER ITEMS

   IMPORTANT :
   productImage vient directement de Product.mainImage.

   Donc :
   Product.mainImage
        ↓
   PreparedOrderItem.productImage
        ↓
   OrderItem.productImage
        ↓
   e-mail administrateur
        ↓
   e-mail client
        ↓
   document de confirmation

   Le navigateur ne choisit jamais cette image.
   ========================================================= */

async function prepareOrderItems(
  input: ValidatedOrderInput
): Promise<
  | {
      success: true;
      items: PreparedOrderItem[];
      subtotal: Prisma.Decimal;
    }
  | {
      success: false;
      code: string;
      message: string;
      status: number;
    }
> {
  const productIds = input.items.map(
    (item) => item.productId
  );

  const products =
    await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },

        status: "PUBLISHED",
      },

      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        promotionalPrice: true,
        stock: true,

        /*
         * IMAGE AUTOMATIQUE
         */
        mainImage: true,
      },
    });

  if (products.length !== productIds.length) {
    return {
      success: false,
      code: "PRODUCT_UNAVAILABLE",
      message:
        "Mindestens ein Produkt ist nicht mehr verfügbar.",
      status: 409,
    };
  }

  const productMap = new Map(
    products.map((product) => [
      product.id,
      product,
    ])
  );

  const preparedItems: PreparedOrderItem[] = [];

  let subtotal = toDecimal(0);

  for (const requestedItem of input.items) {
    const product = productMap.get(
      requestedItem.productId
    );

    if (!product) {
      return {
        success: false,
        code: "PRODUCT_UNAVAILABLE",
        message:
          "Mindestens ein Produkt ist nicht mehr verfügbar.",
        status: 409,
      };
    }

    if (
      !Number.isInteger(product.stock) ||
      product.stock < requestedItem.quantity
    ) {
      return {
        success: false,
        code: "INSUFFICIENT_STOCK",
        message: `Für „${product.name}“ ist die gewünschte Menge derzeit nicht verfügbar.`,
        status: 409,
      };
    }

    let unitPrice: Prisma.Decimal;

    try {
      unitPrice = getEffectiveProductPrice(product);
    } catch {
      return {
        success: false,
        code: "INVALID_PRODUCT_PRICE",
        message:
          "Ein Produkt kann derzeit nicht bestellt werden.",
        status: 409,
      };
    }

    const totalPrice = roundMoney(
      unitPrice.mul(requestedItem.quantity)
    );

    subtotal = subtotal.plus(totalPrice);

    preparedItems.push({
      productId: product.id,

      productName: product.name,

      /*
       * L'image est récupérée depuis Prisma.
       */
      productImage: product.mainImage,

      unitPrice,

      quantity: requestedItem.quantity,

      totalPrice,
    });
  }

  return {
    success: true,
    items: preparedItems,
    subtotal: roundMoney(subtotal),
  };
}

/* =========================================================
   PRISMA ERRORS
   ========================================================= */

function isPrismaUniqueError(
  error: unknown
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isPrismaRetryableTransactionError(
  error: unknown
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

/* =========================================================
   CREATE ORDER TRANSACTION
   ========================================================= */

async function createOrderTransaction(
  input: ValidatedOrderInput,
  preparedItems: PreparedOrderItem[],
  subtotal: Prisma.Decimal,
  orderNumber: string
): Promise<CreatedOrder> {
  return prisma.$transaction(
    async (tx) => {
      /* ===================================================
         STOCK
         =================================================== */

      for (const item of preparedItems) {
        const stockUpdate =
          await tx.product.updateMany({
            where: {
              id: item.productId,
              status: "PUBLISHED",

              stock: {
                gte: item.quantity,
              },
            },

            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

        if (stockUpdate.count !== 1) {
          throw new StockConflictError(
            item.productName
          );
        }
      }

      /* ===================================================
         PHONE
         =================================================== */

      const customerPhone =
        buildCheckoutPhoneNumber(
          input.contact.phoneCountryCode,
          input.contact.phone
        );

      /* ===================================================
         CUSTOMER
         =================================================== */

      const customer =
        await tx.customer.create({
          data: {
            firstName: input.contact.firstName,
            lastName: input.contact.lastName,
            email: input.contact.email,
            phone: customerPhone,
          },

          select: {
            id: true,
          },
        });

      /* ===================================================
         COUNTRIES
         =================================================== */

      const shippingCountry =
        getCheckoutCountryName(
          input.shippingAddress.countryCode
        );

      const billingAddress =
        input.hasDifferentBillingAddress
          ? input.billingAddress
          : null;

      const billingCountry = billingAddress
        ? getCheckoutCountryName(
            billingAddress.countryCode
          )
        : null;

      /* ===================================================
         MONEY

         Les frais de livraison ne sont pas gérés ici.
         =================================================== */

      const shippingAmount = toDecimal(
        TECHNICAL_SHIPPING_AMOUNT
      );

      const total = roundMoney(
        subtotal.plus(shippingAmount)
      );

      /* ===================================================
         CONFIRMATION NUMBER

         Le numéro du document est créé dès la commande.
         =================================================== */

      const confirmationDocumentNumber =
        createConfirmationDocumentNumber(
          orderNumber
        );

      /* ===================================================
         CREATE ORDER
         =================================================== */

      const order = await tx.order.create({
        data: {
          orderNumber,

          customerId: customer.id,

          /* CUSTOMER SNAPSHOT */

          customerFirstName:
            input.contact.firstName,

          customerLastName:
            input.contact.lastName,

          customerEmail:
            input.contact.email,

          customerPhone,

          /* SHIPPING */

          shippingFirstName:
            input.contact.firstName,

          shippingLastName:
            input.contact.lastName,

          shippingAddress:
            input.shippingAddress.address,

          shippingAddress2:
            input.shippingAddress.address2 || null,

          shippingPostalCode:
            input.shippingAddress.postalCode,

          shippingCity:
            input.shippingAddress.city,

          shippingState:
            input.shippingAddress.state || null,

          shippingCountry,

          shippingCountryCode:
            input.shippingAddress.countryCode,

          /* BILLING */

          hasDifferentBillingAddress:
            input.hasDifferentBillingAddress,

          billingFirstName:
            billingAddress?.firstName ?? null,

          billingLastName:
            billingAddress?.lastName ?? null,

          billingAddress:
            billingAddress?.address ?? null,

          billingAddress2:
            billingAddress?.address2 || null,

          billingPostalCode:
            billingAddress?.postalCode ?? null,

          billingCity:
            billingAddress?.city ?? null,

          billingState:
            billingAddress?.state || null,

          billingCountry,

          billingCountryCode:
            billingAddress?.countryCode ?? null,

          /* MONEY */

          subtotal,
          shippingAmount,
          total,
          currency: "EUR",

          /* STATUS */

          status: "PENDING",
          paymentStatus: "PENDING",

          paymentMethod: null,
          paymentReference: null,
          paidAt: null,

          /* EMAIL */

          confirmationEmailSent: false,
          confirmationEmailSentAt: null,

          adminNotificationEmailSent: false,
          adminNotificationEmailSentAt: null,

          /* DOCUMENT */

          confirmationDocumentNumber,

          confirmationDocumentUrl: null,

          /* NOTES */

          customerNote:
            input.customerNote || null,

          adminNote: null,

          /* ITEMS */

          items: {
            create: preparedItems.map(
              (item) => ({
                productId: item.productId,

                productName: item.productName,

                /*
                 * IMAGE DU PRODUIT
                 *
                 * Elle est enregistrée avec la commande.
                 * Même si le produit est modifié plus tard,
                 * la commande conserve son image.
                 */
                productImage:
                  item.productImage,

                unitPrice: item.unitPrice,

                quantity: item.quantity,

                totalPrice:
                  item.totalPrice,
              })
            ),
          },
        },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,

          customerFirstName: true,
          customerLastName: true,
          customerEmail: true,
          customerPhone: true,

          shippingFirstName: true,
          shippingLastName: true,
          shippingAddress: true,
          shippingAddress2: true,
          shippingPostalCode: true,
          shippingCity: true,
          shippingState: true,
          shippingCountry: true,

          hasDifferentBillingAddress: true,

          billingFirstName: true,
          billingLastName: true,
          billingAddress: true,
          billingAddress2: true,
          billingPostalCode: true,
          billingCity: true,
          billingState: true,
          billingCountry: true,

          subtotal: true,
          shippingAmount: true,
          total: true,
          currency: true,

          confirmationDocumentNumber: true,

          customerNote: true,

          items: {
            select: {
              productName: true,

              /*
               * IMAGE RÉCUPÉRÉE POUR LES E-MAILS
               */
              productImage: true,

              unitPrice: true,
              quantity: true,
              totalPrice: true,
            },
          },
        },
      });

      return order as CreatedOrder;
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel
          .Serializable,

      maxWait: 5_000,

      timeout: 15_000,
    }
  );
}

/* =========================================================
   CREATE EMAIL DATA

   Conversion de la commande Prisma vers le format attendu
   par lib/order-email.ts.
   ========================================================= */

function createOrderEmailData(
  order: CreatedOrder
): Omit<OrderEmailData, "adminEmail"> {
  const billingAddress =
    order.hasDifferentBillingAddress &&
    order.billingFirstName &&
    order.billingLastName &&
    order.billingAddress &&
    order.billingPostalCode &&
    order.billingCity &&
    order.billingCountry
      ? {
          firstName:
            order.billingFirstName,

          lastName:
            order.billingLastName,

          address:
            order.billingAddress,

          address2:
            order.billingAddress2,

          postalCode:
            order.billingPostalCode,

          city:
            order.billingCity,

          state:
            order.billingState,

          country:
            order.billingCountry,
        }
      : null;

  return {
    orderNumber: order.orderNumber,

    confirmationDocumentNumber:
      order.confirmationDocumentNumber ??
      createConfirmationDocumentNumber(
        order.orderNumber
      ),

    createdAt: order.createdAt,

    customer: {
      firstName:
        order.customerFirstName,

      lastName:
        order.customerLastName,

      email:
        order.customerEmail,

      phone:
        order.customerPhone,
    },

    shippingAddress: {
      firstName:
        order.shippingFirstName,

      lastName:
        order.shippingLastName,

      address:
        order.shippingAddress,

      address2:
        order.shippingAddress2,

      postalCode:
        order.shippingPostalCode,

      city:
        order.shippingCity,

      state:
        order.shippingState,

      country:
        order.shippingCountry,
    },

    hasDifferentBillingAddress:
      order.hasDifferentBillingAddress,

    billingAddress,

    /*
     * Chaque produit transporte automatiquement
     * son image sauvegardée dans OrderItem.productImage.
     */
    items: order.items.map((item) => ({
      productName:
        item.productName,

      productImage:
        item.productImage,

      quantity:
        item.quantity,

      unitPrice:
        decimalToNumber(
          item.unitPrice
        ),

      totalPrice:
        decimalToNumber(
          item.totalPrice
        ),
    })),

    subtotal:
      decimalToNumber(
        order.subtotal
      ),

    shippingAmount:
      decimalToNumber(
        order.shippingAmount
      ),

    total:
      decimalToNumber(
        order.total
      ),

    currency: "EUR",

    customerNote:
      order.customerNote,
  };
}

/* =========================================================
   SEND EMAILS

   IMPORTANT :
   La commande existe déjà avant cette fonction.

   Une panne Resend ne détruit donc jamais la commande.
   ========================================================= */

async function processOrderEmails(
  order: CreatedOrder
): Promise<void> {
  try {
    const emailData =
      createOrderEmailData(order);

    const result =
      await sendOrderEmails(
        emailData
      );

    const now = new Date();

    const updateData: {
      confirmationEmailSent?: boolean;
      confirmationEmailSentAt?: Date | null;
      adminNotificationEmailSent?: boolean;
      adminNotificationEmailSentAt?: Date | null;
    } = {};

    /* =====================================================
       CUSTOMER EMAIL
       ===================================================== */

    if (result.customer.sent) {
      updateData.confirmationEmailSent =
        true;

      updateData.confirmationEmailSentAt =
        now;
    }

    /* =====================================================
       ADMIN EMAIL
       ===================================================== */

    if (result.admin.sent) {
      updateData.adminNotificationEmailSent =
        true;

      updateData.adminNotificationEmailSentAt =
        now;
    }

    /* =====================================================
       DATABASE EMAIL STATUS
       ===================================================== */

    if (
      Object.keys(updateData).length > 0
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },

        data: updateData,
      });
    }

    /* =====================================================
       LOG CUSTOMER FAILURE
       ===================================================== */

    if (!result.customer.sent) {
      console.error(
        "[NACHTKRONE_CUSTOMER_EMAIL_FAILED]",
        {
          orderId: order.id,
          orderNumber:
            order.orderNumber,
          error:
            result.customer.error,
        }
      );
    }

    /* =====================================================
       LOG ADMIN FAILURE
       ===================================================== */

    if (!result.admin.sent) {
      console.error(
        "[NACHTKRONE_ADMIN_EMAIL_FAILED]",
        {
          orderId: order.id,
          orderNumber:
            order.orderNumber,
          error:
            result.admin.error,
        }
      );
    }
  } catch (error) {
    /*
     * IMPORTANT :
     *
     * On ne relance pas l'erreur.
     *
     * La commande est déjà correctement enregistrée.
     * Une panne Resend ne doit jamais transformer une
     * commande valide en erreur côté client.
     */

    console.error(
      "[NACHTKRONE_ORDER_EMAIL_PROCESSING_ERROR]",
      {
        orderId: order.id,
        orderNumber:
          order.orderNumber,
        error,
      }
    );
  }
}

/* =========================================================
   POST
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  /* =======================================================
     ORIGIN
     ======================================================= */

  if (hasInvalidOrigin(request)) {
    return errorResponse(
      "INVALID_ORIGIN",
      "Die Anfrage konnte aus Sicherheitsgründen nicht verarbeitet werden.",
      403
    );
  }

  /* =======================================================
     CONTENT TYPE
     ======================================================= */

  if (!hasJsonContentType(request)) {
    return errorResponse(
      "UNSUPPORTED_MEDIA_TYPE",
      "Die Anfrage muss als JSON gesendet werden.",
      415
    );
  }

  /* =======================================================
     BODY
     ======================================================= */

  const bodyResult =
    await readJsonBody(request);

  if (!bodyResult.success) {
    if (
      bodyResult.type ===
      "too_large"
    ) {
      return errorResponse(
        "REQUEST_TOO_LARGE",
        "Die übermittelten Daten sind zu groß.",
        413
      );
    }

    return errorResponse(
      "INVALID_JSON",
      "Die übermittelten Daten konnten nicht gelesen werden.",
      400
    );
  }

  /* =======================================================
     VALIDATION
     ======================================================= */

  const validation =
    validateCreateOrderInput(
      bodyResult.data
    );

  if (!validation.success) {
    const validationMessage =
      findFirstValidationError(
        validation.errors
      ) ??
      "Bitte überprüfen Sie Ihre Angaben.";

    return errorResponse(
      "VALIDATION_ERROR",
      validationMessage,
      400
    );
  }

  const input = validation.data;

  /* =======================================================
     PREPARE PRODUCTS
     ======================================================= */

  let preparation: Awaited<
    ReturnType<
      typeof prepareOrderItems
    >
  >;

  try {
    preparation =
      await prepareOrderItems(
        input
      );
  } catch (error) {
    console.error(
      "[NACHTKRONE_ORDER_PREPARATION_ERROR]",
      error
    );

    return errorResponse(
      "ORDER_PREPARATION_FAILED",
      "Die Bestellung konnte derzeit nicht vorbereitet werden.",
      500
    );
  }

  if (!preparation.success) {
    return errorResponse(
      preparation.code,
      preparation.message,
      preparation.status
    );
  }

  /* =======================================================
     CREATE ORDER
     ======================================================= */

  for (
    let attempt = 1;
    attempt <=
    ORDER_NUMBER_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const orderNumber =
      generateOrderNumber();

    try {
      const order =
        await createOrderTransaction(
          input,
          preparation.items,
          preparation.subtotal,
          orderNumber
        );

      /* ===================================================
         EMAILS

         À ce moment précis :
         - la commande existe
         - les OrderItem existent
         - productImage existe
         - le stock est déjà sécurisé

         On peut donc envoyer automatiquement les e-mails.
         =================================================== */

      await processOrderEmails(
        order
      );

      /* ===================================================
         RESPONSE
         =================================================== */

      const response: CreateOrderSuccessResponse =
        {
          success: true,

          order: {
            id: order.id,

            orderNumber:
              order.orderNumber,

            status:
              order.status,

            createdAt:
              order.createdAt.toISOString(),
          },
        };

      return successResponse(
        response
      );
    } catch (error) {
      /* ===================================================
         STOCK
         =================================================== */

      if (
        error instanceof
        StockConflictError
      ) {
        return errorResponse(
          "INSUFFICIENT_STOCK",
          `Für „${error.productName}“ ist die gewünschte Menge nicht mehr verfügbar.`,
          409
        );
      }

      /* ===================================================
         SERIALIZATION CONFLICT

         On traite P2034 AVANT P2002.

         La transaction précédente est annulée entièrement,
         donc une nouvelle tentative est sûre.
         =================================================== */

      if (
        isPrismaRetryableTransactionError(
          error
        ) &&
        attempt <
          ORDER_NUMBER_MAX_ATTEMPTS
      ) {
        continue;
      }

      /* ===================================================
         UNIQUE COLLISION
         =================================================== */

      if (
        isPrismaUniqueError(error) &&
        attempt <
          ORDER_NUMBER_MAX_ATTEMPTS
      ) {
        continue;
      }

      console.error(
        "[NACHTKRONE_CREATE_ORDER_ERROR]",
        error
      );

      return errorResponse(
        "ORDER_CREATION_FAILED",
        "Ihre Bestellung konnte derzeit nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        500
      );
    }
  }

  /* =======================================================
     FALLBACK
     ======================================================= */

  return errorResponse(
    "ORDER_CREATION_FAILED",
    "Ihre Bestellung konnte derzeit nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    500
  );
}