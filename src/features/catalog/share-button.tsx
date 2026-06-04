"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url,
        });
        return;
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground text-sm font-semibold transition-all duration-200 cursor-pointer w-full sm:w-auto"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="text-emerald-400">Link copiado!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>Compartilhar</span>
        </>
      )}
    </button>
  );
}
