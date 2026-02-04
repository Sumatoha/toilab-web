"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, MapPin, Heart, ExternalLink } from "lucide-react";
import { invitation } from "@/lib/api";
import { InvitationData } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";

export default function InvitationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitation();
  }, [slug]);

  async function loadInvitation() {
    try {
      const invData = await invitation.get(slug);
      setData(invData);
    } catch (err) {
      console.error("Failed to load invitation:", err);
      setError("Приглашение не найдено");
    } finally {
      setIsLoading(false);
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

  const { event } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-rose-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center px-4">
          <p className="text-rose-500 font-medium mb-4 tracking-widest uppercase text-sm">
            Приглашение
          </p>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-6">
            {event.person1} <span className="text-rose-500">&</span> {event.person2}
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            {event.greetingRu || "Мы приглашаем вас разделить с нами этот особенный день"}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Date */}
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

          {/* Location */}
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
            {event.venue?.city && (
              <p className="text-gray-500 text-sm">{event.venue.city}</p>
            )}
          </div>
        </div>

        {/* Greeting in Kazakh */}
        {event.greetingKz && (
          <div className="mt-12 text-center">
            <p className="text-gray-600 italic">{event.greetingKz}</p>
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

        {/* 2GIS link */}
        {event.venue?.twoGisId && (
          <div className="mt-8 text-center">
            <a
              href={`https://2gis.kz/almaty/firm/${event.venue.twoGisId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600"
            >
              <ExternalLink className="w-4 h-4" />
              Открыть в 2ГИС
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="py-8 text-center text-gray-400 text-sm">
        <p>Создано с помощью Toilab</p>
      </div>
    </div>
  );
}
