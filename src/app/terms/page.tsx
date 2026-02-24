"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePublicTranslation } from "@/hooks/use-translation";

export default function TermsPage() {
  const { t } = usePublicTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("terms.backToHome")}
        </Link>

        <h1 className="text-3xl font-display font-bold mb-8">
          {t("terms.title")}
        </h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-muted-foreground">
            {t("terms.lastUpdated")}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("terms.section1Title")}</h2>
            <p>{t("terms.section1Text")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("terms.section2Title")}</h2>
            <p>{t("terms.section2Intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("terms.section2Item1")}</li>
              <li>{t("terms.section2Item2")}</li>
              <li>{t("terms.section2Item3")}</li>
              <li>{t("terms.section2Item4")}</li>
              <li>{t("terms.section2Item5")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("terms.section3Title")}</h2>
            <p>{t("terms.section3Text")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("terms.section4Title")}</h2>
            <p>{t("terms.section4Text")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("terms.section5Title")}</h2>
            <p>{t("terms.section5Text")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("terms.section6Title")}</h2>
            <p>{t("terms.section6Text")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
