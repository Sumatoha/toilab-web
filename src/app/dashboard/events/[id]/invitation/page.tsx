"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Settings,
  Check,
  Copy,
  ExternalLink,
  Palette,
} from "lucide-react";
import { events, templates as templatesApi, invitation } from "@/lib/api";
import { Event, TemplatePreview, InvitationData, EventPublicData } from "@/lib/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Default templates when API doesn't return any
const defaultTemplates: TemplatePreview[] = [
  { slug: "light-elegant", name: "Элегантный светлый", nameKz: "Нәзік жарық", previewUrl: "", isPremium: false },
  { slug: "dark-cinematic", name: "Тёмный кинематографичный", nameKz: "Қараңғы кинематографиялық", previewUrl: "", isPremium: false },
  { slug: "modern-minimal", name: "Современный минимализм", nameKz: "Заманауи минимализм", previewUrl: "", isPremium: false },
  { slug: "kazakh-national", name: "Казахский национальный", nameKz: "Қазақ ұлттық", previewUrl: "", isPremium: false },
];

// Function to render template with actual data
function renderTemplate(html: string, eventData: EventPublicData): string {
  return html
    .replace(/\{\{person1\}\}/g, eventData.person1 || "Имя 1")
    .replace(/\{\{person2\}\}/g, eventData.person2 || "Имя 2")
    .replace(/\{\{date\}\}/g, eventData.date || "Дата")
    .replace(/\{\{time\}\}/g, eventData.time || "Время")
    .replace(/\{\{venue\}\}/g, eventData.venue?.name || "Место")
    .replace(/\{\{address\}\}/g, eventData.venue?.address || "Адрес")
    .replace(/\{\{greeting\}\}/g, eventData.greetingRu || "Приглашаем вас на наше торжество!")
    .replace(/\{\{greetingKz\}\}/g, eventData.greetingKz || "")
    .replace(/\{\{hashtag\}\}/g, eventData.hashtag || "");
}

export default function InvitationPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [templatesList, setTemplatesList] = useState<TemplatePreview[]>([]);
  const [preview, setPreview] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "settings">("templates");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [eventData, templatesData, previewData] = await Promise.all([
        events.get(eventId),
        templatesApi.listPreviews(),
        invitation.getPreview(eventId).catch(() => null),
      ]);
      setEvent(eventData);
      setTemplatesList(templatesData?.length ? templatesData : defaultTemplates);
      setPreview(previewData);
    } catch (error) {
      console.error("Failed to load invitation data:", error);
      toast.error("Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSelectTemplate = async (templateSlug: string) => {
    if (!event) return;

    try {
      const updated = await invitation.updateConfig(eventId, { templateId: templateSlug });
      setEvent(updated);
      // Reload preview with new template
      const previewData = await invitation.getPreview(eventId).catch(() => null);
      setPreview(previewData);
      toast.success("Шаблон выбран");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось выбрать шаблон");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Приглашение</h1>
          <p className="text-muted-foreground">
            Настройте внешний вид вашего приглашения
          </p>
        </div>
        <div className="flex gap-2">
          {event.status === "active" ? (
            <>
              <button onClick={copyLink} className="btn-outline btn-sm">
                <Copy className="w-4 h-4 mr-2" />
                Копировать ссылку
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
            <button onClick={handleActivate} className="btn-primary btn-sm">
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
                  : "Завершите настройку и активируйте приглашение"}
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
          onClick={() => setActiveTab("templates")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "templates"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Palette className="w-4 h-4" />
          Шаблоны
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "settings"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
          Настройки
        </button>
      </div>

      {/* Templates */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templatesList.map((template) => (
            <TemplateCard
              key={template.slug}
              template={template}
              isSelected={event.invitation.templateId === template.slug}
              onSelect={() => handleSelectTemplate(template.slug)}
            />
          ))}
        </div>
      )}

      {/* Settings */}
      {activeTab === "settings" && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Настройки приглашения</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={event.invitation.rsvpEnabled}
                  onChange={() => {}}
                  className="rounded border-border"
                />
                <span>Включить RSVP</span>
              </label>
              <p className="text-sm text-muted-foreground ml-6">
                Гости смогут подтверждать присутствие
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && preview.template?.htmlTemplate && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Предпросмотр</h3>
          <div className="aspect-[9/16] max-w-sm mx-auto bg-secondary rounded-lg overflow-hidden border">
            <iframe
              srcDoc={renderTemplate(preview.template.htmlTemplate, preview.event)}
              className="w-full h-full border-0"
              title="Предпросмотр приглашения"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Template color schemes for preview
const templateColors: Record<string, { bg: string; accent: string; text: string }> = {
  "light-elegant": { bg: "#fdfbfb", accent: "#c9b5a7", text: "#3d3d3d" },
  "dark-cinematic": { bg: "#0d0d0d", accent: "#c9a962", text: "#f5f5f5" },
  "modern-minimal": { bg: "#ffffff", accent: "#111111", text: "#111111" },
  "kazakh-national": { bg: "#fffef7", accent: "#c4956a", text: "#1e3a5f" },
};

function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: TemplatePreview;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const colors = templateColors[template.slug] || { bg: "#f5f5f5", accent: "#666", text: "#333" };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "card text-left transition-all hover:shadow-md p-3",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <div
        className="aspect-[3/4] rounded-lg mb-3 overflow-hidden flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: colors.bg }}
      >
        <div
          className="text-[10px] tracking-widest uppercase mb-2"
          style={{ color: colors.accent }}
        >
          Свадьба
        </div>
        <div
          className="text-lg font-serif text-center leading-tight"
          style={{ color: colors.text }}
        >
          Алина
          <span style={{ color: colors.accent }} className="block text-sm my-1">&</span>
          Данияр
        </div>
        <div
          className="text-[9px] mt-3 tracking-wide"
          style={{ color: colors.accent }}
        >
          15.06.2025
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{template.name}</p>
          <p className="text-xs text-muted-foreground">{template.nameKz}</p>
        </div>
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
        {template.isPremium && !isSelected && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded flex-shrink-0">
            Premium
          </span>
        )}
      </div>
    </button>
  );
}
