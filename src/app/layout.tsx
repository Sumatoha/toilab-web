import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
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
    <html lang="ru" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            },
          }}
        />
      </body>
    </html>
  );
}
