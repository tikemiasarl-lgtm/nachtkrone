import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Boxes,
  CheckCircle2,
  Clock3,
  PackagePlus,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

/* =========================================================
   NACHTKRONE — DASHBOARD ADMIN
   app/admin/page.tsx
   ========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   FORMATAGE
   ========================================================= */

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("de-DE");

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatMoney(
  value:
    | number
    | string
    | {
        toString(): string;
      }
    | null
    | undefined
) {
  if (value === null || value === undefined) {
    return euroFormatter.format(0);
  }

  const numericValue = Number(value.toString());

  if (!Number.isFinite(numericValue)) {
    return euroFormatter.format(0);
  }

  return euroFormatter.format(numericValue);
}

/* =========================================================
   LABELS DES STATUTS
   ========================================================= */

const orderStatusLabels: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "Préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payé",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

function getOrderStatusClasses(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PROCESSING":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "SHIPPED":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";

    case "DELIVERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    case "REFUNDED":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getPaymentStatusClasses(status: string) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "REFUNDED":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

export default async function AdminDashboardPage() {
  /*
   * Toutes les données sont récupérées directement depuis
   * PostgreSQL avec Prisma.
   *
   * Les requêtes indépendantes sont exécutées en parallèle
   * pour éviter de ralentir inutilement le dashboard.
   */

  const [
    paidRevenue,
    totalOrders,
    paidOrders,
    pendingOrders,
    totalCustomers,
    totalProducts,
    publishedProducts,
    recentOrders,
  ] = await Promise.all([
    /*
     * Chiffre d'affaires réel :
     * uniquement les commandes dont le paiement est PAID.
     */

    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
      },
      _sum: {
        total: true,
      },
    }),

    /*
     * Nombre total de commandes.
     */

    prisma.order.count(),

    /*
     * Commandes payées.
     */

    prisma.order.count({
      where: {
        paymentStatus: "PAID",
      },
    }),

    /*
     * Commandes encore à traiter.
     *
     * On exclut volontairement les commandes terminées,
     * annulées et remboursées.
     */

    prisma.order.count({
      where: {
        status: {
          in: [
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
          ],
        },
      },
    }),

    /*
     * Nombre de clients.
     */

    prisma.customer.count(),

    /*
     * Nombre total de produits.
     */

    prisma.product.count(),

    /*
     * Produits actuellement publiés.
     */

    prisma.product.count({
      where: {
        status: "PUBLISHED",
      },
    }),

    /*
     * 8 dernières commandes avec le client et les articles.
     */

    prisma.order.findMany({
      take: 8,

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        orderNumber: true,
        customerFirstName: true,
        customerLastName: true,
        customerEmail: true,
        total: true,
        currency: true,
        status: true,
        paymentStatus: true,
        createdAt: true,

        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
          },
        },
      },
    }),
  ]);

  const revenue = paidRevenue._sum.total ?? 0;

  /*
   * Nombre total d'articles contenus dans les dernières
   * commandes affichées.
   *
   * Ce calcul concerne uniquement l'affichage du tableau.
   */

  const recentOrdersWithQuantity = recentOrders.map((order) => {
    const quantity = order.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    return {
      ...order,
      quantity,
    };
  });

  /* =======================================================
     CARTES STATISTIQUES
     ======================================================= */

  const statistics = [
    {
      title: "Chiffre d'affaires",
      value: formatMoney(revenue),
      description: "Paiements encaissés",
      icon: Banknote,
      iconClasses: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Commandes",
      value: numberFormatter.format(totalOrders),
      description: `${numberFormatter.format(
        paidOrders
      )} commande${paidOrders > 1 ? "s" : ""} payée${
        paidOrders > 1 ? "s" : ""
      }`,
      icon: ShoppingBag,
      iconClasses: "bg-blue-50 text-[#087cff]",
    },
    {
      title: "Clients",
      value: numberFormatter.format(totalCustomers),
      description: "Clients enregistrés",
      icon: Users,
      iconClasses: "bg-violet-50 text-violet-600",
    },
    {
      title: "Produits",
      value: numberFormatter.format(totalProducts),
      description: `${numberFormatter.format(
        publishedProducts
      )} publié${publishedProducts > 1 ? "s" : ""}`,
      icon: Boxes,
      iconClasses: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* =================================================
          INTRODUCTION
          ================================================= */}

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#087cff]/5"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 right-32 h-44 w-44 rounded-full bg-[#f0b51b]/5"
          />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf3ff] text-[#087cff]">
                  <TrendingUp
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </span>

                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#087cff]">
                  Vue d&apos;ensemble
                </p>
              </div>

              <h2 className="text-2xl font-black tracking-[-0.035em] text-[#071b3a] sm:text-3xl">
                Tableau de bord NACHTKRONE
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Suivez les ventes, les commandes, les clients et
                l&apos;activité de votre catalogue depuis un seul endroit.
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#087cff] px-5 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(8,124,255,0.20)] transition hover:bg-[#006bea] focus:outline-none focus:ring-4 focus:ring-[#087cff]/15"
            >
              <PackagePlus
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              />

              Ajouter un produit
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================
          STATISTIQUES PRINCIPALES
          ================================================= */}

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Statistiques principales"
      >
        {statistics.map((statistic) => {
          const Icon = statistic.icon;

          return (
            <article
              key={statistic.title}
              className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-500">
                    {statistic.title}
                  </p>

                  <p className="mt-3 break-words text-2xl font-black tracking-[-0.035em] text-[#071b3a] sm:text-[28px]">
                    {statistic.value}
                  </p>

                  <p className="mt-2 text-xs font-medium text-slate-400">
                    {statistic.description}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statistic.iconClasses}`}
                >
                  <Icon
                    className="h-6 w-6"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* =================================================
          RÉSUMÉ OPÉRATIONNEL
          ================================================= */}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Commandes à traiter */}

        <Link
          href="/admin/orders"
          className="group rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#087cff]/25 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock3
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-500">
                À traiter
              </p>

              <p className="mt-1 text-2xl font-black text-[#071b3a]">
                {numberFormatter.format(pendingOrders)}
              </p>
            </div>

            <ArrowRight
              className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#087cff]"
              aria-hidden="true"
            />
          </div>
        </Link>

        {/* Paiements encaissés */}

        <Link
          href="/admin/orders"
          className="group rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#087cff]/25 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-500">
                Paiements encaissés
              </p>

              <p className="mt-1 text-2xl font-black text-[#071b3a]">
                {numberFormatter.format(paidOrders)}
              </p>
            </div>

            <ArrowRight
              className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#087cff]"
              aria-hidden="true"
            />
          </div>
        </Link>

        {/* Produits publiés */}

        <Link
          href="/admin/products"
          className="group rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#087cff]/25 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#087cff]">
              <Boxes
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-500">
                Produits publiés
              </p>

              <p className="mt-1 text-2xl font-black text-[#071b3a]">
                {numberFormatter.format(publishedProducts)}
              </p>
            </div>

            <ArrowRight
              className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#087cff]"
              aria-hidden="true"
            />
          </div>
        </Link>
      </section>

      {/* =================================================
          DERNIÈRES COMMANDES
          ================================================= */}

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {/* Header */}

        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText
                className="h-5 w-5 text-[#087cff]"
                aria-hidden="true"
              />

              <h2 className="text-lg font-black tracking-[-0.025em] text-[#071b3a]">
                Dernières commandes
              </h2>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-400">
              Les 8 commandes les plus récentes.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#087cff] transition hover:text-[#006bea]"
          >
            Voir toutes les commandes

            <ArrowRight
              className="h-4 w-4"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* =================================================
            AUCUNE COMMANDE
            ================================================= */}

        {recentOrdersWithQuantity.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ShoppingBag
                className="h-7 w-7"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-5 text-base font-extrabold text-[#071b3a]">
              Aucune commande pour le moment
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Les nouvelles commandes de la boutique apparaîtront
              automatiquement ici.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                VERSION DESKTOP
                ================================================= */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f8fafc]">
                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Commande
                    </th>

                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Client
                    </th>

                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Articles
                    </th>

                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Total
                    </th>

                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Commande
                    </th>

                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Paiement
                    </th>

                    <th className="px-6 py-3.5 text-right text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentOrdersWithQuantity.map((order) => {
                    const firstName =
                      order.customerFirstName ||
                      order.customer?.firstName ||
                      "";

                    const lastName =
                      order.customerLastName ||
                      order.customer?.lastName ||
                      "";

                    const customerName =
                      `${firstName} ${lastName}`.trim() ||
                      "Client";

                    const customerEmail =
                      order.customerEmail ||
                      order.customer?.email ||
                      "—";

                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-[#fafcff]"
                      >
                        <td className="px-6 py-4">
                          <p className="whitespace-nowrap text-sm font-extrabold text-[#071b3a]">
                            #{order.orderNumber}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="max-w-[210px]">
                            <p className="truncate text-sm font-bold text-[#071b3a]">
                              {customerName}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {customerEmail}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="whitespace-nowrap text-sm font-bold text-slate-600">
                            {numberFormatter.format(order.quantity)}{" "}
                            article
                            {order.quantity > 1 ? "s" : ""}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="whitespace-nowrap text-sm font-black text-[#071b3a]">
                            {formatMoney(order.total)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${getOrderStatusClasses(
                              order.status
                            )}`}
                          >
                            {orderStatusLabels[order.status] ??
                              order.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${getPaymentStatusClasses(
                              order.paymentStatus
                            )}`}
                          >
                            {paymentStatusLabels[
                              order.paymentStatus
                            ] ?? order.paymentStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <time
                            dateTime={order.createdAt.toISOString()}
                            title={dateTimeFormatter.format(
                              order.createdAt
                            )}
                            className="whitespace-nowrap text-xs font-semibold text-slate-500"
                          >
                            {dateFormatter.format(order.createdAt)}
                          </time>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* =================================================
                VERSION MOBILE
                ================================================= */}

            <div className="divide-y divide-slate-100 md:hidden">
              {recentOrdersWithQuantity.map((order) => {
                const firstName =
                  order.customerFirstName ||
                  order.customer?.firstName ||
                  "";

                const lastName =
                  order.customerLastName ||
                  order.customer?.lastName ||
                  "";

                const customerName =
                  `${firstName} ${lastName}`.trim() || "Client";

                return (
                  <article
                    key={order.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-[#071b3a]">
                          #{order.orderNumber}
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-slate-500">
                          {customerName}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-black text-[#071b3a]">
                        {formatMoney(order.total)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getOrderStatusClasses(
                          order.status
                        )}`}
                      >
                        {orderStatusLabels[order.status] ??
                          order.status}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getPaymentStatusClasses(
                          order.paymentStatus
                        )}`}
                      >
                        {paymentStatusLabels[
                          order.paymentStatus
                        ] ?? order.paymentStatus}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-400">
                        {numberFormatter.format(order.quantity)}{" "}
                        article
                        {order.quantity > 1 ? "s" : ""}
                      </p>

                      <time
                        dateTime={order.createdAt.toISOString()}
                        className="text-xs font-semibold text-slate-400"
                      >
                        {dateFormatter.format(order.createdAt)}
                      </time>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}