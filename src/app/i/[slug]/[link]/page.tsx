"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, MapPin, Heart, Check, X, Users } from "lucide-react";
import { invitation } from "@/lib/api";
import { InvitationData, RSVPStatus } from "@/lib/types";
import { formatDate, formatTime, cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Replace placeholders with actual event data
function renderTemplate(html: string, event: InvitationData["event"], guestName?: string): string {
  return html
    .replace(/\{\{person1\}\}/g, event.person1 || "")
    .replace(/\{\{person2\}\}/g, event.person2 || "")
    .replace(/\{\{date\}\}/g, event.date || "")
    .replace(/\{\{time\}\}/g, event.time || "")
    .replace(/\{\{venue\}\}/g, event.venue?.name || "")
    .replace(/\{\{address\}\}/g, event.venue?.address || "")
    .replace(/\{\{greeting\}\}/g, event.greetingRu || "")
    .replace(/\{\{greetingKz\}\}/g, event.greetingKz || "")
    .replace(/\{\{hashtag\}\}/g, event.hashtag || "")
    .replace(/\{\{guestName\}\}/g, guestName || "Дорогой гость");
}

export default function PersonalInvitationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const link = params.link as string;

  const [data, setData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRSVP, setShowRSVP] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>("pending");
  const [plusCount, setPlusCount] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [slug, link]);

  async function loadInvitation() {
    try {
      const invData = await invitation.getPersonalized(slug, link);
      setData(invData);
      if (invData.guest) {
        setRsvpStatus(invData.guest.status);
        setPlusCount(invData.guest.plusCount || 0);
        setNote(invData.guest.note || "");
      }
    } catch (err) {
      console.error("Failed to load invitation:", err);
      setError("Приглашение не найдено");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRSVP() {
    setIsSubmitting(true);
    try {
      await invitation.submitRSVP(slug, link, {
        status: rsvpStatus,
        plusCount,
        note,
      });
      toast.success(
        rsvpStatus === "accepted" ? "Спасибо! Ждём вас!" : "Спасибо за ответ!"
      );
      setShowRSVP(false);
      loadInvitation();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Не удалось отправить ответ");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-gray-800 mb-2">
            Приглашение не найдено
          </h1>
          <p className="text-gray-600">
            Проверьте ссылку или обратитесь к организаторам
          </p>
        </div>
      </div>
    );
  }

  const { event, guest, template } = data;

  // If there's a custom HTML template, render it full-page
  if (template?.htmlTemplate) {
    const renderedHtml = renderTemplate(template.htmlTemplate, event, guest?.name);
    return (
      <iframe
        srcDoc={renderedHtml}
        className="w-full h-screen border-0"
        title="Приглашение"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-rose-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center px-4">
          {guest && (
            <p className="text-gray-600 mb-4">
              Дорогой(ая) <span className="font-semibold">{guest.name}</span>
            </p>
          )}
          <p className="text-rose-500 font-medium mb-4 tracking-widest uppercase text-sm">
            Вы приглашены
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
            {event.person1} <span className="text-rose-500">&</span> {event.person2}
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            {event.greetingRu || "Мы приглашаем вас разделить с нами этот особенный день"}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Когда</h3>
            <p className="text-gray-600">
              {event.date ? formatDate(event.date) : "Дата будет объявлена"}
            </p>
            {event.time && (
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(event.time)}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Где</h3>
            <p className="text-gray-600">
              {event.venue?.name || "Место будет объявлено"}
            </p>
            {event.venue?.address && (
              <p className="text-gray-500 text-sm mt-1">{event.venue.address}</p>
            )}
          </div>
        </div>

        {/* RSVP Status */}
        {guest && guest.status !== "pending" && (
          <div className={cn(
            "mt-8 p-6 rounded-2xl text-center",
            guest.status === "accepted" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          )}>
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              guest.status === "accepted" ? "bg-green-100" : "bg-red-100"
            )}>
              {guest.status === "accepted" ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <X className="w-8 h-8 text-red-600" />
              )}
            </div>
            <p className={cn(
              "font-semibold",
              guest.status === "accepted" ? "text-green-800" : "text-red-800"
            )}>
              {guest.status === "accepted" ? "Вы подтвердили участие" : "Вы отклонили приглашение"}
            </p>
            {guest.plusCount > 0 && (
              <p className="text-gray-600 text-sm mt-1">+{guest.plusCount} сопровождающих</p>
            )}
            <button
              onClick={() => setShowRSVP(true)}
              className="text-sm text-gray-500 hover:text-gray-700 mt-4 underline"
            >
              Изменить ответ
            </button>
          </div>
        )}

        {/* RSVP Button */}
        {guest && event.rsvpOpen && guest.status === "pending" && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowRSVP(true)}
              className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-medium text-lg transition-colors shadow-lg shadow-rose-200"
            >
              Ответить на приглашение
            </button>
          </div>
        )}

        {/* Hashtag */}
        {event.hashtag && (
          <div className="mt-12 text-center">
            <span className="inline-block px-6 py-3 bg-gray-100 rounded-full text-gray-700 font-medium">
              {event.hashtag}
            </span>
          </div>
        )}
      </div>

      {/* RSVP Modal */}
      {showRSVP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-display font-bold text-center mb-6">
              Подтвердите участие
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setRsvpStatus("accepted")}
                className={cn(
                  "p-4 rounded-xl border-2 transition-colors",
                  rsvpStatus === "accepted"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-green-300"
                )}
              >
                <Check className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  rsvpStatus === "accepted" ? "text-green-500" : "text-gray-400"
                )} />
                <p className={cn(
                  "font-medium",
                  rsvpStatus === "accepted" ? "text-green-700" : "text-gray-600"
                )}>Приду</p>
              </button>

              <button
                onClick={() => setRsvpStatus("declined")}
                className={cn(
                  "p-4 rounded-xl border-2 transition-colors",
                  rsvpStatus === "declined"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-red-300"
                )}
              >
                <X className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  rsvpStatus === "declined" ? "text-red-500" : "text-gray-400"
                )} />
                <p className={cn(
                  "font-medium",
                  rsvpStatus === "declined" ? "text-red-700" : "text-gray-600"
                )}>Не смогу</p>
              </button>
            </div>

            {rsvpStatus === "accepted" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Сопровождающие
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPlusCount(Math.max(0, plusCount - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{plusCount}</span>
                  <button
                    onClick={() => setPlusCount(plusCount + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пожелание (необязательно)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                rows={3}
                placeholder="Ваше сообщение..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRSVP(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleRSVP}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="py-8 text-center text-gray-400 text-sm">
        <p>Создано с помощью Toilab</p>
      </div>
    </div>
  );
}
