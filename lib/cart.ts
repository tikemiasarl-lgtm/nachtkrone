"use client";
import { useMemo, useSyncExternalStore } from "react";
export type CartItem = { productId: string; quantity: number };
const KEY = "nachtkrone-cart-v1";
const EVENT = "nachtkrone-cart-change";
export function parseCart(raw: string | null): CartItem[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    const items: CartItem[] = [];
    for (const entry of value.slice(0, 100)) {
      if (!entry || typeof entry !== "object" || typeof entry.productId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(entry.productId) || !Number.isSafeInteger(entry.quantity) || entry.quantity < 1) continue;
      if (!items.some(item => item.productId === entry.productId)) items.push({productId: entry.productId, quantity: Math.min(entry.quantity, 1000000)});
    }
    return items;
  } catch { return []; }
}
function snapshot() { try { return window.localStorage.getItem(KEY) || "[]"; } catch { return "[]"; } }
function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(EVENT, callback); };
}
function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}
export function addCartItem(productId: string, quantity: number, stock: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(stock) || stock < 1) throw new Error("Ung?ltige Menge.");
  const items = parseCart(snapshot());
  const existing = items.find(item => item.productId === productId);
  const total = (existing?.quantity || 0) + quantity;
  if (total > stock) throw new Error("Die gew?nschte Gesamtmenge ?bersteigt den verf?gbaren Bestand.");
  if (existing) existing.quantity = total;
  else { if (items.length >= 100) throw new Error("Der Warenkorb ist voll."); items.push({productId, quantity}); }
  write(items);
}
export function setCartQuantity(productId: string, quantity: number, stock: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > stock) throw new Error("Ung?ltige Menge.");
  write(parseCart(snapshot()).map(item => item.productId === productId ? {...item, quantity} : item));
}
export function removeCartItem(productId: string) { write(parseCart(snapshot()).filter(item => item.productId !== productId)); }
export function useCart() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  return useMemo(() => parseCart(raw), [raw]);
}
