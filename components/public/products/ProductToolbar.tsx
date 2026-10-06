"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export type ProductSort =
  | "newest"
  | "price-asc"
  | "price-desc";

type ProductToolbarProps = {
  search: string;
  sort: ProductSort;
  totalProducts: number;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ProductSort) => void;
  onOpenFilters: () => void;
};

export default function ProductToolbar({
  search,
  sort,
  totalProducts,
  onSearchChange,
  onSortChange,
  onOpenFilters,
}: ProductToolbarProps) {
  const productLabel =
    totalProducts === 1 ? "Produkt" : "Produkte";

  return (
    <div className="w-full">
      {/* =====================================================
          DESKTOP
      ===================================================== */}
      <div className="hidden items-center gap-5 md:flex">
        {/* Recherche */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={19}
            strokeWidth={1.8}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Produkte suchen ..."
            aria-label="Produkte suchen"
            autoComplete="off"
            className="
              h-12
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              pl-12
              pr-4
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

        {/* Nombre de produits */}
        <div className="shrink-0 whitespace-nowrap text-sm font-medium text-slate-600">
          {totalProducts} {productLabel}
        </div>

        {/* Tri */}
        <div className="shrink-0">
          <label htmlFor="product-sort" className="sr-only">
            Produkte sortieren
          </label>

          <select
            id="product-sort"
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as ProductSort)
            }
            className="
              h-12
              min-w-[220px]
              cursor-pointer
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              text-sm
              font-medium
              text-slate-900
              outline-none
              transition
              focus:border-blue-600
              focus:ring-2
              focus:ring-blue-600/10
            "
          >
            <option value="newest">
              Sortieren: Neueste zuerst
            </option>

            <option value="price-asc">
              Preis: niedrig bis hoch
            </option>

            <option value="price-desc">
              Preis: hoch bis niedrig
            </option>
          </select>
        </div>
      </div>

      {/* =====================================================
          MOBILE
      ===================================================== */}
      <div className="md:hidden">
        {/* Recherche */}
        <div className="relative">
          <Search
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Produkte suchen ..."
            aria-label="Produkte suchen"
            autoComplete="off"
            className="
              h-11
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              pl-11
              pr-4
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

        {/* Filtre + tri */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onOpenFilters}
            className="
              flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3
              text-sm
              font-semibold
              text-slate-900
              transition
              hover:border-slate-400
              hover:bg-slate-50
              active:scale-[0.99]
            "
          >
            <SlidersHorizontal
              size={17}
              strokeWidth={2}
              aria-hidden="true"
            />

            Filter
          </button>

          <div className="relative">
            <label htmlFor="product-sort-mobile" className="sr-only">
              Produkte sortieren
            </label>

            <select
              id="product-sort-mobile"
              value={sort}
              onChange={(event) =>
                onSortChange(event.target.value as ProductSort)
              }
              className="
                h-11
                w-full
                cursor-pointer
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                text-center
                text-sm
                font-semibold
                text-slate-900
                outline-none
                transition
                focus:border-blue-600
                focus:ring-2
                focus:ring-blue-600/10
              "
            >
              <option value="newest">
                Sortieren
              </option>

              <option value="price-asc">
                Preis ↑
              </option>

              <option value="price-desc">
                Preis ↓
              </option>
            </select>
          </div>
        </div>

        {/* Nombre de produits */}
        <div className="mt-4 text-sm font-medium text-slate-600">
          {totalProducts} {productLabel}
        </div>
      </div>
    </div>
  );
}