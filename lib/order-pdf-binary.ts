import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { OrderPdfData, OrderPdfAddress } from "@/lib/order-pdf";
import { CHECKOUT_CONTACT } from "@/lib/checkout";

/** Creates PDF bytes locally; never sends order data to a conversion service. */
export function createOrderConfirmationPdf(data: OrderPdfData): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({ title: "Bestellbestätigung " + data.orderNumber, author: "NACHTKRONE" });
  const money = (value: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
  const address = (value: OrderPdfAddress) => [value.firstName + " " + value.lastName, value.address, value.address2, value.postalCode + " " + value.city, value.state, value.country].filter(Boolean).join("\n");
  let y = 22;
  function paragraph(text: string, size = 10, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(text, 174);
    for (const line of lines) {
      if (y > 272) { doc.addPage(); y = 22; }
      doc.text(line, 18, y); y += size * 0.42 + 1.5;
    }
    y += 3;
  }
  doc.setTextColor(16, 28, 44);
  paragraph("NACHTKRONE", 22, true);
  paragraph("Bestellbestätigung", 16, true);
  paragraph("Bestellung: " + data.orderNumber + "\nDokument: " + data.confirmationDocumentNumber + "\nDatum: " + new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium" }).format(new Date(data.createdAt)));
  paragraph("Kontaktdaten", 11, true);
  paragraph(data.customer.firstName + " " + data.customer.lastName + "\n" + data.customer.email + "\n" + data.customer.phone);
  const addresses = [{ content: address(data.shippingAddress) }];
  const heads = ["Lieferadresse"];
  if (data.hasDifferentBillingAddress && data.billingAddress) { heads.push("Rechnungsadresse"); addresses.push({ content: address(data.billingAddress) }); }
  autoTable(doc, { startY: y, margin: { left: 18, right: 18, top: 20, bottom: 22 }, head: [heads], body: [addresses], theme: "grid", styles: { font: "helvetica", fontSize: 10, cellPadding: 4, overflow: "linebreak" }, headStyles: { fillColor: [16, 28, 44] }, didDrawPage: hook => { y = (hook.cursor?.y ?? y) + 8; } });
  autoTable(doc, { startY: y, margin: { left: 18, right: 18, top: 20, bottom: 22 }, head: [["Artikel", "Menge", "Einzelpreis", "Gesamt"]], body: data.items.map(item => [item.productName, String(item.quantity), money(item.unitPrice), money(item.totalPrice)]), theme: "striped", styles: { font: "helvetica", fontSize: 10, cellPadding: 4, overflow: "linebreak" }, headStyles: { fillColor: [16, 28, 44] }, columnStyles: { 0: { cellWidth: 83 }, 1: { cellWidth: 18, halign: "right" }, 2: { cellWidth: 34, halign: "right" }, 3: { cellWidth: 39, halign: "right" } }, didDrawPage: hook => { y = (hook.cursor?.y ?? y) + 8; } });
  paragraph("Zwischensumme: " + money(data.subtotal) + "\nVersand: " + money(data.shippingAmount), 10);
  paragraph("Gesamt: " + money(data.total), 14, true);
  if (data.customerNote?.trim()) { paragraph("Ihre Anmerkung", 11, true); paragraph(data.customerNote); }
  paragraph("Diese Bestellbestätigung ist kein Zahlungsnachweis. Sie bestätigt keinen Zahlungseingang.", 9);
  paragraph("Fragen zur Bestellung: " + CHECKOUT_CONTACT.email, 9);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) { doc.setPage(page); doc.setFontSize(8); doc.setTextColor(100); doc.text("NACHTKRONE | " + data.orderNumber, 18, 286); doc.text("Seite " + page + " / " + pages, 192, 286, { align: "right" }); }
  return Buffer.from(doc.output("arraybuffer"));
}
