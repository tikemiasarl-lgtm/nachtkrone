
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Loader2,
  Trash2,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — ADMIN
   BOUTON DE SUPPRESSION D'UN PRODUIT
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type DeleteProductButtonProps = {
  productId: string;
  productName: string;
};

type DeleteProductResponse = {
  success?: boolean;
  message?: string;
};

/* =========================================================
   COMPOSANT
========================================================= */

export default function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();

  const [pending, setPending] = useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  /* =======================================================
     SUPPRESSION DU PRODUIT
  ======================================================= */

  async function remove() {
    if (pending) {
      return;
    }

    /* CONFIRMATION OBLIGATOIRE */

    const confirmed = window.confirm(
      "Supprimer définitivement : " +
        productName +
        " ? Cette action est irréversible. Les commandes passées seront conservées.",
    );

    if (!confirmed) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      /* APPEL DE L'API EXISTANTE */

      const response = await fetch(
        "/api/admin/products/" +
          encodeURIComponent(productId),
        {
          method: "DELETE",
        },
      );

      const result: DeleteProductResponse =
        await response.json();

      /* VÉRIFICATION DE LA RÉPONSE */

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Suppression impossible.",
        );
      }

      /* ACTUALISATION DE LA LISTE */

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Suppression impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => {
          void remove();
        }}
        disabled={pending}
        aria-label={
          "Supprimer " + productName
        }
        aria-busy={pending}
        className="
          inline-flex
          min-h-10
          items-center
          gap-2
          rounded-lg
          border
          border-red-200
          bg-white
          px-3
          text-xs
          font-semibold
          text-red-600
          transition
          hover:bg-red-50
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-red-600
          disabled:cursor-wait
          disabled:opacity-60
        "
      >
        {pending ? (
          <Loader2
            aria-hidden="true"
            className="h-4 w-4 animate-spin"
          />
        ) : (
          <Trash2
            aria-hidden="true"
            className="h-4 w-4"
          />
        )}

        <span>
          {pending
            ? "Suppression..."
            : "Supprimer"}
        </span>
      </button>

      {/* MESSAGE D'ERREUR */}

      {error && (
        <p
          role="alert"
          className="max-w-56 text-xs text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
