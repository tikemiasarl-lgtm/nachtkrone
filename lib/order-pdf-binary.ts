
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import type {
  OrderPdfData,
  OrderPdfAddress,
} from "@/lib/order-pdf";

import { CHECKOUT_CONTACT } from "@/lib/checkout";

/* =========================================================
   NACHTKRONE — CONFIRMATION DE COMMANDE PDF

   Génération locale du document PDF.
   Aucune donnée de commande n'est envoyée à un
   service externe de conversion.
========================================================= */

export function createOrderConfirmationPdf(
  data: OrderPdfData,
): Buffer {
  /* =======================================================
     INITIALISATION DU DOCUMENT
  ======================================================= */

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    compress: true,
  });

  doc.setProperties({
    title: "Bestellbestätigung " + data.orderNumber,
    author: "NACHTKRONE",
  });

  /* =======================================================
     FORMATAGE DES MONTANTS
  ======================================================= */

  const money = (value: number): string =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  /* =======================================================
     FORMATAGE DES ADRESSES
  ======================================================= */

  const address = (
    value: OrderPdfAddress,
  ): string =>
    [
      value.firstName + " " + value.lastName,
      value.address,
      value.address2,
      value.postalCode + " " + value.city,
      value.state,
      value.country,
    ]
      .filter(Boolean)
      .join("\n");

  /* =======================================================
     POSITION VERTICALE
  ======================================================= */

  let y = 22;

  /* =======================================================
     ÉCRITURE DES PARAGRAPHES
  ======================================================= */

  function paragraph(
    text: string,
    size = 10,
    bold = false,
  ): void {
    doc.setFont(
      "helvetica",
      bold ? "bold" : "normal",
    );

    doc.setFontSize(size);

    const lines: string[] =
      doc.splitTextToSize(text, 174);

    for (const line of lines) {
      if (y > 272) {
        doc.addPage();
        y = 22;
      }

      doc.text(line, 18, y);

      y += size * 0.42 + 1.5;
    }

    y += 3;
  }

  /* =======================================================
     COULEUR PRINCIPALE
  ======================================================= */

  doc.setTextColor(16, 28, 44);

  /* =======================================================
     EN-TÊTE DU DOCUMENT
  ======================================================= */

  paragraph("NACHTKRONE", 22, true);

  paragraph("Bestellbestätigung", 16, true);

  /* =======================================================
     INFORMATIONS DE LA COMMANDE
  ======================================================= */

  const orderDate = new Intl.DateTimeFormat(
    "de-DE",
    {
      timeZone: "Europe/Berlin",
      dateStyle: "medium",
    },
  ).format(new Date(data.createdAt));

  paragraph(
    "Bestellung: " +
      data.orderNumber +
      "\nDokument: " +
      data.confirmationDocumentNumber +
      "\nDatum: " +
      orderDate,
  );

  /* =======================================================
     COORDONNÉES DU CLIENT
  ======================================================= */

  paragraph("Kontaktdaten", 11, true);

  paragraph(
    data.customer.firstName +
      " " +
      data.customer.lastName +
      "\n" +
      data.customer.email +
      "\n" +
      data.customer.phone,
  );

  /* =======================================================
     ADRESSES DE LIVRAISON ET DE FACTURATION
  ======================================================= */

  const addresses = [
    {
      content: address(data.shippingAddress),
    },
  ];

  const heads = ["Lieferadresse"];

  if (
    data.hasDifferentBillingAddress &&
    data.billingAddress
  ) {
    heads.push("Rechnungsadresse");

    addresses.push({
      content: address(data.billingAddress),
    });
  }

  autoTable(doc, {
    startY: y,

    margin: {
      left: 18,
      right: 18,
      top: 20,
      bottom: 22,
    },

    head: [heads],

    body: [addresses],

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4,
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: [16, 28, 44],
    },

    didDrawPage: (hook) => {
      y = (hook.cursor?.y ?? y) + 8;
    },
  });

  /* =======================================================
     TABLEAU DES ARTICLES COMMANDÉS
  ======================================================= */

  autoTable(doc, {
    startY: y,

    margin: {
      left: 18,
      right: 18,
      top: 20,
      bottom: 22,
    },

    head: [
      [
        "Artikel",
        "Menge",
        "Einzelpreis",
        "Gesamt",
      ],
    ],

    body: data.items.map((item) => [
      item.productName,
      String(item.quantity),
      money(item.unitPrice),
      money(item.totalPrice),
    ]),

    theme: "striped",

    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4,
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: [16, 28, 44],
    },

    columnStyles: {
      0: {
        cellWidth: 83,
      },

      1: {
        cellWidth: 18,
        halign: "right",
      },

      2: {
        cellWidth: 34,
        halign: "right",
      },

      3: {
        cellWidth: 39,
        halign: "right",
      },
    },

    didDrawPage: (hook) => {
      y = (hook.cursor?.y ?? y) + 8;
    },
  });

  /* =======================================================
     RÉCAPITULATIF DES MONTANTS
  ======================================================= */

  paragraph(
    "Zwischensumme: " +
      money(data.subtotal) +
      "\nVersand: " +
      money(data.shippingAmount),
    10,
  );

  /* =======================================================
     TOTAL DE LA COMMANDE
  ======================================================= */

  paragraph(
    "Gesamt: " + money(data.total),
    14,
    true,
  );

  /* =======================================================
     NOTE DU CLIENT
  ======================================================= */

  if (data.customerNote?.trim()) {
    paragraph(
      "Ihre Anmerkung",
      11,
      true,
    );

    paragraph(data.customerNote);
  }

  /* =======================================================
     MENTION RELATIVE AU PAIEMENT
  ======================================================= */

  paragraph(
    "Diese Bestellbestätigung ist kein Zahlungsnachweis. Sie bestätigt keinen Zahlungseingang.",
    9,
  );

  /* =======================================================
     CONTACT NACHTKRONE
  ======================================================= */

  paragraph(
    "Fragen zur Bestellung: " +
      CHECKOUT_CONTACT.email,
    9,
  );

  /* =======================================================
     PIED DE PAGE ET NUMÉROTATION
  ======================================================= */

  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);

    doc.setFontSize(8);

    doc.setTextColor(100);

    doc.text(
      "NACHTKRONE | " + data.orderNumber,
      18,
      286,
    );

    doc.text(
      "Seite " + page + " / " + pages,
      192,
      286,
      {
        align: "right",
      },
    );
  }

  /* =======================================================
     GÉNÉRATION DES OCTETS PDF
  ======================================================= */

  return Buffer.from(
    doc.output("arraybuffer"),
  );
}
