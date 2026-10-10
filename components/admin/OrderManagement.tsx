
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Loader2, Trash2 } from "lucide-react";

/* =========================================================
   NACHTKRONE — ADMIN
   GESTION DES COMMANDES ET DES PAIEMENTS
========================================================= */

/* =========================================================
   STATUTS DES COMMANDES
========================================================= */

const orderLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

/* =========================================================
   STATUTS DES PAIEMENTS
========================================================= */

const paymentLabels = {
  PENDING: "En attente",
  PAID: "Payé / encaissé",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

/* =========================================================
   TYPES
========================================================= */

type Props = {
  id: string;
  orderNumber: string;
  status: keyof typeof orderLabels;
  paymentStatus: keyof typeof paymentLabels;
  paymentMethod: string | null;
  paymentReference: string | null;
  updatedAt: string;
};

type OrderApiResponse = {
  success?: boolean;
  message?: string;
};

/* =========================================================
   STYLE DES CHAMPS
========================================================= */

const field =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900";

/* =========================================================
   COMPOSANT
========================================================= */

export default function OrderManagement(props: Props) {
  const router = useRouter();

  /* =======================================================
     ÉTATS
  ======================================================= */

  const [open, setOpen] = useState(false);

  const [status, setStatus] = useState(
    props.status,
  );

  const [paymentStatus, setPayment] = useState(
    props.paymentStatus,
  );

  const [method, setMethod] = useState(
    props.paymentMethod ?? "",
  );

  const [reference, setReference] = useState(
    props.paymentReference ?? "",
  );

  const [confirmed, setConfirmed] = useState(false);

  const [pending, setPending] = useState(false);

  const [deleteConfirmed, setDeleteConfirmed] =
    useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     VÉRIFICATION DU CHANGEMENT DE PAIEMENT
  ======================================================= */

  const changedPayment =
    paymentStatus !== props.paymentStatus;

  /* =======================================================
     ENREGISTREMENT DES MODIFICATIONS
  ======================================================= */

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/orders/" +
          encodeURIComponent(props.id),
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status,
            paymentStatus,
            paymentMethod: method,
            paymentReference: reference,
            updatedAt: props.updatedAt,
            confirmPayment: confirmed,
          }),
        },
      );

      const result: OrderApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Enregistrement impossible.",
        );
      }

      setOpen(false);

      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Enregistrement impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  /* =======================================================
     SUPPRESSION DÉFINITIVE DE LA COMMANDE
  ======================================================= */

  async function removeOrder() {
    if (pending || !deleteConfirmed) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/orders/" +
          encodeURIComponent(props.id),
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            confirmDelete: true,
            updatedAt: props.updatedAt,
          }),
        },
      );

      const result: OrderApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Suppression impossible.",
        );
      }

      setOpen(false);

      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Suppression impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <div className="mt-3 min-w-[160px] text-left">
      {/* BOUTON GÉRER */}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setError("");
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#087cff]/20 bg-blue-50 px-3 py-2 text-xs font-bold text-[#087cff]"
      >
        <Settings2
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />

        {open ? "Fermer" : "Gérer"}
      </button>

      {/* FORMULAIRE */}

      {open && (
        <form
          onSubmit={save}
          aria-label={
            "Gérer " + props.orderNumber
          }
          className="mt-3 w-full min-w-[240px] rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <fieldset
            disabled={pending}
            className="space-y-3"
          >
            {/* STATUT DE LA COMMANDE */}

            <label className="block text-xs font-bold text-slate-700">
              Commande

              <select
                className={field}
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as Props["status"],
                  )
                }
              >
                {Object.entries(orderLabels).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            {/* STATUT DU PAIEMENT */}

            <label className="block text-xs font-bold text-slate-700">
              Paiement

              <select
                className={field}
                value={paymentStatus}
                onChange={(event) => {
                  setPayment(
                    event.target
                      .value as Props["paymentStatus"],
                  );

                  setConfirmed(false);
                }}
              >
                {Object.entries(paymentLabels).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            {/* MOYEN DE PAIEMENT */}

            <label className="block text-xs font-bold text-slate-700">
              Moyen de paiement

              <input
                className={field}
                maxLength={80}
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value)
                }
                placeholder="Virement, espèces, carte..."
              />
            </label>

            {/* RÉFÉRENCE DU PAIEMENT */}

            <label className="block text-xs font-bold text-slate-700">
              Référence (facultatif)

              <input
                className={field}
                maxLength={120}
                value={reference}
                onChange={(event) =>
                  setReference(event.target.value)
                }
              />
            </label>

            {/* INFORMATION SUR LES PAIEMENTS */}

            <p className="text-[11px] leading-5 text-slate-500">
              Enregistre un paiement déjà reçu ou
              remboursé. Cette action ne débite pas
              le client et ne modifie pas le stock.
            </p>

            {/* CONFIRMATION DU STATUT DE PAIEMENT */}

            {changedPayment && (
              <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(event) =>
                    setConfirmed(event.target.checked)
                  }
                  className="mt-0.5"
                />

                {paymentStatus === "PAID"
                  ? "Je confirme avoir reçu la totalité du paiement."
                  : paymentStatus === "REFUNDED"
                    ? "Je confirme avoir remboursé le paiement."
                    : "Je confirme la correction du statut de paiement."}
              </label>
            )}

            {/* MESSAGE D'ERREUR */}

            {error && (
              <p
                role="alert"
                className="text-xs text-red-700"
              >
                {error}
              </p>
            )}

            {/* ENREGISTRER */}

            <button
              type="submit"
              disabled={
                pending ||
                (changedPayment && !confirmed)
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#087cff] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {pending && (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {pending
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>

            {/* ===========================================
                SUPPRESSION DÉFINITIVE
            =========================================== */}

            <div className="border-t border-red-100 pt-3">
              <p className="text-xs font-bold text-red-700">
                Supprimer définitivement
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                La commande et ses articles seront
                supprimés. Si elle est payée, son
                montant sera retiré du chiffre
                d&apos;affaires affiché. Aucun
                remboursement ni retour en stock
                ne sera effectué.
              </p>

              {/* CONFIRMATION DE SUPPRESSION */}

              <label className="my-3 flex items-start gap-2 text-xs font-semibold text-red-700">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(event) =>
                    setDeleteConfirmed(
                      event.target.checked,
                    )
                  }
                  className="mt-0.5"
                />

                Je confirme la suppression de{" "}
                {props.orderNumber}.
              </label>

              {/* BOUTON SUPPRIMER */}

              <button
                type="button"
                onClick={removeOrder}
                disabled={
                  pending || !deleteConfirmed
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <Trash2
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                Supprimer la commande
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
