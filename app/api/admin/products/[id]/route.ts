import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const respond = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });
  try {
    const session = await verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null);
    if (!session) return respond("Connexion administrateur requise.", 401);
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    if (origin && new URL(origin).host !== host) return respond("Requête non autorisée.", 403);
    const { id } = await params;
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return respond("Identifiant du produit invalide.", 400);
    // Les images de galerie sont supprimées en cascade. Les commandes gardent leurs snapshots.
    const product = await prisma.product.delete({ where: { id }, select: { slug: true } });
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/produkte");
    revalidatePath("/produkte/" + product.slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code === "P2025") return respond("Ce produit n'existe plus.", 404);
    console.error("[ADMIN_PRODUCT_DELETE]", { code });
    return respond("Impossible de supprimer le produit. Réessaie plus tard.", 500);
  }
}
