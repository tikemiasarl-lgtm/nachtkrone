"use client";

import { useEffect } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

export type ProductCategoryFilter =
  | "MASK"
  | "COSTUME"
  | "MASK_AND_COSTUME";

export type ProductFiltersValue = {
  categories: ProductCategoryFilter[];
  minPrice: string;
  maxPrice: string;
  onlyAvailable: boolean;
};

type ProductFiltersProps = {
  value: ProductFiltersValue;
  onChange: (value: ProductFiltersValue) => void;
  onReset: () => void;

  /**
   * Desktop :
   * false par défaut.
   *
   * Mobile :
   * true lorsque le panneau de filtres est ouvert.
   */
  mobile?: boolean;

  /**
   * Utilisé uniquement pour le panneau mobile.
   */
  open?: boolean;

  /**
   * Ferme le panneau mobile.
   */
  onClose?: () => void;
};

/* =========================================================
   CATÉGORIES
========================================================= */

const CATEGORY_OPTIONS: Array<{
  value: ProductCategoryFilter;
  label: string;
}> = [
  {
    value: "MASK",
    label: "Masken",
  },
  {
    value: "COSTUME",
    label: "Kostüme",
  },
  {
    value: "MASK_AND_COSTUME",
    label: "Maske & Kostüm",
  },
];

/* =========================================================
   COMPOSANT
========================================================= */

export default function ProductFilters({
  value,
  onChange,
  onReset,
  mobile = false,
  open = false,
  onClose,
}: ProductFiltersProps) {
  /* =======================================================
     BLOQUER LE SCROLL DERRIÈRE LE PANNEAU MOBILE
  ======================================================= */

  useEffect(() => {
    if (!mobile || !open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobile, open]);

  /* =======================================================
     FERMETURE AVEC ESCAPE
  ======================================================= */

  useEffect(() => {
    if (!mobile || !open || !onClose) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobile, open, onClose]);

  /* =======================================================
     ACTIONS
  ======================================================= */

  function toggleCategory(category: ProductCategoryFilter) {
    const alreadySelected = value.categories.includes(category);

    const categories = alreadySelected
      ? value.categories.filter((item) => item !== category)
      : [...value.categories, category];

    onChange({
      ...value,
      categories,
    });
  }

  function updateMinPrice(newValue: string) {
    onChange({
      ...value,
      minPrice: sanitizePriceValue(newValue),
    });
  }

  function updateMaxPrice(newValue: string) {
    onChange({
      ...value,
      maxPrice: sanitizePriceValue(newValue),
    });
  }

  function toggleAvailability() {
    onChange({
      ...value,
      onlyAvailable: !value.onlyAvailable,
    });
  }

  function handleReset() {
    onReset();
  }

  /* =======================================================
     CONTENU DES FILTRES
  ======================================================= */

  const content = (
    <div className="w-full">
      {/* ===================================================
          CATÉGORIE
      =================================================== */}

      <FilterSection
        title="Kategorie"
        defaultOpen
      >
        <div className="space-y-3">
          {CATEGORY_OPTIONS.map((category) => {
            const checked = value.categories.includes(
              category.value,
            );

            return (
              <label
                key={category.value}
                className="
                  group
                  flex
                  cursor-pointer
                  items-center
                  gap-3
                  text-sm
                  text-slate-800
                "
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    toggleCategory(category.value)
                  }
                  className="sr-only"
                />

                <span
                  aria-hidden="true"
                  className={`
                    flex
                    h-[18px]
                    w-[18px]
                    shrink-0
                    items-center
                    justify-center
                    rounded
                    border
                    transition
                    ${
                      checked
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-transparent group-hover:border-slate-400"
                    }
                  `}
                >
                  <Check
                    size={13}
                    strokeWidth={3}
                  />
                </span>

                <span className="leading-5">
                  {category.label}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* ===================================================
          PRIX
      =================================================== */}

      <FilterSection
        title="Preis (€)"
        defaultOpen
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <label
              htmlFor={
                mobile
                  ? "mobile-min-price"
                  : "desktop-min-price"
              }
              className="sr-only"
            >
              Mindestpreis
            </label>

            <input
              id={
                mobile
                  ? "mobile-min-price"
                  : "desktop-min-price"
              }
              type="text"
              inputMode="decimal"
              value={value.minPrice}
              onChange={(event) =>
                updateMinPrice(event.target.value)
              }
              placeholder="Min."
              autoComplete="off"
              className="
                h-10
                w-full
                rounded-md
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                text-slate-950
                outline-none
                transition
                placeholder:text-slate-500
                focus:border-blue-600
                focus:ring-2
                focus:ring-blue-600/10
              "
            />
          </div>

          <span
            aria-hidden="true"
            className="shrink-0 text-slate-400"
          >
            –
          </span>

          <div className="min-w-0 flex-1">
            <label
              htmlFor={
                mobile
                  ? "mobile-max-price"
                  : "desktop-max-price"
              }
              className="sr-only"
            >
              Höchstpreis
            </label>

            <input
              id={
                mobile
                  ? "mobile-max-price"
                  : "desktop-max-price"
              }
              type="text"
              inputMode="decimal"
              value={value.maxPrice}
              onChange={(event) =>
                updateMaxPrice(event.target.value)
              }
              placeholder="Max."
              autoComplete="off"
              className="
                h-10
                w-full
                rounded-md
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                text-slate-950
                outline-none
                transition
                placeholder:text-slate-500
                focus:border-blue-600
                focus:ring-2
                focus:ring-blue-600/10
              "
            />
          </div>
        </div>
      </FilterSection>

      {/* ===================================================
          DISPONIBILITÉ
      =================================================== */}

      <div className="border-t border-slate-200 py-5">
        <label
          className="
            group
            flex
            cursor-pointer
            items-center
            gap-3
            text-sm
            text-slate-800
          "
        >
          <input
            type="checkbox"
            checked={value.onlyAvailable}
            onChange={toggleAvailability}
            className="sr-only"
          />

          <span
            aria-hidden="true"
            className={`
              flex
              h-[18px]
              w-[18px]
              shrink-0
              items-center
              justify-center
              rounded
              border
              transition
              ${
                value.onlyAvailable
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-transparent group-hover:border-slate-400"
              }
            `}
          >
            <Check
              size={13}
              strokeWidth={3}
            />
          </span>

          <span className="leading-5">
            Nur verfügbare Produkte
          </span>
        </label>
      </div>

      {/* ===================================================
          RÉINITIALISATION
      =================================================== */}

      <div className="border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={handleReset}
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-blue-600
            transition
            hover:text-blue-700
          "
        >
          <RotateCcw
            size={17}
            strokeWidth={2}
            aria-hidden="true"
          />

          Filter zurücksetzen
        </button>
      </div>
    </div>
  );

  /* =======================================================
     VERSION DESKTOP
  ======================================================= */

  if (!mobile) {
    return (
      <aside
        aria-label="Produktfilter"
        className="
          hidden
          w-full
          rounded-lg
          border
          border-slate-200
          bg-white
          md:block
        "
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-950">
            Filter
          </h2>
        </div>

        <div className="px-5 pb-5">
          {content}
        </div>
      </aside>
    );
  }

  /* =======================================================
     VERSION MOBILE
  ======================================================= */

  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        aria-label="Filter schließen"
        onClick={onClose}
        className={`
          fixed
          inset-0
          z-[80]
          bg-slate-950/45
          transition-opacity
          duration-200
          md:hidden
          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      {/* Panneau */}
      <aside
        aria-label="Produktfilter"
        aria-hidden={!open}
        className={`
          fixed
          inset-x-0
          bottom-0
          z-[90]
          max-h-[85dvh]
          overflow-hidden
          rounded-t-2xl
          bg-white
          shadow-2xl
          transition-transform
          duration-300
          ease-out
          md:hidden
          ${
            open
              ? "translate-y-0"
              : "translate-y-full"
          }
        `}
      >
        {/* Barre supérieure */}
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            px-5
            py-4
          "
        >
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Filter
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Produkte filtern
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Filter schließen"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white
              text-slate-700
              transition
              hover:bg-slate-50
            "
          >
            <X
              size={20}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div
          className="
            max-h-[calc(85dvh-132px)]
            overflow-y-auto
            px-5
            pb-6
          "
        >
          {content}
        </div>

        {/* Bouton mobile */}
        <div
          className="
            border-t
            border-slate-200
            bg-white
            px-5
            pb-[calc(1rem+env(safe-area-inset-bottom))]
            pt-4
          "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-12
              w-full
              items-center
              justify-center
              rounded-lg
              bg-blue-600
              px-5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-blue-700
              active:scale-[0.99]
            "
          >
            Ergebnisse anzeigen
          </button>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   SECTION RÉUTILISABLE
========================================================= */

type FilterSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: FilterSectionProps) {
  /*
   * Les sections restent volontairement simples.
   * Le bouton visuel correspond à l'architecture de la
   * maquette sans introduire de logique lourde supplémentaire.
   */

  return (
    <section className="border-b border-slate-200 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-950">
          {title}
        </h3>

        {defaultOpen ? (
          <ChevronUp
            size={16}
            strokeWidth={2}
            className="text-slate-700"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            size={16}
            strokeWidth={2}
            className="text-slate-700"
            aria-hidden="true"
          />
        )}
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   UTILITAIRE PRIX
========================================================= */

function sanitizePriceValue(value: string) {
  /*
   * Autorise :
   * 100
   * 100.50
   * 100,50
   *
   * La conversion finale en nombre sera effectuée dans
   * ProductsPage lorsque les produits seront filtrés.
   */

  const sanitized = value
    .replace(/[^\d.,]/g, "")
    .replace(/([.,].*)[.,]/g, "$1");

  return sanitized;
}