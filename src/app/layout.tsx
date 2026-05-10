import type { Metadata } from "next";
import { Nunito_Sans, DM_Sans, Pacifico } from "next/font/google";
import "@fontsource/lily-script-one";
import "@fontsource/nunito-sans";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TransferPrompt, ExportModal } from "@/components";
import { ClientInitializer } from "@/components/ClientInitializer";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  preload: false,
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  preload: false,
});

const pacifico = Pacifico({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

export const metadata: Metadata = {
  title: "Moatt - Design Your Mannequin",
  description: "Create and customize designs on 3D mannequins for fashion designers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunitoSans.variable} ${dmSans.variable} ${pacifico.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-300">
        <ThemeProvider>
          {children}
          <ClientInitializer />
          <TransferPrompt />
          <ExportModal />
        </ThemeProvider>
      </body>
    </html>
  );
}