import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Toilab — CRM для мероприятий",
    template: "%s | Toilab",
  },
  description:
    "Планируйте свадьбы, тои и торжества легко. Бюджет, гости, приглашения — всё в одном месте.",
  keywords: ["той", "свадьба", "мероприятие", "планирование", "Казахстан", "CRM"],
  authors: [{ name: "Toilab" }],
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    url: "https://toilab.kz",
    siteName: "Toilab",
    title: "Toilab — CRM для мероприятий",
    description:
      "Планируйте свадьбы, тои и торжества легко. Бюджет, гости, приглашения — всё в одном месте.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
