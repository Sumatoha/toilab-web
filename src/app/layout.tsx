import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Jost } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "cyrillic-ext"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const jost = Jost({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["100", "200", "300", "400"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Toilab",
    template: "%s | Toilab",
  },
  description: "Планируйте мероприятия легко",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${jakarta.variable} ${jost.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
