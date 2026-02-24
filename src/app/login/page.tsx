"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { auth, config } from "@/lib/api";
import { Logo } from "@/components/ui";
import { usePublicTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";
import type { Country, CountryConfig } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, hydrate, setAuth } = useAuthStore();
  const { t } = usePublicTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState<Country>("kz");
  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrate();
    // Load countries list
    config.getCountries().then(setCountries).catch(() => {
      // Fallback to default countries if API fails
      setCountries([
        { code: "kz", name: "Казахстан", currency: { code: "KZT", symbol: "₸", name: "Тенге" } },
        { code: "ru", name: "Россия", currency: { code: "RUB", symbol: "₽", name: "Рубль" } },
        { code: "kg", name: "Кыргызстан", currency: { code: "KGS", symbol: "сом", name: "Сом" } },
        { code: "uz", name: "Узбекистан", currency: { code: "UZS", symbol: "сум", name: "Сум" } },
        { code: "other", name: "Другое", currency: { code: "USD", symbol: "$", name: "Доллар" } },
      ]);
    });
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isHydrated, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        const result = await auth.login(email, password);
        setAuth(result.user, result.accessToken, result.refreshToken);
        toast.success(t("auth.welcome") + "!");
        router.push("/dashboard");
      } else {
        if (!name.trim()) {
          toast.error(t("errors.required"));
          setSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error(t("auth.passwordMismatch"));
          setSubmitting(false);
          return;
        }
        const result = await auth.register(email, password, confirmPassword, name, country);
        setAuth(result.user, result.accessToken, result.refreshToken);
        toast.success(t("common.success") + "!");
        router.push("/dashboard");
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("auth.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  };

  // Don't show loading spinner - render the form immediately
  // The redirect will happen if user is already authenticated
  if (!mounted || (isHydrated && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="lg" href="/" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-bold mb-2">
                {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
              </h1>
              <p className="text-muted-foreground">
                {mode === "login"
                  ? t("auth.welcome")
                  : t("auth.registerTitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    {t("auth.name")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input w-full"
                    placeholder={t("auth.namePlaceholder")}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  {t("auth.password")}
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full"
                  placeholder={t("auth.passwordPlaceholder")}
                  minLength={6}
                  required
                />
              </div>

              {mode === "register" && (
                <>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                      {t("auth.confirmPassword")}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input w-full"
                      placeholder={t("auth.confirmPassword")}
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium mb-1">
                      {t("auth.country")}
                    </label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value as Country)}
                      className="input w-full"
                      required
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full h-12"
              >
                {submitting ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block"></span>
                ) : mode === "login" ? (
                  t("auth.loginButton")
                ) : (
                  t("auth.registerButton")
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm text-primary hover:underline"
              >
                {mode === "login"
                  ? t("auth.noAccount")
                  : t("auth.hasAccount")}
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-6">
              {t("auth.termsPrefix")}{" "}
              <Link href="/terms" className="text-primary hover:underline">
                {t("auth.termsLink")}
              </Link>{" "}
              {t("auth.and")}{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                {t("auth.privacyLink")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
