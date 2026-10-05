import type { Metadata } from "next";
import CartContents from "@/components/public/cart/CartContents";
export const metadata: Metadata = {title: "Warenkorb | NACHTKRONE", robots: {index: false, follow: false}};
export default function CartPage() { return <CartContents />; }
