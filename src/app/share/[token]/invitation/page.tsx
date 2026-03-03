"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Lock, XCircle, Heart } from "lucide-react";
import { shares } from "@/lib/api";
import { InvitationTemplate } from "@/components/invitation/InvitationTemplate";
import { RsvpForm, RsvpData } from "@/components/invitation/RsvpForm";
import { Event, Guest, SharedEventData } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function InvitationPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <InvitationContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Загрузка...</p>
      </div>
    </div>
  );
}

function InvitationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const guestSlug = searchParams.get("guest"); // Personal invitation

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [showRsvpForm, setShowRsvpForm] = useState(false);
  const [rsvpMode, setRsvpMode] = useState<"confirm" | "decline">("confirm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpComplete, setRsvpComplete] = useState<"accepted" | "declined" | null>(null);

  // PIN state (if needed)
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => {
    checkLink();
  }, [token]);

  async function checkLink() {
    try {
      const check = await shares.check(token);

      if (check.requiresPin) {
        setShowPinForm(true);
        setIsLoading(false);
      } else {
        loadData("");
      }
    } catch {
      setError("Ссылка недействительна или истекла");
      setIsLoading(false);
    }
  }

  async function loadData(pinCode: string) {
    try {
      const result: SharedEventData = await shares.getData(token, pinCode);
      setEvent(result.event);

      // If personal invitation, find the guest
      if (guestSlug && result.guests) {
        const foundGuest = result.guests.find(g => g.personalSlug === guestSlug);
        if (foundGuest) {
          setGuest(foundGuest);
          // Check if already responded
          if (foundGuest.rsvpStatus !== "pending") {
            setRsvpComplete(foundGuest.rsvpStatus);
          }
        }
      }

      setShowPinForm(false);
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("PIN")) {
        setShowPinForm(true);
        setError("Неверный PIN-код");
      } else {
        setError("Не удалось загрузить данные");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      setIsLoading(true);
      setError(null);
      loadData(pin);
    }
  };

  const handleConfirm = () => {
    setRsvpMode("confirm");
    setShowRsvpForm(true);
  };

  const handleDecline = () => {
    setRsvpMode("decline");
    setShowRsvpForm(true);
  };

  const handleRsvpSubmit = async (data: RsvpData) => {
    if (!event) return;

    setIsSubmitting(true);
    try {
      if (guest && guestSlug) {
        // Personal invitation - update existing guest via public API
        await shares.rsvpBySlug(token, guestSlug, {
          rsvpStatus: data.status,
          plusCount: data.plusCount,
          plusNames: data.plusNames.filter(n => n.trim()),
          comment: data.comment,
        });
      } else {
        // Public invitation - create new guest via public API
        await shares.rsvp(token, {
          name: data.name,
          phone: data.phone,
          rsvpStatus: data.status,
          plusCount: data.plusCount,
          plusNames: data.plusNames.filter(n => n.trim()),
          comment: data.comment,
        });
      }

      setShowRsvpForm(false);
      setRsvpComplete(data.status);
    } catch (err) {
      console.error("RSVP error:", err);
      setError("Не удалось сохранить ответ. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Error
  if (error && !showPinForm) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Ошибка</h1>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  // PIN form
  if (showPinForm) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Введите PIN-код</h1>
            <p className="text-white/60 text-sm">
              Для просмотра приглашения введите код
            </p>
          </div>
          <form onSubmit={handlePinSubmit}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full h-16 text-center text-3xl font-mono tracking-[0.5em] bg-white/5 border border-[#D4AF37]/30 rounded-xl text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all"
              placeholder="• • • •"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm text-center mt-3">{error}</p>
            )}
            <button
              type="submit"
              disabled={pin.length !== 4}
              className={cn(
                "w-full mt-6 h-14 rounded-xl font-medium transition-all",
                "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#0a0a0a]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "hover:shadow-lg hover:shadow-[#D4AF37]/20"
              )}
            >
              Продолжить
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RSVP Complete
  if (rsvpComplete) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          {rsvpComplete === "accepted" ? (
            <>
              <div className="w-24 h-24 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-[#D4AF37] fill-[#D4AF37]" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-3">
                Спасибо!
              </h1>
              <p className="text-white/60">
                Ваше участие подтверждено. Мы с нетерпением ждем встречи с вами!
              </p>
              {event && (
                <div className="mt-6 p-4 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/20">
                  <p className="text-[#D4AF37] font-medium">
                    {event.person1} & {event.person2}
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    {event.date && new Date(event.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                    {event.time && ` в ${event.time}`}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-white/40" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-3">
                Понимаем
              </h1>
              <p className="text-white/60">
                Жаль, что вы не сможете присутствовать. Мы желаем вам всего наилучшего!
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main invitation
  if (!event) {
    return null;
  }

  return (
    <>
      <InvitationTemplate
        person1={event.person1 || ""}
        person2={event.person2 || ""}
        eventDate={event.date || ""}
        eventTime={event.time || ""}
        venueName={event.venue?.name}
        venueAddress={event.venue?.address}
        venueCity={event.venue?.city}
        guestName={guest?.name}
        onConfirm={handleConfirm}
        onDecline={handleDecline}
        showRsvpButtons={true}
      />

      {showRsvpForm && (
        <RsvpForm
          mode={rsvpMode}
          onSubmit={handleRsvpSubmit}
          onCancel={() => setShowRsvpForm(false)}
          isSubmitting={isSubmitting}
          guestName={guest?.name}
          allowPlusOnes={rsvpMode === "confirm"}
          maxPlusOnes={5}
        />
      )}
    </>
  );
}
