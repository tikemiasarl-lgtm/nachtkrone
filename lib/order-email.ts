import {
  CHECKOUT_BRAND,
  CHECKOUT_CONTACT,
  formatCheckoutPrice,
} from "@/lib/checkout";

import {
  createOrderConfirmationDocument,
  createOrderConfirmationText,
  type OrderPdfData,
} from "@/lib/order-pdf";

/* =========================================================
   NACHTKRONE — ORDER EMAIL
   lib/order-email.ts

   VERSION FINALE

   Cette version envoie réellement :

   ADMINISTRATEUR
   - numéro de commande
   - date
   - nom / prénom client
   - e-mail
   - téléphone
   - adresse de livraison
   - adresse de facturation
   - image de chaque produit
   - nom de chaque produit
   - quantité
   - prix unitaire
   - prix total de chaque produit
   - sous-total
   - livraison
   - total de la commande
   - note client
   - statut de paiement

   CLIENT
   - confirmation de commande
   - numéro de commande
   - informations client
   - adresse
   - produits
   - images produits
   - quantités
   - prix
   - total
   - document de confirmation

   IMPORTANT
   - les images viennent automatiquement de
     OrderItem.productImage
   - aucun prix n'est pris depuis le navigateur ici
   - aucun paiement n'est marqué comme payé
   - la clé Resend reste exclusivement côté serveur
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type OrderEmailAttachment = {
  filename: string;
  content: string | Buffer;
  contentType:
    | "application/pdf"
    | "text/html";
};

export type OrderEmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: OrderEmailAttachment[];
};

export type OrderEmailBundle = {
  admin: OrderEmailMessage;
  customer: OrderEmailMessage;
};

export type OrderEmailData =
  OrderPdfData & {
    adminEmail: string;
  };

export type SendOrderEmailsResult = {
  admin: {
    sent: boolean;
    id: string | null;
    error: string | null;
  };

  customer: {
    sent: boolean;
    id: string | null;
    error: string | null;
  };
};

/* =========================================================
   INTERNAL RESEND TYPES
   ========================================================= */

type ResendAttachment = {
  filename: string;
  content: string | Buffer;
  contentType?: string;
};

type ResendSendPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: ResendAttachment[];
};

type ResendApiResponse = {
  id?: string;
  message?: string;
  name?: string;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMAIL_LOCALE = "de-DE";
const EMAIL_TIME_ZONE = "Europe/Berlin";

/* =========================================================
   TEXT
   ========================================================= */

function normalizeText(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(
  value: string
): boolean {
  const email = value.trim();

  if (
    !email ||
    email.length > 254
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/* =========================================================
   MONEY
   ========================================================= */

function normalizeMoney(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return (
    Math.round(
      Math.max(0, value) * 100
    ) / 100
  );
}

function formatMoney(
  value: number
): string {
  return formatCheckoutPrice(
    normalizeMoney(value)
  );
}

/* =========================================================
   QUANTITY
   ========================================================= */

function normalizeQuantity(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(value)
  );
}

/* =========================================================
   DATE
   ========================================================= */

function formatOrderDate(
  value: Date
): string {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    EMAIL_LOCALE,
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: EMAIL_TIME_ZONE,
    }
  ).format(value);
}

/* =========================================================
   IMAGE URL

   Product.mainImage
          ↓
   OrderItem.productImage
          ↓
   data.items[].productImage
          ↓
   EMAIL ADMIN + EMAIL CLIENT

   Aucune image n'est saisie manuellement.
   ========================================================= */

function normalizeEmailImageUrl(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const url = value.trim();

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:"
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/* =========================================================
   ADDRESS HTML
   ========================================================= */

function renderAddressHtml(
  address: OrderPdfData["shippingAddress"]
): string {
  const rows: string[] = [];

  rows.push(
    `${escapeHtml(
      address.firstName
    )} ${escapeHtml(
      address.lastName
    )}`
  );

  rows.push(
    escapeHtml(address.address)
  );

  if (
    normalizeText(address.address2)
  ) {
    rows.push(
      escapeHtml(address.address2)
    );
  }

  rows.push(
    `${escapeHtml(
      address.postalCode
    )} ${escapeHtml(
      address.city
    )}`
  );

  if (
    normalizeText(address.state)
  ) {
    rows.push(
      escapeHtml(address.state)
    );
  }

  rows.push(
    escapeHtml(address.country)
  );

  return rows.join("<br />");
}

/* =========================================================
   ADDRESS TEXT
   ========================================================= */

function renderAddressText(
  address: OrderPdfData["shippingAddress"]
): string {
  const rows: string[] = [
    `${address.firstName} ${address.lastName}`,
    address.address,
  ];

  if (
    normalizeText(address.address2)
  ) {
    rows.push(
      address.address2 ?? ""
    );
  }

  rows.push(
    `${address.postalCode} ${address.city}`
  );

  if (
    normalizeText(address.state)
  ) {
    rows.push(
      address.state ?? ""
    );
  }

  rows.push(address.country);

  return rows
    .filter(Boolean)
    .join("\n");
}

/* =========================================================
   PRODUCT IMAGE HTML
   ========================================================= */

function renderProductImageHtml(
  productName: string,
  productImage: string | null
): string {
  const imageUrl =
    normalizeEmailImageUrl(
      productImage
    );

  if (!imageUrl) {
    return `
      <div
        style="
          width:84px;
          height:84px;
          border:1px solid #e2e8f0;
          border-radius:12px;
          background:#f8fafc;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#64748b;
          font-size:9px;
          font-weight:800;
          text-align:center;
        "
      >
        NACHTKRONE
      </div>
    `;
  }

  return `
    <img
      src="${escapeHtml(imageUrl)}"
      alt="${escapeHtml(productName)}"
      width="84"
      height="84"
      style="
        display:block;
        width:84px;
        height:84px;
        object-fit:contain;
        border:1px solid #e2e8f0;
        border-radius:12px;
        background:#ffffff;
      "
    />
  `;
}

/* =========================================================
   REFERENCE
   ========================================================= */

function renderReferenceHtml(
  data: OrderEmailData
): string {
  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin-bottom:24px;
        border:1px solid #dbe3ee;
        border-radius:12px;
        background:#f8fafc;
      "
    >
      <tr>
        <td
          style="
            padding:16px;
          "
        >
          <div
            style="
              color:#64748b;
              font-size:11px;
              font-weight:800;
              text-transform:uppercase;
            "
          >
            Bestellnummer
          </div>

          <div
            style="
              margin-top:4px;
              color:#0f172a;
              font-size:17px;
              font-weight:900;
            "
          >
            ${escapeHtml(
              data.orderNumber
            )}
          </div>

          <div
            style="
              margin-top:5px;
              color:#64748b;
              font-size:12px;
            "
          >
            ${escapeHtml(
              formatOrderDate(
                data.createdAt
              )
            )}
          </div>

          <div
            style="
              margin-top:12px;
              padding-top:12px;
              border-top:1px solid #e2e8f0;
            "
          >
            <div
              style="
                color:#64748b;
                font-size:11px;
                font-weight:800;
                text-transform:uppercase;
              "
            >
              Dokumentnummer
            </div>

            <div
              style="
                margin-top:3px;
                color:#334155;
                font-size:13px;
                font-weight:700;
              "
            >
              ${escapeHtml(
                data.confirmationDocumentNumber
              )}
            </div>
          </div>
        </td>
      </tr>
    </table>
  `;
}

/* =========================================================
   CUSTOMER INFORMATION
   ========================================================= */

function renderCustomerHtml(
  data: OrderEmailData
): string {
  return `
    <div style="margin-top:24px;">

      <div
        style="
          margin-bottom:10px;
          color:#071a33;
          font-size:17px;
          font-weight:900;
        "
      >
        Kontaktdaten
      </div>

      <div
        style="
          padding:16px;
          border:1px solid #e2e8f0;
          border-radius:12px;
          color:#334155;
          font-size:13px;
          line-height:1.8;
        "
      >
        <strong>
          ${escapeHtml(
            data.customer.firstName
          )}
          ${escapeHtml(
            data.customer.lastName
          )}
        </strong>

        <br />

        E-Mail:
        ${escapeHtml(
          data.customer.email
        )}

        <br />

        Telefon:
        ${escapeHtml(
          data.customer.phone
        )}
      </div>

    </div>
  `;
}

/* =========================================================
   BILLING
   ========================================================= */

function renderBillingHtml(
  data: OrderEmailData
): string {
  if (
    !data.hasDifferentBillingAddress
  ) {
    return `
      <div
        style="
          margin-top:10px;
          padding:16px;
          border:1px solid #e2e8f0;
          border-radius:12px;
        "
      >
        <div
          style="
            margin-bottom:6px;
            color:#64748b;
            font-size:11px;
            font-weight:800;
            text-transform:uppercase;
          "
        >
          Rechnungsadresse
        </div>

        <div
          style="
            color:#334155;
            font-size:13px;
          "
        >
          Wie Lieferadresse
        </div>
      </div>
    `;
  }

  if (!data.billingAddress) {
    return "";
  }

  return `
    <div
      style="
        margin-top:10px;
        padding:16px;
        border:1px solid #e2e8f0;
        border-radius:12px;
      "
    >
      <div
        style="
          margin-bottom:6px;
          color:#64748b;
          font-size:11px;
          font-weight:800;
          text-transform:uppercase;
        "
      >
        Rechnungsadresse
      </div>

      <div
        style="
          color:#334155;
          font-size:13px;
          line-height:1.8;
        "
      >
        ${renderAddressHtml(
          data.billingAddress
        )}
      </div>
    </div>
  `;
}

/* =========================================================
   ADDRESSES
   ========================================================= */

function renderAddressesHtml(
  data: OrderEmailData
): string {
  return `
    <div style="margin-top:24px;">

      <div
        style="
          margin-bottom:10px;
          color:#071a33;
          font-size:17px;
          font-weight:900;
        "
      >
        Adressen
      </div>

      <div
        style="
          padding:16px;
          border:1px solid #e2e8f0;
          border-radius:12px;
        "
      >
        <div
          style="
            margin-bottom:6px;
            color:#64748b;
            font-size:11px;
            font-weight:800;
            text-transform:uppercase;
          "
        >
          Lieferadresse
        </div>

        <div
          style="
            color:#334155;
            font-size:13px;
            line-height:1.8;
          "
        >
          ${renderAddressHtml(
            data.shippingAddress
          )}
        </div>
      </div>

      ${renderBillingHtml(data)}

    </div>
  `;
}

/* =========================================================
   PRODUCTS

   Chaque produit reçoit automatiquement :
   - image
   - nom
   - quantité
   - prix unitaire
   - prix total
   ========================================================= */

function renderItemsHtml(
  data: OrderEmailData
): string {
  return data.items
    .map((item) => {
      const quantity =
        normalizeQuantity(
          item.quantity
        );

      return `
        <tr>
          <td
            style="
              padding:15px 12px;
              border-bottom:1px solid #e8edf4;
              vertical-align:middle;
            "
          >
            <table
              role="presentation"
              cellpadding="0"
              cellspacing="0"
              border="0"
            >
              <tr>
                <td
                  style="
                    padding-right:14px;
                    vertical-align:middle;
                  "
                >
                  ${renderProductImageHtml(
                    item.productName,
                    item.productImage
                  )}
                </td>

                <td
                  style="
                    vertical-align:middle;
                  "
                >
                  <div
                    style="
                      color:#0f172a;
                      font-size:14px;
                      font-weight:800;
                      line-height:1.4;
                    "
                  >
                    ${escapeHtml(
                      item.productName
                    )}
                  </div>

                  <div
                    style="
                      margin-top:5px;
                      color:#64748b;
                      font-size:12px;
                    "
                  >
                    Menge:
                    ${quantity}
                  </div>
                </td>
              </tr>
            </table>
          </td>

          <td
            align="right"
            style="
              padding:15px 12px;
              border-bottom:1px solid #e8edf4;
              color:#475569;
              font-size:13px;
              white-space:nowrap;
              vertical-align:middle;
            "
          >
            ${escapeHtml(
              formatMoney(
                item.unitPrice
              )
            )}
          </td>

          <td
            align="right"
            style="
              padding:15px 12px;
              border-bottom:1px solid #e8edf4;
              color:#0f172a;
              font-size:13px;
              font-weight:900;
              white-space:nowrap;
              vertical-align:middle;
            "
          >
            ${escapeHtml(
              formatMoney(
                item.totalPrice
              )
            )}
          </td>
        </tr>
      `;
    })
    .join("");
}

/* =========================================================
   TOTALS
   ========================================================= */

function renderTotalsHtml(
  data: OrderEmailData
): string {
  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin-top:18px;
      "
    >
      <tr>
        <td
          style="
            padding:6px 0;
            color:#64748b;
            font-size:13px;
          "
        >
          Zwischensumme
        </td>

        <td
          align="right"
          style="
            padding:6px 0;
            color:#0f172a;
            font-size:13px;
            font-weight:700;
          "
        >
          ${escapeHtml(
            formatMoney(
              data.subtotal
            )
          )}
        </td>
      </tr>

      <tr>
        <td
          style="
            padding:6px 0;
            color:#64748b;
            font-size:13px;
          "
        >
          Versand
        </td>

        <td
          align="right"
          style="
            padding:6px 0;
            color:#0f172a;
            font-size:13px;
            font-weight:700;
          "
        >
          ${
            data.shippingAmount > 0
              ? escapeHtml(
                  formatMoney(
                    data.shippingAmount
                  )
                )
              : "Wird separat bestätigt"
          }
        </td>
      </tr>

      <tr>
        <td
          style="
            padding-top:14px;
            border-top:2px solid #e2e8f0;
            color:#071a33;
            font-size:18px;
            font-weight:900;
          "
        >
          Gesamt
        </td>

        <td
          align="right"
          style="
            padding-top:14px;
            border-top:2px solid #e2e8f0;
            color:#071a33;
            font-size:18px;
            font-weight:900;
          "
        >
          ${escapeHtml(
            formatMoney(
              data.total
            )
          )}
        </td>
      </tr>
    </table>
  `;
}

/* =========================================================
   ORDER
   ========================================================= */

function renderOrderHtml(
  data: OrderEmailData
): string {
  return `
    <div style="margin-top:26px;">

      <div
        style="
          margin-bottom:10px;
          color:#071a33;
          font-size:17px;
          font-weight:900;
        "
      >
        Bestellung
      </div>

      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          width:100%;
          border:1px solid #e2e8f0;
          border-radius:12px;
          border-collapse:separate;
          border-spacing:0;
        "
      >
        <thead>
          <tr>
            <th
              align="left"
              style="
                padding:11px 12px;
                border-bottom:1px solid #e2e8f0;
                background:#f8fafc;
                color:#64748b;
                font-size:10px;
                text-transform:uppercase;
              "
            >
              Produkt
            </th>

            <th
              align="right"
              style="
                padding:11px 12px;
                border-bottom:1px solid #e2e8f0;
                background:#f8fafc;
                color:#64748b;
                font-size:10px;
                text-transform:uppercase;
              "
            >
              Einzelpreis
            </th>

            <th
              align="right"
              style="
                padding:11px 12px;
                border-bottom:1px solid #e2e8f0;
                background:#f8fafc;
                color:#64748b;
                font-size:10px;
                text-transform:uppercase;
              "
            >
              Gesamt
            </th>
          </tr>
        </thead>

        <tbody>
          ${renderItemsHtml(data)}
        </tbody>
      </table>

      ${renderTotalsHtml(data)}

    </div>
  `;
}

/* =========================================================
   CUSTOMER NOTE
   ========================================================= */

function renderCustomerNoteHtml(
  note?: string | null
): string {
  const normalized =
    normalizeText(note);

  if (!normalized) {
    return "";
  }

  return `
    <div style="margin-top:24px;">

      <div
        style="
          margin-bottom:8px;
          color:#071a33;
          font-size:15px;
          font-weight:900;
        "
      >
        Hinweis des Kunden
      </div>

      <div
        style="
          padding:14px 16px;
          border:1px solid #e2e8f0;
          border-radius:10px;
          background:#f8fafc;
          color:#334155;
          font-size:13px;
          line-height:1.7;
          white-space:pre-wrap;
        "
      >
        ${escapeHtml(
          normalized
        )}
      </div>

    </div>
  `;
}

/* =========================================================
   EMAIL LAYOUT
   ========================================================= */

function createEmailLayout(
  options: {
    preview: string;
    heading: string;
    intro: string;
    body: string;
  }
): string {
  return `<!doctype html>
<html lang="de">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    ${escapeHtml(
      options.heading
    )}
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#eef2f7;
    color:#0f172a;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      display:none;
      max-height:0;
      overflow:hidden;
      opacity:0;
      color:transparent;
    "
  >
    ${escapeHtml(
      options.preview
    )}
  </div>

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      width:100%;
      background:#eef2f7;
    "
  >
    <tr>
      <td
        align="center"
        style="
          padding:28px 12px;
        "
      >

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            max-width:760px;
            overflow:hidden;
            border:1px solid #dbe3ee;
            border-radius:16px;
            background:#ffffff;
          "
        >

          <tr>
            <td
              style="
                padding:25px 28px;
                background:#071a33;
              "
            >
              <div
                style="
                  color:#ffffff;
                  font-size:25px;
                  font-weight:900;
                  letter-spacing:0.8px;
                "
              >
                <span
                  style="
                    color:#1598ff;
                  "
                >
                  NACHT
                </span><span
                  style="
                    color:#f1b73c;
                  "
                >
                  KRONE
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:30px 28px;
              "
            >
              <h1
                style="
                  margin:0;
                  color:#071a33;
                  font-size:25px;
                  line-height:1.25;
                "
              >
                ${escapeHtml(
                  options.heading
                )}
              </h1>

              <p
                style="
                  margin:10px 0 24px;
                  color:#475569;
                  font-size:14px;
                  line-height:1.7;
                "
              >
                ${escapeHtml(
                  options.intro
                )}
              </p>

              ${options.body}

            </td>
          </tr>

          <tr>
            <td
              style="
                padding:21px 28px;
                border-top:1px solid #dbe3ee;
                background:#f8fafc;
                color:#64748b;
                font-size:12px;
                line-height:1.8;
              "
            >
              <strong
                style="
                  color:#0f172a;
                "
              >
                ${escapeHtml(
                  CHECKOUT_BRAND.name
                )}
              </strong>

              <br />

              Telefon / WhatsApp:
              ${escapeHtml(
                CHECKOUT_CONTACT
                  .whatsappDisplay
              )}

              <br />

              E-Mail:
              ${escapeHtml(
                CHECKOUT_CONTACT.email
              )}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/* =========================================================
   CUSTOMER EMAIL HTML
   ========================================================= */

export function createCustomerOrderEmailHtml(
  data: OrderEmailData
): string {
  const body = `
    ${renderReferenceHtml(data)}

    <div
      style="
        padding:15px 16px;
        border:1px solid #bbf7d0;
        border-radius:10px;
        background:#f0fdf4;
        color:#166534;
        font-size:13px;
        line-height:1.7;
      "
    >
      Ihre Bestellung wurde erfolgreich an
      NACHTKRONE übermittelt.
    </div>

    ${renderCustomerHtml(data)}

    ${renderAddressesHtml(data)}

    ${renderOrderHtml(data)}

    ${renderCustomerNoteHtml(
      data.customerNote
    )}

    <div
      style="
        margin-top:25px;
        padding:15px 16px;
        border:1px solid #bfdbfe;
        border-radius:10px;
        background:#eff6ff;
        color:#1e3a5f;
        font-size:12px;
        line-height:1.7;
      "
    >
      <strong>
        Hinweis:
      </strong>

      Diese Nachricht bestätigt den Eingang
      Ihrer Bestellung.

      Sie ist keine Zahlungsbestätigung und
      kein Zahlungsbeleg.
    </div>
  `;

  return createEmailLayout({
    preview:
      `Bestellbestätigung ${data.orderNumber}`,

    heading:
      "Vielen Dank für Ihre Bestellung",

    intro:
      `Hallo ${data.customer.firstName}, wir haben Ihre Bestellung erhalten. Hier finden Sie alle Informationen zu Ihrer Bestellung.`,

    body,
  });
}

/* =========================================================
   ADMIN EMAIL HTML
   ========================================================= */

export function createAdminOrderEmailHtml(
  data: OrderEmailData
): string {
  const body = `
    ${renderReferenceHtml(data)}

    <div
      style="
        padding:15px 16px;
        border:1px solid #bfdbfe;
        border-radius:10px;
        background:#eff6ff;
        color:#1e3a5f;
        font-size:13px;
        line-height:1.7;
      "
    >
      Eine neue Bestellung wurde über den
      NACHTKRONE-Shop übermittelt.
    </div>

    ${renderCustomerHtml(data)}

    ${renderAddressesHtml(data)}

    ${renderOrderHtml(data)}

    ${renderCustomerNoteHtml(
      data.customerNote
    )}

    <div
      style="
        margin-top:25px;
        padding:15px 16px;
        border:1px solid #fde68a;
        border-radius:10px;
        background:#fffbeb;
        color:#92400e;
        font-size:12px;
        line-height:1.7;
      "
    >
      Zahlungsstatus:

      <strong>
        Noch nicht als bezahlt bestätigt.
      </strong>
    </div>
  `;

  return createEmailLayout({
    preview:
      `Neue Bestellung ${data.orderNumber}`,

    heading:
      "Neue Bestellung eingegangen",

    intro:
      "Eine neue Bestellung wurde über NACHTKRONE übermittelt. Alle Kunden-, Produkt- und Preisinformationen finden Sie unten.",

    body,
  });
}

/* =========================================================
   ADMIN TEXT
   ========================================================= */

export function createAdminOrderEmailText(
  data: OrderEmailData
): string {
  const lines: string[] = [
    "NACHTKRONE",
    "NEUE BESTELLUNG",
    "",

    `Bestellnummer: ${data.orderNumber}`,

    `Dokumentnummer: ${data.confirmationDocumentNumber}`,

    `Datum: ${formatOrderDate(
      data.createdAt
    )}`,

    "",

    "KONTAKTDATEN",

    `${data.customer.firstName} ${data.customer.lastName}`,

    `E-Mail: ${data.customer.email}`,

    `Telefon: ${data.customer.phone}`,

    "",

    "LIEFERADRESSE",

    renderAddressText(
      data.shippingAddress
    ),
  ];

  if (
    data.hasDifferentBillingAddress &&
    data.billingAddress
  ) {
    lines.push(
      "",
      "RECHNUNGSADRESSE",

      renderAddressText(
        data.billingAddress
      )
    );
  } else {
    lines.push(
      "",
      "RECHNUNGSADRESSE",
      "Wie Lieferadresse"
    );
  }

  lines.push(
    "",
    "BESTELLUNG"
  );

  for (
    const item of data.items
  ) {
    const image =
      normalizeEmailImageUrl(
        item.productImage
      );

    lines.push(
      "",
      item.productName,

      `Menge: ${normalizeQuantity(
        item.quantity
      )}`,

      `Einzelpreis: ${formatMoney(
        item.unitPrice
      )}`,

      `Gesamt: ${formatMoney(
        item.totalPrice
      )}`,

      `Bild: ${
        image ??
        "Nicht verfügbar"
      }`
    );
  }

  lines.push(
    "",

    `Zwischensumme: ${formatMoney(
      data.subtotal
    )}`,

    data.shippingAmount > 0
      ? `Versand: ${formatMoney(
          data.shippingAmount
        )}`
      : "Versand: Wird separat bestätigt",

    `GESAMT: ${formatMoney(
      data.total
    )}`,

    "",

    "Zahlungsstatus: Noch nicht als bezahlt bestätigt."
  );

  if (
    normalizeText(
      data.customerNote
    )
  ) {
    lines.push(
      "",
      "HINWEIS DES KUNDEN",

      normalizeText(
        data.customerNote
      )
    );
  }

  return lines.join("\n");
}

/* =========================================================
   CUSTOMER TEXT
   ========================================================= */

export function createCustomerOrderEmailText(
  data: OrderEmailData
): string {
  return createOrderConfirmationText(
    data
  );
}

/* =========================================================
   VALIDATION
   ========================================================= */

function assertOrderEmailData(
  data: OrderEmailData
): void {
  const adminEmail =
    normalizeText(
      data.adminEmail
    ).toLowerCase();

  const customerEmail =
    normalizeText(
      data.customer.email
    ).toLowerCase();

  if (
    !isValidEmail(adminEmail)
  ) {
    throw new Error(
      "A valid administrator email address is required."
    );
  }

  if (
    !isValidEmail(
      customerEmail
    )
  ) {
    throw new Error(
      "A valid customer email address is required."
    );
  }

  if (
    !normalizeText(
      data.orderNumber
    )
  ) {
    throw new Error(
      "An order number is required."
    );
  }

  if (
    !normalizeText(
      data.confirmationDocumentNumber
    )
  ) {
    throw new Error(
      "A confirmation document number is required."
    );
  }

  if (
    !Array.isArray(
      data.items
    ) ||
    data.items.length === 0
  ) {
    throw new Error(
      "At least one order item is required."
    );
  }
}

/* =========================================================
   EMAIL BUNDLE
   ========================================================= */

export function createOrderEmailBundle(
  data: OrderEmailData
): OrderEmailBundle {
  assertOrderEmailData(data);

  const adminEmail =
    data.adminEmail
      .trim()
      .toLowerCase();

  const customerEmail =
    data.customer.email
      .trim()
      .toLowerCase();

  const document =
    createOrderConfirmationDocument(
      data
    );

  /*
   * Le document fourni actuellement par order-pdf.ts
   * contient sa source HTML complète.
   *
   * On ne ment pas sur son type :
   * tant qu'un vrai Buffer PDF n'est pas retourné,
   * la pièce jointe reste HTML.
   */

  const attachmentFilename =
    document.filename.replace(
      /\.pdf$/i,
      ".html"
    );

  const customerAttachment:
    OrderEmailAttachment = {
      filename:
        attachmentFilename,

      content:
        document.html,

      contentType:
        "text/html",
    };

  return {
    admin: {
      to: adminEmail,

      subject:
        `Neue Bestellung ${data.orderNumber} | NACHTKRONE`,

      html:
        createAdminOrderEmailHtml(
          data
        ),

      text:
        createAdminOrderEmailText(
          data
        ),

      replyTo:
        customerEmail,
    },

    customer: {
      to:
        customerEmail,

      subject:
        `Bestellbestätigung ${data.orderNumber} | NACHTKRONE`,

      html:
        createCustomerOrderEmailHtml(
          data
        ),

      text:
        createCustomerOrderEmailText(
          data
        ),

      replyTo:
        CHECKOUT_CONTACT.email,

      attachments: [
        customerAttachment,
      ],
    },
  };
}

/* =========================================================
   DOCUMENT SOURCE
   ========================================================= */

export function createOrderEmailPdfSource(
  data: OrderEmailData
) {
  assertOrderEmailData(data);

  return createOrderConfirmationDocument(
    data
  );
}

/* =========================================================
   ENV
   ========================================================= */

function getRequiredEnv(
  key: string
): string {
  const value =
    process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }

  return value;
}

/* =========================================================
   RESEND
   ========================================================= */

async function sendWithResend(
  apiKey: string,
  payload: ResendSendPayload,
  idempotencyKey: string
): Promise<{
  sent: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    const attachments =
      payload.attachments?.map(
        (attachment) => {
          const content =
            Buffer.isBuffer(
              attachment.content
            )
              ? attachment.content.toString(
                  "base64"
                )
              : Buffer.from(
                  attachment.content,
                  "utf8"
                ).toString(
                  "base64"
                );

          return {
            filename:
              attachment.filename,

            content,

            ...(attachment.contentType
              ? {
                  content_type:
                    attachment.contentType,
                }
              : {}),
          };
        }
      );

    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              idempotencyKey,
          },

          body: JSON.stringify({
            from:
              payload.from,

            to:
              payload.to,

            subject:
              payload.subject,

            html:
              payload.html,

            text:
              payload.text,

            ...(payload.replyTo
              ? {
                  reply_to:
                    payload.replyTo,
                }
              : {}),

            ...(attachments &&
            attachments.length > 0
              ? {
                  attachments,
                }
              : {}),
          }),
        }
      );

    let result:
      ResendApiResponse | null =
      null;

    try {
      result =
        (await response.json()) as
          ResendApiResponse;
    } catch {
      result = null;
    }

    if (!response.ok) {
      return {
        sent: false,
        id: null,

        error:
          result?.message ??
          `Resend request failed with HTTP ${response.status}`,
      };
    }

    return {
      sent: true,

      id:
        result?.id ??
        null,

      error: null,
    };
  } catch (error) {
    return {
      sent: false,
      id: null,

      error:
        error instanceof Error
          ? error.message
          : "Unknown Resend error",
    };
  }
}

/* =========================================================
   MESSAGE -> RESEND
   ========================================================= */

function toResendPayload(
  message: OrderEmailMessage,
  from: string
): ResendSendPayload {
  return {
    from,

    to: [
      message.to,
    ],

    subject:
      message.subject,

    html:
      message.html,

    text:
      message.text,

    replyTo:
      message.replyTo,

    attachments:
      message.attachments?.map(
        (attachment) => ({
          filename:
            attachment.filename,

          content:
            attachment.content,

          contentType:
            attachment.contentType,
        })
      ),
  };
}

/* =========================================================
   SEND ORDER EMAILS

   ENV nécessaires :

   RESEND_API_KEY
   RESEND_FROM_EMAIL
   ORDER_ADMIN_EMAIL

   Exemple :

   RESEND_API_KEY="re_xxxxxxxxx"
   RESEND_FROM_EMAIL="NACHTKRONE <commande@nachtkrone-shop.com>"
   ORDER_ADMIN_EMAIL="contact@nachtkrone-shop.com"

   Ne jamais mettre NEXT_PUBLIC_ devant RESEND_API_KEY.
   ========================================================= */

export async function sendOrderEmails(
  data: Omit<
    OrderEmailData,
    "adminEmail"
  > & {
    adminEmail?: string;
  }
): Promise<SendOrderEmailsResult> {
  const apiKey =
    getRequiredEnv(
      "RESEND_API_KEY"
    );

  const from =
    getRequiredEnv(
      "RESEND_FROM_EMAIL"
    );

  const adminEmail =
    data.adminEmail?.trim() ||
    getRequiredEnv(
      "ORDER_ADMIN_EMAIL"
    );

  const emailData:
    OrderEmailData = {
    ...data,
    adminEmail,
  };

  assertOrderEmailData(
    emailData
  );

  const bundle =
    createOrderEmailBundle(
      emailData
    );

  /* =======================================================
     ADMIN EMAIL
     ======================================================= */

  const adminResult =
    await sendWithResend(
      apiKey,

      toResendPayload(
        bundle.admin,
        from
      ),

      `nachtkrone-order-${emailData.orderNumber}-admin`
    );

  /* =======================================================
     CUSTOMER EMAIL
     ======================================================= */

  const customerResult =
    await sendWithResend(
      apiKey,

      toResendPayload(
        bundle.customer,
        from
      ),

      `nachtkrone-order-${emailData.orderNumber}-customer`
    );

  /* =======================================================
     RESULT
     ======================================================= */

  return {
    admin: {
      sent:
        adminResult.sent,

      id:
        adminResult.id,

      error:
        adminResult.error,
    },

    customer: {
      sent:
        customerResult.sent,

      id:
        customerResult.id,

      error:
        customerResult.error,
    },
  };
}