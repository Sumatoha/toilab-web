"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePublicTranslation } from "@/hooks/use-translation";

export default function PrivacyPage() {
  const { t } = usePublicTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("privacy.backToHome")}
        </Link>

        <h1 className="text-3xl font-display font-bold mb-8">
          {t("privacy.title")}
        </h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-muted-foreground">
            {t("privacy.lastUpdated")}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("privacy.section1Title")}</h2>
            <p>{t("privacy.section1Text")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("privacy.section2Title")}</h2>
            <p>{t("privacy.section2Intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("privacy.section2Item1")}</li>
              <li>{t("privacy.section2Item2")}</li>
              <li>{t("privacy.section2Item3")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("privacy.section3Title")}</h2>
            <p>{t("privacy.section3Text")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("privacy.section4Title")}</h2>
            <p>{t("privacy.section4Text")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("privacy.section5Title")}</h2>
            <p>{t("privacy.section5Text")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
