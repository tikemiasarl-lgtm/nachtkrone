"use client";
import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {removeCartItem, setCartQuantity, useCart} from "@/lib/cart";
import {getWhatsAppUrl} from "@/lib/public-navigation";
type Product = {id: string; name: string; slug: string; mainImage: string; price: string; promotionalPrice: string | null; stock: number};
const money = (cents: number) => new Intl.NumberFormat("de-DE", {style: "currency", currency: "EUR"}).format(cents / 100);
const unitCents = (p: Product) => Math.round(Number(p.promotionalPrice !== null && Number(p.promotionalPrice) > 0 && Number(p.promotionalPrice) < Number(p.price) ? p.promotionalPrice : p.price) * 100);
export default function CartContents() {
  const cart = useCart();
  const ids = cart.map(item => item.productId).sort().join(",");
  const [result, setResult] = useState<{ids: string; products: Product[]; error?: string} | null>(null);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    fetch("/api/cart/products?ids=" + encodeURIComponent(ids), {cache: "no-store", signal: controller.signal}).then(async response => {
      if (!response.ok) throw new Error("Der Warenkorb konnte nicht geladen werden. Bitte laden Sie die Seite erneut.");
      return response.json();
    }).then(data => {if (!controller.signal.aborted) setResult({ids, products: data.products});}).catch(error => {if (!controller.signal.aborted) setResult({ids, products: [], error: error.message});});
    return () => controller.abort();
  }, [ids]);
  const ready = result?.ids === ids && !result.error;
  const lines = cart.map(item => ({item, product: ready ? result.products.find(p => p.id === item.productId) : undefined}));
  const valid = ready && lines.every(({item, product}) => product && product.stock >= item.quantity);
  const total = lines.reduce((sum, {item, product}) => sum + (product ? unitCents(product) * item.quantity : 0), 0);
  const message = ["Hallo NACHTKRONE, ich m?chte folgende Produkte bestellen:", ...lines.map(({item, product}) => product ? product.name + " ? " + item.quantity + " ? " + money(unitCents(product) * item.quantity) : ""), "Gesamt (ohne Versand): " + money(total), "Bitte best?tigen Sie Verf?gbarkeit und Versandkosten."].join("\n");
  function change(id: string, quantity: number, stock: number) {try {setCartQuantity(id, quantity, stock);setActionError("");} catch (error) {setActionError(error instanceof Error ? error.message : "?nderung fehlgeschlagen.");}}
  function remove(id: string) {try {removeCartItem(id);setActionError("");} catch {setActionError("Der Warenkorb konnte nicht gespeichert werden.");}}
  return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <h1 className="text-3xl font-black">Warenkorb</h1>
    {!cart.length ? <div className="mt-8 rounded-2xl border p-8"><p>Ihr Warenkorb ist leer.</p><Link href="/produkte" className="mt-4 inline-block font-bold text-blue-700">Produkte entdecken ?</Link></div> : <>
      {!ready && !result?.error ? <p role="status" className="mt-6">Produkte werden geladen?</p> : null}
      {result?.ids === ids && result.error ? <p role="alert" className="mt-6 text-red-700">{result.error}</p> : null}
      {actionError ? <p role="alert" className="mt-6 text-red-700">{actionError}</p> : null}
      <div className="mt-6 space-y-4">{lines.map(({item, product}) => <article key={item.productId} className="flex flex-wrap items-center gap-4 rounded-2xl border p-4">
        {product ? <><div className="relative h-24 w-24 shrink-0"><Image src={product.mainImage} alt={product.name} fill sizes="96px" className="object-contain" /></div><div className="min-w-0 flex-1"><Link href={"/produkte/" + product.slug} className="font-bold">{product.name}</Link><p className="mt-1">{money(unitCents(product))}</p><label className="mt-3 flex items-center gap-3">Menge<input aria-label={"Menge f?r " + product.name} type="number" min={1} max={product.stock} value={item.quantity} disabled={product.stock === 0} onChange={event => change(item.productId, Number(event.target.value), product.stock)} className="w-20 rounded-lg border px-2 py-1" /></label>{item.quantity > product.stock ? <p className="mt-2 text-sm text-red-700">Nur {product.stock} verf?gbar. Bitte Menge reduzieren oder Produkt entfernen.</p> : null}</div><strong>{money(unitCents(product) * item.quantity)}</strong></> : <p className="flex-1">{ready ? "Dieses Produkt ist nicht mehr verf?gbar." : "Produkt wird geladen?"}</p>}
        <button type="button" onClick={() => remove(item.productId)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-red-700">Entfernen</button>
      </article>)}</div>
      {ready ? <div className="mt-6 rounded-2xl bg-slate-50 p-6"><p className="flex justify-between text-lg font-bold"><span>Gesamt</span><span>{money(total)}</span></p><p className="mt-2 text-sm text-slate-500">Versandkosten werden bei der Best?tigung mitgeteilt.</p>{valid ? <a href={getWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-xl bg-green-600 px-5 py-3 font-bold text-white">Bestellung per WhatsApp</a> : <p className="mt-4 text-red-700">Bitte pr?fen Sie die nicht verf?gbaren Artikel.</p>}</div> : null}
    </>}
  </section>;
}
