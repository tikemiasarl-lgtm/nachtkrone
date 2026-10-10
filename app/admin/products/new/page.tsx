"use client";

import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, PRODUCT_SUBCATEGORIES, type ProductCategoryValue } from "@/lib/product-categories";

import Image from "next/image";
import Link from "next/link";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Images,
  Loader2,
  PackagePlus,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — AJOUT PRODUIT
   app/admin/products/new/page.tsx
   ========================================================= */

const MAX_ADDITIONAL_IMAGES = 15;
const MAX_TOTAL_IMAGES = 16;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

type ProductCategory = ProductCategoryValue;

type ProductStatus =
  | "DRAFT"
  | "PUBLISHED";

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

type UploadResponse = {
  success?: boolean;
  message?: string;

  images?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
};

type ProductResponse = {
  success?: boolean;
  message?: string;

  product?: {
    id: string;
    slug: string;
  };

  fieldErrors?: Partial<
    Record<string, string[]>
  >;
};

/* =========================================================
   IDENTIFIANT LOCAL
   ========================================================= */

function createLocalId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/* =========================================================
   NORMALISATION DES PRIX
   ========================================================= */

function normalizePriceValue(value: string) {
  return value
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
}

/* =========================================================
   PAGE
   ========================================================= */

export default function NewProductPage() {
  const router = useRouter();

  const mainImageInputRef =
    useRef<HTMLInputElement>(null);

  const additionalImagesInputRef =
    useRef<HTMLInputElement>(null);

  /* =======================================================
     INFORMATIONS PRODUIT
     ======================================================= */

  const [name, setName] = useState("");

  const [
    shortDescription,
    setShortDescription,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [category, setCategory] =
    useState<ProductCategory>("MASK");

  const [subcategory, setSubcategory] = useState("");

  const [price, setPrice] = useState("");

  const [
    promotionalPrice,
    setPromotionalPrice,
  ] = useState("");

  const [stock, setStock] = useState("0");

  /* =======================================================
     IMAGES
     ======================================================= */

  const [mainImage, setMainImage] =
    useState<SelectedImage | null>(null);

  const [
    additionalImages,
    setAdditionalImages,
  ] = useState<SelectedImage[]>([]);

  const [isDraggingMain, setIsDraggingMain] =
    useState(false);

  const [
    isDraggingAdditional,
    setIsDraggingAdditional,
  ] = useState(false);

  /* =======================================================
     ÉTAT
     ======================================================= */

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [fieldErrors, setFieldErrors] =
    useState<
      Partial<Record<string, string[]>>
    >({});

  /* =======================================================
     NETTOYAGE DES PREVIEWS
     ======================================================= */

  useEffect(() => {
    return () => {
      if (mainImage) {
        URL.revokeObjectURL(
          mainImage.preview
        );
      }

      for (const image of additionalImages) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [mainImage, additionalImages]);

  /* =======================================================
     ERREURS
     ======================================================= */

  function clearMessages() {
    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[field];

      return next;
    });
  }

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0];
  }

  /* =======================================================
     VALIDATION IMAGE CLIENT
     ======================================================= */

  function validateImageFile(
    file: File
  ): string | null {
    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      return `Le fichier "${file.name}" n'est pas une image JPG, PNG, WEBP ou AVIF valide.`;
    }

    if (file.size <= 0) {
      return `Le fichier "${file.name}" est vide.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `Le fichier "${file.name}" dépasse 8 Mo.`;
    }

    return null;
  }

  function fileAlreadySelected(
    file: File
  ) {
    const signature = `${file.name}-${file.size}-${file.lastModified}`;

    if (mainImage) {
      const mainSignature = `${mainImage.file.name}-${mainImage.file.size}-${mainImage.file.lastModified}`;

      if (signature === mainSignature) {
        return true;
      }
    }

    return additionalImages.some(
      (image) =>
        `${image.file.name}-${image.file.size}-${image.file.lastModified}` ===
        signature
    );
  }

  function createSelectedImage(
    file: File
  ): SelectedImage {
    return {
      id: createLocalId(),
      file,
      preview:
        URL.createObjectURL(file),
    };
  }

  /* =======================================================
     IMAGE PRINCIPALE
     ======================================================= */

  function selectMainImage(
    file: File | undefined
  ) {
    if (!file) {
      return;
    }

    clearMessages();
    clearFieldError("mainImage");

    const validationError =
      validateImageFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (fileAlreadySelected(file)) {
      setError(
        "Cette image est déjà sélectionnée."
      );

      return;
    }

    const selected =
      createSelectedImage(file);

    setMainImage((current) => {
      if (current) {
        URL.revokeObjectURL(
          current.preview
        );
      }

      return selected;
    });
  }

  function handleMainImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    selectMainImage(file);

    event.target.value = "";
  }

  function removeMainImage() {
    if (mainImage) {
      URL.revokeObjectURL(
        mainImage.preview
      );
    }

    setMainImage(null);
  }

  function handleMainDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDraggingMain(false);

    const file =
      event.dataTransfer.files?.[0];

    selectMainImage(file);
  }

  /* =======================================================
     IMAGES SUPPLÉMENTAIRES
     ======================================================= */

  function addAdditionalImages(
    files: File[]
  ) {
    if (files.length === 0) {
      return;
    }

    clearMessages();
    clearFieldError("images");

    const remainingSlots =
      MAX_ADDITIONAL_IMAGES -
      additionalImages.length;

    if (remainingSlots <= 0) {
      setError(
        `Maximum ${MAX_ADDITIONAL_IMAGES} images supplémentaires.`
      );

      return;
    }

    const newImages: SelectedImage[] =
      [];

    for (const file of files) {
      if (
        newImages.length >=
        remainingSlots
      ) {
        break;
      }

      const validationError =
        validateImageFile(file);

      if (validationError) {
        setError(validationError);
        continue;
      }

      if (fileAlreadySelected(file)) {
        continue;
      }

      const alreadyInNewSelection =
        newImages.some(
          (image) =>
            image.file.name ===
              file.name &&
            image.file.size ===
              file.size &&
            image.file.lastModified ===
              file.lastModified
        );

      if (alreadyInNewSelection) {
        continue;
      }

      newImages.push(
        createSelectedImage(file)
      );
    }

    setAdditionalImages((current) => [
      ...current,
      ...newImages,
    ]);

    if (
      files.length > remainingSlots
    ) {
      setError(
        `Seulement ${remainingSlots} image${
          remainingSlots > 1 ? "s" : ""
        } supplémentaire${
          remainingSlots > 1 ? "s" : ""
        } pouvai${
          remainingSlots > 1
            ? "ent"
            : "t"
        } encore être ajoutée${
          remainingSlots > 1 ? "s" : ""
        }.`
      );
    }
  }

  function handleAdditionalImagesChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    addAdditionalImages(
      Array.from(
        event.target.files ?? []
      )
    );

    event.target.value = "";
  }

  function handleAdditionalDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDraggingAdditional(false);

    addAdditionalImages(
      Array.from(
        event.dataTransfer.files ?? []
      )
    );
  }

  function removeAdditionalImage(
    id: string
  ) {
    setAdditionalImages((current) => {
      const image =
        current.find(
          (item) => item.id === id
        );

      if (image) {
        URL.revokeObjectURL(
          image.preview
        );
      }

      return current.filter(
        (item) => item.id !== id
      );
    });
  }

  /* =======================================================
     UPLOAD
     ======================================================= */

  async function uploadFiles(
    files: File[]
  ): Promise<string[]> {
    if (files.length === 0) {
      return [];
    }

    const formData = new FormData();

    for (const file of files) {
      formData.append("files", file);
    }

    const response = await fetch(
      "/api/admin/products/upload",
      {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        body: formData,
      }
    );

    let data: UploadResponse = {};

    try {
      data =
        (await response.json()) as UploadResponse;
    } catch {
      data = {};
    }

    if (
      !response.ok ||
      !data.success ||
      !data.images
    ) {
      throw new Error(
        data.message ??
          "Impossible d'envoyer les images."
      );
    }

    return data.images.map(
      (image) => image.url
    );
  }

  /* =======================================================
     VALIDATION AVANT ENVOI
     ======================================================= */

  function validateForm() {
    const errors: Partial<
      Record<string, string[]>
    > = {};

    if (name.trim().length < 2) {
      errors.name = [
        "Le nom du produit est obligatoire.",
      ];
    }

    if (
      shortDescription.trim().length <
      10
    ) {
      errors.shortDescription = [
        "La description courte doit contenir au minimum 10 caractères.",
      ];
    }

    if (
      description.trim().length < 20
    ) {
      errors.description = [
        "La description complète doit contenir au minimum 20 caractères.",
      ];
    }

    /* -------------------------------------------------------
       PRIX RÉEL
       ------------------------------------------------------- */

    const normalizedPrice =
      Number(
        normalizePriceValue(price)
      );

    if (
      !Number.isFinite(
        normalizedPrice
      ) ||
      normalizedPrice <= 0
    ) {
      errors.price = [
        "Renseigne un prix réel valide supérieur à 0.",
      ];
    }

    /* -------------------------------------------------------
       PRIX PROMOTIONNEL
       Facultatif.
       S'il existe, il doit être inférieur au prix réel.
       ------------------------------------------------------- */

    const normalizedPromotionalPriceText =
      normalizePriceValue(
        promotionalPrice
      );

    if (
      normalizedPromotionalPriceText
    ) {
      const normalizedPromotionalPrice =
        Number(
          normalizedPromotionalPriceText
        );

      if (
        !Number.isFinite(
          normalizedPromotionalPrice
        ) ||
        normalizedPromotionalPrice <= 0
      ) {
        errors.promotionalPrice = [
          "Renseigne un prix promotionnel valide supérieur à 0.",
        ];
      } else if (
        Number.isFinite(
          normalizedPrice
        ) &&
        normalizedPrice > 0 &&
        normalizedPromotionalPrice >=
          normalizedPrice
      ) {
        errors.promotionalPrice = [
          "Le prix promotionnel doit être strictement inférieur au prix réel.",
        ];
      }
    }

    const normalizedStock =
      Number(stock);

    if (
      !Number.isInteger(
        normalizedStock
      ) ||
      normalizedStock < 0
    ) {
      errors.stock = [
        "Le stock doit être un nombre entier positif ou égal à 0.",
      ];
    }

    if (!mainImage) {
      errors.mainImage = [
        "L'image principale est obligatoire.",
      ];
    }

    setFieldErrors(errors);

    const firstError =
      Object.values(errors)[0]?.[0];

    if (firstError) {
      setError(firstError);
      return false;
    }

    return true;
  }

  /* =======================================================
     ENREGISTREMENT
     ======================================================= */

  async function saveProduct(
    status: ProductStatus
  ) {
    if (isSubmitting) {
      return;
    }

    clearMessages();

    if (!validateForm()) {
      return;
    }

    if (!mainImage) {
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * Toutes les images sont envoyées
       * ensemble.
       *
       * La première est toujours
       * l'image principale.
       */

      const allFiles = [
        mainImage.file,
        ...additionalImages.map(
          (image) => image.file
        ),
      ];

      if (
        allFiles.length >
        MAX_TOTAL_IMAGES
      ) {
        throw new Error(
          `Un produit peut contenir au maximum ${MAX_TOTAL_IMAGES} images.`
        );
      }

      const uploadedUrls =
        await uploadFiles(allFiles);

      const uploadedMainImage =
        uploadedUrls[0];

      const uploadedAdditionalImages =
        uploadedUrls.slice(1);

      if (!uploadedMainImage) {
        throw new Error(
          "L'image principale n'a pas pu être enregistrée."
        );
      }

      const response = await fetch(
        "/api/admin/products",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "same-origin",

          cache: "no-store",

          body: JSON.stringify({
            name: name.trim(),

            shortDescription:
              shortDescription.trim(),

            description:
              description.trim(),

            category,
            subcategory: subcategory || null,

            price:
              normalizePriceValue(
                price
              ),

            promotionalPrice:
              promotionalPrice.trim() === ""
                ? null
                : normalizePriceValue(
                    promotionalPrice
                  ),

            stock: Number(stock),

            mainImage:
              uploadedMainImage,

            images:
              uploadedAdditionalImages,

            status,
          }),
        }
      );

      let data: ProductResponse = {};

      try {
        data =
          (await response.json()) as ProductResponse;
      } catch {
        data = {};
      }

      if (
        !response.ok ||
        !data.success
      ) {
        if (data.fieldErrors) {
          setFieldErrors(
            data.fieldErrors
          );
        }

        throw new Error(
          data.message ??
            "Impossible d'enregistrer le produit."
        );
      }

      setSuccess(
        data.message ??
          "Produit enregistré avec succès."
      );

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void saveProduct("PUBLISHED");
  }

  /* =======================================================
     INTERFACE
     ======================================================= */

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      {/* =================================================
          HAUT DE PAGE
          ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/products"
            className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#087cff]"
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />

            Retour aux produits
          </Link>

          <h2 className="text-2xl font-black tracking-[-0.035em] text-[#071b3a] sm:text-3xl">
            Nouveau produit
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ajoutez un masque, un costume ou
            un ensemble masque et costume au
            catalogue NACHTKRONE.
          </p>
        </div>

        <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#087cff] sm:flex">
          <PackagePlus
            className="h-7 w-7"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* =================================================
          MESSAGES
          ================================================= */}

      <div
        aria-live="polite"
        className="mb-5"
      >
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span>{error}</span>
          </div>
        ) : null}

        {!error && success ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <span>{success}</span>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* =================================================
              COLONNE PRINCIPALE
              ================================================= */}

          <div className="space-y-6">
            {/* ===============================================
                INFORMATIONS
                =============================================== */}

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h3 className="text-lg font-black text-[#071b3a]">
                  Informations du produit
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Présentez clairement le
                  produit aux clients.
                </p>
              </div>

              {/* Nom */}

              <div>
                <label
                  htmlFor="product-name"
                  className="mb-2 block text-sm font-extrabold text-[#071b3a]"
                >
                  Nom du produit *
                </label>

                <input
                  id="product-name"
                  type="text"
                  maxLength={160}
                  value={name}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setName(
                      event.target.value
                    );

                    clearFieldError(
                      "name"
                    );
                  }}
                  placeholder="Ex. Masque Krampus Premium"
                  className="h-13 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-medium text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
                />

                {getFieldError("name") ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {getFieldError(
                      "name"
                    )}
                  </p>
                ) : null}
              </div>

              {/* Description courte */}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="short-description"
                    className="text-sm font-extrabold text-[#071b3a]"
                  >
                    Description courte *
                  </label>

                  <span className="text-xs font-medium text-slate-400">
                    {
                      shortDescription.length
                    }
                    /350
                  </span>
                </div>

                <textarea
                  id="short-description"
                  rows={3}
                  maxLength={350}
                  value={
                    shortDescription
                  }
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setShortDescription(
                      event.target.value
                    );

                    clearFieldError(
                      "shortDescription"
                    );
                  }}
                  placeholder="Une présentation courte et attractive du produit..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm font-medium leading-6 text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
                />

                {getFieldError(
                  "shortDescription"
                ) ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {getFieldError(
                      "shortDescription"
                    )}
                  </p>
                ) : null}
              </div>

              {/* Description complète */}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="description"
                    className="text-sm font-extrabold text-[#071b3a]"
                  >
                    Description complète *
                  </label>

                  <span className="text-xs font-medium text-slate-400">
                    {description.length}
                    /10000
                  </span>
                </div>

                <textarea
                  id="description"
                  rows={9}
                  maxLength={10000}
                  value={description}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setDescription(
                      event.target.value
                    );

                    clearFieldError(
                      "description"
                    );
                  }}
                  placeholder="Décrivez le produit : apparence, matériaux, dimensions, utilisation, entretien..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm font-medium leading-6 text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
                />

                {getFieldError(
                  "description"
                ) ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {getFieldError(
                      "description"
                    )}
                  </p>
                ) : null}
              </div>
            </section>

            {/* ===============================================
                IMAGE PRINCIPALE
                =============================================== */}

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[#071b3a]">
                    Image principale
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Cette photo sera affichée
                    en premier sur la boutique.
                  </p>
                </div>

                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-red-600">
                  Obligatoire
                </span>
              </div>

              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                disabled={isSubmitting}
                onChange={
                  handleMainImageChange
                }
              />

              {!mainImage ? (
                <div
                  onDragEnter={(
                    event
                  ) => {
                    event.preventDefault();
                    setIsDraggingMain(
                      true
                    );
                  }}
                  onDragOver={(
                    event
                  ) => {
                    event.preventDefault();
                    setIsDraggingMain(
                      true
                    );
                  }}
                  onDragLeave={() =>
                    setIsDraggingMain(
                      false
                    )
                  }
                  onDrop={handleMainDrop}
                  className={[
                    "flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition",
                    isDraggingMain
                      ? "border-[#087cff] bg-[#f2f8ff]"
                      : "border-slate-200 bg-[#fafbfc]",
                  ].join(" ")}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#087cff]">
                    <UploadCloud className="h-7 w-7" />
                  </div>

                  <p className="mt-4 text-sm font-extrabold text-[#071b3a]">
                    Ajoutez l&apos;image
                    principale
                  </p>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                    JPG, PNG, WEBP ou AVIF.
                    Maximum 8 Mo.
                  </p>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      mainImageInputRef.current?.click()
                    }
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#087cff] px-4 text-sm font-extrabold text-white transition hover:bg-[#006bea]"
                  >
                    <ImagePlus className="h-4 w-4" />

                    Choisir une image
                  </button>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fa]">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={
                        mainImage.preview
                      }
                      alt="Aperçu de l'image principale"
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#071b3a]">
                        {
                          mainImage.file
                            .name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {(
                          mainImage.file
                            .size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        Mo
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          isSubmitting
                        }
                        onClick={() =>
                          mainImageInputRef.current?.click()
                        }
                        className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-[#087cff]/30 hover:text-[#087cff]"
                      >
                        Remplacer
                      </button>

                      <button
                        type="button"
                        disabled={
                          isSubmitting
                        }
                        onClick={
                          removeMainImage
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                        aria-label="Supprimer l'image principale"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {getFieldError(
                "mainImage"
              ) ? (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {getFieldError(
                    "mainImage"
                  )}
                </p>
              ) : null}
            </section>

            {/* ===============================================
                IMAGES SUPPLÉMENTAIRES
                =============================================== */}

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[#071b3a]">
                    Galerie du produit
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Ajoutez jusqu&apos;à 15
                    photos supplémentaires.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#eaf3ff] px-3 py-1.5 text-xs font-extrabold text-[#087cff]">
                  {
                    additionalImages.length
                  }
                  /15
                </span>
              </div>

              <input
                ref={
                  additionalImagesInputRef
                }
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                disabled={isSubmitting}
                onChange={
                  handleAdditionalImagesChange
                }
              />

              {additionalImages.length <
              MAX_ADDITIONAL_IMAGES ? (
                <div
                  onDragEnter={(
                    event
                  ) => {
                    event.preventDefault();
                    setIsDraggingAdditional(
                      true
                    );
                  }}
                  onDragOver={(
                    event
                  ) => {
                    event.preventDefault();
                    setIsDraggingAdditional(
                      true
                    );
                  }}
                  onDragLeave={() =>
                    setIsDraggingAdditional(
                      false
                    )
                  }
                  onDrop={
                    handleAdditionalDrop
                  }
                  className={[
                    "flex min-h-[150px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition",
                    isDraggingAdditional
                      ? "border-[#087cff] bg-[#f2f8ff]"
                      : "border-slate-200 bg-[#fafbfc]",
                  ].join(" ")}
                >
                  <Images className="h-7 w-7 text-[#087cff]" />

                  <p className="mt-3 text-sm font-extrabold text-[#071b3a]">
                    Ajoutez plusieurs
                    photos
                  </p>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      additionalImagesInputRef.current?.click()
                    }
                    className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-[#071b3a] shadow-sm transition hover:border-[#087cff]/30 hover:text-[#087cff]"
                  >
                    Sélectionner les images
                  </button>
                </div>
              ) : null}

              {additionalImages.length >
              0 ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {additionalImages.map(
                    (image, index) => (
                      <div
                        key={image.id}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                      >
                        <div className="relative aspect-square bg-[#f7f8fa]">
                          <Image
                            src={
                              image.preview
                            }
                            alt={`Image supplémentaire ${
                              index + 1
                            }`}
                            fill
                            unoptimized
                            className="object-contain p-1.5"
                          />

                          <div className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-lg bg-[#03152f]/85 px-1.5 text-[10px] font-extrabold text-white">
                            {index + 1}
                          </div>

                          <button
                            type="button"
                            disabled={
                              isSubmitting
                            }
                            onClick={() =>
                              removeAdditionalImage(
                                image.id
                              )
                            }
                            aria-label={`Supprimer l'image ${
                              index + 1
                            }`}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-600 shadow-md transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : null}

              {getFieldError(
                "images"
              ) ? (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {getFieldError(
                    "images"
                  )}
                </p>
              ) : null}
            </section>
          </div>

          {/* =================================================
              COLONNE DROITE
              ================================================= */}

          <aside className="space-y-6">
            {/* ===============================================
                VENTE
                =============================================== */}

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black text-[#071b3a]">
                Vente
              </h3>

              {/* Kategorie */}

              <div className="mt-5">
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-extrabold text-[#071b3a]"
                >
                  Catégorie *
                </label>

                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    disabled={isSubmitting}
                    onChange={(event) => { setCategory(event.target.value as ProductCategory); setSubcategory(""); }}
                    className="h-13 w-full appearance-none rounded-xl border border-slate-200 bg-[#f8fafc] px-4 pr-11 text-sm font-bold text-[#071b3a] outline-none transition focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
                  >
                    {PRODUCT_CATEGORIES.filter(value => value !== "MASK_AND_COSTUME").map(value => <option key={value} value={value}>{PRODUCT_CATEGORY_LABELS[value]}</option>)}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="subcategory" className="mb-2 block text-sm font-extrabold text-[#071b3a]">Unterkategorie <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                <div className="relative">
                  <select id="subcategory" value={subcategory} disabled={isSubmitting} onChange={event => setSubcategory(event.target.value)} className="h-13 w-full appearance-none rounded-xl border border-slate-200 bg-[#f8fafc] px-4 pr-11 text-sm font-bold text-[#071b3a] outline-none transition focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10">
                    <option value="">Unterkategorie auswählen</option>
                    {PRODUCT_SUBCATEGORIES[category].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Prix réel */}

              <div className="mt-5">
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-extrabold text-[#071b3a]"
                >
                  Prix réel (€) *
                </label>

                <div className="relative">
                  <input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    value={price}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setPrice(
                        event.target.value
                      );

                      clearFieldError(
                        "price"
                      );

                      clearFieldError(
                        "promotionalPrice"
                      );
                    }}
                    placeholder="199,00"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 pr-12 text-sm font-bold text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">
                    €
                  </span>
                </div>

                {getFieldError(
                  "price"
                ) ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {getFieldError(
                      "price"
                    )}
                  </p>
                ) : null}
              </div>

              {/* Prix promotionnel */}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="promotional-price"
                    className="block text-sm font-extrabold text-[#071b3a]"
                  >
                    Prix promotionnel (€)
                  </label>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                    Facultatif
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="promotional-price"
                    type="text"
                    inputMode="decimal"
                    value={
                      promotionalPrice
                    }
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setPromotionalPrice(
                        event.target.value
                      );

                      clearFieldError(
                        "promotionalPrice"
                      );
                    }}
                    placeholder="149,00"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 pr-12 text-sm font-bold text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">
                    €
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Laissez vide si le produit
                  n&apos;est pas en promotion.
                  Le prix promotionnel doit
                  être inférieur au prix réel.
                </p>

                {getFieldError(
                  "promotionalPrice"
                ) ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {getFieldError(
                      "promotionalPrice"
                    )}
                  </p>
                ) : null}
              </div>

              {/* Stock */}

              <div className="mt-5">
                <label
                  htmlFor="stock"
                  className="mb-2 block text-sm font-extrabold text-[#071b3a]"
                >
                  Stock *
                </label>

                <input
                  id="stock"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={stock}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setStock(
                      event.target.value
                    );

                    clearFieldError(
                      "stock"
                    );
                  }}
                  className="h-13 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-bold text-[#071b3a] outline-none transition focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10"
                />

                {getFieldError(
                  "stock"
                ) ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {getFieldError(
                      "stock"
                    )}
                  </p>
                ) : null}
              </div>
            </section>

            {/* ===============================================
                RÉSUMÉ IMAGES
                =============================================== */}

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black text-[#071b3a]">
                Images
              </h3>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    Image principale
                  </span>

                  <span
                    className={[
                      "text-xs font-extrabold",
                      mainImage
                        ? "text-emerald-600"
                        : "text-red-500",
                    ].join(" ")}
                  >
                    {mainImage
                      ? "Ajoutée"
                      : "Manquante"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    Galerie
                  </span>

                  <span className="text-xs font-extrabold text-[#071b3a]">
                    {
                      additionalImages.length
                    }
                    /15
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="text-sm font-bold text-[#071b3a]">
                    Total
                  </span>

                  <span className="text-sm font-black text-[#087cff]">
                    {(
                      mainImage ? 1 : 0
                    ) +
                      additionalImages.length}
                    /16
                  </span>
                </div>
              </div>
            </section>

            {/* ===============================================
                PUBLICATION
                =============================================== */}

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-[102px]">
              <h3 className="text-base font-black text-[#071b3a]">
                Enregistrement
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Publiez directement le
                produit ou gardez-le en
                brouillon.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#087cff] px-4 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(8,124,255,0.20)] transition hover:bg-[#006bea] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <UploadCloud className="h-5 w-5" />
                )}

                {isSubmitting
                  ? "Enregistrement..."
                  : "Publier le produit"}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  void saveProduct(
                    "DRAFT"
                  )
                }
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#071b3a] transition hover:border-[#087cff]/30 hover:bg-[#f7faff] hover:text-[#087cff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />

                Enregistrer en brouillon
              </button>

              <Link
                href="/admin/products"
                className="mt-3 flex h-11 w-full items-center justify-center text-xs font-bold text-slate-400 transition hover:text-[#071b3a]"
              >
                Annuler
              </Link>
            </section>
          </aside>
        </div>
      </form>
    </div>
  );
}