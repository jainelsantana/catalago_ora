import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Premium Catalog | Catálogo de Produtos",
  description: "Descubra nossa linha exclusiva de produtos de alta qualidade e gerencie com facilidade.",
  openGraph: {
    title: "Premium Catalog | Catálogo de Produtos",
    description: "Descubra nossa linha exclusiva de produtos de alta qualidade e gerencie com facilidade.",
    url: "http://localhost:3000",
    siteName: "Premium Catalog",
    images: [
      {
        url: "http://localhost:3000/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Premium Catalog Banner",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Catalog | Catálogo de Produtos",
    description: "Descubra nossa linha exclusiva de produtos de alta qualidade e gerencie com facilidade.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
