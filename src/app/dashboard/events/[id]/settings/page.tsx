"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Link2, Plus, Copy, RefreshCw, Eye, Edit3, Lock, X } from "lucide-react";
import { events, shares } from "@/lib/api";
import { Event, UpdateEventRequest, ShareLink, ShareAccessLevel, ShareWidget, Country } from "@/lib/types";
import { PageLoader, ConfirmDialog, SuccessDialog, Modal, ModalFooter, TimeInput } from "@/components/ui";
import { cn, getDefaultCity } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

export default function EventSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const userCountry: Country = user?.country || "kz";
  const defaultCity = getDefaultCity(userCountry);

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateEventRequest>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sharing state
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await events.get(eventId);
        setEvent(data);
        setFormData({
          title: data.title,
          person1: data.person1 || "",
          person2: data.person2 || "",
          date: data.date || "",
          time: data.time || "",
          totalBudget: data.totalBudget,
          venue: data.venue || {},
          greetingRu: data.greetingRu || "",
          hashtag: data.hashtag || "",
        });
        // Load share links
        loadShareLinks();
      } catch (error) {
        console.error("Failed to load event:", error);
        toast.error(t("eventSettings.loadError"));
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  async function loadShareLinks() {
    setIsLoadingShares(true);
    try {
      const links = await shares.list(eventId);
      setShareLinks(links || []);
    } catch (error) {
      console.error("Failed to load share links:", error);
    } finally {
      setIsLoadingShares(false);
    }
  }

  async function handleCreateShare(data: { accessLevel: ShareAccessLevel; widgets?: ShareWidget[]; pinCode?: string; label?: string }) {
    try {
      const link = await shares.create(eventId, data);
      setShareLinks((prev) => [link, ...prev]);
      setShowShareModal(false);
      toast.success(t("eventSettings.linkCreated"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("eventSettings.linkCreateError"));
    }
  }

  async function handleDeactivateShare(shareId: string) {
    try {
      await shares.deactivate(eventId, shareId);
      setShareLinks((prev) => prev.map((l) => (l.id === shareId ? { ...l, isActive: false } : l)));
      toast.success(t("eventSettings.linkDeactivated"));
    } catch {
      toast.error(t("eventSettings.deactivateError"));
    }
  }

  async function handleRegenerateShare(shareId: string) {
    try {
      const link = await shares.regenerate(eventId, shareId);
      setShareLinks((prev) => prev.map((l) => (l.id === shareId ? link : l)));
      toast.success(t("eventSettings.linkRefreshed"));
    } catch {
      toast.error(t("eventSettings.refreshError"));
    }
  }

  async function handleDeleteShare(shareId: string) {
    try {
      await shares.delete(eventId, shareId);
      setShareLinks((prev) => prev.filter((l) => l.id !== shareId));
      toast.success(t("eventSettings.linkDeleted"));
    } catch {
      toast.error(t("eventSettings.deleteError"));
    }
  }

  function getShareUrl(token: string) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/share/${token}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(t("eventSettings.copied"));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await events.update(eventId, formData);
      setShowSuccessModal(true);
    } catch {
      toast.error(t("eventSettings.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await events.delete(eventId);
      router.push("/dashboard");
    } catch {
      toast.error(t("eventSettings.deleteEventError"));
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (!event) return null;

  return (
    <div className="max-w-2xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-h1">{t("eventSettings.title")}</h1>
        <p className="text-caption mt-1">{t("eventSettings.editing")}</p>
      </div>

      {/* Basic */}
      <section className="space-y-3 sm:space-y-4">
        <h2 className="font-medium text-sm sm:text-base">{t("eventSettings.basic")}</h2>
        <div>
          <label className="block text-xs sm:text-sm mb-1.5">{t("eventSettings.name")}</label>
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm mb-1.5">{t("eventSettings.person1")}</label>
            <input
              type="text"
              value={formData.person1 || ""}
              onChange={(e) => setFormData({ ...formData, person1: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm mb-1.5">{t("eventSettings.person2")}</label>
            <input
              type="text"
              value={formData.person2 || ""}
              onChange={(e) => setFormData({ ...formData, person2: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </section>

      {/* Date & Time */}
      <section className="space-y-3 sm:space-y-4">
        <h2 className="font-medium text-sm sm:text-base">{t("eventSettings.dateTime")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm mb-1.5">{t("eventSettings.date")}</label>
            <input
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm mb-1.5">{t("eventSettings.time")}</label>
            <TimeInput
              value={formData.time || ""}
              onChange={(value) => setFormData({ ...formData, time: value })}
            />
          </div>
        </div>
      </section>

      {/* Venue */}
      <section className="space-y-4">
        <h2 className="font-medium">{t("eventSettings.venue")}</h2>
        <div>
          <label className="block text-sm mb-1.5">{t("eventSettings.venueName")}</label>
          <input
            type="text"
            value={formData.venue?.name || ""}
            onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, name: e.target.value } })}
            className="input"
            placeholder={t("eventSettings.venueNamePlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">{t("eventSettings.address")}</label>
          <input
            type="text"
            value={formData.venue?.address || ""}
            onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, address: e.target.value } })}
            className="input"
            placeholder={t("eventSettings.addressPlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">{t("eventSettings.city")}</label>
          <input
            type="text"
            value={formData.venue?.city || ""}
            onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, city: e.target.value } })}
            className="input"
            placeholder={defaultCity || t("eventSettings.cityPlaceholder")}
          />
        </div>
      </section>

      {/* Budget */}
      <section className="space-y-4">
        <h2 className="font-medium">{t("eventSettings.budget")}</h2>
        <div>
          <label className="block text-sm mb-1.5">{t("eventSettings.totalBudget")}</label>
          <input
            type="number"
            value={formData.totalBudget || ""}
            onChange={(e) => setFormData({ ...formData, totalBudget: parseInt(e.target.value) || 0 })}
            className="input"
          />
        </div>
      </section>

      {/* Invitation text */}
      <section className="space-y-4">
        <h2 className="font-medium">{t("eventSettings.invitation")}</h2>
        <div>
          <label className="block text-sm mb-1.5">{t("eventSettings.greeting")}</label>
          <textarea
            value={formData.greetingRu || ""}
            onChange={(e) => setFormData({ ...formData, greetingRu: e.target.value })}
            className="input min-h-[80px]"
            placeholder={t("eventSettings.greetingPlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">{t("eventSettings.hashtag")}</label>
          <input
            type="text"
            value={formData.hashtag || ""}
            onChange={(e) => setFormData({ ...formData, hashtag: e.target.value })}
            className="input"
            placeholder={t("eventSettings.hashtagPlaceholder")}
          />
        </div>
      </section>

      {/* Sharing */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-medium text-sm sm:text-base flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              {t("eventSettings.sharing")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("eventSettings.sharePartner")}</p>
          </div>
          <button onClick={() => setShowShareModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            {t("eventSettings.createLink")}
          </button>
        </div>

        {isLoadingShares ? (
          <div className="text-center py-4 text-muted-foreground">{t("eventSettings.loading")}</div>
        ) : shareLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t("eventSettings.noLinks")}</p>
            <p className="text-sm">{t("eventSettings.noLinksHint")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shareLinks.map((link) => (
              <div
                key={link.id}
                className={cn(
                  "p-4 rounded-lg border",
                  link.isActive ? "border-border bg-white" : "border-border/50 bg-secondary/30 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {link.accessLevel === "editor" ? (
                        <span className="badge-success flex items-center gap-1 text-xs">
                          <Edit3 className="w-3 h-3" />
                          {t("eventSettings.editor")}
                        </span>
                      ) : (
                        <span className="badge-default flex items-center gap-1 text-xs">
                          <Eye className="w-3 h-3" />
                          {t("eventSettings.view")}
                        </span>
                      )}
                      {link.pinCode && (
                        <span className="badge-warning flex items-center gap-1 text-xs">
                          <Lock className="w-3 h-3" />
                          PIN
                        </span>
                      )}
                      {!link.isActive && (
                        <span className="badge-default text-xs">{t("eventSettings.inactive")}</span>
                      )}
                    </div>
                    {link.label && (
                      <p className="font-medium text-sm">{link.label}</p>
                    )}
                    {link.widgets && link.widgets.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {link.widgets.map((w) => (
                          <span key={w} className="text-xs px-1.5 py-0.5 bg-secondary rounded">
                            {t(`eventSettings.widgets.${w}`)}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {getShareUrl(link.token)}
                    </p>
                  </div>
                  {link.isActive && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(getShareUrl(link.token))}
                        className="btn-ghost btn-sm"
                        title={t("eventSettings.copyLink")}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRegenerateShare(link.id)}
                        className="btn-ghost btn-sm"
                        title={t("eventSettings.refreshToken")}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeactivateShare(link.id)}
                        className="btn-ghost btn-sm text-amber-600"
                        title={t("eventSettings.deactivate")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShare(link.id)}
                        className="btn-ghost btn-sm text-red-600"
                        title={t("eventSettings.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
        <button onClick={() => setShowDeleteModal(true)} className="btn-ghost btn-sm text-red-600 hover:bg-red-50 justify-center sm:justify-start">
          <Trash2 className="w-4 h-4" />
          {t("eventSettings.delete")}
        </button>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary btn-md w-full sm:w-auto">
          {isSaving ? t("eventSettings.saving") : t("eventSettings.save")}
        </button>
      </div>

      {/* Success Modal */}
      <SuccessDialog
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={t("eventSettings.saved")}
        description={t("eventSettings.savedDesc")}
        buttonText={t("eventSettings.toEvent")}
        onButtonClick={() => router.push(`/dashboard/events/${eventId}`)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t("eventSettings.deleteTitle")}
        description={t("eventSettings.deleteDesc")}
        confirmText={t("eventSettings.delete")}
        cancelText={t("eventSettings.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Create Share Modal */}
      <CreateShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSubmit={handleCreateShare}
        t={t}
      />
    </div>
  );
}

interface CreateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { accessLevel: ShareAccessLevel; widgets?: ShareWidget[]; pinCode?: string; label?: string }) => void;
  t: (key: string) => string;
}

const WIDGET_KEYS: ShareWidget[] = ["guests", "budget", "checklist", "program", "seating", "gifts"];

function CreateShareModal({ isOpen, onClose, onSubmit, t }: CreateShareModalProps) {
  const [accessLevel, setAccessLevel] = useState<ShareAccessLevel>("view");
  const [selectedWidgets, setSelectedWidgets] = useState<ShareWidget[]>(["guests", "checklist", "program"]);
  const [usePin, setUsePin] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleWidget = (widget: ShareWidget) => {
    setSelectedWidgets((prev) =>
      prev.includes(widget)
        ? prev.filter((w) => w !== widget)
        : [...prev, widget]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usePin && pinCode.length !== 4) return;
    if (selectedWidgets.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        accessLevel,
        widgets: selectedWidgets,
        pinCode: usePin ? pinCode : undefined,
        label: label || undefined,
      });
      // Reset form
      setAccessLevel("view");
      setSelectedWidgets(["guests", "checklist", "program"]);
      setUsePin(false);
      setPinCode("");
      setLabel("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("eventSettings.createAccessLink")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t("eventSettings.accessLevel")}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccessLevel("view")}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-colors",
                accessLevel === "view"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{t("eventSettings.view")}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("eventSettings.viewOnly")}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAccessLevel("editor")}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-colors",
                accessLevel === "editor"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Edit3 className="w-4 h-4" />
                <span className="font-medium">{t("eventSettings.editor")}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("eventSettings.viewAndEdit")}
              </p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("eventSettings.widgetsToShow")}</label>
          <div className="grid grid-cols-2 gap-2">
            {WIDGET_KEYS.map((widgetKey) => (
              <label
                key={widgetKey}
                className={cn(
                  "flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors",
                  selectedWidgets.includes(widgetKey)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedWidgets.includes(widgetKey)}
                  onChange={() => toggleWidget(widgetKey)}
                  className="mt-0.5 rounded border-border"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{t(`eventSettings.widgets.${widgetKey}`)}</span>
                  <p className="text-xs text-muted-foreground">{t(`eventSettings.widgets.${widgetKey}Desc`)}</p>
                </div>
              </label>
            ))}
          </div>
          {selectedWidgets.length === 0 && (
            <p className="text-xs text-red-500 mt-1">{t("eventSettings.selectOneWidget")}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("eventSettings.labelOptional")}</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input"
            placeholder={t("eventSettings.labelPlaceholder")}
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={usePin}
              onChange={(e) => {
                setUsePin(e.target.checked);
                if (!e.target.checked) setPinCode("");
              }}
              className="rounded border-border"
            />
            <span className="text-sm">{t("eventSettings.protectPin")}</span>
          </label>

          {usePin && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">
                {t("eventSettings.pinDigits")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                className="input text-center text-xl tracking-widest w-32"
                placeholder="____"
              />
            </div>
          )}
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-ghost btn-md">
            {t("eventSettings.cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (usePin && pinCode.length !== 4) || selectedWidgets.length === 0}
            className="btn-primary btn-md"
          >
            {isSubmitting ? t("eventSettings.creating") : t("eventSettings.create")}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
