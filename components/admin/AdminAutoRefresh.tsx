"use client";

import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

const LIVE_PAGES = new Set(["/admin", "/admin/orders", "/admin/customers", "/admin/products"]);

export default function AdminAutoRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const enabled = LIVE_PAGES.has(pathname);

  useEffect(() => {
    if (!enabled) return;
    let lastRefresh = Date.now();
    const refresh = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || isPending) return;
      // Leave search fields and other controls undisturbed while typing.
      if (document.activeElement?.matches("input, textarea, select, [contenteditable=true]")) return;
      if (Date.now() - lastRefresh < 1000) return;
      lastRefresh = Date.now();
      startTransition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [enabled, pathname, router, isPending]);

  if (!enabled) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <p>Actualisation automatique toutes les 15 secondes lorsque cette page est active.</p>
      <button type="button" disabled={isPending} onClick={() => startTransition(() => router.refresh())}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold text-[#071b3a] disabled:opacity-50">
        {isPending ? "Actualisation..." : "Actualiser les données"}
      </button>
    </div>
  );
}
