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
import { program, events } from "@/lib/api";
import { ProgramItem, ProgramTemplate, Event } from "@/lib/types";
import { cn, eventTypeLabels, formatDate } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter, EmptyState, ConfirmDialog } from "@/components/ui";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ProgramPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [items, setItems] = useState<ProgramItem[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
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
      const [itemsData, eventData, templatesData] = await Promise.all([
        program.list(eventId),
        events.get(eventId),
        program.getTemplates(),
      ]);
      setItems(itemsData || []);
      setEvent(eventData);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error("Failed to load program:", error);
      toast.error("Не удалось загрузить программу");
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
      setItems((prev) => [...prev, newItem]);
      setShowAddModal(false);
      toast.success("Пункт добавлен");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить пункт");
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
      setItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));
      setEditingItem(null);
      toast.success("Пункт обновлён");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось обновить пункт");
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    setIsDeleting(true);
    try {
      await program.delete(eventId, deleteItemId);
      setItems((prev) => prev.filter((item) => item.id !== deleteItemId));
      setDeleteItemId(null);
      toast.success("Пункт удалён");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить пункт");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplyTemplate = async (eventType: string) => {
    try {
      const newItems = await program.applyTemplate(eventId, eventType);
      setItems(newItems);
      setShowTemplateModal(false);
      toast.success("Шаблон применён");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось применить шаблон");
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
      toast.error("Не удалось сохранить порядок");
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
      return `${hours} ч ${mins} мин`;
    } else if (hours > 0) {
      return `${hours} ч`;
    }
    return `${mins} мин`;
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || items.length === 0) return;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const eventTitle = event?.title || "Программа";
      pdf.save(`${eventTitle} - Программа.pdf`);

      toast.success("PDF скачан");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Не удалось создать PDF");
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
          <h1 className="text-h1">Программа</h1>
          <p className="text-caption mt-1">
            Расписание мероприятия для подрядчиков
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
                {isGeneratingPdf ? "..." : "Скачать"}
              </button>
              <button
                onClick={() => window.print()}
                className="btn-outline btn-sm"
              >
                <Printer className="w-4 h-4" />
                Печать
              </button>
            </>
          )}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="btn-outline btn-sm"
          >
            <Sparkles className="w-4 h-4" />
            Шаблон
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Добавить
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
                <div className="text-sm text-muted-foreground">пунктов</div>
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
                <div className="text-sm text-muted-foreground">общая длительность</div>
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
                  <div className="text-sm text-muted-foreground">время проведения</div>
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
            title="Программа пуста"
            description="Добавьте пункты вручную или используйте готовый шаблон"
            action={
              <div className="flex gap-2">
                <button onClick={() => setShowTemplateModal(true)} className="btn-outline btn-sm">
                  <Sparkles className="w-4 h-4" />
                  Использовать шаблон
                </button>
                <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  Добавить пункт
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Hidden printable content for PDF */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={printRef} className="bg-white p-8" style={{ width: "595px" }}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">{event?.title || "Программа мероприятия"}</h1>
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
                  <div className="text-sm text-gray-500">{item.duration} мин</div>
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
        />
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          templates={templates}
          currentEventType={event?.type}
          onClose={() => setShowTemplateModal(false)}
          onApply={handleApplyTemplate}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleDeleteItem}
        title="Удалить пункт?"
        description="Пункт программы будет удалён"
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function ProgramItemRow({
  item,
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
}: {
  item: ProgramItem;
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
}) {
  const [editData, setEditData] = useState({
    startTime: item.startTime,
    title: item.title,
    description: item.description || "",
    responsible: item.responsible || "",
    duration: item.duration,
  });

  if (isEditing) {
    return (
      <div className={cn("px-4 py-3 bg-secondary/30", className)}>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-2">
            <input
              type="time"
              value={editData.startTime}
              onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
              className="input text-sm"
            />
          </div>
          <div className="col-span-3">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="input text-sm"
              placeholder="Название"
            />
          </div>
          <div className="col-span-3">
            <input
              type="text"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="input text-sm"
              placeholder="Описание"
            />
          </div>
          <div className="col-span-2">
            <input
              type="text"
              value={editData.responsible}
              onChange={(e) => setEditData({ ...editData, responsible: e.target.value })}
              className="input text-sm"
              placeholder="Ответственный"
            />
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
        "flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors group cursor-move",
        isDragging && "opacity-50 bg-secondary/30",
        isDragOver && "border-t-2 border-primary",
        className
      )}
    >
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
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          {item.responsible}
        </div>
      )}
      {item.duration > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {item.duration} мин
        </div>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          title="Редактировать"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AddProgramItemModal({
  onClose,
  onAdd,
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
}) {
  const [startTime, setStartTime] = useState("18:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("");
  const [duration, setDuration] = useState("30");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime) {
      toast.error("Укажите время и название");
      return;
    }
    onAdd({
      startTime,
      title: title.trim(),
      description: description.trim() || undefined,
      responsible: responsible.trim() || undefined,
      duration: parseInt(duration) || 30,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="Добавить пункт программы">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Время начала *</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Длительность (мин)</label>
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
          <label className="block text-sm font-medium mb-1.5">Название *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Бата, Первый танец, Торт..."
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Описание</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder="Дополнительная информация"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Ответственный</label>
          <input
            type="text"
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            className="input"
            placeholder="Ведущий, DJ, Ресторан..."
          />
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            Отмена
          </button>
          <button type="submit" className="btn-primary btn-md">
            Добавить
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
}: {
  templates: ProgramTemplate[];
  currentEventType?: string;
  onClose: () => void;
  onApply: (eventType: string) => void;
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
      title="Выбрать шаблон"
      description="Шаблон заменит текущую программу"
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
                <div className="font-medium">{label.ru}</div>
                <div className="text-sm text-muted-foreground">
                  {template.itemCount} пунктов программы
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
          Отмена
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={isApplying}
          className="btn-primary btn-md"
        >
          {isApplying ? "Применение..." : "Применить шаблон"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
