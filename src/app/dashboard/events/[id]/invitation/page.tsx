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
  Sparkles,
  Eye,
  UserCheck,
  Share2,
  ChevronDown,
  ChevronUp,
  Palette,
} from "lucide-react";
import { InvitationTemplate } from "@/components/invitation/InvitationTemplate";
import { InvitationTemplate2 } from "@/components/invitation/InvitationTemplate2";
import { events, guests as guestsApi, shares } from "@/lib/api";
import { Event, Guest, ShareLink } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

export default function InvitationPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { t } = useTranslation();

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [externalUrl, setExternalUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"builtin" | "external">("builtin");
  const [selectedTemplate, setSelectedTemplate] = useState<1 | 2>(1);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [eventData, guestsData, sharesData] = await Promise.all([
        events.get(eventId),
        guestsApi.list(eventId),
        shares.list(eventId).catch(() => []),
      ]);
      setEvent(eventData);
      setGuests(guestsData || []);
      setShareLinks(sharesData || []);
      setExternalUrl(eventData.invitation?.externalUrl || "");
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error(t("invitation.loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveUrl() {
    if (!event) return;

    setIsSaving(true);
    try {
      await events.updateInvitation(eventId, { externalUrl });
      toast.success(t("invitation.urlSaved"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("invitation.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function createInvitationLink() {
    setIsCreatingLink(true);
    try {
      const newShare = await shares.create(eventId, {
        label: "Приглашение",
        accessLevel: "view",
        widgets: ["guests"], // Minimal access for RSVP
      });
      setShareLinks([...shareLinks, newShare]);
      toast.success("Ссылка создана");
    } catch (error) {
      console.error("Failed to create link:", error);
      toast.error("Не удалось создать ссылку");
    } finally {
      setIsCreatingLink(false);
    }
  }

  function getInvitationUrl(token: string, guestSlug?: string, template?: number) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const path = `/share/${token}/invitation`;
    const params = new URLSearchParams();
    if (guestSlug) params.set("guest", guestSlug);
    if (template && template !== 1) params.set("template", String(template));
    const queryString = params.toString();
    return queryString ? `${baseUrl}${path}?${queryString}` : `${baseUrl}${path}`;
  }

  function copyLink(url: string, type: string) {
    navigator.clipboard.writeText(url);
    setCopiedLinkType(type);
    toast.success("Ссылка скопирована");
    setTimeout(() => setCopiedLinkType(null), 2000);
  }

  function copyWhatsAppMessage(guest: Guest, url: string) {
    const message = `${guest.name}, приглашаем вас на наш праздник! 🎉\n\nПодробности и подтверждение участия: ${url}`;
    navigator.clipboard.writeText(message);
    setCopiedGuestId(guest.id);
    toast.success(t("invitation.messageCopied"));
    setTimeout(() => setCopiedGuestId(null), 2000);
  }

  function openWhatsApp(guest: Guest, url: string) {
    if (!guest.phone) {
      toast.error(t("invitation.noPhoneNumber"));
      return;
    }

    const message = encodeURIComponent(
      `${guest.name}, приглашаем вас на наш праздник! 🎉\n\nПодробности и подтверждение участия: ${url}`
    );
    const phone = guest.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  }

  const filteredGuests = guests.filter((guest) =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find invitation-type share link (or first available)
  const invitationShare = shareLinks.find(s => s.isActive) || shareLinks[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return <div>{t("invitation.eventNotFound")}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1">{t("invitation.title")}</h1>
        <p className="text-caption mt-1">
          {t("invitation.description")}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 bg-secondary rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("builtin")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "builtin"
              ? "bg-white shadow-sm text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Встроенный шаблон
        </button>
        <button
          onClick={() => setActiveTab("external")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "external"
              ? "bg-white shadow-sm text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link2 className="w-4 h-4 inline mr-2" />
          Внешняя ссылка
        </button>
      </div>

      {activeTab === "builtin" && (
        <>
          {/* Template Selector */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Выберите шаблон
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Template 1 - Dark Elegant */}
              <button
                onClick={() => setSelectedTemplate(1)}
                className={cn(
                  "relative overflow-hidden rounded-xl border-2 transition-all group",
                  selectedTemplate === 1
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="aspect-[3/4] bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] p-4 flex flex-col items-center justify-center">
                  <div className="text-[#D4AF37] text-2xl mb-2">✦</div>
                  <div className="text-white/80 text-xs font-serif">Elegant Dark</div>
                  <div className="text-[#D4AF37]/60 text-[10px] mt-1">Классика</div>
                </div>
                {selectedTemplate === 1 && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>

              {/* Template 2 - Colorful Illustrated */}
              <button
                onClick={() => setSelectedTemplate(2)}
                className={cn(
                  "relative overflow-hidden rounded-xl border-2 transition-all group",
                  selectedTemplate === 2
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="aspect-[3/4] bg-gradient-to-b from-[#FFF0A0] to-[#FFD6E7] p-4 flex flex-col items-center justify-center">
                  <div className="text-[#1E1408] text-2xl mb-2">♡</div>
                  <div className="text-[#1E1408]/80 text-xs" style={{fontFamily: "cursive"}}>Playful</div>
                  <div className="text-[#FF7EB3] text-[10px] mt-1">Яркий</div>
                </div>
                {selectedTemplate === 2 && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Template Preview */}
          <InvitationPreview event={event} selectedTemplate={selectedTemplate} />

          {/* Built-in Invitation Template */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Ссылки для приглашения
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Создайте ссылку и отправьте гостям — они смогут подтвердить участие
            </p>

            {!invitationShare ? (
              <button
                onClick={createInvitationLink}
                disabled={isCreatingLink}
                className="btn-primary"
              >
                {isCreatingLink ? "Создание..." : "Создать ссылку на приглашение"}
              </button>
            ) : (
              <div className="space-y-4">
                {/* General invitation link */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Общая ссылка</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Для новых гостей
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Гости смогут подтвердить участие и добавить +1, +2 и т.д.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copyLink(getInvitationUrl(invitationShare.token, undefined, selectedTemplate), "general")}
                      className={cn(
                        "btn-outline btn-sm",
                        copiedLinkType === "general" && "bg-green-50 border-green-500 text-green-600"
                      )}
                    >
                      {copiedLinkType === "general" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="ml-2">Скопировать</span>
                    </button>
                    <a
                      href={getInvitationUrl(invitationShare.token, undefined, selectedTemplate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline btn-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="ml-2">Предпросмотр</span>
                    </a>
                  </div>
                </div>

                {/* Personal invitation links info */}
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">Персональные ссылки</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Для существующих гостей генерируются персональные ссылки с их именем.
                    RSVP автоматически привязывается к гостю.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Guests with personal links */}
          {invitationShare && (
            <div className="card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Отправить приглашения</span>
                </h3>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {guests.length} гостей
                </span>
              </div>

              {guests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t("invitation.noGuests")}</p>
                  <p className="text-sm">{t("invitation.noGuestsHint")}</p>
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
                      placeholder={t("invitation.searchGuest")}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>

                  {/* Guest list */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredGuests.map((guest) => {
                      const personalUrl = getInvitationUrl(invitationShare.token, guest.personalSlug, selectedTemplate);

                      return (
                        <div
                          key={guest.id}
                          className={cn(
                            "flex items-center justify-between gap-2 p-2 sm:p-3 rounded-lg transition-colors",
                            guest.rsvpStatus === "accepted" && "bg-emerald-50 border border-emerald-200",
                            guest.rsvpStatus === "declined" && "bg-red-50 border border-red-200",
                            guest.rsvpStatus === "pending" && "bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className={cn(
                              "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                              guest.rsvpStatus === "accepted" && "bg-emerald-500 text-white",
                              guest.rsvpStatus === "declined" && "bg-red-400 text-white",
                              guest.rsvpStatus === "pending" && "bg-primary/10 text-primary"
                            )}>
                              {guest.rsvpStatus === "accepted" ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <span className="text-xs sm:text-sm font-medium">
                                  {guest.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm sm:text-base font-medium truncate">{guest.name}</p>
                                {guest.rsvpStatus !== "pending" && (
                                  <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    guest.rsvpStatus === "accepted" && "bg-emerald-100 text-emerald-700",
                                    guest.rsvpStatus === "declined" && "bg-red-100 text-red-700"
                                  )}>
                                    {guest.rsvpStatus === "accepted" ? "Придёт" : "Не придёт"}
                                    {guest.plusCount > 0 && ` +${guest.plusCount}`}
                                  </span>
                                )}
                              </div>
                              {guest.phone ? (
                                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{guest.phone}</span>
                                </p>
                              ) : (
                                <p className="text-xs sm:text-sm text-muted-foreground italic">
                                  {t("invitation.noPhone")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <button
                              onClick={() => copyWhatsAppMessage(guest, personalUrl)}
                              className={cn(
                                "btn-outline btn-sm p-2",
                                copiedGuestId === guest.id && "bg-green-50 border-green-500 text-green-600"
                              )}
                              title={t("invitation.copyMessage")}
                            >
                              {copiedGuestId === guest.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            {guest.phone && (
                              <button
                                onClick={() => openWhatsApp(guest, personalUrl)}
                                className="btn-sm bg-green-500 hover:bg-green-600 text-white p-2"
                                title={t("invitation.openWhatsApp")}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "external" && (
        <>
          {/* External Template Preview */}
          {event && <InvitationPreview event={event} selectedTemplate={selectedTemplate} />}

          {/* External URL */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              {t("invitation.externalUrl")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              {t("invitation.externalUrlHint")}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder={t("invitation.externalUrlPlaceholder")}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                onClick={handleSaveUrl}
                disabled={isSaving}
                className="btn-primary px-4 sm:px-6 h-10 sm:h-auto"
              >
                {isSaving ? "..." : t("common.save")}
              </button>
            </div>

            {externalUrl && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(externalUrl);
                    toast.success(t("invitation.linkCopied"));
                  }}
                  className="btn-outline btn-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">{t("common.copy")}</span>
                </button>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline btn-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">{t("invitation.open")}</span>
                </a>
              </div>
            )}
          </div>

          {/* Guests for External WhatsApp */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="hidden sm:inline">{t("invitation.whatsappBroadcast")}</span>
                <span className="sm:hidden">{t("invitation.whatsapp")}</span>
              </h3>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {guests.length} {t("invitation.guestsCount")}
              </span>
            </div>

            {guests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("invitation.noGuests")}</p>
                <p className="text-sm">{t("invitation.noGuestsHint")}</p>
              </div>
            ) : !externalUrl ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Сначала добавьте ссылку на приглашение</p>
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
                    placeholder={t("invitation.searchGuest")}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                {/* Guest list */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-medium text-primary">
                            {guest.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-medium truncate">{guest.name}</p>
                          {guest.phone ? (
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{guest.phone}</span>
                            </p>
                          ) : (
                            <p className="text-xs sm:text-sm text-muted-foreground italic">
                              {t("invitation.noPhone")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            const message = t("invitation.inviteMessage").replace("{name}", guest.name).replace("{url}", externalUrl);
                            navigator.clipboard.writeText(message);
                            setCopiedGuestId(guest.id);
                            toast.success(t("invitation.messageCopied"));
                            setTimeout(() => setCopiedGuestId(null), 2000);
                          }}
                          className={cn(
                            "btn-outline btn-sm p-2",
                            copiedGuestId === guest.id && "bg-green-50 border-green-500 text-green-600"
                          )}
                          title={t("invitation.copyMessage")}
                        >
                          {copiedGuestId === guest.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        {guest.phone && (
                          <button
                            onClick={() => {
                              const message = encodeURIComponent(
                                t("invitation.inviteMessage").replace("{name}", guest.name).replace("{url}", externalUrl)
                              );
                              const phone = guest.phone!.replace(/\D/g, "");
                              window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                            }}
                            className="btn-sm bg-green-500 hover:bg-green-600 text-white p-2"
                            title={t("invitation.openWhatsApp")}
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
        </>
      )}
    </div>
  );
}

// Full invitation template preview component
function InvitationPreview({ event, selectedTemplate }: { event: Event; selectedTemplate: 1 | 2 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const TemplateComponent = selectedTemplate === 1 ? InvitationTemplate : InvitationTemplate2;

  return (
    <div className="card overflow-hidden">
      {/* Preview Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            selectedTemplate === 1
              ? "bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]"
              : "bg-gradient-to-br from-[#FFF0A0] to-[#FFD6E7]"
          )}>
            {selectedTemplate === 1 ? (
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            ) : (
              <span className="text-[#FF7EB3] text-lg">♡</span>
            )}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm sm:text-base">
              Превью приглашения {selectedTemplate === 1 ? "(Elegant)" : "(Playful)"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {event.person1} & {event.person2} — нажмите чтобы {isExpanded ? "свернуть" : "развернуть"}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Full Template Preview */}
      {isExpanded && (
        <div className="border-t border-border">
          <div className="max-h-[600px] overflow-y-auto">
            <TemplateComponent
              person1={event.person1 || ""}
              person2={event.person2 || ""}
              eventDate={event.date || ""}
              eventTime={event.time || ""}
              venueName={event.venue?.name}
              venueAddress={event.venue?.address}
              venueCity={event.venue?.city}
              showRsvpButtons={false}
            />
          </div>
          <div className="p-3 bg-secondary/30 text-center border-t">
            <p className="text-xs text-muted-foreground">
              Это полный шаблон приглашения. Кнопки RSVP будут видны гостям.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
