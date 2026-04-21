import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { PreferencesProvider } from "@/context/preferences-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PodoMedExcellence Sync",
  description: "Internal collaboration for PodoMed Excellence clinic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pme_theme");if(t==="dark"||t==="light"){document.documentElement.classList.toggle("dark",t==="dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans min-h-screen">
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
