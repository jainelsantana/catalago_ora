"use client";

import { useState, useRef, DragEvent } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  value: string[]; // List of already uploaded image urls
  onChange: (urls: string[]) => void;
}

const normalizeImageUrl = (url: string) => {
  const trimmed = url?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `/${trimmed}`;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.readAsDataURL(file);
  });

export function ImageUploader({ value = [], onChange }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas compression helper
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // If it's not an image, resolve immediately
      if (!file.type.startsWith("image/")) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFilename = file.name.replace(/\.[^/.]+$/, "") + "-compressed.jpg";
                const compressedFile = new File([blob], newFilename, {
                  type: "image/jpeg",
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8 // 80% compression quality
          );
        };
      };
    });
  };

  const uploadFiles = async (files: FileList) => {
    setLoading(true);
    const fileArray = Array.from(files);
    const selectedPreviewUrls = await Promise.all(fileArray.map(readFileAsDataUrl));
    setPreviewUrls((prev) => [...prev, ...selectedPreviewUrls]);

    try {
      const formData = new FormData();
      
      for (let i = 0; i < fileArray.length; i++) {
        const compressedFile = await compressImage(fileArray[i]);
        formData.append("files", compressedFile);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erro ao enviar imagens.");
      }

      const data = await res.json();
      onChange([...value, ...data.urls]);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Falha no upload das imagens.");
      console.error(error);
    } finally {
      setLoading(false);
      setPreviewUrls([]);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFiles(e.target.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (indexToRemove < value.length) {
      onChange(value.filter((_, idx) => idx !== indexToRemove));
      return;
    }

    const previewIndex = indexToRemove - value.length;
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== previewIndex));
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Dropzone area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center transition-all ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/60 bg-background/50 hover:bg-muted/10"
        } ${loading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {loading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
            <p className="text-sm font-semibold">Processando e enviando imagens...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Comprimindo imagens no navegador para otimizar velocidade
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">
              Arraste e solte imagens aqui ou <span className="text-primary hover:underline">procure</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: PNG, JPG, WEBP. Tamanho recomendado até 5MB.
            </p>
          </>
        )}
      </div>

      {/* Preview list */}
      {value.length + previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
          {[...value, ...previewUrls].map((url, idx) => {
            const isPreview = idx >= value.length;
            return (
              <div
                key={`${isPreview ? "preview" : "uploaded"}-${idx}-${url}`}
                className="group relative aspect-square rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center shadow-xs"
              >
                <img
                  src={normalizeImageUrl(url)}
                  alt={isPreview ? `Preview image ${idx + 1}` : `Uploaded image ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                {/* Overlay and Delete Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                    className="p-1.5 rounded-full bg-destructive text-white hover:scale-105 transition-transform cursor-pointer"
                    title="Remover Imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Upload status badge */}
                {isPreview && (
                  <span className="absolute top-2 left-2 bg-amber-500/95 text-amber-foreground text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                    Enviando...
                  </span>
                )}
                {/* Primary Image Label */}
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                    Principal
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
