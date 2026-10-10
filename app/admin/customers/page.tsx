import DeleteCustomerButton from "@/components/admin/DeleteCustomerButton";
import Link from "next/link";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

/* =========================================================
   NACHTKRONE — CLIENTS ADMIN
   app/admin/customers/page.tsx
   ========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CUSTOMERS_PER_PAGE = 20;

/* =========================================================
   TYPES
   ========================================================= */

type PageSearchParams = {
  page?: string | string[];
  search?: string | string[];
};

type CustomersPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

/* =========================================================
   HELPERS
   ========================================================= */

function getSingleSearchParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function normalizePage(value: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function formatMoney(
  value:
    | number
    | string
    | {
        toString(): string;
      }
    | null
    | undefined,
  currency = "EUR"
): string {
  const numericValue =
    value === null || value === undefined
      ? 0
      : Number(value.toString());

  const safeValue = Number.isFinite(numericValue)
    ? numericValue
    : 0;

  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue);
  }
}

function formatDate(
  date: Date | null | undefined
): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(
  date: Date | null | undefined
): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildCustomersUrl({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (search) {
    params.set("search", search);
  }

  const query = params.toString();

  return query
    ? `/admin/customers?${query}`
    : "/admin/customers";
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function AdminCustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = searchParams
    ? await searchParams
    : {};

  const requestedPage = normalizePage(
    getSingleSearchParam(params.page)
  );

  const search = getSingleSearchParam(
    params.search
  ).slice(0, 160);

  /* =======================================================
     FILTRE
     ======================================================= */

  const where = search
    ? {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  /* =======================================================
     PAGINATION
     ======================================================= */

  const filteredCustomersCount =
    await prisma.customer.count({
      where,
    });

  const totalPages =
    filteredCustomersCount === 0
      ? 0
      : Math.ceil(
          filteredCustomersCount /
            CUSTOMERS_PER_PAGE
        );

  const currentPage =
    totalPages === 0
      ? 1
      : Math.min(
          requestedPage,
          totalPages
        );

  const skip =
    (currentPage - 1) *
    CUSTOMERS_PER_PAGE;

  /* =======================================================
     DONNÉES
     ======================================================= */

  const [
    customers,
    totalCustomers,
    customersWithOrders,
    paidRevenue,
    totalOrders,
  ] = await Promise.all([
    prisma.customer.findMany({
      where,

      skip,

      take: CUSTOMERS_PER_PAGE,

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,

        orders: {
          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            orderNumber: true,
            total: true,
            currency: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    }),

    /*
     * Statistiques générales.
     */

    prisma.customer.count(),

    prisma.customer.count({
      where: {
        orders: {
          some: {},
        },
      },
    }),

    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
      },

      _sum: {
        total: true,
      },
    }),

    prisma.order.count(),
  ]);

  /* =======================================================
     STATISTIQUES CLIENTS
     ======================================================= */

  const globalRevenue =
    paidRevenue._sum.total ?? 0;

  const averageRevenuePerCustomer =
    customersWithOrders > 0
      ? Number(globalRevenue.toString()) /
        customersWithOrders
      : 0;

  /*
   * On calcule les statistiques de chaque client
   * à partir de ses vraies commandes.
   *
   * Montant dépensé =
   * uniquement paymentStatus === PAID.
   */

  const customersWithStats = customers.map(
    (customer) => {
      const paidOrders =
        customer.orders.filter(
          (order) =>
            order.paymentStatus === "PAID"
        );

      const amountSpent =
        paidOrders.reduce(
          (sum, order) =>
            sum +
            Number(
              order.total.toString()
            ),
          0
        );

      const lastOrder =
        customer.orders[0] ?? null;

      return {
        ...customer,

        totalOrders:
          customer.orders.length,

        paidOrders:
          paidOrders.length,

        amountSpent,

        lastOrder,
      };
    }
  );

  const previousUrl =
    buildCustomersUrl({
      page: Math.max(
        1,
        currentPage - 1
      ),
      search,
    });

  const nextUrl =
    buildCustomersUrl({
      page: currentPage + 1,
      search,
    });

  /* =======================================================
     INTERFACE
     ======================================================= */

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* =================================================
          INTRODUCTION
          ================================================= */}

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="relative px-5 py-6 sm:px-7 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#087cff]/5"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 right-32 h-44 w-44 rounded-full bg-[#f0b51b]/5"
          />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#087cff]">
                  <Users
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#087cff]">
                  Clientèle
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#071b3a] sm:text-3xl">
                Gestion des clients
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Consultez les clients NACHTKRONE,
                leurs coordonnées et leur historique
                d&apos;achat.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff8e6] text-[#d99a00]">
              <UserRound
                className="h-7 w-7"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          STATISTIQUES
          ================================================= */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Clients */}

        <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Clients
              </p>

              <p className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#071b3a]">
                {totalCustomers}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                Clients enregistrés
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#087cff]">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </article>

        {/* Acheteurs */}

        <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Acheteurs
              </p>

              <p className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#071b3a]">
                {customersWithOrders}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                Avec au moins une commande
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </article>

        {/* Commandes */}

        <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Commandes
              </p>

              <p className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#071b3a]">
                {totalOrders}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                Toutes commandes confondues
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </article>

        {/* Panier moyen par acheteur */}

        <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-500">
                Valeur par acheteur
              </p>

              <p className="mt-3 break-words text-2xl font-black tracking-[-0.035em] text-[#071b3a]">
                {formatMoney(
                  averageRevenuePerCustomer
                )}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                CA payé ÷ acheteurs
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Banknote className="h-6 w-6" />
            </div>
          </div>
        </article>
      </section>

      {/* =================================================
          RECHERCHE
          ================================================= */}

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form
          method="GET"
          action="/admin/customers"
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />

            <input
              type="search"
              name="search"
              defaultValue={search}
              maxLength={160}
              placeholder="Rechercher par nom, prénom, e-mail ou téléphone..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-11 pr-4 text-sm font-medium text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-5 text-sm font-extrabold text-white transition hover:bg-[#0c2853]"
          >
            <Search className="h-4 w-4" />

            Rechercher
          </button>

          {search ? (
            <Link
              href="/admin/customers"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-500 transition hover:border-[#087cff]/30 hover:text-[#087cff]"
            >
              Réinitialiser
            </Link>
          ) : null}
        </form>
      </section>

      {/* =================================================
          COMPTEUR
          ================================================= */}

      <div>
        <p className="text-sm font-extrabold text-[#071b3a]">
          {filteredCustomersCount} client
          {filteredCustomersCount !== 1
            ? "s"
            : ""}
        </p>

        {totalPages > 0 ? (
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            Page {currentPage} sur{" "}
            {totalPages}
          </p>
        ) : null}
      </div>

      {/* =================================================
          AUCUN CLIENT
          ================================================= */}

      {customersWithStats.length === 0 ? (
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#087cff]">
            {search ? (
              <Search className="h-8 w-8" />
            ) : (
              <Users className="h-8 w-8" />
            )}
          </div>

          <h3 className="mt-5 text-lg font-black text-[#071b3a]">
            {search
              ? "Aucun client trouvé"
              : "Aucun client pour le moment"}
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {search
              ? "Aucun client ne correspond à cette recherche."
              : "Les clients seront automatiquement enregistrés lorsqu'ils passeront leurs commandes sur NACHTKRONE."}
          </p>

          {search ? (
            <Link
              href="/admin/customers"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#071b3a] transition hover:border-[#087cff]/30 hover:text-[#087cff]"
            >
              Effacer la recherche
            </Link>
          ) : null}
        </section>
      ) : (
        <>
          {/* =================================================
              DESKTOP
              ================================================= */}

          <section className="hidden overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f8fafc]">
                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Commandes
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Payées
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Dépensé
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Dernière commande
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Client depuis
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {customersWithStats.map(
                    (customer) => {
                      const customerName =
                        `${customer.firstName} ${customer.lastName}`.trim() ||
                        "Client";

                      return (
                        <tr
                          key={customer.id}
                          className="transition hover:bg-[#fafcff]"
                        >
                          {/* Client */}

                          <td className="px-5 py-4">
                            <div className="flex min-w-[210px] items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#087cff]">
                                <UserRound className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[200px] truncate text-sm font-black text-[#071b3a]">
                                  {customerName}
                                </p>

                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                                  Client NACHTKRONE
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}

                          <td className="px-5 py-4">
                            <div className="min-w-[210px] space-y-1.5">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                                <span className="max-w-[190px] truncate text-xs font-semibold text-slate-600">
                                  {customer.email}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                                <span className="max-w-[190px] truncate text-xs font-semibold text-slate-500">
                                  {customer.phone ||
                                    "Non renseigné"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Commandes */}

                          <td className="px-5 py-4">
                            <span className="text-sm font-black text-[#071b3a]">
                              {customer.totalOrders}
                            </span>
                          </td>

                          {/* Payées */}

                          <td className="px-5 py-4">
                            <span
                              className={[
                                "inline-flex rounded-lg px-2.5 py-1.5 text-xs font-extrabold",
                                customer.paidOrders >
                                0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500",
                              ].join(" ")}
                            >
                              {customer.paidOrders}
                            </span>
                          </td>

                          {/* Dépensé */}

                          <td className="px-5 py-4">
                            <p className="whitespace-nowrap text-sm font-black text-[#071b3a]">
                              {formatMoney(
                                customer.amountSpent
                              )}
                            </p>
                          </td>

                          {/* Dernière commande */}

                          <td className="px-5 py-4">
                            {customer.lastOrder ? (
                              <div>
                                <p className="whitespace-nowrap text-xs font-extrabold text-[#071b3a]">
                                  #
                                  {
                                    customer
                                      .lastOrder
                                      .orderNumber
                                  }
                                </p>

                                <p
                                  className="mt-1 text-[11px] font-medium text-slate-400"
                                  title={formatDateTime(
                                    customer
                                      .lastOrder
                                      .createdAt
                                  )}
                                >
                                  {formatDate(
                                    customer
                                      .lastOrder
                                      .createdAt
                                  )}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">
                                Aucune
                              </span>
                            )}
                          </td>

                          {/* Inscription */}

                          <td className="px-5 py-4 text-right">
                            <time
                              dateTime={customer.createdAt.toISOString()}
                              title={formatDateTime(
                                customer.createdAt
                              )}
                              className="whitespace-nowrap text-xs font-semibold text-slate-500"
                            >
                              {formatDate(
                                customer.createdAt
                              )}
                            </time>
                            <DeleteCustomerButton key={customer.updatedAt.toISOString()} id={customer.id} name={customerName} totalOrders={customer.totalOrders} updatedAt={customer.updatedAt.toISOString()} />
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* =================================================
              MOBILE / TABLETTE
              ================================================= */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {customersWithStats.map(
              (customer) => {
                const customerName =
                  `${customer.firstName} ${customer.lastName}`.trim() ||
                  "Client";

                return (
                  <article
                    key={customer.id}
                    className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Client */}

                    <div className="border-b border-slate-100 bg-[#fafcff] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#087cff]">
                          <UserRound className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-[#071b3a]">
                            {customerName}
                          </h3>

                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">
                            Client depuis{" "}
                            {formatDate(
                              customer.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Contact */}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0 text-slate-400" />

                          <p className="min-w-0 truncate text-xs font-semibold text-slate-600">
                            {customer.email}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-slate-400" />

                          <p className="min-w-0 truncate text-xs font-semibold text-slate-500">
                            {customer.phone ||
                              "Téléphone non renseigné"}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-[#f8fafc] p-3 text-center">
                          <p className="text-base font-black text-[#071b3a]">
                            {
                              customer.totalOrders
                            }
                          </p>

                          <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.05em] text-slate-400">
                            Commandes
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#f8fafc] p-3 text-center">
                          <p className="text-base font-black text-emerald-600">
                            {
                              customer.paidOrders
                            }
                          </p>

                          <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.05em] text-slate-400">
                            Payées
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#f8fafc] p-3 text-center">
                          <p className="truncate text-sm font-black text-[#071b3a]">
                            {formatMoney(
                              customer.amountSpent
                            )}
                          </p>

                          <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.05em] text-slate-400">
                            Dépensé
                          </p>
                        </div>
                      </div>

                      {/* Dernière commande */}

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400">
                            Dernière commande
                          </p>

                          {customer.lastOrder ? (
                            <p className="mt-1 text-xs font-extrabold text-[#071b3a]">
                              #
                              {
                                customer
                                  .lastOrder
                                  .orderNumber
                              }
                            </p>
                          ) : (
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              Aucune commande
                            </p>
                          )}
                        </div>

                        {customer.lastOrder ? (
                          <p className="shrink-0 text-xs font-semibold text-slate-400">
                            {formatDate(
                              customer
                                .lastOrder
                                .createdAt
                            )}
                          </p>
                        ) : null}
                      </div>
                      <DeleteCustomerButton key={customer.updatedAt.toISOString()} id={customer.id} name={customerName} totalOrders={customer.totalOrders} updatedAt={customer.updatedAt.toISOString()} />
                    </div>
                  </article>
                );
              }
            )}
          </section>

          {/* =================================================
              PAGINATION
              ================================================= */}

          {totalPages > 1 ? (
            <section className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm font-extrabold text-[#071b3a]">
                  Page {currentPage} sur{" "}
                  {totalPages}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  {filteredCustomersCount}{" "}
                  client
                  {filteredCustomersCount !==
                  1
                    ? "s"
                    : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={previousUrl}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#071b3a] transition hover:border-[#087cff]/30 hover:text-[#087cff]"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    Précédent
                  </Link>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-slate-300">
                    <ChevronLeft className="h-4 w-4" />

                    Précédent
                  </span>
                )}

                <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#071b3a] px-3 text-xs font-black text-white">
                  {currentPage}
                </span>

                {currentPage <
                totalPages ? (
                  <Link
                    href={nextUrl}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#071b3a] transition hover:border-[#087cff]/30 hover:text-[#087cff]"
                  >
                    Suivant

                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-slate-300">
                    Suivant

                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}