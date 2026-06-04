import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Banner } from "@/components/banner";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { Search, FilterX, HelpCircle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const currentCategorySlug = resolvedParams.category || "";
  const currentSearch = resolvedParams.search || "";

  // Build Prisma filter
  const where: any = {
    status: "ACTIVE",
    deletedAt: null,
  };

  if (currentCategorySlug) {
    where.category = {
      slug: currentCategorySlug,
    };
  }

  if (currentSearch) {
    where.OR = [
      { name: { contains: currentSearch, mode: "insensitive" } },
      { shortDescription: { contains: currentSearch, mode: "insensitive" } },
      { description: { contains: currentSearch, mode: "insensitive" } },
    ];
  }

  // Fetch data in parallel
  const [products, totalProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  // Helper to build page URL
  const getPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (currentCategorySlug) params.set("category", currentCategorySlug);
    if (currentSearch) params.set("search", currentSearch);
    params.set("page", targetPage.toString());
    return `/?${params.toString()}`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Only show Banner on homepage first page with no active filters */}
        {!currentCategorySlug && !currentSearch && page === 1 && <Banner />}

        {/* Search & Category Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8 pb-6 border-b border-border">
          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !currentCategorySlug
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              Todos
            </Link>
            {categories.map((cat) => {
              const isActive = currentCategorySlug === cat.slug;
              const linkParams = new URLSearchParams();
              linkParams.set("category", cat.slug);
              if (currentSearch) linkParams.set("search", currentSearch);
              
              return (
                <Link
                  key={cat.id}
                  href={`/?${linkParams.toString()}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>

          {/* Search Bar Form */}
          <form method="GET" action="/" className="relative w-full md:w-80">
            {currentCategorySlug && (
              <input type="hidden" name="category" value={currentCategorySlug} />
            )}
            <input
              type="text"
              name="search"
              defaultValue={currentSearch}
              placeholder="Buscar produtos..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            {currentSearch && (
              <Link
                href={currentCategorySlug ? `/?category=${currentCategorySlug}` : "/"}
                className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar
              </Link>
            )}
          </form>
        </div>

        {/* Search Results Summary */}
        {currentSearch && (
          <p className="text-sm text-muted-foreground mb-6">
            Resultados para &quot;<span className="font-semibold text-foreground">{currentSearch}</span>&quot;:{" "}
            {totalProducts} {totalProducts === 1 ? "produto encontrado" : "produtos encontrados"}.
          </p>
        )}

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-border p-8">
            <FilterX className="h-16 w-16 text-muted-foreground stroke-[1.5] mb-4" />
            <h3 className="text-xl font-bold mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Não encontramos produtos que correspondam aos filtros ou termo de busca selecionado. Tente alterar sua pesquisa ou categoria.
            </p>
            <Link
              href="/"
              className="mt-6 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-medium transition-all"
            >
              Ver todos os produtos
            </Link>
          </div>
        )}

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-border">
            {page > 1 && (
              <Link
                href={getPageUrl(page - 1)}
                className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-muted text-sm font-medium transition-colors"
              >
                Anterior
              </Link>
            )}
            
            <div className="flex items-center gap-1 text-sm font-medium">
              {Array.from({ length: totalPages }).map((_, i) => {
                const targetPage = i + 1;
                const isCurrent = page === targetPage;
                
                return (
                  <Link
                    key={targetPage}
                    href={getPageUrl(targetPage)}
                    className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-secondary text-secondary-foreground hover:bg-muted"
                    }`}
                  >
                    {targetPage}
                  </Link>
                );
              })}
            </div>

            {page < totalPages && (
              <Link
                href={getPageUrl(page + 1)}
                className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-muted text-sm font-medium transition-colors"
              >
                Próximo
              </Link>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card mt-20 py-8">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between text-muted-foreground text-sm gap-4">
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
