"use client";

import {
  Check,
  ClipboardCheck,
  MapPin,
  UserRound,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — CHECKOUT STEPS
   components/public/checkout/CheckoutSteps.tsx

   Indicateur visuel des étapes du checkout.

   Étapes :
   1. Kontakt
   2. Lieferung
   3. Bestätigung

   RESPONSABILITÉS :
   - afficher la progression
   - différencier étape active / terminée / future
   - rester parfaitement responsive
   - rester accessible
   - ne gérer aucune donnée client
   - ne gérer aucune commande
   - ne gérer aucun paiement

   Ce composant est purement visuel.
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type CheckoutStep =
  | "contact"
  | "shipping"
  | "confirmation";

type CheckoutStepsProps = {
  currentStep?: CheckoutStep;

  className?: string;
};

type StepDefinition = {
  id: CheckoutStep;
  number: number;
  label: string;
  shortLabel: string;
  icon: typeof UserRound;
};

/* =========================================================
   CONFIGURATION
   ========================================================= */

const CHECKOUT_STEPS: readonly StepDefinition[] = [
  {
    id: "contact",
    number: 1,
    label: "Kontakt",
    shortLabel: "Kontakt",
    icon: UserRound,
  },
  {
    id: "shipping",
    number: 2,
    label: "Lieferung",
    shortLabel: "Lieferung",
    icon: MapPin,
  },
  {
    id: "confirmation",
    number: 3,
    label: "Bestätigung",
    shortLabel: "Bestätigung",
    icon: ClipboardCheck,
  },
] as const;

/* =========================================================
   HELPERS
   ========================================================= */

function getStepIndex(
  step: CheckoutStep
): number {
  return CHECKOUT_STEPS.findIndex(
    (item) => item.id === step
  );
}

function joinClassNames(
  ...classes: Array<
    string | false | null | undefined
  >
): string {
  return classes
    .filter(Boolean)
    .join(" ");
}

/* =========================================================
   COMPOSANT
   ========================================================= */

export default function CheckoutSteps({
  currentStep = "contact",
  className,
}: CheckoutStepsProps) {
  const currentIndex = Math.max(
    0,
    getStepIndex(currentStep)
  );

  return (
    <nav
      aria-label="Bestellfortschritt"
      className={joinClassNames(
        "w-full",
        className
      )}
    >
      <ol
        className="
          relative
          grid
          w-full
          grid-cols-3
          items-start
        "
      >
        {CHECKOUT_STEPS.map(
          (step, index) => {
            const Icon =
              step.icon;

            const isCompleted =
              index < currentIndex;

            const isActive =
              index === currentIndex;

            const isFuture =
              index > currentIndex;

            return (
              <li
                key={step.id}
                aria-current={
                  isActive
                    ? "step"
                    : undefined
                }
                className="
                  relative
                  flex
                  min-w-0
                  flex-col
                  items-center
                  text-center
                "
              >
                {/* =========================================
                    LIGNE GAUCHE

                    Chaque étape sauf la première possède
                    la moitié gauche de la ligne.
                   ========================================= */}

                {index > 0 ? (
                  <div
                    aria-hidden="true"
                    className="
                      absolute
                      left-0
                      right-1/2
                      top-[22px]
                      h-[2px]
                      pr-[22px]
                    "
                  >
                    <div
                      className={joinClassNames(
                        "h-full w-full",
                        "transition-colors duration-300",

                        isCompleted ||
                          isActive
                          ? "bg-[#1769e0]"
                          : "bg-slate-200"
                      )}
                    />
                  </div>
                ) : null}

                {/* =========================================
                    LIGNE DROITE

                    Chaque étape sauf la dernière possède
                    la moitié droite de la ligne.
                   ========================================= */}

                {index <
                CHECKOUT_STEPS.length -
                  1 ? (
                  <div
                    aria-hidden="true"
                    className="
                      absolute
                      left-1/2
                      right-0
                      top-[22px]
                      h-[2px]
                      pl-[22px]
                    "
                  >
                    <div
                      className={joinClassNames(
                        "h-full w-full",
                        "transition-colors duration-300",

                        isCompleted
                          ? "bg-[#1769e0]"
                          : "bg-slate-200"
                      )}
                    />
                  </div>
                ) : null}

                {/* =========================================
                    CERCLE
                   ========================================= */}

                <div
                  className="
                    relative
                    z-10
                    flex
                    flex-col
                    items-center
                  "
                >
                  <div
                    className={joinClassNames(
                      [
                        "flex",
                        "h-11",
                        "w-11",
                        "items-center",
                        "justify-center",
                        "rounded-full",
                        "border-2",
                        "transition-all",
                        "duration-300",
                      ].join(" "),

                      isCompleted &&
                        [
                          "border-[#1769e0]",
                          "bg-[#1769e0]",
                          "text-white",
                          "shadow-[0_6px_18px_rgba(23,105,224,0.20)]",
                        ].join(" "),

                      isActive &&
                        [
                          "border-[#1769e0]",
                          "bg-white",
                          "text-[#1769e0]",
                          "shadow-[0_0_0_5px_rgba(23,105,224,0.10)]",
                        ].join(" "),

                      isFuture &&
                        [
                          "border-slate-200",
                          "bg-white",
                          "text-slate-400",
                        ].join(" ")
                    )}
                  >
                    {isCompleted ? (
                      <Check
                        aria-hidden="true"
                        className="h-5 w-5"
                        strokeWidth={2.8}
                      />
                    ) : (
                      <Icon
                        aria-hidden="true"
                        className="h-[18px] w-[18px]"
                        strokeWidth={
                          isActive
                            ? 2.4
                            : 2
                        }
                      />
                    )}
                  </div>

                  {/* =======================================
                      NUMÉRO ACCESSIBLE
                     ======================================= */}

                  <span className="sr-only">
                    Schritt{" "}
                    {step.number} von{" "}
                    {
                      CHECKOUT_STEPS.length
                    }
                    : {step.label}.
                    {isCompleted
                      ? " Abgeschlossen."
                      : isActive
                        ? " Aktuell."
                        : " Noch nicht abgeschlossen."}
                  </span>

                  {/* =======================================
                      LIBELLÉ
                     ======================================= */}

                  <div
                    className="
                      mt-3
                      flex
                      min-w-0
                      flex-col
                      items-center
                    "
                  >
                    <span
                      className={joinClassNames(
                        [
                          "max-w-full",
                          "truncate",
                          "text-[11px]",
                          "font-black",
                          "leading-4",
                          "transition-colors",
                          "duration-300",
                          "sm:text-xs",
                          "md:text-sm",
                        ].join(" "),

                        isCompleted ||
                          isActive
                          ? "text-slate-900"
                          : "text-slate-400"
                      )}
                    >
                      <span className="sm:hidden">
                        {
                          step.shortLabel
                        }
                      </span>

                      <span className="hidden sm:inline">
                        {step.label}
                      </span>
                    </span>

                    {/* =====================================
                        PETIT ÉTAT DESKTOP
                       ===================================== */}

                    <span
                      aria-hidden="true"
                      className={joinClassNames(
                        [
                          "mt-1",
                          "hidden",
                          "text-[10px]",
                          "font-bold",
                          "leading-4",
                          "md:block",
                        ].join(" "),

                        isCompleted
                          ? "text-emerald-600"
                          : isActive
                            ? "text-[#1769e0]"
                            : "text-slate-400"
                      )}
                    >
                      {isCompleted
                        ? "Abgeschlossen"
                        : isActive
                          ? "Aktuell"
                          : `Schritt ${step.number}`}
                    </span>
                  </div>
                </div>
              </li>
            );
          }
        )}
      </ol>
    </nav>
  );
}