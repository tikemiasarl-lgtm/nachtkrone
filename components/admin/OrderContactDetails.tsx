
/* =========================================================
   NACHTKRONE — ADMIN
   COORDONNÉES CLIENT ET ADRESSE DE LIVRAISON
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type OrderContact = {
  customerPhone: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingAddress2: string | null;
  shippingPostalCode: string;
  shippingCity: string;
  shippingState: string | null;
  shippingCountry: string;
  customerNote: string | null;
};

type OrderContactDetailsProps = {
  order: OrderContact;
};

/* =========================================================
   COMPOSANT
========================================================= */

export default function OrderContactDetails({
  order,
}: OrderContactDetailsProps) {
  return (
    <details className="mt-2 max-w-xs text-xs text-slate-600">
      {/* TITRE DÉROULANT */}

      <summary className="cursor-pointer font-bold text-[#087cff]">
        Coordonnées et livraison
      </summary>

      {/* INFORMATIONS CLIENT */}

      <div className="mt-2 space-y-1 break-words rounded-lg bg-slate-50 p-3">
        {/* TÉLÉPHONE */}

        <p>
          Téléphone :{" "}
          {order.customerPhone || "Non renseigné"}
        </p>

        {/* NOM ET PRÉNOM */}

        <p className="font-bold">
          {order.shippingFirstName}{" "}
          {order.shippingLastName}
        </p>

        {/* ADRESSE PRINCIPALE */}

        <p>{order.shippingAddress}</p>

        {/* COMPLÉMENT D'ADRESSE */}

        {order.shippingAddress2 && (
          <p>{order.shippingAddress2}</p>
        )}

        {/* CODE POSTAL ET VILLE */}

        <p>
          {order.shippingPostalCode}{" "}
          {order.shippingCity}
        </p>

        {/* RÉGION / ÉTAT */}

        {order.shippingState && (
          <p>{order.shippingState}</p>
        )}

        {/* PAYS */}

        <p>{order.shippingCountry}</p>

        {/* NOTE DU CLIENT */}

        {order.customerNote && (
          <p className="whitespace-pre-wrap border-t border-slate-200 pt-2">
            Note : {order.customerNote}
          </p>
        )}
      </div>
    </details>
  );
}
