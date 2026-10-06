import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PUBLIC_IMAGES, PUBLIC_ROUTES } from "@/lib/public-navigation";
import type { HomeProduct } from "./HomeProducts";

export default function HomeBrandStory({ product }: { product?: HomeProduct }) {
  const image = product?.mainImage || PUBLIC_IMAGES.cover;
  const href = product ? "/produkte/" + encodeURIComponent(product.slug) : PUBLIC_ROUTES.products;
  return (
    <section aria-labelledby="home-story-title" className="bg-[#f5f2ec] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto grid max-w-[1404px] items-center gap-10 lg:grid-cols-2 lg:gap-24">
        <Link href={href} className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-[#e7e2d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769e0]">
          <Image src={image} alt={product?.name || "Die Krampuswelt von NACHTKRONE"} fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 text-white sm:p-8"><div><p className="text-[10px] uppercase tracking-[0.25em] text-white/70">Im Fokus</p><p className="mt-2 max-w-sm text-lg font-medium leading-snug">{product?.name || "Entdecke die Kollektion"}</p></div><ArrowUpRight aria-hidden="true" className="h-6 w-6 shrink-0" /></div>
        </Link>
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#87734e]">Charakter bis ins Detail</p>
          <h2 id="home-story-title" className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-[#07111f] sm:text-5xl">Mehr als ein Kost?m.<br /><span className="font-serif font-normal italic text-[#87734e]">Dein Ausdruck.</span></h2>
          <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base">Markante H?rner, eindrucksvolle Gesichter und au?ergew?hnliche Silhouetten. Finde einen Look, der zu dir passt ? f?r Krampusl?ufe, Perchten-Events und besondere N?chte.</p>
          <div className="mt-9 space-y-0 border-t border-[#dcd6cb]">
            {[['01', 'Deinen Look entdecken', 'Masken, Kost?me oder ein komplettes Set ausw?hlen.'], ['02', 'Details ansehen', 'Bilder, Preise und Verf?gbarkeit direkt am Produkt pr?fen.'], ['03', 'Pers?nlich Kontakt aufnehmen', 'Fragen zu deiner Auswahl? Wir sind ?ber WhatsApp erreichbar.']].map(([number, title, text]) => <div key={number} className="flex gap-5 border-b border-[#dcd6cb] py-5"><span className="pt-1 font-mono text-xs text-[#87734e]">{number}</span><div><h3 className="text-sm font-semibold text-[#07111f]">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>)}
          </div>
          <Link href={PUBLIC_ROUTES.contact} className="mt-8 inline-flex min-h-12 items-center gap-4 text-sm font-semibold text-[#07111f] hover:text-[#1769e0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769e0]">Kontakt & Beratung <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
