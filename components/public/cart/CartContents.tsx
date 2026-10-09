
"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  MessageCircle,
  Minus,
  PackageOpen,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  removeCartItem,
  setCartQuantity,
  useCart,
} from "@/lib/cart";

import { getWhatsAppUrl } from "@/lib/public-navigation";

type Product = {
  id: string;
  name: string;
  slug: string;
  mainImage: string;
  price: string;
  promotionalPrice: string | null;
  stock: number;
};

type CartResult = {
  ids: string;
  products: Product[];
  error?: string;
};

const money = (cents: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);

const unitCents = (product: Product) => {
  const price = Number(product.price);
  const promotionalPrice =
    product.promotionalPrice !== null
      ? Number(product.promotionalPrice)
      : null;

  const hasPromotion =
    promotionalPrice !== null &&
    Number.isFinite(promotionalPrice) &&
    promotionalPrice > 0 &&
    promotionalPrice < price;

  return Math.round(
    (hasPromotion ? promotionalPrice : price) * 100,
  );
};

export default function CartContents() {
  const cart = useCart();

  const ids = cart
    .map((item) => item.productId)
    .sort()
    .join(",");

  const [result, setResult] = useState<CartResult | null>(
    null,
  );

  const [actionError, setActionError] = useState("");

  /* =====================================================
     PRODUITS DU PANIER
  ===================================================== */

  useEffect(() => {
    if (!ids) {
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch(
          "/api/cart/products?ids=" +
            encodeURIComponent(ids),
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            "Der Warenkorb konnte nicht geladen werden. Bitte laden Sie die Seite erneut.",
          );
        }

        const data: { products?: Product[] } =
          await response.json();

        if (!Array.isArray(data.products)) {
          throw new Error(
            "Ungültige Produktdaten. Bitte laden Sie die Seite erneut.",
          );
        }

        if (!controller.signal.aborted) {
          setResult({
            ids,
            products: data.products,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            ids,
            products: [],
            error:
              error instanceof Error
                ? error.message
                : "Der Warenkorb konnte nicht geladen werden.",
          });
        }
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [ids]);

  /* =====================================================
     DONNÉES ET VALIDATION
  ===================================================== */

  const ready = result?.ids === ids && !result.error;

  const lines = cart.map((item) => ({
    item,
    product: ready
      ? result.products.find(
          (product) => product.id === item.productId,
        )
      : undefined,
  }));

  const valid =
    ready &&
    lines.every(
      ({ item, product }) =>
        product !== undefined &&
        product.stock > 0 &&
        product.stock >= item.quantity &&
        item.quantity >= 1 &&
        Number.isFinite(unitCents(product)),
    );

  const total = lines.reduce(
    (sum, { item, product }) =>
      sum +
      (product
        ? unitCents(product) * item.quantity
        : 0),
    0,
  );

  const quantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const loadError =
    result?.ids === ids ? result.error : undefined;

  /* =====================================================
     MESSAGE WHATSAPP
  ===================================================== */

  const message = [
    "Hallo NACHTKRONE, ich möchte folgende Produkte bestellen:",
    ...lines.map(({ item, product }) =>
      product
        ? product.name +
          " × " +
          item.quantity +
          " — " +
          money(unitCents(product) * item.quantity)
        : "",
    ),
    "Gesamt (ohne Versand): " + money(total),
    "Bitte bestätigen Sie Verfügbarkeit und Versandkosten.",
  ].join("\n");

  /* =====================================================
     ACTIONS
  ===================================================== */

  function change(
    id: string,
    nextQuantity: number,
    stock: number,
  ) {
    try {
      if (
        !Number.isInteger(nextQuantity) ||
        nextQuantity < 1 ||
        nextQuantity > stock
      ) {
        return;
      }

      setCartQuantity(id, nextQuantity, stock);
      setActionError("");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Änderung fehlgeschlagen.",
      );
    }
  }

  function remove(id: string) {
    try {
      removeCartItem(id);
      setActionError("");
    } catch {
      setActionError(
        "Der Warenkorb konnte nicht gespeichert werden.",
      );
    }
  }

  /* =====================================================
     AFFICHAGE
  ===================================================== */

  return (
    <section
      className="min-h-[65vh] bg-[#f7f5f0] pb-16 text-[#07111f] sm:pb-24"
      aria-labelledby="cart-title"
    >
      {/* EN-TÊTE */}

      <div className="bg-[#07111f] px-5 pb-14 pt-8 text-white sm:px-8 sm:pb-20 sm:pt-12 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <nav
            aria-label="Brotkrumennavigation"
            className="mb-8 flex items-center gap-2 text-xs text-slate-400"
          >
            <Link
              href="/"
              className="hover:text-[#e8d5b2]"
            >
              Startseite
            </Link>

            <ChevronRight
              className="h-3 w-3"
              aria-hidden="true"
            />

            <span
              aria-current="page"
              className="text-[#dcc49b]"
            >
              Warenkorb
            </span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#dcc49b]">
                Deine NACHTKRONE Auswahl
              </p>

              <h1
                id="cart-title"
                className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl"
              >
                Dein Warenkorb.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                Dein nächster Auftritt beginnt hier.
                Prüfe deine Auswahl und stelle deine
                Bestellanfrage.
              </p>
            </div>

            <Link
              href="/produkte"
              className="inline-flex min-h-11 items-center gap-3 border-b border-white/25 text-sm text-[#e8d5b2] hover:border-[#e8d5b2] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Weiter einkaufen
              <ArrowUpRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* CONTENU */}

      <div className="mx-auto -mt-6 max-w-[1400px] px-5 sm:-mt-8 sm:px-8 lg:px-12">
        {!cart.length ? (
          /* PANIER VIDE */

          <div className="relative rounded-2xl border border-[#e5dfd5] bg-white px-6 py-16 text-center shadow-sm sm:py-24">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f7f5f0] text-[#8b6533]">
              <ShoppingBag
                className="h-8 w-8"
                strokeWidth={1.25}
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-7 text-2xl font-semibold tracking-tight sm:text-3xl">
              Noch Platz für deinen nächsten Look.
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500">
              Dein Warenkorb ist noch leer. Entdecke
              unsere Masken, Kostüme und Sets und finde
              deinen Favoriten.
            </p>

            <Link
              href="/produkte"
              className="mt-8 inline-flex min-h-13 items-center gap-4 rounded-md bg-[#07111f] px-6 py-4 text-sm font-semibold text-[#e8d5b2] hover:bg-[#14253b] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Kollektion entdecken
              <ArrowRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        ) : (
          <div className="relative grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
            {/* PRODUITS */}

            <div className="min-w-0">
              <div className="rounded-2xl border border-[#e5dfd5] bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-[#eee9e1] px-5 py-5 sm:px-7">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Deine Auswahl
                  </h2>

                  <span className="rounded-full bg-[#f7f5f0] px-3 py-1.5 text-xs text-slate-600">
                    {quantity} Artikel
                  </span>
                </div>

                {!ready && !loadError && (
                  <p
                    role="status"
                    className="px-5 py-5 text-sm text-slate-500"
                  >
                    Preise und Verfügbarkeit werden
                    geladen...
                  </p>
                )}

                {loadError && (
                  <p
                    role="alert"
                    className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {loadError}
                  </p>
                )}

                {actionError && (
                  <p
                    role="alert"
                    className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {actionError}
                  </p>
                )}

                <div className="divide-y divide-[#eee9e1]">
                  {lines.map(({ item, product }) => (
                    <article
                      key={item.productId}
                      className="p-5 sm:p-7"
                    >
                      {product ? (
                        <div className="flex items-start gap-4 sm:gap-6">
                          {/* IMAGE */}

                          <Link
                            href={
                              "/produkte/" +
                              encodeURIComponent(product.slug)
                            }
                            aria-label={product.name}
                            className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-[#eee9e1] bg-[#f7f5f0] sm:h-40 sm:w-32"
                          >
                            <Image
                              src={product.mainImage}
                              alt={product.name}
                              fill
                              sizes="(min-width: 640px) 128px, 96px"
                              className="object-contain p-2 sm:p-3"
                            />
                          </Link>

                          {/* INFORMATIONS */}

                          <div className="min-w-0 flex-1">
                            <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#8b6533]">
                              NACHTKRONE
                            </p>

                            <Link
                              href={
                                "/produkte/" +
                                encodeURIComponent(product.slug)
                              }
                              className="text-sm font-semibold leading-6 hover:text-[#8b6533] sm:text-base"
                            >
                              {product.name}
                            </Link>

                            <p className="mt-2 text-xs text-slate-500">
                              {money(unitCents(product))} / Stück
                            </p>

                            {/* QUANTITÉ ET TOTAL */}

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center rounded-lg border border-[#dcd5c9]">
                                <button
                                  type="button"
                                  aria-label={
                                    "Menge verringern: " +
                                    product.name
                                  }
                                  disabled={
                                    item.quantity <= 1 ||
                                    product.stock === 0
                                  }
                                  onClick={() =>
                                    change(
                                      item.productId,
                                      item.quantity - 1,
                                      product.stock,
                                    )
                                  }
                                  className="flex h-11 w-10 items-center justify-center rounded-l-lg hover:bg-[#f7f5f0] focus-visible:outline-2 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                  <Minus
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                </button>

                                <input
                                  aria-label={
                                    "Menge für " +
                                    product.name
                                  }
                                  type="number"
                                  min={1}
                                  max={Math.max(
                                    1,
                                    product.stock,
                                  )}
                                  value={item.quantity}
                                  disabled={
                                    product.stock === 0
                                  }
                                  onChange={(event) =>
                                    change(
                                      item.productId,
                                      Number(
                                        event.target.value,
                                      ),
                                      product.stock,
                                    )
                                  }
                                  className="h-11 w-12 border-x border-[#eee9e1] bg-transparent text-center text-sm font-semibold outline-offset-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />

                                <button
                                  type="button"
                                  aria-label={
                                    "Menge erhöhen: " +
                                    product.name
                                  }
                                  disabled={
                                    item.quantity >=
                                    product.stock
                                  }
                                  onClick={() =>
                                    change(
                                      item.productId,
                                      item.quantity + 1,
                                      product.stock,
                                    )
                                  }
                                  className="flex h-11 w-10 items-center justify-center rounded-r-lg hover:bg-[#f7f5f0] focus-visible:outline-2 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                  <Plus
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>

                              <p className="text-base font-semibold tabular-nums sm:text-lg">
                                {money(
                                  unitCents(product) *
                                    item.quantity,
                                )}
                              </p>
                            </div>

                            {/* STOCK */}

                            {item.quantity >
                            product.stock ? (
                              <p className="mt-3 text-xs leading-5 text-red-700">
                                Nur {product.stock} verfügbar.
                                Bitte Menge reduzieren oder
                                Produkt entfernen.
                              </p>
                            ) : (
                              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700">
                                <Check
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                Auf Lager
                              </p>
                            )}

                            {/* SUPPRESSION */}

                            <button
                              type="button"
                              onClick={() =>
                                remove(item.productId)
                              }
                              aria-label={
                                "Entfernen: " +
                                product.name
                              }
                              className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-xs text-slate-500 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                              <Trash2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Entfernen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-4">
                          <PackageOpen
                            className="h-6 w-6 text-slate-400"
                            aria-hidden="true"
                          />

                          <p className="flex-1 text-sm text-slate-500">
                            {ready
                              ? "Dieses Produkt ist nicht mehr verfügbar."
                              : "Produkt wird geladen..."}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              remove(item.productId)
                            }
                            className="min-h-11 rounded-lg border border-[#e5dfd5] px-3 text-xs text-red-700"
                          >
                            Entfernen
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>

              <p className="mt-5 flex items-start gap-2 px-1 text-xs leading-6 text-slate-500">
                <Truck
                  className="mt-1 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                Verfügbarkeit und Versandkosten werden bei
                der Bestätigung deiner Anfrage mitgeteilt.
              </p>
            </div>

            {/* RÉCAPITULATIF */}

            <aside
              aria-labelledby="cart-summary-title"
              className="space-y-4 lg:sticky lg:top-24"
            >
              <div className="overflow-hidden rounded-2xl border border-[#e5dfd5] bg-white shadow-sm">
                <div className="border-b border-[#eee9e1] px-6 py-5">
                  <h2
                    id="cart-summary-title"
                    className="text-lg font-semibold tracking-tight"
                  >
                    Bestellübersicht
                  </h2>
                </div>

                <div className="p-6">
                  <dl className="space-y-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">
                        Zwischensumme
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {ready ? money(total) : "—"}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">
                        Versand
                      </dt>
                      <dd className="text-right text-xs text-slate-500">
                        Nach Bestätigung
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4 border-t border-[#eee9e1] pt-5">
                      <dt className="font-semibold">
                        Gesamt ohne Versand
                      </dt>
                      <dd className="text-xl font-semibold tabular-nums">
                        {ready ? money(total) : "—"}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-2 text-right text-[10px] uppercase tracking-wider text-slate-400">
                    EUR
                  </p>

                  {valid ? (
                    <a
                      href={getWhatsAppUrl(message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 flex min-h-14 items-center justify-center gap-3 rounded-md bg-[#07111f] px-4 text-sm font-semibold text-[#e8d5b2] hover:bg-[#14253b] focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      <MessageCircle
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                      Bestellung per WhatsApp
                      <ArrowUpRight
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </a>
                  ) : (
                    <div className="mt-6 rounded-lg bg-[#f7f5f0] p-4 text-xs leading-6 text-slate-600">
                      {ready
                        ? "Bitte prüfe die nicht verfügbaren Artikel, bevor du deine Anfrage sendest."
                        : "Die Bestellanfrage ist verfügbar, sobald Preise und Bestand geprüft sind."}
                    </div>
                  )}

                  <p className="mt-4 text-xs leading-6 text-slate-500">
                    Du sendest eine Anfrage per WhatsApp.
                    Verfügbarkeit und Versand werden
                    anschließend bestätigt.
                  </p>
                </div>
              </div>

              {/* AIDE */}

              <div className="rounded-xl border border-[#e5dfd5] bg-[#eeeadf] p-5">
                <p className="text-sm font-semibold">
                  Fragen zu deiner Auswahl?
                </p>

                <p className="mt-2 text-xs leading-6 text-slate-600">
                  Wir helfen dir bei Fragen zu Produkten
                  und deiner Bestellung.
                </p>

                <Link
                  href="/kontakt"
                  className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[#07111f] hover:text-[#8b6533]"
                >
                  Kontakt aufnehmen
                  <ArrowRight
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
