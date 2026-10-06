import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import { PUBLIC_CONTACT, PUBLIC_ROUTES } from "@/lib/public-navigation";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktiere NACHTKRONE per WhatsApp, Telefon oder E-Mail. Wir helfen dir gerne bei Fragen zu Produkten und Bestellungen.",
};

const questions = [
  { title: "Fragen zu einem Produkt?", text: "Sende uns den Produktnamen oder den Link zur Produktseite und deine Frage. So wissen wir direkt, welcher Look dich interessiert." },
  { title: "Du hast bereits bestellt?", text: "Bitte gib deine Bestellnummer an, wenn du uns zu einer bestehenden Bestellung kontaktierst. Beschreibe kurz, wobei du Unterst?tzung ben?tigst." },
  { title: "Fragen zur Lieferung?", text: "Nenne uns dein Lieferland und das gew?nschte Produkt. Wir helfen dir bei Fragen zur Lieferung und deiner Bestellung weiter." },
];

export default function KontaktPage() {
  return (
    <div className="bg-[#f5f2ec] text-[#07111f]">
      <section aria-labelledby="contact-title" className="relative overflow-hidden bg-[#07111f] px-5 pb-20 pt-8 text-white sm:px-8 lg:px-12 lg:pb-28 lg:pt-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 h-[550px] w-[550px] rounded-full border border-[#dcc49b]/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-[420px] w-[420px] rounded-full border border-[#dcc49b]/10" />
        <div className="relative mx-auto max-w-[1404px]">
          <nav aria-label="Brotkr?melnavigation" className="flex items-center gap-3 text-xs text-slate-400">
            <Link href={PUBLIC_ROUTES.home} className="min-h-10 content-center hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dcc49b]">Startseite</Link>
            <span aria-hidden="true">/</span><span aria-current="page" className="text-[#dcc49b]">Kontakt</span>
          </nav>
          <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-20">
            <div>
              <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#dcc49b]"><span className="h-px w-8 bg-[#dcc49b]" /> Pers?nlich f?r dich da</p>
              <h1 id="contact-title" className="mt-6 text-[clamp(2.8rem,6vw,5.6rem)] font-semibold leading-[1.02] tracking-[-0.05em]">Dein Look.<br /><span className="font-serif font-normal italic text-[#e8d5b2]">Unsere Beratung.</span></h1>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-300 sm:text-base">Ob Produktfrage, Lieferung oder bestehende Bestellung: Kontaktiere NACHTKRONE direkt. Gemeinsam finden wir Antworten auf deine Fragen.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="contact-options-title" className="relative mx-auto -mt-8 max-w-[1500px] px-5 sm:px-8 lg:-mt-12 lg:px-12">
        <h2 id="contact-options-title" className="sr-only">So erreichst du NACHTKRONE</h2>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
          <article className="flex min-w-0 flex-col rounded-xl border border-[#ddd5c7] bg-[#e8d5b2] p-7 sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <MessageCircle aria-hidden="true" className="h-9 w-9" strokeWidth={1.4} />
              <span className="rounded-full border border-[#07111f]/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">Direkter Kontakt</span>
            </div>
            <h3 className="mt-9 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Lass uns sprechen.</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-[#07111f]/70">Schreib uns auf WhatsApp ? zu deiner Auswahl, einem Produkt oder deiner Bestellung.</p>
            <p className="mt-6 text-lg font-medium tracking-tight">{PUBLIC_CONTACT.whatsappDisplay}</p>
            <a href={PUBLIC_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-14 items-center justify-between gap-6 rounded-md bg-[#07111f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#14253c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#07111f]">WhatsApp ?ffnen <ArrowUpRight aria-hidden="true" className="h-5 w-5" /></a>
          </article>
          <div className="grid gap-4 lg:gap-6">
            <ContactOption icon="phone" title="Telefon" description="Du m?chtest direkt mit uns sprechen?" value={PUBLIC_CONTACT.phoneDisplay} href={PUBLIC_CONTACT.phoneHref} action="Jetzt anrufen" />
            <ContactOption icon="email" title="E-Mail" description="F?r deine Fragen und ausf?hrlichen Anliegen." value={PUBLIC_CONTACT.email} href={PUBLIC_CONTACT.emailHref} action="E-Mail senden" />
          </div>
        </div>
      </section>

      <section aria-labelledby="contact-help-title" className="mx-auto grid max-w-[1500px] gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-12 lg:py-24">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#87734e]">Gut zu wissen</p>
          <h2 id="contact-help-title" className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">So k?nnen wir<br />dir weiterhelfen.</h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">Mit ein paar Details k?nnen wir deine Anfrage besser zuordnen. Du kannst uns jederzeit eine Nachricht senden.</p>
        </div>
        <div className="border-t border-[#dcd6cb]">
          {questions.map(({ title, text }, index) => (
            <details key={title} className="group border-b border-[#dcd6cb]" open={index === 0}>
              <summary className="flex min-h-20 cursor-pointer list-none items-center gap-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769e0] [&::-webkit-details-marker]:hidden"><span aria-hidden="true" className="font-mono text-xs text-[#87734e]">0{index + 1}</span><h3 className="flex-1 text-sm font-semibold sm:text-base">{title}</h3><ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform motion-safe:group-open:rotate-180" /></summary>
              <p className="pb-6 pl-8 pr-5 text-sm leading-7 text-slate-600">{text}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="border-t border-[#dcd6cb] bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1404px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><p className="text-sm text-slate-500">Dein n?chster Auftritt beginnt hier.</p><Link href={PUBLIC_ROUTES.products} className="inline-flex min-h-12 items-center gap-3 text-sm font-semibold hover:text-[#1769e0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769e0]"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Zur?ck zur Kollektion</Link></div>
      </div>
    </div>
  );
}

function ContactOption({ icon, title, description, value, href, action }: { icon: "phone" | "email"; title: string; description: string; value: string; href: string; action: string }) {
  const Icon = icon === "phone" ? Phone : Mail;
  return (
    <article className="min-w-0 rounded-xl border border-[#e4dfd5] bg-white p-7 sm:px-9">
      <div className="flex items-center gap-3"><Icon aria-hidden="true" className="h-5 w-5 text-[#87734e]" strokeWidth={1.6} /><h3 className="text-lg font-semibold">{title}</h3></div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <p className="mt-3 break-words text-sm font-medium sm:text-base">{value}</p>
      <a href={href} className="mt-4 inline-flex min-h-11 items-center gap-3 border-b border-[#dcd6cb] text-xs font-semibold transition-colors hover:border-[#87734e] hover:text-[#87734e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769e0]">{action}<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>
    </article>
  );
}
