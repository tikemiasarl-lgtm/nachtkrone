"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  ShoppingBag,
  Users,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — SIDEBAR ADMIN
   components/admin/AdminSidebar.tsx
   ========================================================= */

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

/* =========================================================
   NAVIGATION
   ========================================================= */

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Produits",
    href: "/admin/products",
    icon: Boxes,
    exact: true,
  },
  {
    label: "Ajouter un produit",
    href: "/admin/products/new",
    icon: PackagePlus,
    exact: true,
  },
  {
    label: "Commandes",
    href: "/admin/orders",
    icon: ShoppingBag,
    exact: true,
  },
  {
    label: "Clients",
    href: "/admin/customers",
    icon: Users,
    exact: true,
  },
];

/* =========================================================
   COMPOSANT
   ========================================================= */

export default function AdminSidebar({
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  /* =======================================================
     ROUTE ACTIVE
     ======================================================= */

  function isItemActive(item: NavigationItem) {
    if (item.exact) {
      return pathname === item.href;
    }

    return pathname.startsWith(item.href);
  }

  /* =======================================================
     FERMETURE MOBILE
     ======================================================= */

  function closeMobileSidebar() {
    onMobileClose?.();
  }

  /* =======================================================
     DÉCONNEXION
     ======================================================= */

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setLogoutError("");
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      let data: {
        success?: boolean;
        message?: string;
        redirectTo?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        setLogoutError(
          data.message ?? "Impossible de fermer la session."
        );

        return;
      }

      closeMobileSidebar();

      router.replace(data.redirectTo ?? "/admin/login");
      router.refresh();
    } catch {
      setLogoutError(
        "Impossible de fermer la session. Réessaie."
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  /* =======================================================
     CONTENU SIDEBAR
     ======================================================= */

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#03152f] text-white">
      {/* =================================================
          LOGO
          ================================================= */}

      <div className="flex h-[82px] shrink-0 items-center border-b border-white/10 px-5">
        <Link
          href="/admin"
          onClick={closeMobileSidebar}
          className="relative block h-11 w-[205px] max-w-full"
          aria-label="NACHTKRONE - Dashboard"
        >
          <Image
            src="/logo/logo.png"
            alt="NACHTKRONE"
            fill
            priority
            sizes="205px"
            className="object-contain object-left"
          />
        </Link>
      </div>

      {/* =================================================
          IDENTIFICATION ESPACE
          ================================================= */}

      <div className="px-4 pb-3 pt-5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#087cff]/15 text-[#39a2ff]">
            <ShieldCheck
              className="h-5 w-5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-white">
              Administration
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-400">
              NACHTKRONE
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          NAVIGATION
          ================================================= */}

      <nav
        className="flex-1 overflow-y-auto px-4 py-3"
        aria-label="Navigation administrateur"
      >
        <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
          Gestion
        </p>

        <div className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSidebar}
                aria-current={active ? "page" : undefined}
                className={[
                  "group flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition",
                  active
                    ? "bg-[#087cff] text-white shadow-[0_8px_22px_rgba(8,124,255,0.22)]"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-white/[0.04] text-slate-400 group-hover:text-white",
                  ].join(" ")}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </span>

                <span className="truncate">{item.label}</span>

                {active ? (
                  <span
                    aria-hidden="true"
                    className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#f0b51b]"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* =================================================
          DÉCONNEXION
          ================================================= */}

      <div className="shrink-0 border-t border-white/10 p-4">
        {logoutError ? (
          <div
            role="alert"
            className="mb-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-xs font-medium leading-5 text-red-200"
          >
            {logoutError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-bold text-slate-300 transition hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
            {isLoggingOut ? (
              <Loader2
                className="h-[18px] w-[18px] animate-spin"
                aria-hidden="true"
              />
            ) : (
              <LogOut
                className="h-[18px] w-[18px]"
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
          </span>

          <span>
            {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
          </span>
        </button>

        <p className="mt-4 px-3 text-[10px] leading-4 text-slate-600">
          © {new Date().getFullYear()} NACHTKRONE
        </p>
      </div>
    </div>
  );

  /* =======================================================
     RENDU DESKTOP + MOBILE
     ======================================================= */

  return (
    <>
      {/* Desktop */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] lg:block">
        {sidebarContent}
      </aside>

      {/* Overlay mobile */}

      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={closeMobileSidebar}
        className={[
          "fixed inset-0 z-40 bg-[#020b18]/65 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Sidebar mobile */}

      <aside
        aria-hidden={!mobileOpen}
        className={[
          "fixed inset-y-0 left-0 z-50 w-[min(86vw,310px)] shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="absolute right-3 top-5 z-10">
          <button
            type="button"
            onClick={closeMobileSidebar}
            aria-label="Fermer la navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#087cff]/40"
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>
        </div>

        {sidebarContent}
      </aside>
    </>
  );
}