"use client";

import Image from "next/image";

import {
  Suspense,
  type FormEvent,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   NACHTKRONE — CONNEXION ADMIN
   app/admin/login/page.tsx

   VERSION FINALE

   Fonctionnalités :
   - Connexion administrateur
   - Gestion sécurisée du paramètre "next"
   - Redirection après connexion
   - Affichage / masquage du mot de passe
   - États de chargement
   - Messages d'erreur
   - Message de succès
   - Responsive desktop / mobile
   - Compatible Next.js 16
   - useSearchParams protégé par Suspense
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type LoginResponse = {
  success?: boolean;
  message?: string;
  redirectTo?: string;
};

/* =========================================================
   SÉCURISATION DU CHEMIN DE REDIRECTION
   ========================================================= */

/**
 * Vérifie que la destination après connexion
 * reste strictement dans l'espace administrateur.
 *
 * Cela empêche notamment une redirection vers
 * un domaine externe.
 */
function getSafeRedirectPath(
  requestedPath: string | null,
  fallback: string
): string {
  /*
   * Le fallback fourni par l'API est lui aussi
   * contrôlé avant utilisation.
   */

  const safeFallback =
    fallback === "/admin" ||
    (
      fallback.startsWith("/admin/") &&
      fallback !== "/admin/login" &&
      !fallback.startsWith("/admin/login?")
    )
      ? fallback
      : "/admin";

  if (!requestedPath) {
    return safeFallback;
  }

  /*
   * Protection supplémentaire :
   *
   * une URL commençant par "//" pourrait être
   * interprétée comme une URL externe.
   */

  if (requestedPath.startsWith("//")) {
    return safeFallback;
  }

  /*
   * Seules les routes internes de l'administration
   * sont acceptées.
   */

  const isAdminPath =
    requestedPath === "/admin" ||
    requestedPath.startsWith("/admin/");

  if (!isAdminPath) {
    return safeFallback;
  }

  /*
   * On ne redirige jamais vers la page
   * de connexion elle-même.
   */

  if (
    requestedPath === "/admin/login" ||
    requestedPath.startsWith("/admin/login?") ||
    requestedPath.startsWith("/admin/login/")
  ) {
    return safeFallback;
  }

  return requestedPath;
}

/* =========================================================
   FALLBACK SUSPENSE
   ========================================================= */

/**
 * Écran affiché pendant que Next.js prépare
 * le composant utilisant useSearchParams().
 *
 * On conserve les couleurs et l'identité visuelle
 * NACHTKRONE afin d'éviter un flash visuel brutal.
 */
function AdminLoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-5 text-[#071b3a]">
      <div className="flex flex-col items-center text-center">

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_18px_60px_rgba(15,35,65,0.08)]">
          <Loader2
            className="h-7 w-7 animate-spin text-[#087cff]"
            aria-hidden="true"
          />
        </div>

        <p className="mt-5 text-sm font-extrabold text-[#071b3a]">
          Chargement de l&apos;espace administrateur...
        </p>

        <p className="mt-1 text-xs text-slate-400">
          NACHTKRONE
        </p>

      </div>
    </main>
  );
}

/* =========================================================
   PAGE EXPORTÉE

   IMPORTANT :
   useSearchParams() est utilisé dans AdminLoginContent,
   qui se trouve sous cette frontière Suspense.

   Cela permet à Next.js 16 de construire correctement
   /admin/login pendant le build de production.
   ========================================================= */

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginLoading />}>
      <AdminLoginContent />
    </Suspense>
  );
}

/* =========================================================
   CONTENU DE LA PAGE
   ========================================================= */

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* =======================================================
     FORMULAIRE
     ======================================================= */

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     CONNEXION
     ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /*
     * Protection contre un double clic pendant
     * une requête déjà en cours.
     */

    if (isSubmitting) {
      return;
    }

    setError("");
    setSuccess("");

    const normalizedEmail =
      email.trim().toLowerCase();

    /* =====================================================
       VALIDATION CLIENT
       ===================================================== */

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Renseigne ton adresse e-mail et ton mot de passe."
      );

      return;
    }

    if (
      normalizedEmail.length > 254
    ) {
      setError(
        "L'adresse e-mail renseignée est invalide."
      );

      return;
    }

    if (password.length > 256) {
      setError(
        "Le mot de passe renseigné est invalide."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /* ===================================================
         APPEL API
         =================================================== */

      const response =
        await fetch(
          "/api/admin/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },

            credentials:
              "same-origin",

            cache:
              "no-store",

            body:
              JSON.stringify({
                email:
                  normalizedEmail,
                password,
              }),
          }
        );

      /* ===================================================
         LECTURE DE LA RÉPONSE
         =================================================== */

      let data: LoginResponse =
        {};

      try {
        data =
          (await response.json()) as LoginResponse;
      } catch {
        data = {};
      }

      /* ===================================================
         ÉCHEC
         =================================================== */

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ??
            "Impossible de se connecter. Vérifie tes identifiants."
        );

        return;
      }

      /* ===================================================
         SUCCÈS
         =================================================== */

      setSuccess(
        "Connexion réussie."
      );

      /*
       * Si le proxy a redirigé l'administrateur vers :
       *
       * /admin/login?next=/admin/products
       *
       * alors nous récupérons :
       *
       * /admin/products
       *
       * Sinon, la destination par défaut reste /admin.
       */

      const requestedPath =
        searchParams.get("next");

      const redirectPath =
        getSafeRedirectPath(
          requestedPath,
          data.redirectTo ??
            "/admin"
        );

      /*
       * replace évite de conserver la page de connexion
       * dans l'historique de navigation.
       */

      router.replace(
        redirectPath
      );

      /*
       * Permet aux Server Components de récupérer
       * immédiatement la nouvelle session.
       */

      router.refresh();
    } catch {
      setError(
        "Impossible de joindre le serveur. Vérifie ta connexion puis réessaie."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* =======================================================
     INTERFACE
     ======================================================= */

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#071b3a]">

      <div className="flex min-h-screen">

        {/* =================================================
            PARTIE VISUELLE — DESKTOP
            ================================================= */}

        <section className="relative hidden w-[46%] overflow-hidden bg-[#03152f] lg:flex lg:flex-col lg:justify-between">

          {/* Décor bleu */}

          <div
            aria-hidden="true"
            className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-[#087cff]/20 blur-3xl"
          />

          {/* Décor doré */}

          <div
            aria-hidden="true"
            className="absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full bg-[#f0b51b]/15 blur-3xl"
          />

          {/* Overlay */}

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_45%,rgba(0,0,0,0.12)_100%)]"
          />

          {/* ===============================================
              LOGO DESKTOP
              =============================================== */}

          <div className="relative z-10 px-12 pt-12">

            <div className="relative h-16 w-[310px] max-w-full">

              <Image
                src="/logo/logo.png"
                alt="NACHTKRONE"
                fill
                priority
                sizes="310px"
                className="object-contain object-left"
              />

            </div>

          </div>

          {/* ===============================================
              PRÉSENTATION
              =============================================== */}

          <div className="relative z-10 max-w-xl px-12">

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">

              <ShieldCheck
                className="h-7 w-7 text-[#f0b51b]"
                strokeWidth={1.8}
                aria-hidden="true"
              />

            </div>

            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#1994ff]">
              Administration
            </p>

            <h1 className="max-w-lg text-4xl font-black leading-[1.08] tracking-[-0.035em] text-white xl:text-5xl">
              Gérez votre boutique
              <span className="text-[#f0b51b]">
                {" "}
                NACHTKRONE
              </span>
              .
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              Produits, commandes, clients et ventes réunis
              dans un espace simple et sécurisé.
            </p>

          </div>

          {/* ===============================================
              BAS DE LA PARTIE DESKTOP
              =============================================== */}

          <div className="relative z-10 px-12 pb-10">

            <div className="h-px w-full bg-white/10" />

            <p className="mt-6 text-xs leading-5 text-slate-400">
              Espace privé réservé à l&apos;administration
              NACHTKRONE.
            </p>

          </div>

        </section>

        {/* =================================================
            PARTIE CONNEXION
            ================================================= */}

        <section className="flex min-h-screen flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">

          <div className="w-full max-w-[460px]">

            {/* ===============================================
                LOGO MOBILE
                =============================================== */}

            <div className="mb-10 lg:hidden">

              <div className="mx-auto flex w-fit rounded-2xl bg-[#03152f] px-6 py-4 shadow-sm">

                <div className="relative h-10 w-[210px]">

                  <Image
                    src="/logo/logo.png"
                    alt="NACHTKRONE"
                    fill
                    priority
                    sizes="210px"
                    className="object-contain"
                  />

                </div>

              </div>

            </div>

            {/* ===============================================
                EN-TÊTE
                =============================================== */}

            <div className="mb-8">

              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#087cff] lg:hidden">

                <LockKeyhole
                  className="h-6 w-6"
                  aria-hidden="true"
                />

              </div>

              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#087cff]">
                Espace administrateur
              </p>

              <h2 className="text-3xl font-black tracking-[-0.035em] text-[#071b3a] sm:text-4xl">
                Connexion
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Connectez-vous pour accéder au tableau de bord.
              </p>

            </div>

            {/* ===============================================
                FORMULAIRE
                =============================================== */}

            <form
              onSubmit={
                handleSubmit
              }
              className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,35,65,0.08)] sm:p-8"
              noValidate
            >

              {/* =============================================
                  EMAIL
                  ============================================= */}

              <div>

                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-bold text-[#071b3a]"
                >
                  Adresse e-mail
                </label>

                <div className="relative">

                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={254}
                    required
                    disabled={
                      isSubmitting
                    }
                    value={email}
                    onChange={(
                      event
                    ) => {
                      setEmail(
                        event.target
                          .value
                      );

                      if (error) {
                        setError("");
                      }

                      if (success) {
                        setSuccess("");
                      }
                    }}
                    placeholder="Adresse e-mail"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-12 pr-4 text-[15px] font-medium text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

              {/* =============================================
                  MOT DE PASSE
                  ============================================= */}

              <div className="mt-5">

                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-bold text-[#071b3a]"
                >
                  Mot de passe
                </label>

                <div className="relative">

                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="admin-password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    maxLength={256}
                    required
                    disabled={
                      isSubmitting
                    }
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) => {
                      setPassword(
                        event.target
                          .value
                      );

                      if (error) {
                        setError("");
                      }

                      if (success) {
                        setSuccess("");
                      }
                    }}
                    placeholder="Votre mot de passe"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-12 pr-14 text-[15px] font-medium text-[#071b3a] outline-none transition placeholder:text-slate-400 focus:border-[#087cff] focus:bg-white focus:ring-4 focus:ring-[#087cff]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    aria-pressed={
                      showPassword
                    }
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#071b3a] focus:outline-none focus:ring-2 focus:ring-[#087cff]/30 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    )}
                  </button>

                </div>

              </div>

              {/* =============================================
                  MESSAGES
                  ============================================= */}

              <div
                aria-live="polite"
                aria-atomic="true"
                className="mt-5"
              >

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700"
                  >
                    {error}
                  </div>
                ) : null}

                {!error &&
                success ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-5 text-emerald-700">
                    {success}
                  </div>
                ) : null}

              </div>

              {/* =============================================
                  BOUTON CONNEXION
                  ============================================= */}

              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#087cff] px-5 text-[15px] font-extrabold text-white shadow-[0_10px_25px_rgba(8,124,255,0.22)] transition hover:bg-[#006bea] focus:outline-none focus:ring-4 focus:ring-[#087cff]/20 disabled:cursor-not-allowed disabled:opacity-70"
              >

                {isSubmitting ? (
                  <>
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />

                    Connexion...
                  </>
                ) : (
                  <>
                    <LockKeyhole
                      className="h-5 w-5"
                      aria-hidden="true"
                    />

                    Se connecter
                  </>
                )}

              </button>

              {/* =============================================
                  SÉCURITÉ
                  ============================================= */}

              <div className="mt-6 flex items-start gap-3 border-t border-slate-100 pt-5">

                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#087cff]"
                />

                <p className="text-xs leading-5 text-slate-500">
                  Accès privé et sécurisé réservé à
                  l&apos;administration NACHTKRONE.
                </p>

              </div>

            </form>

            {/* ===============================================
                FOOTER
                =============================================== */}

            <p className="mt-7 text-center text-xs leading-5 text-slate-400">
              © {new Date().getFullYear()} NACHTKRONE.
              Tous droits réservés.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}