"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Copy,
  ExternalLink,
  Link2,
  Check,
  MessageCircle,
  Users,
  Phone,
  Search,
} from "lucide-react";
import { events, guests as guestsApi } from "@/lib/api";
import { Event, Guest } from "@/lib/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function InvitationPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [externalUrl, setExternalUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [eventData, guestsData] = await Promise.all([
        events.get(eventId),
        guestsApi.list(eventId),
      ]);
      setEvent(eventData);
      setGuests(guestsData);
      setExternalUrl(eventData.invitation?.externalUrl || "");
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveUrl() {
    if (!event) return;

    setIsSaving(true);
    try {
      await events.updateInvitation(eventId, { externalUrl });
      toast.success("Ссылка сохранена");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setIsSaving(false);
    }
  }

  function copyWhatsAppMessage(guest: Guest) {
    if (!externalUrl) {
      toast.error("Сначала добавьте ссылку на приглашение");
      return;
    }

    const message = `Здравствуйте, ${guest.name}! Приглашаем вас на наше мероприятие. Подробности по ссылке: ${externalUrl}`;
    navigator.clipboard.writeText(message);
    setCopiedGuestId(guest.id);
    toast.success("Сообщение скопировано");

    setTimeout(() => setCopiedGuestId(null), 2000);
  }

  function openWhatsApp(guest: Guest) {
    if (!externalUrl) {
      toast.error("Сначала добавьте ссылку на приглашение");
      return;
    }

    if (!guest.phone) {
      toast.error("У гостя не указан номер телефона");
      return;
    }

    const message = encodeURIComponent(
      `Здравствуйте, ${guest.name}! Приглашаем вас на наше мероприятие. Подробности по ссылке: ${externalUrl}`
    );
    const phone = guest.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  }

  const filteredGuests = guests.filter((guest) =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return <div>Мероприятие не найдено</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Приглашение</h1>
        <p className="text-muted-foreground">
          Добавьте ссылку на приглашение и отправьте гостям через WhatsApp
        </p>
      </div>

      {/* External URL */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Ссылка на приглашение
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Вставьте ссылку на ваше приглашение (Canva, Tilda, Google Sites и т.д.)
        </p>

        <div className="flex gap-3">
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://www.canva.com/design/..."
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSaveUrl}
            disabled={isSaving}
            className="btn-primary px-6"
          >
            {isSaving ? "..." : "Сохранить"}
          </button>
        </div>

        {externalUrl && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(externalUrl);
                toast.success("Ссылка скопирована");
              }}
              className="btn-outline btn-sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Копировать
            </button>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline btn-sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Открыть
            </a>
          </div>
        )}
      </div>

      {/* Guests for WhatsApp */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Рассылка по WhatsApp
          </h3>
          <span className="text-sm text-muted-foreground">
            {guests.length} гостей
          </span>
        </div>

        {guests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Нет гостей</p>
            <p className="text-sm">Добавьте гостей в разделе "Гости"</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск гостя..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Guest list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {guest.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      {guest.phone ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {guest.phone}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Нет номера
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyWhatsAppMessage(guest)}
                      className={cn(
                        "btn-outline btn-sm",
                        copiedGuestId === guest.id && "bg-green-50 border-green-500 text-green-600"
                      )}
                      title="Копировать сообщение"
                    >
                      {copiedGuestId === guest.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {guest.phone && (
                      <button
                        onClick={() => openWhatsApp(guest)}
                        className="btn-sm bg-green-500 hover:bg-green-600 text-white"
                        title="Открыть WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
