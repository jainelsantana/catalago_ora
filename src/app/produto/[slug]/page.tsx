import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { ProductGallery } from "@/features/catalog/product-gallery";
import { ShareButton } from "@/features/catalog/share-button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Metadata } from "next";

// Always render at request time — never statically pre-render at build
export const dynamic = "force-dynamic";


interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null },
    include: { images: true },
  });

  if (!product) {
    return {
      title: "Produto não encontrado | Premium Catalog",
    };
  }

  const primaryImage = product.images[0]?.url;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return {
    title: `${product.name} | Premium Catalog`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      url: `${baseUrl}/produto/${product.slug}`,
      images: primaryImage ? [{ url: primaryImage.startsWith("http") ? primaryImage : `${baseUrl}${primaryImage}` }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null },
    include: {
      category: true,
      images: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!product) {
    notFound();
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const productUrl = `${baseUrl}/produto/${product.slug}`;
  
  // Prefilled WhatsApp link
  const whatsappNumber = "5511999999999"; // Can be replaced by env/config
  const whatsappText = `Olá! Gostaria de saber mais informações sobre o produto *${product.name}* (SKU: ${product.sku}) que vi no catálogo.\n\nLink do produto: ${productUrl}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para o catálogo</span>
        </Link>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Image Gallery */}
          <div className="w-full">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right Column: Information & CTAs */}
          <div className="flex flex-col">
            <div className="border-b border-border pb-6">
              <span className="inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground rounded-md mb-3">
                {product.category.name}
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <p className="text-3xl font-bold text-foreground">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(product.price)}
                </p>
                
                <div className="flex items-center gap-1.5 text-sm">
                  {product.stock > 0 ? (
                    <>
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      <span className="text-muted-foreground">
                        Em estoque ({product.stock} disponíveis)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4.5 w-4.5 text-destructive" />
                      <span className="text-destructive font-medium">Esgotado</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Identifiers */}
            <div className="py-4 border-b border-border/50 text-sm text-muted-foreground grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-foreground">SKU:</span> {product.sku}
              </div>
              <div>
                <span className="font-semibold text-foreground">Status:</span>{" "}
                {product.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </div>
            </div>

            {/* Description section */}
            <div className="py-6 border-b border-border/50">
              <h2 className="text-base font-semibold text-foreground mb-2">Descrição curta</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            {/* Interactive Actions */}
            <div className="py-6 space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <MessageCircle className="h-5 w-5 fill-white text-emerald-600" />
                <span>Tenho Interesse (WhatsApp)</span>
              </a>

              <ShareButton />
            </div>
          </div>
        </div>

        {/* Detailed Full Description */}
        <div className="mt-12 lg:mt-16 pt-8 border-t border-border">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            Detalhes do Produto
          </h2>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {product.description}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-20 py-8">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row items-center justify-between text-muted-foreground text-sm gap-4">
          <p>© {new Date().getFullYear()} Premium Catalog. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-foreground transition-colors">Catálogo</Link>
            <Link href="/admin" className="hover:text-foreground transition-colors">Administração</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
