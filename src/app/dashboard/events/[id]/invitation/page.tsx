"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Send,
  Loader2,
  Wand2,
  MessageSquare,
  Download,
} from "lucide-react";
import { events, invitation, ai } from "@/lib/api";
import { Event, InvitationData, EventPublicData } from "@/lib/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Function to render template with actual data
function renderTemplate(html: string, eventData: EventPublicData, guestName?: string): string {
  return html
    .replace(/\{\{person1\}\}/g, eventData.person1 || "Имя 1")
    .replace(/\{\{person2\}\}/g, eventData.person2 || "Имя 2")
    .replace(/\{\{date\}\}/g, eventData.date || "Дата")
    .replace(/\{\{time\}\}/g, eventData.time || "Время")
    .replace(/\{\{venue\}\}/g, eventData.venue?.name || "Место")
    .replace(/\{\{address\}\}/g, eventData.venue?.address || "Адрес")
    .replace(/\{\{greeting\}\}/g, eventData.greetingRu || "Приглашаем вас на наше торжество!")
    .replace(/\{\{greetingKz\}\}/g, eventData.greetingKz || "")
    .replace(/\{\{hashtag\}\}/g, eventData.hashtag || "")
    .replace(/\{\{guestName\}\}/g, guestName || "Дорогой гость");
}

export default function InvitationPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [preview, setPreview] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"editor" | "mailing">("editor");

  // Form state
  const [styleDescription, setStyleDescription] = useState("");
  const [greetingRu, setGreetingRu] = useState("");
  const [greetingKz, setGreetingKz] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationsRemaining, setGenerationsRemaining] = useState<number | null>(null);
  const [generationsTotal, setGenerationsTotal] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [eventData, previewData, generationsData] = await Promise.all([
        events.get(eventId),
        invitation.getPreview(eventId).catch(() => null),
        ai.getGenerationsRemaining().catch(() => null),
      ]);
      setEvent(eventData);
      setPreview(previewData);

      // Initialize form from event data
      setStyleDescription(eventData.invitation.styleDescription || "");
      setGreetingRu(eventData.greetingRu || "");
      setGreetingKz(eventData.greetingKz || "");

      if (generationsData) {
        setGenerationsRemaining(generationsData.remaining);
        setGenerationsTotal(generationsData.total);
      }
    } catch (error) {
      console.error("Failed to load invitation data:", error);
      toast.error("Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGenerate = async () => {
    if (!event) return;

    if (!styleDescription.trim()) {
      toast.error("Опишите желаемый стиль приглашения");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await ai.generate(eventId, {
        greetingRu: greetingRu.trim() || "Приглашаем вас разделить с нами радость нашего торжества!",
        greetingKz: greetingKz.trim(),
        styleDescription: styleDescription.trim(),
      });

      setGenerationsRemaining(result.generationsLeft);
      setGenerationsTotal(result.generationsTotal);

      // Update preview with generated HTML
      if (result.html) {
        setPreview((prev) =>
          prev
            ? {
                ...prev,
                template: {
                  slug: "ai-generated",
                  name: "AI Generated",
                  htmlTemplate: result.html,
                  cssVariables: {
                    accentColor: "",
                    bgColor: "",
                    textColor: "",
                    fontDisplay: "",
                    fontBody: "",
                  },
                  blocks: [],
                },
              }
            : null
        );

        // Reload event data to get updated customHtml
        const updatedEvent = await events.get(eventId);
        setEvent(updatedEvent);

        toast.success("Приглашение готово!");
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось сгенерировать приглашение");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivate = async () => {
    if (!event) return;

    try {
      const updated = await events.activate(eventId);
      setEvent(updated);
      toast.success("Приглашение активировано!");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось активировать");
    }
  };

  const copyLink = () => {
    if (event) {
      const link = `${window.location.origin}/i/${event.slug}`;
      navigator.clipboard.writeText(link);
      toast.success("Ссылка скопирована!");
    }
  };

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

  const invitationLink = `${typeof window !== "undefined" ? window.location.origin : ""}/i/${event.slug}`;
  const hasCustomHtml = !!event.invitation.customHtml || !!preview?.template?.htmlTemplate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Приглашение</h1>
          <p className="text-muted-foreground">
            Создайте уникальное приглашение с помощью AI
          </p>
        </div>
        <div className="flex gap-2">
          {event.status === "active" ? (
            <>
              <button onClick={copyLink} className="btn-outline btn-sm">
                <Copy className="w-4 h-4 mr-2" />
                Копировать
              </button>
              <a
                href={invitationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Открыть
              </a>
            </>
          ) : (
            <button
              onClick={handleActivate}
              className="btn-primary btn-sm"
              disabled={!hasCustomHtml}
            >
              <Check className="w-4 h-4 mr-2" />
              Активировать
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                event.status === "active" ? "bg-green-500" : "bg-yellow-500"
              )}
            />
            <div>
              <p className="font-medium">
                {event.status === "active" ? "Приглашение активно" : "Черновик"}
              </p>
              <p className="text-sm text-muted-foreground">
                {event.status === "active"
                  ? "Гости могут просматривать приглашение и отвечать на RSVP"
                  : hasCustomHtml
                  ? "Готово к активации"
                  : "Сгенерируйте приглашение с помощью AI"}
              </p>
            </div>
          </div>
          {event.status === "active" && (
            <div className="text-sm text-muted-foreground max-w-xs sm:max-w-md truncate">
              <span className="font-mono text-xs">{invitationLink}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("editor")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "editor"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Wand2 className="w-4 h-4" />
          Редактор
        </button>
        <button
          onClick={() => setActiveTab("mailing")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "mailing"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Send className="w-4 h-4" />
          Рассылка
        </button>
      </div>

      {/* Editor Tab */}
      {activeTab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Form (40%) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Генерация (Claude Opus 4.5)
              </h3>

              {/* Style description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Описание стиля
                  </label>
                  <textarea
                    value={styleDescription}
                    onChange={(e) => setStyleDescription(e.target.value)}
                    placeholder="Опишите желаемый стиль: цвета, настроение, элементы...&#10;&#10;Примеры:&#10;• Минималистичный, белый фон, золотые акценты&#10;• Казахский национальный стиль с орнаментами&#10;• Романтический, пастельные тона, цветы"
                    className="w-full h-32 px-4 py-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Приветствие (RU)
                  </label>
                  <textarea
                    value={greetingRu}
                    onChange={(e) => setGreetingRu(e.target.value)}
                    placeholder="Дорогие друзья! Приглашаем вас разделить с нами радость нашего торжества..."
                    className="w-full h-24 px-4 py-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Приветствие (KZ){" "}
                    <span className="text-muted-foreground font-normal">
                      (опционально)
                    </span>
                  </label>
                  <textarea
                    value={greetingKz}
                    onChange={(e) => setGreetingKz(e.target.value)}
                    placeholder="Құрметті қонақтар! Сіздерді біздің тойымызға шақырамыз..."
                    className="w-full h-24 px-4 py-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isGenerating}
                  />
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !styleDescription.trim()}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Генерация... (до 1 мин)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Сгенерировать с AI
                    </>
                  )}
                </button>

                {/* Generations counter */}
                {generationsRemaining !== null && generationsTotal !== null && (
                  <p className="text-sm text-center text-muted-foreground">
                    Осталось генераций: {generationsRemaining} из {generationsTotal} в день
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Preview (60%) */}
          <div className="lg:col-span-3">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Предпросмотр</h3>
              <div className="flex justify-center">
                {/* iPhone frame */}
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-[320px] h-[640px] bg-black rounded-[40px] p-3 shadow-xl">
                    {/* Screen */}
                    <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />

                      {/* Content */}
                      {isGenerating ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-secondary to-background">
                          <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
                          <p className="text-muted-foreground font-medium">
                            AI создаёт приглашение...
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Это может занять до минуты
                          </p>
                        </div>
                      ) : preview?.template?.htmlTemplate ? (
                        <iframe
                          srcDoc={renderTemplate(
                            preview.template.htmlTemplate,
                            preview.event
                          )}
                          className="w-full h-full border-0"
                          title="Предпросмотр приглашения"
                          sandbox="allow-scripts"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-secondary to-background">
                          <Wand2 className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Опишите стиль и нажмите
                            <br />
                            &quot;Сгенерировать с AI&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mailing Tab */}
      {activeTab === "mailing" && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-6">Рассылка приглашений</h3>

          {/* Channels */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Способы рассылки:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-lg border border-dashed border-border text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground mt-1">Скоро</p>
              </div>
              <div className="p-6 rounded-lg border border-dashed border-border text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium">Telegram</p>
                <p className="text-sm text-muted-foreground mt-1">Скоро</p>
              </div>
              <div className="p-6 rounded-lg border border-dashed border-border text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-medium">SMS</p>
                <p className="text-sm text-muted-foreground mt-1">Скоро</p>
              </div>
            </div>
          </div>

          {/* Manual options */}
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Ручная рассылка:
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                <div>
                  <p className="font-medium">Скопировать общую ссылку</p>
                  <p className="text-sm text-muted-foreground">
                    Одна ссылка для всех гостей
                  </p>
                </div>
                <button onClick={copyLink} className="btn-outline btn-sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Копировать
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                <div>
                  <p className="font-medium">Экспорт персональных ссылок</p>
                  <p className="text-sm text-muted-foreground">
                    CSV файл со ссылками для каждого гостя
                  </p>
                </div>
                <button className="btn-outline btn-sm" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Скоро
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
