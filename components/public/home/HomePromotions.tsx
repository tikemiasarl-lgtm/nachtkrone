"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import type { HomeProduct } from "./HomeProducts";

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

type Props = { products: HomeProduct[]; season: "halloween" | "krampus" | "collection" };

export default function HomePromotions({ products, season }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const count = products.length;
  const current = count ? active % count : 0;

  useEffect(() => {
    if (count < 2 || paused || hovered || focused) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
      if (!motion.matches && document.visibilityState === "visible") {
        timer = setInterval(() => setActive(value => (value + 1) % count), 6000);
      }
    };
    sync();
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      if (timer) clearInterval(timer);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [count, paused, hovered, focused]);

  if (!count) return null;
  const title = season === "halloween" ? "Dein Halloween-Auftritt beginnt hier." : season === "krampus" ? "Bereit für die Krampuszeit." : "Besondere Looks. Besondere Angebote.";
  const label = season === "halloween" ? "Herbst & Halloween" : season === "krampus" ? "Krampus & Perchten" : "NACHTKRONE Auswahl";
  const description = season === "halloween" ? "Entdecke reduzierte Masken und Kostüme für Halloween und die kommende Krampuszeit." : season === "krampus" ? "Ausdrucksstarke Looks für die Saison. Entdecke unsere aktuellen Preisvorteile." : "Ausgewählte Produkte zum reduzierten Preis. Finde deinen nächsten Look.";
  const move = (direction: number) => setActive(value => (value + direction + count) % count);

  return (
    <section aria-labelledby="home-promotions-title" aria-roledescription="Karussell" className="bg-[#f7f5f0] px-5 py-14 sm:px-8 sm:py-20 lg:px-12"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8b6533]"><Sparkles className="h-4 w-4" aria-hidden="true" /> {label} · Aktuelle Angebote</p>
            <h2 id="home-promotions-title" className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#07111f] sm:text-4xl">{title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          {count > 1 && <button type="button" onClick={() => setPaused(value => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d9cbb6] px-4 text-xs font-semibold text-[#07111f] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4">
            {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
            {paused ? "Automatik starten" : "Automatik pausieren"}
          </button>}
        </div>
        <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#07111f] shadow-xl shadow-[#07111f]/10">
          {products.map((product, index) => {
            const visible = index === current;
            const price = Number(product.price);
            const sale = Number(product.promotionalPrice);
            const discount = Math.floor((1 - sale / price) * 100);
            return <article key={product.id} aria-hidden={!visible} inert={!visible} aria-roledescription="Folie" aria-label={String(index + 1) + " von " + count}
              className={"col-start-1 row-start-1 grid min-w-0 md:grid-cols-2 motion-safe:transition-opacity motion-safe:duration-700 " + (visible ? "opacity-100" : "pointer-events-none invisible opacity-0")}>
              <div className="relative min-h-[300px] overflow-hidden bg-[#eeeae3] sm:min-h-[380px] md:min-h-[460px]">
                <Image src={product.mainImage} alt={product.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-5 sm:p-8" />
                <span className="absolute left-5 top-5 rounded-full bg-[#07111f] px-4 py-2 text-xs font-semibold text-[#e8d5b2]">{discount > 0 ? "−" + discount + " %" : "Reduziert"}</span>
              </div>
              <div className="flex flex-col justify-center p-6 text-white sm:p-10 lg:p-14">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#dcc49b]">NACHTKRONE · Saison-Auswahl</p>
                <h3 className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">{product.name}</h3>
                <div className="mt-6 flex flex-wrap items-baseline gap-3"><span className="text-3xl font-semibold text-[#e8d5b2]">{money.format(sale)}</span><span className="text-sm text-slate-400"><span className="sr-only">Regulärer Preis: </span><s>{money.format(price)}</s></span></div>
                <p className="mt-3 text-xs text-slate-300">Du sparst {money.format(price - sale)} gegenüber dem regulären Preis.</p>
                <Link href={"/produkte/" + encodeURIComponent(product.slug)} className="mt-8 inline-flex min-h-12 items-center justify-center gap-4 self-start rounded-md bg-[#e8d5b2] px-6 text-sm font-semibold text-[#07111f] hover:bg-[#f3e6cd] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Angebot ansehen <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </article>;
          })}
        </div>
        {count > 1 && <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs tabular-nums text-slate-500">{current + 1} / {count}</p>
          <div className="flex flex-wrap justify-center gap-1">{products.map((product, index) => <button key={product.id} type="button" aria-label={"Angebot " + (index + 1) + " anzeigen"} aria-current={index === current ? "true" : undefined} onClick={() => setActive(index)} className="flex h-10 w-7 items-center justify-center rounded focus-visible:outline-2"><span className={"h-1.5 rounded-full transition-all motion-reduce:transition-none " + (index === current ? "w-6 bg-[#8b6533]" : "w-1.5 bg-[#c9c1b4]")} /></button>)}</div>
          <div className="flex gap-2"><button type="button" aria-label="Vorheriges Angebot" onClick={() => move(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9cbb6] bg-white hover:bg-[#e8d5b2] focus-visible:outline-2"><ChevronLeft className="h-5 w-5" /></button><button type="button" aria-label="Nächstes Angebot" onClick={() => move(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9cbb6] bg-white hover:bg-[#e8d5b2] focus-visible:outline-2"><ChevronRight className="h-5 w-5" /></button></div>
        </div>}
      </div>
    </section>
  );
}
