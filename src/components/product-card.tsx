import Link from "next/link";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    price: number;
    stock: number;
    category: {
      name: string;
    };
    images: {
      url: string;
    }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images[0]?.url;

  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
        {/* Image wrapper */}
        <div className="relative aspect-square w-full bg-muted flex items-center justify-center overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Package className="h-12 w-12 stroke-[1.5]" />
              <span className="text-xs">Sem imagem</span>
            </div>
          )}
          {product.stock <= 0 && (
            <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
              Esgotado
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {product.category.name}
          </span>
          <h3 className="font-semibold text-base sm:text-lg mt-1 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 min-h-[40px]">
            {product.shortDescription}
          </p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <span className="font-bold text-lg text-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(product.price)}
            </span>
            <span className="text-xs text-primary font-medium group-hover:underline">
              Ver detalhes →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
