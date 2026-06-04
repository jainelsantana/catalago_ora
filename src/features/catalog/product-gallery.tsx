"use client";

import { useState } from "react";
import { Package } from "lucide-react";

interface ProductGalleryProps {
  images: {
    id: string;
    url: string;
  }[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-muted border border-border flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Package className="h-16 w-16 stroke-[1.2]" />
        <span className="text-sm">Sem imagens disponíveis</span>
      </div>
    );
  }

  const activeImage = images[activeImageIndex];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image View */}
      <div className="relative aspect-square w-full rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center">
        <img
          src={activeImage.url}
          alt={`${productName} - Imagem ${activeImageIndex + 1}`}
          className="h-full w-full object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails Gallery */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, index) => {
            const isActive = index === activeImageIndex;
            return (
              <button
                key={img.id}
                onClick={() => setActiveImageIndex(index)}
                className={`relative aspect-square w-20 rounded-lg bg-muted border overflow-hidden flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "border-primary ring-2 ring-primary/20 scale-[0.98]"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <img
                  src={img.url}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
