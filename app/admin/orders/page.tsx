import OrderContactDetails from "@/components/admin/OrderContactDetails";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  ReceiptText,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

/* =========================================================
   NACHTKRONE — COMMANDES ADMIN
   app/admin/orders/page.tsx
   ========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ORDERS_PER_PAGE = 20;

/* =========================================================
   TYPES
   ========================================================= */

type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentStatusValue =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

type PageSearchParams = {
  page?: string | string[];
  search?: string | string[];
  status?: string | string[];
  payment?: string | string[];
};

type OrdersPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

/* =========================================================
   STATUTS
   ========================================================= */

const ORDER_STATUSES: OrderStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const PAYMENT_STATUSES: PaymentStatusValue[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
];

const orderStatusLabels: Record<OrderStatusValue, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "Préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

const paymentStatusLabels: Record<PaymentStatusValue, string> = {
  PENDING: "En attente",
  PAID: "Payé",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
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

function normalizeOrderStatus(
  value: string
): OrderStatusValue | "ALL" {
  const normalized = value.toUpperCase();

  if (
    ORDER_STATUSES.includes(
      normalized as OrderStatusValue
    )
  ) {
    return normalized as OrderStatusValue;
  }

  return "ALL";
}

function normalizePaymentStatus(
  value: string
): PaymentStatusValue | "ALL" {
  const normalized = value.toUpperCase();

  if (
    PAYMENT_STATUSES.includes(
      normalized as PaymentStatusValue
    )
  ) {
    return normalized as PaymentStatusValue;
  }

  return "ALL";
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getOrderStatusClasses(
  status: OrderStatusValue
): string {
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

    case "PENDING":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getPaymentStatusClasses(
  status: PaymentStatusValue
): string {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "REFUNDED":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "PENDING":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

/* =========================================================
   CONSTRUCTION DES URLS DE PAGINATION
   ========================================================= */

function buildOrdersUrl({
  page,
  search,
  status,
  payment,
}: {
  page: number;
  search: string;
  status: OrderStatusValue | "ALL";
  payment: PaymentStatusValue | "ALL";
}) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (search) {
    params.set("search", search);
  }

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (payment !== "ALL") {
    params.set("payment", payment);
  }

  const query = params.toString();

  return query
    ? `/admin/orders?${query}`
    : "/admin/orders";
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const params = searchParams
    ? await searchParams
    : {};

  const requestedPage = normalizePage(
    getSingleSearchParam(params.page)
  );

  const search = getSingleSearchParam(
    params.search
  ).slice(0, 160);

  const status = normalizeOrderStatus(
    getSingleSearchParam(params.status)
  );

  const payment = normalizePaymentStatus(
    getSingleSearchParam(params.payment)
  );

  /* =======================================================
     FILTRE PRISMA
     ======================================================= */

  const where = {
    ...(status !== "ALL"
      ? {
          status,
        }
      : {}),

    ...(payment !== "ALL"
      ? {
          paymentStatus: payment,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              orderNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customerFirstName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customerLastName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customerEmail: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customerPhone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  /* =======================================================
     TOTAL POUR CALCULER UNE PAGE VALIDE
     ======================================================= */

  const totalOrders = await prisma.order.count({
    where,
  });

  const totalPages =
    totalOrders === 0
      ? 0
      : Math.ceil(
          totalOrders / ORDERS_PER_PAGE
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
    ORDERS_PER_PAGE;

  /* =======================================================
     DONNÉES
     ======================================================= */

  const [
    orders,
    totalRevenue,
    paidOrdersCount,
    pendingOrdersCount,
    shippedOrdersCount,
  ] = await Promise.all([
    prisma.order.findMany({
      where,

      skip,

      take: ORDERS_PER_PAGE,

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        orderNumber: true,

        customerFirstName: true,
        customerLastName: true,
        customerEmail: true,
        customerPhone: true,

        shippingFirstName: true,
        shippingLastName: true,
        shippingAddress: true,
        shippingAddress2: true,
        shippingPostalCode: true,
        shippingState: true,
        customerNote: true,
        shippingCity: true,
        shippingCountry: true,

        subtotal: true,
        shippingAmount: true,
        total: true,
        currency: true,

        status: true,
        paymentStatus: true,

        paymentMethod: true,
        paymentReference: true,
        paidAt: true,

        createdAt: true,

        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },

        items: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
    }),

    /*
     * Les cartes supérieures représentent
     * l'activité générale de la boutique,
     * indépendamment des filtres du tableau.
     */

    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
      },

      _sum: {
        total: true,
      },
    }),

    prisma.order.count({
      where: {
        paymentStatus: "PAID",
      },
    }),

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

    prisma.order.count({
      where: {
        status: "SHIPPED",
      },
    }),
  ]);

  const revenue =
    totalRevenue._sum.total ?? 0;

  const hasFilters =
    search !== "" ||
    status !== "ALL" ||
    payment !== "ALL";

  const previousUrl = buildOrdersUrl({
    page: Math.max(
      1,
      currentPage - 1
    ),
    search,
    status,
    payment,
  });

  const nextUrl = buildOrdersUrl({
    page: currentPage + 1,
    search,
    status,
    payment,
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

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#087cff]">
                  <ShoppingBag className="h-5 w-5" />
                </div>

                <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#087cff]">
                  Ventes
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#071b3a] sm:text-3xl">
                Gestion des commandes
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Consultez les commandes, les paiements,
                les clients et le suivi des expéditions
                NACHTKRONE.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff8e6] text-[#d99a00]">
              <ReceiptText className="h-7 w-7" />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          STATISTIQUES
          ================================================= */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Chiffre d&apos;affaires
              </p>

              <p className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#071b3a]">
                {formatMoney(revenue)}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                Paiements encaissés
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Banknote className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Payées
              </p>

              <p className="mt-3 text-2xl font-black text-[#071b3a]">
                {paidOrdersCount}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                Commandes encaissées
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                À traiter
              </p>

              <p className="mt-3 text-2xl font-black text-[#071b3a]">
                {pendingOrdersCount}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                En attente ou préparation
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock3 className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Expédiées
              </p>

              <p className="mt-3 text-2xl font-black text-[#071b3a]">
                {shippedOrdersCount}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                En cours de livraison
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </article>
      </section>

      {/* =================================================
          RECHERCHE / FILTRES
          ================================================= */}

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form
          method="GET"
          action="/admin/orders"
          className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_190px_auto]"
        >
          {/* Recherche */}

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              name="search"
              defaultValue={search}
              maxLength={160}
              placeholder="N° commande, client, e-mail ou téléphone..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-11 pr-4 text-sm font-medium text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
            />
          </div>

          {/* Statut commande */}

          <select
            name="status"
            defaultValue={status}
            className="h-12 rounded-xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-bold text-[#071b3a] outline-none transition focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
          >
            <option value="ALL">
              Toutes les commandes
            </option>

            <option value="PENDING">
              En attente
            </option>

            <option value="CONFIRMED">
              Confirmées
            </option>

            <option value="PROCESSING">
              En préparation
            </option>

            <option value="SHIPPED">
              Expédiées
            </option>

            <option value="DELIVERED">
              Livrées
            </option>

            <option value="CANCELLED">
              Annulées
            </option>

            <option value="REFUNDED">
              Remboursées
            </option>
          </select>

          {/* Paiement */}

          <select
            name="payment"
            defaultValue={payment}
            className="h-12 rounded-xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-bold text-[#071b3a] outline-none transition focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
          >
            <option value="ALL">
              Tous les paiements
            </option>

            <option value="PAID">
              Payés
            </option>

            <option value="PENDING">
              En attente
            </option>

            <option value="FAILED">
              Échoués
            </option>

            <option value="CANCELLED">
              Annulés
            </option>

            <option value="REFUNDED">
              Remboursés
            </option>
          </select>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-5 text-sm font-extrabold text-white transition hover:bg-[#0c2853]"
          >
            <Search className="h-4 w-4" />

            Filtrer
          </button>
        </form>

        {hasFilters ? (
          <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 transition hover:text-[#087cff]"
            >
              <XCircle className="h-4 w-4" />

              Réinitialiser les filtres
            </Link>
          </div>
        ) : null}
      </section>

      {/* =================================================
          COMPTEUR
          ================================================= */}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-[#071b3a]">
            {totalOrders} commande
            {totalOrders !== 1 ? "s" : ""}
          </p>

          {totalPages > 0 ? (
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Page {currentPage} sur {totalPages}
            </p>
          ) : null}
        </div>
      </div>

      {/* =================================================
          AUCUNE COMMANDE
          ================================================= */}

      {orders.length === 0 ? (
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#087cff]">
            {hasFilters ? (
              <Search className="h-8 w-8" />
            ) : (
              <ShoppingBag className="h-8 w-8" />
            )}
          </div>

          <h3 className="mt-5 text-lg font-black text-[#071b3a]">
            {hasFilters
              ? "Aucune commande trouvée"
              : "Aucune commande pour le moment"}
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {hasFilters
              ? "Aucune commande ne correspond aux critères sélectionnés."
              : "Les commandes passées par les clients de la boutique apparaîtront automatiquement ici."}
          </p>

          {hasFilters ? (
            <Link
              href="/admin/orders"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#071b3a] transition hover:border-[#087cff]/30 hover:text-[#087cff]"
            >
              Effacer les filtres
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
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f8fafc]">
                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Commande
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Articles
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Total
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Statut
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Paiement
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const quantity =
                      order.items.reduce(
                        (sum, item) =>
                          sum + item.quantity,
                        0
                      );

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
                        {/* Commande */}

                        <td className="px-5 py-4">
                          <div>
                            <p className="whitespace-nowrap text-sm font-black text-[#071b3a]">
                              #{order.orderNumber}
                            </p>

                            {order.shippingCity ||
                            order.shippingCountry ? (
                              <p className="mt-1 max-w-[170px] truncate text-[11px] font-medium text-slate-400">
                                {[
                                  order.shippingCity,
                                  order.shippingCountry,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* Client */}

                        <td className="px-5 py-4">
                          <div className="flex min-w-[200px] items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#087cff]">
                              <UserRound className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate text-sm font-bold text-[#071b3a]">
                                {customerName}
                              </p>

                              <p className="mt-0.5 max-w-[190px] truncate text-xs text-slate-400">
                                {customerEmail}
                              </p>
                              <OrderContactDetails order={order} />
                            </div>
                          </div>
                        </td>

                        {/* Articles */}

                        <td className="px-5 py-4">
                          <div>
                            <p className="whitespace-nowrap text-sm font-extrabold text-[#071b3a]">
                              {quantity} article
                              {quantity !== 1 ? "s" : ""}
                            </p>

                            {order.items[0] ? (
                              <p className="mt-1 max-w-[180px] truncate text-[11px] text-slate-400">
                                {order.items[0].productName}
                                {order.items.length > 1
                                  ? ` +${order.items.length - 1}`
                                  : ""}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* Total */}

                        <td className="px-5 py-4">
                          <p className="whitespace-nowrap text-sm font-black text-[#071b3a]">
                            {formatMoney(
                              order.total,
                              order.currency
                            )}
                          </p>

                          {Number(
                            order.shippingAmount.toString()
                          ) > 0 ? (
                            <p className="mt-1 whitespace-nowrap text-[10px] font-medium text-slate-400">
                              dont{" "}
                              {formatMoney(
                                order.shippingAmount,
                                order.currency
                              )}{" "}
                              livraison
                            </p>
                          ) : null}
                        </td>

                        {/* Statut */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${getOrderStatusClasses(
                              order.status
                            )}`}
                          >
                            {orderStatusLabels[order.status]}
                          </span>
                        </td>

                        {/* Paiement */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${getPaymentStatusClasses(
                              order.paymentStatus
                            )}`}
                          >
                            {
                              paymentStatusLabels[
                                order.paymentStatus
                              ]
                            }
                          </span>

                          {order.paymentMethod ? (
                            <p className="mt-1.5 max-w-[150px] truncate text-[10px] font-semibold text-slate-400">
                              {order.paymentMethod}
                            </p>
                          ) : null}
                        </td>

                        {/* Date */}

                        <td className="px-5 py-4 text-right">
                          <time
                            dateTime={order.createdAt.toISOString()}
                            title={formatDateTime(
                              order.createdAt
                            )}
                            className="whitespace-nowrap text-xs font-semibold text-slate-500"
                          >
                            {formatDate(
                              order.createdAt
                            )}
                          </time>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* =================================================
              MOBILE / TABLETTE
              ================================================= */}

          <section className="grid grid-cols-1 gap-4 lg:hidden">
            {orders.map((order) => {
              const quantity =
                order.items.reduce(
                  (sum, item) =>
                    sum + item.quantity,
                  0
                );

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
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
                >
                  {/* Header */}

                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-[#fafcff] p-4">
                    <div>
                      <p className="text-sm font-black text-[#071b3a]">
                        #{order.orderNumber}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {formatDateTime(
                          order.createdAt
                        )}
                      </p>
                    </div>

                    <p className="text-base font-black text-[#071b3a]">
                      {formatMoney(
                        order.total,
                        order.currency
                      )}
                    </p>
                  </div>

                  {/* Client */}

                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#087cff]">
                        <UserRound className="h-[18px] w-[18px]" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#071b3a]">
                          {customerName}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {customerEmail}
                        </p>
                              <OrderContactDetails order={order} />
                      </div>
                    </div>

                    {/* Articles */}

                    <div className="mt-4 rounded-xl bg-[#f8fafc] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-500">
                          Articles
                        </span>

                        <span className="text-xs font-black text-[#071b3a]">
                          {quantity}
                        </span>
                      </div>

                      {order.items.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {order.items
                            .slice(0, 2)
                            .map((item) => (
                              <p
                                key={item.id}
                                className="truncate text-[11px] font-medium text-slate-500"
                              >
                                {item.quantity} ×{" "}
                                {item.productName}
                              </p>
                            ))}

                          {order.items.length > 2 ? (
                            <p className="text-[11px] font-bold text-[#087cff]">
                              +
                              {order.items.length -
                                2}{" "}
                              autre
                              {order.items.length -
                                2 >
                              1
                                ? "s"
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {/* Statuts */}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getOrderStatusClasses(
                          order.status
                        )}`}
                      >
                        {orderStatusLabels[order.status]}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getPaymentStatusClasses(
                          order.paymentStatus
                        )}`}
                      >
                        {
                          paymentStatusLabels[
                            order.paymentStatus
                          ]
                        }
                      </span>
                    </div>

                    {/* Destination */}

                    {order.shippingCity ||
                    order.shippingCountry ? (
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                        <Truck className="h-4 w-4 shrink-0 text-slate-400" />

                        <p className="truncate text-xs font-semibold text-slate-500">
                          {[
                            order.shippingCity,
                            order.shippingCountry,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>

          {/* =================================================
              PAGINATION
              ================================================= */}

          {totalPages > 1 ? (
            <section className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm font-extrabold text-[#071b3a]">
                  Page {currentPage} sur {totalPages}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  {totalOrders} commande
                  {totalOrders !== 1 ? "s" : ""}
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

                {currentPage < totalPages ? (
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

      {/* =================================================
          INFORMATION
          ================================================= */}

      <section className="rounded-[20px] border border-blue-100 bg-[#f5f9ff] p-4">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#087cff]" />

          <p className="text-xs font-medium leading-5 text-slate-600">
            Cette page lit directement les commandes enregistrées
            dans PostgreSQL. Les nouvelles commandes créées par le
            futur checkout apparaîtront automatiquement ici.
          </p>
        </div>
      </section>
    </div>
  );
}