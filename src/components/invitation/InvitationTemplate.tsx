"use client";

import { useState, useEffect, useMemo } from "react";
import { MapPin, Calendar, Clock, Heart, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvitationTemplateProps {
  person1: string;
  person2: string;
  eventDate: string; // ISO date string
  eventTime: string; // "18:00" format
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  guestName?: string; // For personal invitations
  onConfirm?: () => void;
  onDecline?: () => void;
  showRsvpButtons?: boolean;
  isConfirming?: boolean;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function InvitationTemplate({
  person1,
  person2,
  eventDate,
  eventTime,
  venueName,
  venueAddress,
  venueCity,
  guestName,
  onConfirm,
  onDecline,
  showRsvpButtons = true,
  isConfirming = false,
}: InvitationTemplateProps) {
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showContent, setShowContent] = useState(false);

  // Parse event date and time
  const eventDateTime = useMemo(() => {
    if (!eventDate) return null;
    const date = new Date(eventDate);
    if (eventTime) {
      const [hours, minutes] = eventTime.split(":").map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  }, [eventDate, eventTime]);

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!eventDateTime) return "";
    const months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    const day = eventDateTime.getDate();
    const month = months[eventDateTime.getMonth()];
    const year = eventDateTime.getFullYear();
    return `${day} ${month} ${year}`;
  }, [eventDateTime]);

  // Countdown timer
  useEffect(() => {
    if (!eventDateTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = eventDateTime.getTime();
      const difference = target - now;

      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eventDateTime]);

  // Animate content on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white overflow-hidden">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-2 h-2 bg-[#D4AF37] rounded-full animate-float opacity-60" style={{ animationDelay: "0s" }} />
        <div className="absolute top-[20%] right-[10%] w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-float opacity-40" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] left-[8%] w-1 h-1 bg-[#D4AF37] rounded-full animate-float opacity-50" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[60%] right-[15%] w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-float opacity-30" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-[80%] left-[12%] w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-float opacity-50" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Main Content */}
      <div className={cn(
        "relative z-10 min-h-screen flex flex-col transition-all duration-1000 ease-out",
        showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        {/* Header Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          {/* Ornament top */}
          <div className="mb-6">
            <svg className="w-16 h-8 text-[#D4AF37]" viewBox="0 0 100 50">
              <path
                d="M50 5 Q30 25 10 25 Q30 25 50 45 Q70 25 90 25 Q70 25 50 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* Invitation text */}
          <p className="text-[#D4AF37]/80 text-sm tracking-[0.3em] uppercase mb-4">
            Приглашаем вас на свадьбу
          </p>

          {/* Names */}
          <div className="relative mb-8">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-light tracking-wide">
              <span className="text-[#D4AF37]">{person1 || "Имя"}</span>
              <span className="mx-3 sm:mx-4 text-white/40">&</span>
              <span className="text-[#D4AF37]">{person2 || "Имя"}</span>
            </h1>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 text-white/60 mb-6">
            <div className="w-12 h-px bg-[#D4AF37]/30" />
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-lg tracking-wider">{formattedDate}</span>
            <div className="w-12 h-px bg-[#D4AF37]/30" />
          </div>

          {/* Time */}
          {eventTime && (
            <div className="flex items-center gap-2 text-white/60 mb-8">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-lg tracking-wider">{eventTime}</span>
            </div>
          )}

          {/* Countdown */}
          <div className="grid grid-cols-4 gap-3 sm:gap-6 mb-8 max-w-md mx-auto">
            <CountdownBlock value={countdown.days} label="дней" />
            <CountdownBlock value={countdown.hours} label="часов" />
            <CountdownBlock value={countdown.minutes} label="минут" />
            <CountdownBlock value={countdown.seconds} label="секунд" />
          </div>

          {/* Scroll indicator */}
          <button
            onClick={() => {
              document.getElementById("details")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-4 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors animate-bounce"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Details Section */}
        <div id="details" className="bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="max-w-lg mx-auto px-6 py-12">
            {/* Venue */}
            {(venueName || venueAddress || venueCity) && (
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 text-[#D4AF37] mb-4">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm tracking-[0.2em] uppercase">Место проведения</span>
                </div>
                {venueName && (
                  <h3 className="text-xl sm:text-2xl font-light mb-2">{venueName}</h3>
                )}
                {venueAddress && (
                  <p className="text-white/60 text-sm">{venueAddress}</p>
                )}
                {venueCity && (
                  <p className="text-white/40 text-sm mt-1">{venueCity}</p>
                )}
              </div>
            )}

            {/* Personal greeting */}
            {guestName && (
              <div className="text-center mb-10 p-6 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5">
                <p className="text-white/60 text-sm mb-2">Уважаемый(ая)</p>
                <p className="text-xl text-[#D4AF37]">{guestName}</p>
                <p className="text-white/60 text-sm mt-2">
                  Мы будем рады видеть вас на нашем празднике!
                </p>
              </div>
            )}

            {/* RSVP Section */}
            {showRsvpButtons && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-6">
                  Пожалуйста, подтвердите ваше присутствие
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={onConfirm}
                    disabled={isConfirming}
                    className={cn(
                      "group relative px-8 py-4 rounded-full overflow-hidden transition-all duration-300",
                      "bg-gradient-to-r from-[#D4AF37] to-[#B8860B]",
                      "hover:shadow-lg hover:shadow-[#D4AF37]/30 hover:scale-105",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2 text-[#0a0a0a] font-medium">
                      <Heart className="w-4 h-4" />
                      {isConfirming ? "Отправка..." : "Я буду"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#B8860B] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    onClick={onDecline}
                    disabled={isConfirming}
                    className={cn(
                      "px-8 py-4 rounded-full border border-white/20 text-white/60",
                      "hover:border-white/40 hover:text-white/80 transition-all duration-300",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    К сожалению, не смогу
                  </button>
                </div>
              </div>
            )}

            {/* Footer ornament */}
            <div className="flex justify-center mt-12">
              <svg className="w-20 h-10 text-[#D4AF37]/40" viewBox="0 0 100 50">
                <path
                  d="M10 25 Q25 10 50 25 Q75 40 90 25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <circle cx="50" cy="25" r="3" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-white/30 text-xs">
          Toilab
        </footer>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-5px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="w-14 sm:w-20 h-14 sm:h-20 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 flex items-center justify-center mb-2">
        <span className="text-2xl sm:text-3xl font-light text-[#D4AF37]">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
    </div>
  );
}
