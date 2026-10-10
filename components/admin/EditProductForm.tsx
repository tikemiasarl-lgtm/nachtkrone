
"use client";

import {
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_SUBCATEGORIES,
  type ProductCategoryValue,
} from "@/lib/product-categories";

/* =========================================================
   TYPES
========================================================= */

export type EditableProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: ProductCategoryValue;
  subcategory: string;
  price: string;
  promotionalPrice: string;
  stock: string;
  mainImage: string;
  images: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
};

type FieldErrors = Record<string, string[]>;

type UploadResponse = {
  success?: boolean;
  message?: string;
  images?: Array<{ url: string }>;
};

type SaveResponse = {
  success?: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
};

/* =========================================================
   CONFIGURATION
========================================================= */

const MAX_EXTRA_IMAGES = 15;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-[#071b3a] focus:border-[#087cff] focus:outline-none focus:ring-4 focus:ring-[#087cff]/10";

/* =========================================================
   FORMULAIRE
========================================================= */

export default function EditProductForm({
  product,
}: {
  product: EditableProduct;
}) {
  const router = useRouter();

  const [form, setForm] = useState<EditableProduct>(
    product,
  );

  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  const busy = pending || uploading;

  /* =======================================================
     MODIFICATION DES CHAMPS
  ======================================================= */

  function update<K extends keyof EditableProduct>(
    key: K,
    value: EditableProduct[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];

      return next;
    });
  }

  /* =======================================================
     ENVOI DES IMAGES
  ======================================================= */

  async function upload(
    event: ChangeEvent<HTMLInputElement>,
    main: boolean,
  ) {
    if (busy) {
      return;
    }

    const files = Array.from(
      event.target.files ?? [],
    );

    event.target.value = "";

    if (!files.length) {
      return;
    }

    setError("");

    if (main && files.length !== 1) {
      setError(
        "Veuillez sélectionner une seule image principale.",
      );
      return;
    }

    if (
      !main &&
      form.images.length + files.length >
        MAX_EXTRA_IMAGES
    ) {
      setError(
        "Maximum 15 images supplémentaires.",
      );
      return;
    }

    const invalidFile = files.some(
      (file) =>
        file.size > MAX_IMAGE_SIZE ||
        file.size <= 0 ||
        !ALLOWED_IMAGE_TYPES.includes(file.type),
    );

    if (invalidFile) {
      setError(
        "Images JPG, PNG, WebP ou AVIF uniquement, maximum 8 Mo par fichier.",
      );
      return;
    }

    setUploading(true);

    try {
      const body = new FormData();

      files.forEach((file) => {
        body.append("files", file);
      });

      const response = await fetch(
        "/api/admin/products/upload",
        {
          method: "POST",
          body,
        },
      );

      const data: UploadResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success ||
        !Array.isArray(data.images) ||
        data.images.length !== files.length
      ) {
        throw new Error(
          data.message ||
            "Envoi des images impossible.",
        );
      }

      const urls = data.images.map(
        (image) => image.url,
      );

      if (
        urls.some(
          (url) =>
            typeof url !== "string" ||
            !url.trim(),
        )
      ) {
        throw new Error(
          "Les images envoyées sont invalides.",
        );
      }

      if (main) {
        update("mainImage", urls[0]);
      } else {
        setForm((current) => ({
          ...current,
          images: [
            ...current.images,
            ...urls,
          ],
        }));
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Envoi impossible.",
      );
    } finally {
      setUploading(false);
    }
  }

  /* =======================================================
     ENREGISTREMENT
  ======================================================= */

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setPending(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch(
        "/api/admin/products/" +
          encodeURIComponent(product.id),
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            ...form,

            price: form.price
              .trim()
              .replace(",", "."),

            promotionalPrice:
              form.promotionalPrice
                .trim()
                .replace(",", ".") || null,

            stock: Number(form.stock),

            subcategory:
              form.subcategory || null,
          }),
        },
      );

      const data: SaveResponse =
        await response.json();

      if (!response.ok || !data.success) {
        setFieldErrors(
          data.fieldErrors ?? {},
        );

        throw new Error(
          data.message ||
            "Modification impossible.",
        );
      }

      router.push("/admin/products");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Modification impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  /* =======================================================
     ERREURS DES CHAMPS
  ======================================================= */

  function errors(key: string) {
    return fieldErrors[key]?.map(
      (message, index) => (
        <p
          key={`${key}-${index}`}
          className="mt-2 text-xs text-red-600"
        >
          {message}
        </p>
      ),
    );
  }

  /* =======================================================
     SUPPRESSION D'UNE IMAGE SUPPLÉMENTAIRE
  ======================================================= */

  function removeImage(index: number) {
    if (busy) {
      return;
    }

    setForm((current) => ({
      ...current,

      images: current.images.filter(
        (_, imageIndex) =>
          imageIndex !== index,
      ),
    }));
  }

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* EN-TÊTE */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Link
          href="/admin/products"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#087cff]"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Retour aux produits
        </Link>

        <h1 className="mt-3 text-2xl font-black text-[#071b3a]">
          Modifier le produit
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Mets à jour les informations du produit.
          Son URL reste conservée.
        </p>
      </div>

      {/* ERREUR GÉNÉRALE */}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* FORMULAIRE */}

      <form onSubmit={save}>
        <fieldset
          disabled={busy}
          className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          {/* COLONNE PRINCIPALE */}

          <div className="min-w-0 space-y-6">
            {/* INFORMATIONS */}

            <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-extrabold">
                Informations du produit
              </h2>

              <div>
                <label
                  htmlFor="edit-name"
                  className="mb-2 block text-sm font-bold"
                >
                  Nom du produit *
                </label>

                <input
                  id="edit-name"
                  required
                  maxLength={160}
                  value={form.name}
                  onChange={(event) =>
                    update(
                      "name",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />

                {errors("name")}
              </div>

              <div>
                <label
                  htmlFor="edit-short"
                  className="mb-2 block text-sm font-bold"
                >
                  Description courte *
                </label>

                <textarea
                  id="edit-short"
                  required
                  maxLength={350}
                  rows={3}
                  value={form.shortDescription}
                  onChange={(event) =>
                    update(
                      "shortDescription",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />

                {errors("shortDescription")}
              </div>

              <div>
                <label
                  htmlFor="edit-description"
                  className="mb-2 block text-sm font-bold"
                >
                  Description complète *
                </label>

                <textarea
                  id="edit-description"
                  required
                  maxLength={10000}
                  rows={10}
                  value={form.description}
                  onChange={(event) =>
                    update(
                      "description",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />

                {errors("description")}
              </div>
            </section>

            {/* IMAGES */}

            <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-extrabold">
                Images du produit
              </h2>

              <p className="text-xs text-slate-500">
                Les images actuelles restent conservées
                si tu ne les remplaces pas.
              </p>

              {/* IMAGE PRINCIPALE */}

              <div className="relative h-56 rounded-xl bg-slate-50">
                {form.mainImage ? (
                  <Image
                    src={form.mainImage}
                    alt={form.name}
                    fill
                    sizes="(min-width: 1024px) 600px, 90vw"
                    className="object-contain p-3"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Aucune image principale
                  </div>
                )}
              </div>

              <label className="block text-sm font-bold">
                Remplacer l&apos;image principale

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) =>
                    void upload(event, true)
                  }
                  className="mt-2 block w-full text-xs"
                />
              </label>

              {errors("mainImage")}

              {/* IMAGES SUPPLÉMENTAIRES */}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {form.images.map(
                  (url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="rounded-xl border border-slate-200 p-2"
                    >
                      <div className="relative h-24">
                        <Image
                          src={url}
                          alt={`${form.name} - ${
                            index + 1
                          }`}
                          fill
                          sizes="150px"
                          className="object-contain"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(index)
                        }
                        className="mt-2 flex min-h-10 w-full items-center justify-center gap-1 text-xs text-red-600"
                      >
                        <Trash2
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        Retirer
                      </button>
                    </div>
                  ),
                )}
              </div>

              <label className="block text-sm font-bold">
                Ajouter des images (
                {form.images.length}/
                {MAX_EXTRA_IMAGES})

                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) =>
                    void upload(event, false)
                  }
                  className="mt-2 block w-full text-xs"
                />
              </label>

              {errors("images")}
            </section>
          </div>

          {/* COLONNE VENTE */}

          <section className="h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-extrabold">
              Vente
            </h2>

            {/* CATÉGORIE */}

            <div>
              <label
                htmlFor="edit-category"
                className="mb-2 block text-sm font-bold"
              >
                Kategorie *
              </label>

              <select
                id="edit-category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    category:
                      event.target.value as ProductCategoryValue,

                    subcategory: "",
                  }))
                }
                className={inputClass}
              >
                {PRODUCT_CATEGORIES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {
                        PRODUCT_CATEGORY_LABELS[
                          value
                        ]
                      }
                    </option>
                  ),
                )}
              </select>

              {errors("category")}
            </div>

            {/* SOUS-CATÉGORIE */}

            <div>
              <label
                htmlFor="edit-subcategory"
                className="mb-2 block text-sm font-bold"
              >
                Unterkategorie (optional)
              </label>

              <select
                id="edit-subcategory"
                value={form.subcategory}
                onChange={(event) =>
                  update(
                    "subcategory",
                    event.target.value,
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Unterkategorie auswählen
                </option>

                {PRODUCT_SUBCATEGORIES[
                  form.category
                ].map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              {errors("subcategory")}
            </div>

            {/* PRIX */}

            <div>
              <label
                htmlFor="edit-price"
                className="mb-2 block text-sm font-bold"
              >
                Prix réel (€) *
              </label>

              <input
                id="edit-price"
                required
                inputMode="decimal"
                value={form.price}
                onChange={(event) =>
                  update(
                    "price",
                    event.target.value,
                  )
                }
                className={inputClass}
              />

              {errors("price")}
            </div>

            {/* PROMOTION */}

            <div>
              <label
                htmlFor="edit-promo"
                className="mb-2 block text-sm font-bold"
              >
                Prix promotionnel (€)
              </label>

              <input
                id="edit-promo"
                inputMode="decimal"
                value={form.promotionalPrice}
                onChange={(event) =>
                  update(
                    "promotionalPrice",
                    event.target.value,
                  )
                }
                className={inputClass}
              />

              <p className="mt-2 text-xs text-slate-500">
                Laisser vide pour retirer la promotion.
              </p>

              {errors("promotionalPrice")}
            </div>

            {/* STOCK */}

            <div>
              <label
                htmlFor="edit-stock"
                className="mb-2 block text-sm font-bold"
              >
                Stock *
              </label>

              <input
                id="edit-stock"
                required
                type="number"
                min={0}
                max={1000000}
                step={1}
                value={form.stock}
                onChange={(event) =>
                  update(
                    "stock",
                    event.target.value,
                  )
                }
                className={inputClass}
              />

              {errors("stock")}
            </div>

            {/* STATUT */}

            <div>
              <label
                htmlFor="edit-status"
                className="mb-2 block text-sm font-bold"
              >
                Statut *
              </label>

              <select
                id="edit-status"
                value={form.status}
                onChange={(event) =>
                  update(
                    "status",
                    event.target
                      .value as EditableProduct["status"],
                  )
                }
                className={inputClass}
              >
                <option value="DRAFT">
                  Brouillon
                </option>

                <option value="PUBLISHED">
                  Publié
                </option>

                <option value="ARCHIVED">
                  Archivé
                </option>
              </select>

              {errors("status")}
            </div>

            {/* ENREGISTRER */}

            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#087cff] px-4 text-sm font-extrabold text-white hover:bg-[#006bea] disabled:opacity-50"
            >
              {busy ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              )}

              {uploading
                ? "Envoi des images..."
                : pending
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
            </button>

            <Link
              href="/admin/products"
              className="flex min-h-11 items-center justify-center text-sm text-slate-500"
            >
              Annuler
            </Link>
          </section>
        </fieldset>
      </form>
    </div>
  );
}
