import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { PUBLIC_IMAGES, PUBLIC_ROUTES } from "@/lib/public-navigation";

export default function HomeHero() {
  return (
    <section aria-labelledby="nachtkrone-hero-title" className="relative isolate overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 -z-20">
        <Image src={PUBLIC_IMAGES.cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover object-[54%_center] lg:object-[center_45%]" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#07111f_0%,rgba(7,17,31,0.85)_35%,rgba(7,17,31,0.12)_85%)] lg:bg-[linear-gradient(90deg,rgba(7,17,31,0.97)_0%,rgba(7,17,31,0.9)_28%,rgba(7,17,31,0.35)_62%,rgba(7,17,31,0.08)_100%)]" />
      <div className="mx-auto flex min-h-[720px] max-w-[1500px] flex-col justify-end px-5 pb-8 pt-72 sm:px-8 lg:min-h-[760px] lg:justify-center lg:px-12 lg:py-24">
        <div className="max-w-[650px]">
          <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#dcc49b] sm:text-xs"><span className="h-px w-9 bg-[#dcc49b]" /> Die Welt von NACHTKRONE</p>
          <h1 id="nachtkrone-hero-title" className="text-[clamp(2.8rem,6.5vw,6.2rem)] font-semibold leading-[0.98] tracking-[-0.055em]">Ein Auftritt.<br /><span className="font-serif font-normal italic text-[#e8d5b2]">Unvergesslich.</span></h1>
          <p className="mt-7 max-w-[420px] text-sm leading-7 text-slate-300 sm:text-base">Ausdrucksstarke Krampusmasken, Kost?me und komplette Sets. Entdecke deinen Look f?r die n?chste Nacht.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link href={PUBLIC_ROUTES.products} className="group inline-flex min-h-14 items-center justify-center gap-6 rounded-md bg-[#e8d5b2] px-6 text-sm font-semibold text-[#07111f] transition-colors hover:bg-[#f3e6cd] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Kollektion entdecken <ArrowUpRight aria-hidden="true" className="h-5 w-5 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" /></Link>
            <Link href={PUBLIC_ROUTES.masks} className="inline-flex min-h-12 items-center justify-center border-b border-white/30 px-1 text-sm text-white transition-colors hover:border-[#e8d5b2] hover:text-[#e8d5b2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Unsere Masken ansehen</Link>
          </div>
        </div>
        <div className="mt-12 flex items-end justify-between gap-6 border-t border-white/15 pt-5 lg:mt-20">
          <p className="text-[10px] uppercase leading-5 tracking-[0.2em] text-slate-400">Masken ? Kost?me ? Komplette Sets</p>
          <a href="#produkte" aria-label="Unsere Produktauswahl ansehen" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><ArrowDown aria-hidden="true" className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}
