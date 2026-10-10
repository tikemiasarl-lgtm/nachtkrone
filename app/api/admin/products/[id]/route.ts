import { validateProductInput, getProductErrorsByField } from "@/lib/products";
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const respond = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });
  try {
    const session = await verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null);
    if (!session) return respond("Connexion administrateur requise.", 401);
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    if (origin && new URL(origin).host !== host) return respond("Requête non autorisée.", 403);
    const { id } = await params;
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return respond("Identifiant invalide.", 400);
    if (!request.headers.get("content-type")?.includes("application/json")) return respond("Format JSON requis.", 415);
    let body;
    try { body = await request.json(); } catch { return respond("JSON invalide.", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return respond("Produit invalide.", 400);
    if (typeof body.updatedAt !== "string" || !Number.isFinite(Date.parse(body.updatedAt))) return respond("Version du produit invalide. Recharge la page.", 400);
    const existing = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
    if (!existing) return respond("Ce produit n'existe plus.", 404);
    // Keep the existing URL and never modify historical order snapshots.
    const validation = validateProductInput({ ...body, slug: existing.slug });
    if (!validation.success) return NextResponse.json({ success: false, message: validation.errors[0]?.message, fieldErrors: getProductErrorsByField(validation.errors) }, { status: 422 });
    const { images, ...data } = validation.data;
    await prisma.product.update({
      where: { id, updatedAt: new Date(body.updatedAt) },
      data: { ...data, images: { deleteMany: {}, create: images.map((url, position) => ({ url, position })) } },
      select: { id: true },
    });
    for (const route of ["/admin/products", "/admin", "/", "/produkte", "/produkte/" + existing.slug, "/admin/products/" + id + "/edit"]) revalidatePath(route);
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code === "P2025") return respond("Le produit ou son stock a changé. Recharge la page avant de modifier.", 409);
    if (code === "P2002") return respond("Cette URL est déjà utilisée.", 409);
    console.error("[ADMIN_PRODUCT_UPDATE]", { code });
    return respond("Impossible de modifier le produit pour le moment.", 500);
  }
}
