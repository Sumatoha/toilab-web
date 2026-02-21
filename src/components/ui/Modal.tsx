"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  full: "sm:max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key and trap focus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      // Focus the modal for accessibility
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop with fade animation */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Full height on mobile, centered on desktop */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          "relative bg-card shadow-2xl w-full",
          // Mobile: full height with max, slide up animation
          "h-[85vh] sm:h-auto sm:max-h-[85vh]",
          "rounded-t-2xl sm:rounded-2xl",
          "sm:mx-4",
          "animate-slide-up sm:animate-scale-in",
          "flex flex-col",
          "overflow-hidden",
          sizes[size]
        )}
      >
        {/* Header - sticky */}
        <div className="flex-shrink-0 flex items-start justify-between p-4 sm:p-5 border-b border-border bg-card">
          <div className="flex-1 min-w-0 pr-3">
            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold truncate">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-secondary active:bg-secondary/80 transition-colors flex-shrink-0 -mt-1 -mr-1 touch-manipulation"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  sticky?: boolean;
}

export function ModalFooter({ children, sticky = false }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 mt-4 border-t border-border",
        sticky && "-mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-4 bg-card mt-auto"
      )}
    >
      {children}
    </div>
  );
}
