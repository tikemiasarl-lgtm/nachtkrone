
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useTransition,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

/* =========================================================
   NACHTKRONE — ADMIN AUTO REFRESH
   components/admin/AdminAutoRefresh.tsx

   Responsabilités :
   - Actualisation automatique toutes les 15 secondes
   - Actualisation manuelle
   - Uniquement sur les pages autorisées
   - Respect des champs en cours de saisie
   - Vérification de la visibilité de la page
   - Vérification de la connexion Internet
   - Nettoyage des événements et de l'intervalle
========================================================= */

/* =========================================================
   CONFIGURATION
========================================================= */

const REFRESH_INTERVAL = 15_000;

const MIN_REFRESH_DELAY = 1_000;

const LIVE_PAGES = new Set([
  "/admin",
  "/admin/orders",
  "/admin/customers",
  "/admin/products",
]);

/* =========================================================
   COMPOSANT
========================================================= */

export default function AdminAutoRefresh() {
  const pathname = usePathname();
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const lastRefreshRef = useRef(0);

  const pendingRef = useRef(isPending);
  useEffect(() => {
    pendingRef.current = isPending;
  }, [isPending]);

  const enabled = LIVE_PAGES.has(pathname);

  /* =======================================================
     ACTUALISATION MANUELLE
  ======================================================= */

  const manualRefresh = useCallback(() => {
    if (pendingRef.current) {
      return;
    }

    lastRefreshRef.current = Date.now();

    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  /* =======================================================
     ACTUALISATION AUTOMATIQUE
  ======================================================= */

  useEffect(() => {
    if (!enabled) {
      return;
    }

    lastRefreshRef.current = Date.now();

    function refresh() {
      /* PAGE NON VISIBLE */

      if (
        document.visibilityState !== "visible"
      ) {
        return;
      }

      /* ABSENCE DE CONNEXION */

      if (!navigator.onLine) {
        return;
      }

      /* ACTUALISATION DÉJÀ EN COURS */

      if (pendingRef.current) {
        return;
      }

      /* NE PAS PERTURBER UNE SAISIE */

      const activeElement =
        document.activeElement;

      if (
        activeElement?.matches(
          "input, textarea, select, [contenteditable=true]",
        )
      ) {
        return;
      }

      /* ÉVITER LES ACTUALISATIONS TROP RAPPROCHÉES */

      const now = Date.now();

      if (
        now - lastRefreshRef.current <
        MIN_REFRESH_DELAY
      ) {
        return;
      }

      lastRefreshRef.current = now;

      /* ACTUALISER LES DONNÉES */

      startTransition(() => {
        router.refresh();
      });
    }

    /* INTERVALLE DE 15 SECONDES */

    const timer = window.setInterval(
      refresh,
      REFRESH_INTERVAL,
    );

    /* RETOUR SUR L'ONGLET */

    document.addEventListener(
      "visibilitychange",
      refresh,
    );

    /* RETOUR SUR LA FENÊTRE */

    window.addEventListener(
      "focus",
      refresh,
    );

    /* RÉTABLISSEMENT DE LA CONNEXION */

    window.addEventListener(
      "online",
      refresh,
    );

    /* NETTOYAGE */

    return () => {
      window.clearInterval(timer);

      document.removeEventListener(
        "visibilitychange",
        refresh,
      );

      window.removeEventListener(
        "focus",
        refresh,
      );

      window.removeEventListener(
        "online",
        refresh,
      );
    };
  }, [enabled, pathname, router, startTransition]);

  /* =======================================================
     PAGES NON CONCERNÉES
  ======================================================= */

  if (!enabled) {
    return null;
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <p>
        Actualisation automatique toutes les 15 secondes
        lorsque cette page est active.
      </p>

      <button
        type="button"
        disabled={isPending}
        onClick={manualRefresh}
        aria-busy={isPending}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold text-[#071b3a] disabled:opacity-50"
      >
        {isPending
          ? "Actualisation..."
          : "Actualiser les données"}
      </button>
    </div>
  );
}
