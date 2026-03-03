"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Trash2,
  Clock,
  GripVertical,
  FileText,
  Download,
  Printer,
  Sparkles,
  User,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { program, events, vendors as vendorsApi } from "@/lib/api";
import { ProgramItem, ProgramTemplate, Event, Vendor } from "@/lib/types";
import { cn, eventTypeLabels, formatDate, vendorTypeLabels } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { PageLoader, Modal, ModalFooter, EmptyState, ConfirmDialog, TimeInput } from "@/components/ui";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Sort items by startTime (HH:MM format)
function sortByTime(items: ProgramItem[]): ProgramItem[] {
  return [...items].sort((a, b) => {
    const timeA = a.startTime.split(":").map(Number);
    const timeB = b.startTime.split(":").map(Number);
    const minutesA = timeA[0] * 60 + (timeA[1] || 0);
    const minutesB = timeB[0] * 60 + (timeB[1] || 0);
    return minutesA - minutesB;
  });
}

export default function ProgramPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { t, tLabel } = useTranslation();

  const [items, setItems] = useState<ProgramItem[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [itemsData, eventData, templatesData, vendorsData] = await Promise.all([
        program.list(eventId),
        events.get(eventId),
        program.getTemplates(),
        vendorsApi.list(eventId).catch(() => []),
      ]);
      setItems(itemsData || []);
      setEvent(eventData);
      setTemplates(templatesData || []);
      setVendors(vendorsData || []);
    } catch (error) {
      console.error("Failed to load program:", error);
      toast.error(t("program.loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddItem = async (data: {
    startTime: string;
    endTime?: string;
    title: string;
    description?: string;
    responsible?: string;
    duration?: number;
  }) => {
    try {
      const newItem = await program.create(eventId, data);
      setItems((prev) => sortByTime([...prev, newItem]));
      setShowAddModal(false);
      toast.success(t("program.itemAdded"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("program.addError"));
    }
  };

  const handleUpdateItem = async (itemId: string, data: {
    startTime?: string;
    endTime?: string;
    title?: string;
    description?: string;
    responsible?: string;
    duration?: number;
  }) => {
    try {
      const updatedItem = await program.update(eventId, itemId, data);
      setItems((prev) => sortByTime(prev.map((item) => (item.id === itemId ? updatedItem : item))));
      setEditingItem(null);
      toast.success(t("program.itemUpdated"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("program.updateError"));
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    setIsDeleting(true);
    try {
      await program.delete(eventId, deleteItemId);
      setItems((prev) => prev.filter((item) => item.id !== deleteItemId));
      setDeleteItemId(null);
      toast.success(t("program.itemDeleted"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("program.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplyTemplate = async (eventType: string) => {
    try {
      const newItems = await program.applyTemplate(eventId, eventType);
      setItems(newItems);
      setShowTemplateModal(false);
      toast.success(t("program.templateApplied"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("program.templateError"));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = useCallback(async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder items locally
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update order values
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setItems(reorderedItems);
    setDraggedId(null);

    // Send reorder request to API
    try {
      await program.reorder(eventId, {
        items: reorderedItems.map((item) => ({ id: item.id, order: item.order })),
      });
    } catch (error) {
      console.error("Failed to reorder:", error);
      toast.error(t("program.reorderError"));
      loadData(); // Reload to get correct order
    }
  }, [draggedId, items, eventId]);

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const calculateTotalDuration = () => {
    return items.reduce((sum, item) => sum + (item.duration || 0), 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return t("program.hoursAndMinutes").replace("{hours}", hours.toString()).replace("{minutes}", mins.toString());
    } else if (hours > 0) {
      return `${hours} ${t("program.hours")}`;
    }
    return `${mins} ${t("program.minutes")}`;
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || items.length === 0) return;

    setIsGeneratingPdf(true);
    try {
      // Higher scale for better quality (3x = ~216 DPI)
      const canvas = await html2canvas(printRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 595, // A4 width at 72 DPI
      });

      // Use JPEG with high quality for smaller file size
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, "FAST");

      const eventTitle = event?.title || t("program.title");
      pdf.save(`${eventTitle} - ${t("program.title")}.pdf`);

      toast.success(t("program.pdfDownloaded"));
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error(t("program.pdfError"));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">{t("program.title")}</h1>
          <p className="text-caption mt-1">
            {t("program.description")}
          </p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="btn-outline btn-sm"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPdf ? "..." : t("common.download")}
              </button>
              <button
                onClick={() => window.print()}
                className="btn-outline btn-sm"
              >
                <Printer className="w-4 h-4" />
                {t("program.print")}
              </button>
            </>
          )}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="btn-outline btn-sm"
          >
            <Sparkles className="w-4 h-4" />
            {t("program.template")}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            {t("common.add")}
          </button>
        </div>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{items.length}</div>
                <div className="text-sm text-muted-foreground">{t("program.itemsCount")}</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatDuration(calculateTotalDuration())}</div>
                <div className="text-sm text-muted-foreground">{t("program.totalDuration")}</div>
              </div>
            </div>
          </div>
          {items.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{items[0]?.startTime} – {items[items.length - 1]?.startTime}</div>
                  <div className="text-sm text-muted-foreground">{t("program.timeRange")}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Program list */}
      <div className="card p-0 overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={t("program.emptyTitle")}
            description={t("program.emptyDescription")}
            action={
              <div className="flex gap-2">
                <button onClick={() => setShowTemplateModal(true)} className="btn-outline btn-sm">
                  <Sparkles className="w-4 h-4" />
                  {t("program.useTemplate")}
                </button>
                <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  {t("program.addItem")}
                </button>
              </div>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((item, index) => (
              <ProgramItemRow
                key={item.id}
                item={item}
                vendors={vendors}
                isEditing={editingItem?.id === item.id}
                isDragging={draggedId === item.id}
                isDragOver={dragOverId === item.id}
                onEdit={() => setEditingItem(item)}
                onSave={(data) => handleUpdateItem(item.id, data)}
                onCancel={() => setEditingItem(null)}
                onDelete={() => setDeleteItemId(item.id)}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item.id)}
                onDragEnd={handleDragEnd}
                className={`animate-in stagger-${Math.min(index + 1, 4)}`}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hidden printable content for PDF */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={printRef} className="bg-white p-8" style={{ width: "595px" }}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">{event?.title || t("program.eventProgram")}</h1>
            {event?.date && (
              <p className="text-gray-600">{formatDate(event.date)}</p>
            )}
          </div>
          <div className="border-t border-gray-200">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 py-3 border-b border-gray-100">
                <div className="w-16 text-center font-mono font-semibold text-indigo-600">
                  {item.startTime}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500">{item.description}</p>
                  )}
                </div>
                {item.responsible && (
                  <div className="text-sm text-gray-500">{item.responsible}</div>
                )}
                {item.duration > 0 && (
                  <div className="text-sm text-gray-500">{item.duration} {t("program.minutes")}</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center text-sm text-gray-400">
            Toilab
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .card, .card * {
            visibility: visible;
          }
          .card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .btn-outline, .btn-primary, button {
            display: none !important;
          }
        }
      `}</style>

      {/* Add Item Modal */}
      {showAddModal && (
        <AddProgramItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
          vendors={vendors}
          t={t}
        />
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          templates={templates}
          currentEventType={event?.type}
          onClose={() => setShowTemplateModal(false)}
          onApply={handleApplyTemplate}
          t={t}
          tLabel={tLabel}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleDeleteItem}
        title={t("program.deleteTitle")}
        description={t("program.deleteDescription")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function ProgramItemRow({
  item,
  vendors,
  isEditing,
  isDragging,
  isDragOver,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  className,
  t,
}: {
  item: ProgramItem;
  vendors: Vendor[];
  isEditing: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onEdit: () => void;
  onSave: (data: { startTime?: string; title?: string; description?: string; responsible?: string; duration?: number }) => void;
  onCancel: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  className?: string;
  t: (key: string) => string;
}) {
  // Check if responsible is a known vendor
  const isKnownVendor = item.responsible
    ? vendors.some(v => v.name === item.responsible)
    : true;
  const [editData, setEditData] = useState({
    startTime: item.startTime,
    title: item.title,
    description: item.description || "",
    responsible: item.responsible || "",
    duration: item.duration,
  });
  const [isCustomResponsible, setIsCustomResponsible] = useState(!isKnownVendor && !!item.responsible);

  if (isEditing) {
    return (
      <div className={cn("px-4 py-3 bg-secondary/30", className)}>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-2">
            <TimeInput
              value={editData.startTime}
              onChange={(value) => setEditData({ ...editData, startTime: value })}
              className="text-sm"
            />
          </div>
          <div className="col-span-3">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="input text-sm"
              placeholder={t("program.itemTitle")}
            />
          </div>
          <div className="col-span-3">
            <input
              type="text"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="input text-sm"
              placeholder={t("common.description")}
            />
          </div>
          <div className="col-span-2">
            {vendors.length > 0 && !isCustomResponsible ? (
              <select
                value={vendors.some(v => v.name === editData.responsible) ? editData.responsible : ""}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomResponsible(true);
                    setEditData({ ...editData, responsible: "" });
                  } else {
                    setEditData({ ...editData, responsible: e.target.value });
                  }
                }}
                className="input text-sm"
              >
                <option value="">{t("program.notAssigned")}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
                <option value="custom">{t("program.other")}</option>
              </select>
            ) : (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={editData.responsible}
                  onChange={(e) => setEditData({ ...editData, responsible: e.target.value })}
                  className="input text-sm flex-1"
                  placeholder={t("program.responsiblePlaceholder")}
                />
                {vendors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomResponsible(false)}
                    className="p-2 text-muted-foreground hover:bg-secondary rounded-lg"
                    title={t("program.selectFromList")}
                  >
                    <User className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <button
              onClick={() => onSave(editData)}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "px-3 sm:px-4 py-3 hover:bg-secondary/50 transition-colors group cursor-move",
        isDragging && "opacity-50 bg-secondary/30",
        isDragOver && "border-t-2 border-primary",
        className
      )}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-muted-foreground cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="w-16 text-center">
          <span className="font-mono text-lg font-semibold text-primary">{item.startTime}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{item.title}</p>
          {item.description && (
            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
        {item.responsible && (
          <div className={cn(
            "flex items-center gap-1.5 text-sm",
            isKnownVendor ? "text-muted-foreground" : "text-amber-600"
          )}>
            <User className="w-3.5 h-3.5" />
            <span>{item.responsible}</span>
            {!isKnownVendor && vendors.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded" title={t("program.vendorNotFound")}>
                ?
              </span>
            )}
          </div>
        )}
        {item.duration > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {item.duration} {t("program.minutes")}
          </div>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            title={t("common.edit")}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title={t("common.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground cursor-grab active:cursor-grabbing pt-1">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-base font-semibold text-primary">{item.startTime}</span>
              {item.duration > 0 && (
                <span className="text-xs text-muted-foreground">({item.duration} мин)</span>
              )}
            </div>
            <p className="font-medium text-sm">{item.title}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
            )}
            {item.responsible && (
              <div className={cn(
                "flex items-center gap-1 text-xs mt-1.5",
                isKnownVendor ? "text-muted-foreground" : "text-amber-600"
              )}>
                <User className="w-3 h-3" />
                <span>{item.responsible}</span>
                {!isKnownVendor && vendors.length > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded">?</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              title={t("common.edit")}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title={t("common.delete")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddProgramItemModal({
  onClose,
  onAdd,
  vendors,
  t,
}: {
  onClose: () => void;
  onAdd: (data: {
    startTime: string;
    endTime?: string;
    title: string;
    description?: string;
    responsible?: string;
    duration?: number;
  }) => void;
  vendors: Vendor[];
  t: (key: string) => string;
}) {
  const [startTime, setStartTime] = useState("18:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("");
  const [customResponsible, setCustomResponsible] = useState("");
  const [duration, setDuration] = useState("30");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime) {
      toast.error(t("program.timeAndTitleRequired"));
      return;
    }
    const finalResponsible = responsible === "custom" ? customResponsible.trim() : responsible;
    onAdd({
      startTime,
      title: title.trim(),
      description: description.trim() || undefined,
      responsible: finalResponsible || undefined,
      duration: parseInt(duration) || 30,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={t("program.addItemTitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("program.startTimeRequired")}</label>
            <TimeInput
              value={startTime}
              onChange={setStartTime}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("program.durationMinutes")}</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="input"
              min="1"
              max="300"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("program.titleRequired")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder={t("program.titlePlaceholder")}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("common.description")}</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder={t("program.descriptionPlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("program.responsible")}</label>
          {vendors.length > 0 ? (
            <>
              <select
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="input"
              >
                <option value="">{t("program.notAssigned")}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name} ({vendorTypeLabels[v.category]?.ru || v.category})
                  </option>
                ))}
                <option value="custom">{t("program.other")}</option>
              </select>
              {responsible === "custom" && (
                <input
                  type="text"
                  value={customResponsible}
                  onChange={(e) => setCustomResponsible(e.target.value)}
                  className="input mt-2"
                  placeholder={t("program.enterResponsible")}
                />
              )}
            </>
          ) : (
            <input
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              className="input"
              placeholder={t("program.responsibleExamples")}
            />
          )}
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn-primary btn-md">
            {t("common.add")}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function TemplateModal({
  templates,
  currentEventType,
  onClose,
  onApply,
  t,
  tLabel,
}: {
  templates: ProgramTemplate[];
  currentEventType?: string;
  onClose: () => void;
  onApply: (eventType: string) => void;
  t: (key: string) => string;
  tLabel: (ru: string, kz?: string) => string;
}) {
  const [selectedType, setSelectedType] = useState(currentEventType || "wedding");
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(selectedType);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("program.selectTemplate")}
      description={t("program.templateWillReplace")}
    >
      <div className="space-y-3">
        {templates.map((template) => {
          const label = eventTypeLabels[template.eventType] || { ru: template.eventType };
          return (
            <button
              key={template.eventType}
              type="button"
              onClick={() => setSelectedType(template.eventType)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left",
                selectedType === template.eventType
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex-1">
                <div className="font-medium">{tLabel(label.ru, label.kz)}</div>
                <div className="text-sm text-muted-foreground">
                  {template.itemCount} {t("program.itemsInTemplate")}
                </div>
              </div>
              {selectedType === template.eventType && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          );
        })}
      </div>
      <ModalFooter>
        <button type="button" onClick={onClose} className="btn-outline btn-md">
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={isApplying}
          className="btn-primary btn-md"
        >
          {isApplying ? t("program.applying") : t("program.applyTemplate")}
        </button>
      </ModalFooter>
    </Modal>
  );
}
