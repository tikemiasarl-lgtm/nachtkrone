import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const ids = [...new Set((request.nextUrl.searchParams.get("ids") || "").split(",").filter(Boolean))];
  if (ids.length > 100 || ids.some(id => !/^[a-zA-Z0-9_-]{1,100}$/.test(id))) return NextResponse.json({message: "Ung?ltiger Warenkorb."}, {status: 400});
  try {
    const products = ids.length ? await prisma.product.findMany({where: {id: {in: ids}, status: "PUBLISHED"}, select: {id: true, name: true, slug: true, mainImage: true, price: true, promotionalPrice: true, stock: true}}) : [];
    return NextResponse.json({products: products.map(product => ({...product, price: product.price.toString(), promotionalPrice: product.promotionalPrice?.toString() ?? null}))}, {headers: {"Cache-Control": "no-store"}});
  } catch { return NextResponse.json({message: "Der Warenkorb konnte nicht geladen werden."}, {status: 500}); }
}
