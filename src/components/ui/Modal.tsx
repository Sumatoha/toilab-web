"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Full width on mobile, centered on desktop */}
      <div
        className={cn(
          "relative bg-card shadow-xl w-full max-h-[90vh] overflow-y-auto",
          "rounded-t-2xl sm:rounded-xl",
          "sm:mx-4 sm:my-4",
          "animate-in",
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card flex items-start justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-semibold truncate">{title}</h2>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0 -mt-1 -mr-1"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 mt-4 border-t border-border">
      {children}
    </div>
  );
}
