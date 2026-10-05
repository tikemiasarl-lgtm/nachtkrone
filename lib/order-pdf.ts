import {
  CHECKOUT_CONTACT,
  formatCheckoutPrice,
} from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — ORDER CONFIRMATION DOCUMENT
   lib/order-pdf.ts

   VERSION FINALE MISE À JOUR

   Ce fichier construit le document de confirmation
   de commande utilisé par le système d'e-mail.

   IMPORTANT :
   - ce document est une BESTELLBESTÄTIGUNG
   - ce n'est PAS une facture
   - ce n'est PAS un reçu
   - ce n'est PAS une confirmation de paiement
   - les images viennent automatiquement de
     OrderItem.productImage
   - plusieurs produits sont supportés
   - toutes les données dynamiques sont échappées
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type OrderPdfItem = {
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type OrderPdfAddress = {
  firstName: string;
  lastName: string;

  address: string;
  address2?: string | null;

  postalCode: string;
  city: string;

  state?: string | null;

  country: string;
};

export type OrderPdfData = {
  orderNumber: string;

  confirmationDocumentNumber: string;

  createdAt: Date;

  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  shippingAddress: OrderPdfAddress;

  hasDifferentBillingAddress: boolean;

  billingAddress?: OrderPdfAddress | null;

  items: OrderPdfItem[];

  subtotal: number;

  shippingAmount: number;

  total: number;

  currency: "EUR";

  customerNote?: string | null;
};

export type OrderPdfDocument = {
  filename: string;
  title: string;
  html: string;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const DOCUMENT_TITLE =
  "Bestellbestätigung";

const DOCUMENT_LANGUAGE = "de";

const DOCUMENT_LOCALE = "de-DE";

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
   TEXT NORMALIZATION
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
   IMAGE URL

   Les images des produits sont enregistrées dans :

   Product.mainImage
        ↓
   OrderItem.productImage
        ↓
   OrderPdfItem.productImage

   Pour les e-mails / documents HTML, l'image doit être
   accessible publiquement avec une URL absolue.

   Supabase Storage public fonctionne parfaitement ici.
   ========================================================= */

function normalizeImageUrl(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const url = value.trim();

  if (!url) {
    return null;
  }

  if (
    url.startsWith("data:image/")
  ) {
    return url;
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
  amount: number
): string {
  return formatCheckoutPrice(
    normalizeMoney(amount)
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

function formatDocumentDate(
  date: Date
): string {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    DOCUMENT_LOCALE,
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",

      timeZone: "Europe/Berlin",
    }
  ).format(date);
}

/* =========================================================
   FILENAME
   ========================================================= */

function sanitizeFilenamePart(
  value: string
): string {
  return value
    .trim()
    .replace(
      /[^A-Za-z0-9_-]/g,
      "-"
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* =========================================================
   VALIDATION
   ========================================================= */

function assertOrderPdfData(
  data: OrderPdfData
): void {
  if (
    !normalizeText(
      data.orderNumber
    )
  ) {
    throw new Error(
      "Order confirmation requires an order number."
    );
  }

  if (
    !normalizeText(
      data.confirmationDocumentNumber
    )
  ) {
    throw new Error(
      "Order confirmation requires a document number."
    );
  }

  if (
    !(data.createdAt instanceof Date) ||
    Number.isNaN(
      data.createdAt.getTime()
    )
  ) {
    throw new Error(
      "Order confirmation requires a valid creation date."
    );
  }

  if (
    !normalizeText(
      data.customer.firstName
    ) ||
    !normalizeText(
      data.customer.lastName
    )
  ) {
    throw new Error(
      "Order confirmation requires a customer name."
    );
  }

  if (
    !normalizeText(
      data.customer.email
    )
  ) {
    throw new Error(
      "Order confirmation requires a customer email."
    );
  }

  if (
    !Array.isArray(data.items) ||
    data.items.length === 0
  ) {
    throw new Error(
      "Order confirmation requires at least one order item."
    );
  }

  for (const item of data.items) {
    if (
      !normalizeText(
        item.productName
      )
    ) {
      throw new Error(
        "Every order item requires a product name."
      );
    }

    if (
      !Number.isFinite(
        item.quantity
      ) ||
      item.quantity <= 0
    ) {
      throw new Error(
        "Every order item requires a valid quantity."
      );
    }
  }
}

/* =========================================================
   ADDRESS HTML
   ========================================================= */

function renderAddress(
  address: OrderPdfAddress
): string {
  const lines: string[] = [];

  lines.push(
    `${escapeHtml(
      address.firstName
    )} ${escapeHtml(
      address.lastName
    )}`
  );

  lines.push(
    escapeHtml(
      address.address
    )
  );

  if (
    normalizeText(
      address.address2
    )
  ) {
    lines.push(
      escapeHtml(
        address.address2
      )
    );
  }

  lines.push(
    `${escapeHtml(
      address.postalCode
    )} ${escapeHtml(
      address.city
    )}`
  );

  if (
    normalizeText(
      address.state
    )
  ) {
    lines.push(
      escapeHtml(
        address.state
      )
    );
  }

  lines.push(
    escapeHtml(
      address.country
    )
  );

  return lines
    .filter(Boolean)
    .join("<br />");
}

/* =========================================================
   ADDRESS TEXT
   ========================================================= */

function renderAddressText(
  address: OrderPdfAddress
): string {
  const lines: string[] = [
    `${address.firstName} ${address.lastName}`,
    address.address,
  ];

  if (
    normalizeText(
      address.address2
    )
  ) {
    lines.push(
      address.address2 ?? ""
    );
  }

  lines.push(
    `${address.postalCode} ${address.city}`
  );

  if (
    normalizeText(
      address.state
    )
  ) {
    lines.push(
      address.state ?? ""
    );
  }

  lines.push(
    address.country
  );

  return lines
    .filter(Boolean)
    .join("\n");
}

/* =========================================================
   PRODUCT IMAGE

   IMAGE AUTOMATIQUE.

   Si productImage contient une URL Supabase publique,
   l'image réelle du produit apparaît.

   Si aucune image valide n'est disponible, on affiche
   proprement un placeholder NACHTKRONE.
   ========================================================= */

function renderProductImage(
  item: OrderPdfItem
): string {
  const imageUrl =
    normalizeImageUrl(
      item.productImage
    );

  if (!imageUrl) {
    return `
      <div
        class="product-image product-image-empty"
      >
        <span>NACHTKRONE</span>
      </div>
    `;
  }

  return `
    <div class="product-image">
      <img
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(
          item.productName
        )}"
      />
    </div>
  `;
}

/* =========================================================
   ORDER ITEMS
   ========================================================= */

function renderOrderItems(
  items: OrderPdfItem[]
): string {
  return items
    .map((item) => {
      const quantity =
        normalizeQuantity(
          item.quantity
        );

      const unitPrice =
        normalizeMoney(
          item.unitPrice
        );

      const totalPrice =
        normalizeMoney(
          item.totalPrice
        );

      return `
        <tr>
          <td class="product-cell">
            <div class="product-wrapper">

              ${renderProductImage(
                item
              )}

              <div class="product-copy">
                <div class="product-name">
                  ${escapeHtml(
                    item.productName
                  )}
                </div>

                <div
                  class="mobile-product-meta"
                >
                  Menge: ${quantity}

                  <br />

                  Einzelpreis:
                  ${escapeHtml(
                    formatMoney(
                      unitPrice
                    )
                  )}
                </div>
              </div>

            </div>
          </td>

          <td
            class="
              table-center
              desktop-value
            "
          >
            ${quantity}
          </td>

          <td
            class="
              table-right
              desktop-value
            "
          >
            ${escapeHtml(
              formatMoney(
                unitPrice
              )
            )}
          </td>

          <td
            class="
              table-right
              table-total
            "
          >
            ${escapeHtml(
              formatMoney(
                totalPrice
              )
            )}
          </td>
        </tr>
      `;
    })
    .join("");
}

/* =========================================================
   CUSTOMER NOTE
   ========================================================= */

function renderCustomerNote(
  note?: string | null
): string {
  const normalized =
    normalizeText(note);

  if (!normalized) {
    return "";
  }

  return `
    <section class="section">
      <h2>
        Hinweis zur Bestellung
      </h2>

      <div class="info-card">
        <p class="note-text">
          ${escapeHtml(
            normalized
          )}
        </p>
      </div>
    </section>
  `;
}

/* =========================================================
   BILLING ADDRESS
   ========================================================= */

function renderBillingAddress(
  data: OrderPdfData
): string {
  if (
    !data.hasDifferentBillingAddress
  ) {
    return `
      <div class="address-card">

        <div class="address-label">
          Rechnungsadresse
        </div>

        <div class="address-content">
          Wie Lieferadresse
        </div>

      </div>
    `;
  }

  if (!data.billingAddress) {
    return `
      <div class="address-card">

        <div class="address-label">
          Rechnungsadresse
        </div>

        <div class="address-content">
          Nicht angegeben
        </div>

      </div>
    `;
  }

  return `
    <div class="address-card">

      <div class="address-label">
        Rechnungsadresse
      </div>

      <div class="address-content">
        ${renderAddress(
          data.billingAddress
        )}
      </div>

    </div>
  `;
}

/* =========================================================
   SHIPPING DISPLAY
   ========================================================= */

function renderShippingAmount(
  shippingAmount: number
): string {
  if (shippingAmount > 0) {
    return `
      <strong>
        ${escapeHtml(
          formatMoney(
            shippingAmount
          )
        )}
      </strong>
    `;
  }

  return `
    <span class="shipping-pending">
      Wird separat bestätigt
    </span>
  `;
}

/* =========================================================
   COMPLETE HTML DOCUMENT
   ========================================================= */

export function createOrderConfirmationHtml(
  data: OrderPdfData
): string {
  assertOrderPdfData(data);

  const subtotal =
    normalizeMoney(
      data.subtotal
    );

  const shippingAmount =
    normalizeMoney(
      data.shippingAmount
    );

  const total =
    normalizeMoney(
      data.total
    );

  const formattedDate =
    formatDocumentDate(
      data.createdAt
    );

  const itemsHtml =
    renderOrderItems(
      data.items
    );

  return `<!DOCTYPE html>
<html lang="${DOCUMENT_LANGUAGE}">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    ${escapeHtml(
      DOCUMENT_TITLE
    )}
    ${escapeHtml(
      data.orderNumber
    )}
  </title>

  <style>
    * {
      box-sizing: border-box;
    }

    html {
      margin: 0;
      padding: 0;
      background: #eef2f7;
    }

    body {
      margin: 0;
      padding: 32px 16px;

      background: #eef2f7;

      color: #0f172a;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size: 14px;
      line-height: 1.55;
    }

    .document {
      width: 100%;
      max-width: 900px;

      margin: 0 auto;

      overflow: hidden;

      border: 1px solid #dbe3ee;
      border-radius: 18px;

      background: #ffffff;

      box-shadow:
        0 18px 50px
        rgba(15, 23, 42, 0.08);
    }

    .header {
      padding: 28px 34px;

      background:
        linear-gradient(
          135deg,
          #071a33 0%,
          #0c294e 100%
        );

      color: #ffffff;
    }

    .brand {
      margin: 0;

      font-size: 27px;
      font-weight: 900;
      letter-spacing: 0.8px;
    }

    .brand-blue {
      color: #1598ff;
    }

    .brand-gold {
      color: #f1b73c;
    }

    .header-subtitle {
      margin-top: 8px;

      color: #d7e4f5;

      font-size: 13px;
      font-weight: 600;
    }

    .content {
      padding: 32px 34px;
    }

    .title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;

      gap: 24px;

      margin-bottom: 28px;
    }

    h1 {
      margin: 0;

      color: #071a33;

      font-size: 28px;
      line-height: 1.2;
    }

    .intro {
      max-width: 520px;

      margin: 8px 0 0;

      color: #475569;

      font-size: 14px;
    }

    .order-reference {
      min-width: 220px;

      padding: 14px 16px;

      border: 1px solid #dbe3ee;
      border-radius: 12px;

      background: #f8fafc;
    }

    .reference-label {
      margin-bottom: 3px;

      color: #64748b;

      font-size: 11px;
      font-weight: 700;

      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .reference-value {
      color: #0f172a;

      font-size: 14px;
      font-weight: 800;

      word-break: break-word;
    }

    .reference-date {
      margin-top: 8px;

      color: #64748b;

      font-size: 12px;
    }

    .document-number {
      margin-top: 12px;

      padding-top: 12px;

      border-top: 1px solid #dbe3ee;
    }

    .section {
      margin-top: 30px;
    }

    .section:first-child {
      margin-top: 0;
    }

    h2 {
      margin:
        0
        0
        12px;

      color: #071a33;

      font-size: 18px;
      line-height: 1.3;
    }

    .info-grid {
      display: grid;

      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );

      gap: 12px;
    }

    .info-card,
    .address-card {
      padding: 16px;

      border: 1px solid #dbe3ee;
      border-radius: 12px;

      background: #ffffff;
    }

    .info-label,
    .address-label {
      margin-bottom: 6px;

      color: #64748b;

      font-size: 11px;
      font-weight: 800;

      text-transform: uppercase;
      letter-spacing: 0.45px;
    }

    .info-value,
    .address-content {
      color: #0f172a;

      font-size: 14px;
      font-weight: 600;

      word-break: break-word;
    }

    .address-grid {
      display: grid;

      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );

      gap: 12px;
    }

    .order-table-wrapper {
      overflow: hidden;

      border: 1px solid #dbe3ee;
      border-radius: 12px;
    }

    table {
      width: 100%;

      border-collapse: collapse;
      border-spacing: 0;
    }

    thead {
      background: #f8fafc;
    }

    th {
      padding: 12px 14px;

      border-bottom:
        1px solid #dbe3ee;

      color: #64748b;

      font-size: 11px;
      font-weight: 800;

      text-align: left;
      text-transform: uppercase;

      letter-spacing: 0.4px;
    }

    td {
      padding: 14px;

      border-bottom:
        1px solid #e7edf5;

      vertical-align: middle;
    }

    tbody tr:last-child td {
      border-bottom: 0;
    }

    .table-center {
      text-align: center;
    }

    .table-right {
      text-align: right;

      white-space: nowrap;
    }

    .table-total {
      font-weight: 800;
    }

    .product-wrapper {
      display: flex;

      align-items: center;

      gap: 12px;
    }

    .product-image {
      display: flex;

      width: 70px;
      height: 70px;

      flex:
        0
        0
        70px;

      align-items: center;
      justify-content: center;

      overflow: hidden;

      border:
        1px solid #e2e8f0;

      border-radius: 10px;

      background: #f8fafc;
    }

    .product-image img {
      display: block;

      width: 100%;
      height: 100%;

      object-fit: contain;
    }

    .product-image-empty {
      padding: 6px;

      color: #94a3b8;

      font-size: 9px;
      font-weight: 800;

      text-align: center;
    }

    .product-copy {
      min-width: 0;
    }

    .product-name {
      color: #0f172a;

      font-size: 13px;
      font-weight: 800;

      word-break: break-word;
    }

    .mobile-product-meta {
      display: none;

      margin-top: 4px;

      color: #64748b;

      font-size: 11px;
    }

    .summary {
      width: 100%;
      max-width: 390px;

      margin:
        18px
        0
        0
        auto;
    }

    .summary-row {
      display: flex;

      justify-content:
        space-between;

      gap: 20px;

      padding: 6px 0;

      color: #334155;
    }

    .summary-row strong {
      color: #0f172a;
    }

    .summary-total {
      margin-top: 7px;

      padding-top: 12px;

      border-top:
        2px solid #dbe3ee;

      color: #071a33;

      font-size: 18px;
      font-weight: 900;
    }

    .shipping-pending {
      color: #64748b;

      font-size: 12px;
      font-weight: 600;

      text-align: right;
    }

    .notice {
      margin-top: 30px;

      padding: 16px 18px;

      border: 1px solid #bfdbfe;
      border-radius: 12px;

      background: #eff6ff;

      color: #1e3a5f;

      font-size: 13px;
      line-height: 1.6;
    }

    .notice strong {
      color: #0f172a;
    }

    .note-text {
      margin: 0;

      white-space: pre-wrap;
      word-break: break-word;
    }

    .footer {
      padding: 22px 34px;

      border-top:
        1px solid #dbe3ee;

      background: #f8fafc;

      color: #64748b;

      font-size: 12px;
      line-height: 1.65;
    }

    .footer strong {
      color: #0f172a;
    }

    .footer-contact {
      margin-top: 8px;
    }

    @media print {
      html,
      body {
        background: #ffffff;
      }

      body {
        padding: 0;
      }

      .document {
        max-width: none;

        border: 0;
        border-radius: 0;

        box-shadow: none;
      }

      .product-image {
        break-inside: avoid;
      }

      tr {
        break-inside: avoid;
      }
    }

    @media (
      max-width: 640px
    ) {
      body {
        padding: 0;

        background: #ffffff;
      }

      .document {
        border: 0;
        border-radius: 0;

        box-shadow: none;
      }

      .header {
        padding: 22px 20px;
      }

      .brand {
        font-size: 23px;
      }

      .content {
        padding: 24px 20px;
      }

      .title-row {
        display: block;
      }

      h1 {
        font-size: 24px;
      }

      .order-reference {
        margin-top: 18px;
      }

      .info-grid,
      .address-grid {
        grid-template-columns: 1fr;
      }

      .desktop-value {
        display: none;
      }

      .mobile-product-meta {
        display: block;
      }

      th:nth-child(2),
      th:nth-child(3) {
        display: none;
      }

      .product-image {
        width: 58px;
        height: 58px;

        flex-basis: 58px;
      }

      .summary {
        max-width: none;
      }

      .footer {
        padding: 20px;
      }
    }
  </style>
</head>

<body>

  <main class="document">

    <header class="header">

      <div class="brand">
        <span class="brand-blue">
          NACHT
        </span><span
          class="brand-gold"
        >KRONE</span>
      </div>

      <div class="header-subtitle">
        Bestellbestätigung
      </div>

    </header>

    <div class="content">

      <section class="title-row">

        <div>

          <h1>
            Vielen Dank für Ihre Bestellung
          </h1>

          <p class="intro">
            Wir haben Ihre Bestellung erhalten.
            Nachfolgend finden Sie eine
            Zusammenfassung der übermittelten
            Bestelldaten.
          </p>

        </div>

        <div class="order-reference">

          <div class="reference-label">
            Bestellnummer
          </div>

          <div class="reference-value">
            ${escapeHtml(
              data.orderNumber
            )}
          </div>

          <div class="reference-date">
            ${escapeHtml(
              formattedDate
            )}
          </div>

          <div class="document-number">

            <div class="reference-label">
              Dokumentnummer
            </div>

            <div class="reference-value">
              ${escapeHtml(
                data.confirmationDocumentNumber
              )}
            </div>

          </div>

        </div>

      </section>

      <section class="section">

        <h2>
          Kontaktdaten
        </h2>

        <div class="info-grid">

          <div class="info-card">

            <div class="info-label">
              Name
            </div>

            <div class="info-value">
              ${escapeHtml(
                data.customer.firstName
              )}
              ${escapeHtml(
                data.customer.lastName
              )}
            </div>

          </div>

          <div class="info-card">

            <div class="info-label">
              E-Mail-Adresse
            </div>

            <div class="info-value">
              ${escapeHtml(
                data.customer.email
              )}
            </div>

          </div>

          <div class="info-card">

            <div class="info-label">
              Telefonnummer
            </div>

            <div class="info-value">
              ${escapeHtml(
                data.customer.phone
              )}
            </div>

          </div>

          <div class="info-card">

            <div class="info-label">
              Dokumentnummer
            </div>

            <div class="info-value">
              ${escapeHtml(
                data.confirmationDocumentNumber
              )}
            </div>

          </div>

        </div>

      </section>

      <section class="section">

        <h2>
          Adressen
        </h2>

        <div class="address-grid">

          <div class="address-card">

            <div class="address-label">
              Lieferadresse
            </div>

            <div class="address-content">
              ${renderAddress(
                data.shippingAddress
              )}
            </div>

          </div>

          ${renderBillingAddress(
            data
          )}

        </div>

      </section>

      <section class="section">

        <h2>
          Ihre Bestellung
        </h2>

        <div class="order-table-wrapper">

          <table>

            <thead>

              <tr>

                <th>
                  Produkt
                </th>

                <th class="table-center">
                  Menge
                </th>

                <th class="table-right">
                  Einzelpreis
                </th>

                <th class="table-right">
                  Gesamt
                </th>

              </tr>

            </thead>

            <tbody>
              ${itemsHtml}
            </tbody>

          </table>

        </div>

        <div class="summary">

          <div class="summary-row">

            <span>
              Zwischensumme
            </span>

            <strong>
              ${escapeHtml(
                formatMoney(
                  subtotal
                )
              )}
            </strong>

          </div>

          <div class="summary-row">

            <span>
              Versand
            </span>

            ${renderShippingAmount(
              shippingAmount
            )}

          </div>

          <div
            class="
              summary-row
              summary-total
            "
          >

            <span>
              Warenwert
            </span>

            <span>
              ${escapeHtml(
                formatMoney(
                  total
                )
              )}
            </span>

          </div>

        </div>

      </section>

      ${renderCustomerNote(
        data.customerNote
      )}

      <div class="notice">

        <strong>
          Hinweis:
        </strong>

        Diese Bestellbestätigung bestätigt
        den Eingang Ihrer Bestellung bei
        NACHTKRONE.

        Sie ist keine Zahlungsbestätigung
        und kein Zahlungsbeleg.

        Die Versandkosten können separat
        bestätigt werden.

      </div>

    </div>

    <footer class="footer">

      <strong>
        NACHTKRONE
      </strong>

      <div>
        Bei Fragen zu Ihrer Bestellung
        können Sie uns gerne kontaktieren.
      </div>

      <div class="footer-contact">

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

      </div>

      <div
        style="
          margin-top:10px;
        "
      >

        Bestellnummer:

        ${escapeHtml(
          data.orderNumber
        )}

      </div>

    </footer>

  </main>

</body>
</html>`;
}

/* =========================================================
   CREATE DOCUMENT

   IMPORTANT :

   Cette fonction construit la source complète du document.

   Elle garde exactement le contrat utilisé par
   lib/order-email.ts :

   {
     filename,
     title,
     html
   }

   Le HTML contient déjà automatiquement les images
   provenant de OrderItem.productImage.
   ========================================================= */

export function createOrderConfirmationDocument(
  data: OrderPdfData
): OrderPdfDocument {
  assertOrderPdfData(data);

  const safeOrderNumber =
    sanitizeFilenamePart(
      data.orderNumber
    );

  const filename =
    `NACHTKRONE-Bestellbestaetigung-${safeOrderNumber}.pdf`;

  return {
    filename,

    title:
      `${DOCUMENT_TITLE} ${data.orderNumber}`,

    html:
      createOrderConfirmationHtml(
        data
      ),
  };
}

/* =========================================================
   TEXT VERSION
   ========================================================= */

export function createOrderConfirmationText(
  data: OrderPdfData
): string {
  assertOrderPdfData(data);

  const lines: string[] = [
    "NACHTKRONE",

    DOCUMENT_TITLE,

    "",

    `Bestellnummer: ${data.orderNumber}`,

    `Dokumentnummer: ${data.confirmationDocumentNumber}`,

    `Datum: ${formatDocumentDate(
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

  /* =======================================================
     BILLING
     ======================================================= */

  lines.push(
    "",
    "RECHNUNGSADRESSE"
  );

  if (
    data.hasDifferentBillingAddress &&
    data.billingAddress
  ) {
    lines.push(
      renderAddressText(
        data.billingAddress
      )
    );
  } else {
    lines.push(
      "Wie Lieferadresse"
    );
  }

  /* =======================================================
     PRODUCTS
     ======================================================= */

  lines.push(
    "",
    "BESTELLUNG"
  );

  for (const item of data.items) {
    const imageUrl =
      normalizeImageUrl(
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

      imageUrl
        ? `Produktbild: ${imageUrl}`
        : "Produktbild: Nicht verfügbar"
    );
  }

  /* =======================================================
     TOTALS
     ======================================================= */

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

    `Warenwert: ${formatMoney(
      data.total
    )}`
  );

  /* =======================================================
     NOTE
     ======================================================= */

  if (
    normalizeText(
      data.customerNote
    )
  ) {
    lines.push(
      "",

      "HINWEIS ZUR BESTELLUNG",

      normalizeText(
        data.customerNote
      )
    );
  }

  /* =======================================================
     IMPORTANT NOTICE
     ======================================================= */

  lines.push(
    "",

    "HINWEIS:",

    "Diese Bestellbestätigung bestätigt den Eingang Ihrer Bestellung bei NACHTKRONE.",

    "Sie ist keine Zahlungsbestätigung und kein Zahlungsbeleg.",

    "",

    `Telefon / WhatsApp: ${CHECKOUT_CONTACT.whatsappDisplay}`,

    `E-Mail: ${CHECKOUT_CONTACT.email}`
  );

  return lines.join("\n");
}