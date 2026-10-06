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

export default function OrderContactDetails({ order }: { order: OrderContact }) {
  return (
    <details className="mt-2 max-w-xs text-xs text-slate-600">
      <summary className="cursor-pointer font-bold text-[#087cff]">Coordonnées et livraison</summary>
      <div className="mt-2 space-y-1 break-words rounded-lg bg-slate-50 p-3">
        <p>Téléphone : {order.customerPhone || "Non renseigné"}</p>
        <p className="font-bold">{order.shippingFirstName} {order.shippingLastName}</p>
        <p>{order.shippingAddress}</p>
        {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
        <p>{order.shippingPostalCode} {order.shippingCity}</p>
        {order.shippingState && <p>{order.shippingState}</p>}
        <p>{order.shippingCountry}</p>
        {order.customerNote && <p className="whitespace-pre-wrap border-t border-slate-200 pt-2">Note : {order.customerNote}</p>}
      </div>
    </details>
  );
}
