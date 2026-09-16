import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const fontSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const fontHeading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Suivi de Performance d'Équipe",
  description:
    "Planification, suivi et évaluation de la performance de votre équipe",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${fontSans.variable} ${fontMono.variable} ${fontHeading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-muted/30">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
