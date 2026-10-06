"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function remove() {
    if (pending || !window.confirm('Supprimer définitivement : ' + productName + ' ? Cette action est irréversible. Les commandes passées seront conservées.')) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/products/' + encodeURIComponent(productId), { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Suppression impossible.');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Suppression impossible.');
    } finally {
      setPending(false);
    }
  }
  return <div className="flex flex-col items-start gap-2">
    <button type="button" onClick={remove} disabled={pending} aria-label={'Supprimer ' + productName} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-60">
      {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />} {pending ? 'Suppression...' : 'Supprimer'}
    </button>
    {error && <p role="alert" className="max-w-56 text-xs text-red-600">{error}</p>}
  </div>;
}
