
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

/* =========================================================
   NACHTKRONE — ADMIN
   SUPPRESSION D'UN CLIENT
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type Props = {
  id: string;
  name: string;
  totalOrders: number;
  updatedAt: string;
};

type DeleteCustomerResponse = {
  success?: boolean;
  message?: string;
};

/* =========================================================
   COMPOSANT
========================================================= */

export default function DeleteCustomerButton({
  id,
  name,
  totalOrders,
  updatedAt,
}: Props) {
  const router = useRouter();

  /* =======================================================
     ÉTATS
  ======================================================= */

  const [open, setOpen] = useState(false);

  const [confirmed, setConfirmed] = useState(false);

  const [pending, setPending] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     OUVERTURE / FERMETURE
  ======================================================= */

  function toggleOpen() {
    if (pending) {
      return;
    }

    setOpen((current) => !current);
    setConfirmed(false);
    setError("");
  }

  /* =======================================================
     SUPPRESSION DU CLIENT
  ======================================================= */

  async function remove() {
    /* VÉRIFICATIONS AVANT SUPPRESSION */

    if (
      !confirmed ||
      pending ||
      totalOrders > 0
    ) {
      return;
    }

    setPending(true);
    setError("");

    try {
      /* APPEL DE L'API EXISTANTE */

      const response = await fetch(
        "/api/admin/customers/" +
          encodeURIComponent(id),
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            confirmDelete: true,
            updatedAt,
          }),
        },
      );

      const result: DeleteCustomerResponse =
        await response.json();

      /* VÉRIFICATION DE LA RÉPONSE */

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Suppression impossible.",
        );
      }

      /* FERMETURE ET ACTUALISATION */

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
    <div className="mt-3 text-left">
      {/* BOUTON PRINCIPAL */}

      <button
        type="button"
        disabled={pending}
        aria-expanded={open}
        onClick={toggleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
      >
        <Trash2
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />

        {open ? "Fermer" : "Supprimer"}
      </button>

      {/* PANNEAU DE SUPPRESSION */}

      {open && (
        <div className="mt-2 min-w-[200px] rounded-xl border border-red-100 bg-red-50 p-3">
          {/* CLIENT AVEC COMMANDES */}

          {totalOrders > 0 ? (
            <p className="text-xs leading-5 text-slate-700">
              Ce client possède encore{" "}
              {totalOrders} commande
              {totalOrders > 1 ? "s" : ""}.
              La suppression est bloquée pour
              conserver cet historique.
            </p>
          ) : (
            <>
              {/* CONFIRMATION */}

              <p className="text-xs font-bold text-red-700">
                Supprimer définitivement la fiche de{" "}
                {name} ?
              </p>

              <label className="my-3 flex items-start gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  disabled={pending}
                  checked={confirmed}
                  onChange={(event) =>
                    setConfirmed(
                      event.target.checked,
                    )
                  }
                  className="mt-0.5"
                />

                Je confirme la suppression de ce client.
              </label>

              {/* MESSAGE D'ERREUR */}

              {error && (
                <p
                  role="alert"
                  className="mb-2 text-xs text-red-700"
                >
                  {error}
                </p>
              )}

              {/* BOUTON DE CONFIRMATION */}

              <button
                type="button"
                disabled={pending || !confirmed}
                onClick={remove}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {pending && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}

                {pending
                  ? "Suppression..."
                  : "Confirmer la suppression"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
