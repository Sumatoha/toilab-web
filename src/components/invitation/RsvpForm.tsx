"use client";

import { useState } from "react";
import { Users, UserPlus, Minus, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RsvpFormProps {
  onSubmit: (data: RsvpData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode: "confirm" | "decline";
  allowPlusOnes?: boolean;
  maxPlusOnes?: number;
  guestName?: string; // Pre-filled for personal invitations
}

export interface RsvpData {
  name: string;
  phone?: string;
  plusCount: number;
  plusNames: string[];
  comment?: string;
  status: "accepted" | "declined";
}

export function RsvpForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode,
  allowPlusOnes = true,
  maxPlusOnes = 5,
  guestName,
}: RsvpFormProps) {
  const [name, setName] = useState(guestName || "");
  const [phone, setPhone] = useState("");
  const [plusCount, setPlusCount] = useState(0);
  const [plusNames, setPlusNames] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const isConfirm = mode === "confirm";

  const handlePlusCountChange = (delta: number) => {
    const newCount = Math.max(0, Math.min(maxPlusOnes, plusCount + delta));
    setPlusCount(newCount);

    // Adjust plusNames array
    if (newCount > plusNames.length) {
      setPlusNames([...plusNames, ...Array(newCount - plusNames.length).fill("")]);
    } else {
      setPlusNames(plusNames.slice(0, newCount));
    }
  };

  const handlePlusNameChange = (index: number, value: string) => {
    const newNames = [...plusNames];
    newNames[index] = value;
    setPlusNames(newNames);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      plusCount,
      plusNames: plusNames.filter(n => n.trim()),
      comment: comment.trim() || undefined,
      status: isConfirm ? "accepted" : "declined",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Form */}
      <div className="relative w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">
        {/* Header */}
        <div className={cn(
          "px-6 py-4 border-b",
          isConfirm
            ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#B8860B]/20 border-[#D4AF37]/20"
            : "bg-red-500/10 border-red-500/20"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConfirm ? (
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#D4AF37]" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-white">
                  {isConfirm ? "Подтверждение" : "Отказ"}
                </h3>
                <p className="text-sm text-white/60">
                  {isConfirm ? "Укажите ваши данные" : "Сообщите нам"}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Ваше имя <span className="text-[#D4AF37]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться?"
              className={cn(
                "w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30",
                "focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all",
                "border-white/10 focus:border-[#D4AF37]/50"
              )}
              required
              disabled={!!guestName}
            />
          </div>

          {/* Phone (optional) */}
          {isConfirm && !guestName && (
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Телефон <span className="text-white/30">(необязательно)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30",
                  "focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all",
                  "border-white/10 focus:border-[#D4AF37]/50"
                )}
              />
            </div>
          )}

          {/* Plus ones */}
          {isConfirm && allowPlusOnes && (
            <div>
              <label className="block text-sm text-white/60 mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Сколько гостей с вами?</span>
                </div>
              </label>
              <div className="flex items-center gap-4 mb-3">
                <button
                  type="button"
                  onClick={() => handlePlusCountChange(-1)}
                  disabled={plusCount === 0}
                  className={cn(
                    "w-10 h-10 rounded-full border flex items-center justify-center transition-all",
                    plusCount === 0
                      ? "border-white/10 text-white/20 cursor-not-allowed"
                      : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  )}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-light text-[#D4AF37] min-w-[2rem] text-center">
                    {plusCount}
                  </span>
                  <span className="text-white/40 text-sm">
                    {plusCount === 0 ? "только вы" : plusCount === 1 ? "гость" : "гостей"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlusCountChange(1)}
                  disabled={plusCount >= maxPlusOnes}
                  className={cn(
                    "w-10 h-10 rounded-full border flex items-center justify-center transition-all",
                    plusCount >= maxPlusOnes
                      ? "border-white/10 text-white/20 cursor-not-allowed"
                      : "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Plus one names */}
              {plusCount > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs text-white/40 mb-2">
                    <UserPlus className="w-3 h-3 inline mr-1" />
                    Укажите имена (необязательно)
                  </p>
                  {Array.from({ length: plusCount }).map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      value={plusNames[index] || ""}
                      onChange={(e) => handlePlusNameChange(index, e.target.value)}
                      placeholder={`Гость ${index + 1}`}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg bg-white/5 border text-white placeholder-white/30 text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all",
                        "border-white/10 focus:border-[#D4AF37]/50"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comment */}
          {!isConfirm && (
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Комментарий <span className="text-white/30">(необязательно)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Пожелания или причина..."
                rows={3}
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all",
                  "border-white/10 focus:border-[#D4AF37]/50"
                )}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className={cn(
              "w-full py-4 rounded-xl font-medium transition-all",
              isConfirm
                ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#0a0a0a] hover:shadow-lg hover:shadow-[#D4AF37]/20"
                : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Отправка..." : isConfirm ? "Подтвердить участие" : "Отправить"}
          </button>
        </form>
      </div>
    </div>
  );
}
