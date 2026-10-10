import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PackageOpen } from "lucide-react";

import {
  PUBLIC_CATEGORY_LABELS,
  PUBLIC_ROUTES,
  type PublicProductCategory,
} from "@/lib/public-navigation";

/* =========================================================
   NACHTKRONE — HOME PRODUCTS
   components/public/home/HomeProducts.tsx

   Section produits de la page d'accueil.

   Le composant :
   - reçoit les produits depuis app/(public)/page.tsx
   - n'effectue aucun fetch côté client
   - affiche uniquement les données transmises par le serveur
   - gère prix normal + prix promotionnel
   - gère les 3 catégories
   - gère le stock
   - responsive mobile / desktop
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type HomeProduct = {
  id: string;
  name: string;
  slug: string;
  category: PublicProductCategory;
  price: string | number;
  promotionalPrice?: string | number | null;
  stock: number;
  mainImage: string;
};

type HomeProductsProps = {
  products: HomeProduct[];
};

/* =========================================================
   FORMATAGE DU PRIX
   ========================================================= */

function formatPrice(
  value: string | number
): string {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

/* =========================================================
   VÉRIFICATION DU PRIX PROMOTIONNEL
   ========================================================= */

function getValidPromotionalPrice(
  price: string | number,
  promotionalPrice?: string | number | null
): number | null {
  if (
    promotionalPrice === null ||
    promotionalPrice === undefined ||
    promotionalPrice === ""
  ) {
    return null;
  }

  const normalPrice = Number(price);
  const promoPrice = Number(promotionalPrice);

  if (
    !Number.isFinite(normalPrice) ||
    !Number.isFinite(promoPrice) ||
    promoPrice <= 0 ||
    promoPrice >= normalPrice
  ) {
    return null;
  }

  return promoPrice;
}

/* =========================================================
   LIEN D'UN PRODUIT
   ========================================================= */

function getProductHref(slug: string): string {
  return `/produkte/${encodeURIComponent(slug)}`;
}

/* =========================================================
   CARTE PRODUIT
   ========================================================= */

function ProductCard({ product }: { product: HomeProduct }) {
  const promotionalPrice = getValidPromotionalPrice(product.price, product.promotionalPrice);
  const inStock = product.stock > 0;
  const discount = promotionalPrice !== null
    ? Math.floor(((Number(product.price) - promotionalPrice) * 100) / Number(product.price))
    : 0;

  return (
    <article className="group flex min-w-0 flex-col">
      <Link href={getProductHref(product.slug)} aria-label={product.name}
        className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-[#e9e4db] bg-[#f4f1eb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8b6533]">
        <Image src={product.mainImage} alt={product.name} fill
          sizes="(max-width: 479px) 100vw, (max-width: 1023px) 50vw, (max-width: 1499px) 25vw, 340px"
          className="object-contain p-4 sm:p-5 motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]" />
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
          {promotionalPrice !== null ? <span className="rounded-full border border-[#d9cbb6] bg-[#e8d5b2] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#07111f]">{discount > 0 ? "−" + discount + " %" : "Angebot"}</span> : <span />}
          {!inStock && <span className="rounded-full bg-[#07111f] px-3 py-1.5 text-[10px] font-medium text-white">Ausverkauft</span>}
        </div>
        <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#07111f] shadow-sm backdrop-blur-sm transition-colors group-hover:border-[#07111f] group-hover:bg-[#07111f] group-hover:text-[#e8d5b2] sm:bottom-4 sm:right-4">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-5 sm:pt-6">
        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#8b6533] sm:text-[10px]">{PUBLIC_CATEGORY_LABELS[product.category]}</p>
        <h3 className="mt-2 min-h-12 text-[15px] font-medium leading-6 tracking-[-0.015em] text-[#07111f] sm:text-base">
          <Link href={getProductHref(product.slug)} className="line-clamp-2 hover:text-[#8b6533] focus-visible:outline-2 focus-visible:outline-offset-2">{product.name}</Link>
        </h3>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={"text-xl font-semibold tabular-nums tracking-[-0.035em] sm:text-2xl " + (promotionalPrice !== null ? "rounded-md border border-[#ead2d5] bg-[#faf0f1] px-2.5 py-1 text-[#96243c]" : "text-[#805b2b]")}>{formatPrice(promotionalPrice ?? product.price)}</span>
          {promotionalPrice !== null && <span className="text-xs tabular-nums text-[#78818b] decoration-[#a8adb4]"><span className="sr-only">Regulärer Preis: </span><s>{formatPrice(product.price)}</s></span>}
        </div>
        <p className={"mt-2 flex items-center gap-2 text-[11px] " + (inStock ? "text-emerald-700" : "text-slate-500")}><span aria-hidden="true" className={"h-1 w-1 rounded-full " + (inStock ? "bg-emerald-600" : "bg-slate-400")} />{inStock ? "Auf Lager" : "Derzeit nicht verfügbar"}</p>
        <div className="mt-auto pt-5">
          <Link href={getProductHref(product.slug)} className="flex min-h-11 items-center justify-between gap-3 border-t border-[#e9e4db] text-xs font-medium text-[#07111f] transition-colors hover:text-[#8b6533] focus-visible:outline-2 focus-visible:outline-offset-2">
            Produkt entdecken <ArrowRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyProducts() {
  return (
    <div className="rounded-2xl border border-[#e9e4db] bg-[#f7f5f0] px-6 py-16 text-center">
      <PackageOpen className="mx-auto h-9 w-9 text-[#8b6533]" strokeWidth={1.25} aria-hidden="true" />
      <h3 className="mt-5 text-2xl font-medium tracking-tight text-[#07111f]">Bald verfügbar</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">Neue Krampus-Masken und Kostüme werden vorbereitet.</p>
    </div>
  );
}

export default function HomeProducts({ products }: HomeProductsProps) {
  return (
    <section id="produkte" aria-labelledby="home-products-title" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 border-b border-[#e9e4db] pb-8 sm:flex-row sm:items-end sm:justify-between lg:pb-10">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8b6533]"><span aria-hidden="true" className="h-px w-8 bg-[#c4a477]" /> NACHTKRONE Kollektion</p>
            <h2 id="home-products-title" className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.12] tracking-[-0.045em] text-[#07111f]">Dein Look.<br /><span className="font-serif font-normal italic text-[#8b6533]">Dein unvergesslicher Auftritt.</span></h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500">Entdecke ausgewählte Masken, Kostüme und Sets für deine Krampus-Saison.</p>
          </div>
          <Link href={PUBLIC_ROUTES.products} className="group inline-flex min-h-12 shrink-0 items-center justify-between gap-8 self-start rounded-md border border-[#d9cbb6] px-5 text-xs font-semibold text-[#07111f] transition-colors hover:border-[#07111f] hover:bg-[#07111f] hover:text-[#e8d5b2] focus-visible:outline-2 focus-visible:outline-offset-4 sm:self-auto">Alle Produkte ansehen <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-8 lg:mt-10">
          {products.length > 0 ? <div className="grid grid-cols-1 gap-x-5 gap-y-9 min-[480px]:grid-cols-2 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-7">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : <EmptyProducts />}
        </div>
        {products.length > 0 && <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#e9e4db] pt-6 sm:flex-row"><p className="text-xs text-slate-500">Noch mehr aus der Welt von NACHTKRONE.</p><Link href={PUBLIC_ROUTES.products} className="inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-[#8b6533] hover:text-[#07111f] focus-visible:outline-2 focus-visible:outline-offset-4">Die gesamte Kollektion entdecken <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>}
      </div>
    </section>
  );
}
