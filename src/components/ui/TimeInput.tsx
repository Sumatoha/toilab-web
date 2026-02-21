"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimeInput({
  value,
  onChange,
  placeholder = "00:00",
  className,
  disabled,
}: TimeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const formatTime = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, "");

    if (digits.length === 0) return "";
    if (digits.length <= 2) return digits;

    // Format as HH:MM
    const hours = digits.slice(0, 2);
    const minutes = digits.slice(2, 4);

    return `${hours}:${minutes}`;
  };

  const validateAndFormat = (input: string): string => {
    const formatted = formatTime(input);
    if (!formatted) return "";

    const [hours, minutes] = formatted.split(":");
    const h = Math.min(23, parseInt(hours) || 0);
    const m = minutes ? Math.min(59, parseInt(minutes) || 0) : 0;

    if (!minutes && formatted.length <= 2) {
      return formatted;
    }

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Format the input
    const formatted = formatTime(input);
    setLocalValue(formatted);

    // Restore cursor position
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = cursorPos + (formatted.length - input.length);
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleBlur = () => {
    const validated = validateAndFormat(localValue);
    setLocalValue(validated);
    onChange(validated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"];

    // Allow navigation and control keys
    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) {
      return;
    }

    // Allow numbers and colon
    if (/^[0-9:]$/.test(e.key)) {
      // Limit to 5 characters (HH:MM)
      if (localValue.length >= 5) {
        e.preventDefault();
      }
      return;
    }

    // Block everything else
    e.preventDefault();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={cn("input", className)}
      maxLength={5}
      aria-label="Время в формате ЧЧ:ММ"
    />
  );
}
