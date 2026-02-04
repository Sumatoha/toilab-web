"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const icons = {
    danger: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
  };

  const iconColors = {
    danger: "text-red-500 bg-red-50",
    warning: "text-amber-500 bg-amber-50",
    info: "text-blue-500 bg-blue-50",
  };

  const buttonColors = {
    danger: "bg-red-500 hover:bg-red-600 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    info: "btn-primary",
  };

  const Icon = icons[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4", iconColors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-outline btn-md flex-1"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn("btn btn-md flex-1", buttonColors[variant])}
          >
            {isLoading ? "..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function SuccessDialog({
  isOpen,
  onClose,
  title,
  description,
  buttonText = "Хорошо",
  onButtonClick,
}: SuccessDialogProps) {
  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
        )}
        <button
          onClick={handleClick}
          className="btn-primary btn-md w-full"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}
