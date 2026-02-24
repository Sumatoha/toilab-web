"use client";

import Link from "next/link";
import {
  Calendar,
  Users,
  Wallet,
  CheckSquare,
  Mail,
  Sparkles,
  ArrowRight,
  Check,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { usePublicTranslation } from "@/hooks/use-translation";

export default function LandingPage() {
  const { t, locale, setLocale } = usePublicTranslation();

  const features = [
    {
      icon: Wallet,
      titleKey: "landing.featuresSection.budget.title",
      descKey: "landing.featuresSection.budget.desc",
    },
    {
      icon: Users,
      titleKey: "landing.featuresSection.guests.title",
      descKey: "landing.featuresSection.guests.desc",
    },
    {
      icon: Mail,
      titleKey: "landing.featuresSection.invitations.title",
      descKey: "landing.featuresSection.invitations.desc",
    },
    {
      icon: CheckSquare,
      titleKey: "landing.featuresSection.checklist.title",
      descKey: "landing.featuresSection.checklist.desc",
    },
    {
      icon: Calendar,
      titleKey: "landing.featuresSection.vendors.title",
      descKey: "landing.featuresSection.vendors.desc",
    },
    {
      icon: Sparkles,
      titleKey: "landing.featuresSection.ai.title",
      descKey: "landing.featuresSection.ai.desc",
    },
  ];

  const weddingFeatures = [
    t("landing.weddingFeatures.guests"),
    t("landing.weddingFeatures.budget"),
    t("landing.weddingFeatures.checklist"),
    t("landing.weddingFeatures.invitations"),
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="lg" href="/" />

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("landing.nav.features")}
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("landing.nav.pricing")}
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language Selector */}
              <button
                onClick={() => setLocale(locale === "kk" ? "ru" : "kk")}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title={locale === "kk" ? "Русский" : "Қазақша"}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{locale === "kk" ? "RU" : "ҚАЗ"}</span>
              </button>

              <Link href="/login" className="btn-ghost btn-sm hidden sm:flex">
                {t("landing.nav.login")}
              </Link>
              <Link href="/login" className="btn-primary btn-sm">
                {t("landing.startFree")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              {t("landing.hero.badge")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 animate-slide-up">
              {t("landing.hero.titlePart1")}{" "}
              <span className="text-primary">{t("landing.hero.titleHighlight")}</span>
              <br />
              {t("landing.hero.titlePart2")}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              {t("landing.hero.subtitle")}
              <br />
              {t("landing.hero.subtitle2")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link href="/login" className="btn-primary btn-lg w-full sm:w-auto">
                {t("landing.hero.cta")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a href="#features" className="btn-outline btn-lg w-full sm:w-auto">
                {t("landing.hero.learnMore")}
              </a>
            </div>
          </div>

          {/* Wedding features */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
            {weddingFeatures.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm"
              >
                <Check className="w-4 h-4 text-primary" />
                {feature}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              {t("landing.featuresSection.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.featuresSection.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.titleKey}
                className="card-hover"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                <p className="text-muted-foreground">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              {t("landing.pricing.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.pricing.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card relative">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-1">{t("landing.pricing.free.name")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("landing.pricing.free.desc")}</p>
                <div className="text-4xl font-bold">{t("landing.pricing.free.price")}</div>
              </div>

              <ul className="space-y-3 mb-6">
                {["Бюджет и расходы", "Чек-лист задач", "Программа вечера", "1 мероприятие"].map((feature, idx) => {
                  const features = locale === "kk"
                    ? ["Бюджет және шығындар", "Тапсырмалар тізімі", "Кеш бағдарламасы", "1 іс-шара"]
                    : ["Бюджет и расходы", "Чек-лист задач", "Программа вечера", "1 мероприятие"];
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{features[idx]}</span>
                    </li>
                  );
                })}
              </ul>

              <Link href="/login" className="w-full btn-outline btn-md">
                {t("landing.pricing.free.cta")}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="card relative border-primary shadow-lg scale-105">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-1">{t("landing.pricing.pro.name")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("landing.pricing.pro.desc")}</p>
                <div className="text-4xl font-bold">{t("landing.pricing.pro.price")}</div>
              </div>

              <ul className="space-y-3 mb-6">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const features = locale === "kk"
                    ? ["Барлық мүмкіндіктер", "Қонақтар тізімі және RSVP", "Қонақтарды орналастыру", "Шақырулар", "Сыйлықтар есебі", "Командамен бөлісу"]
                    : ["Все функции", "Список гостей и RSVP", "Рассадка гостей", "Приглашения", "Учёт подарков", "Поделиться с командой"];
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{features[idx]}</span>
                    </li>
                  );
                })}
              </ul>

              <Link href="/login" className="w-full btn-primary btn-md">
                {t("landing.pricing.pro.cta")}
              </Link>
            </div>

            {/* Studio Plan */}
            <div className="card relative">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-1">{t("landing.pricing.studio.name")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("landing.pricing.studio.desc")}</p>
                <div className="text-4xl font-bold">
                  {t("landing.pricing.studio.price")}
                  <span className="text-lg font-normal text-muted-foreground">{t("landing.pricing.studio.period")}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {[0, 1, 2, 3].map((idx) => {
                  const features = locale === "kk"
                    ? ["Pro-дағы барлығы", "10 іс-шараға дейін", "Басым қолдау", "Командалық қол жеткізу"]
                    : ["Всё из Pro", "До 10 мероприятий", "Приоритетная поддержка", "Командный доступ"];
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{features[idx]}</span>
                    </li>
                  );
                })}
              </ul>

              <Link href="/login" className="w-full btn-outline btn-md">
                {t("landing.pricing.studio.cta")}
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {t("landing.pricing.footer")}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-lg text-white/80 mb-8">
            {t("landing.cta.subtitle")}
          </p>
          <Link href="/login" className="btn bg-white text-primary hover:bg-white/90 btn-lg">
            {t("landing.cta.button")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="lg" href={undefined} />

            <p className="text-sm text-muted-foreground">
              {t("landing.footer.copyright")}
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("landing.footer.privacy")}
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("landing.footer.terms")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
