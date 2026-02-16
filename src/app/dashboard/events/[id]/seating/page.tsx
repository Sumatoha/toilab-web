"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Users,
  Circle,
  Square,
  RectangleHorizontal,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  UserPlus,
  UserMinus,
  GripVertical,
  Theater,
} from "lucide-react";
import { seating, guests as guestsApi } from "@/lib/api";
import {
  TableWithGuests,
  SeatingStats,
  Guest,
  TableShape,
  CreateTableRequest,
} from "@/lib/types";
import { PageLoader, Modal, ModalFooter } from "@/components/ui";
import { cn, formatTableName } from "@/lib/utils";
import toast from "react-hot-toast";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const DEFAULT_TABLE_SIZE = 100;

const tableShapeIcons: Record<TableShape, typeof Circle> = {
  round: Circle,
  rect: RectangleHorizontal,
  square: Square,
  oval: Circle,
  scene: Theater,
};

export default function SeatingPage() {
  const params = useParams();
  const eventId = params.id as string;
  const canvasRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [tables, setTables] = useState<TableWithGuests[]>([]);
  const [unseatedGuests, setUnseatedGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<SeatingStats | null>(null);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Drag state using refs to avoid stale closure issues
  const draggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  // Global mouse up listener to handle drag end even outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = async () => {
      if (draggingRef.current) {
        const tableId = draggingRef.current;
        draggingRef.current = null;
        setIsDragging(false);

        // Get the latest table position from state
        setTables((currentTables) => {
          const table = currentTables.find((t) => t.id === tableId);
          if (table) {
            // Save position to backend (fire and forget)
            seating.updateTable(eventId, tableId, {
              positionX: table.positionX,
              positionY: table.positionY,
            }).catch((error) => {
              console.error("Failed to save position:", error);
            });
          }
          return currentTables;
        });
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [eventId]);

  async function loadData() {
    try {
      const [tablesData, statsData, guestsData] = await Promise.all([
        seating.getTablesWithGuests(eventId),
        seating.getStats(eventId),
        guestsApi.list(eventId),
      ]);
      setTables(tablesData || []);
      setStats(statsData);

      // Calculate unseated guests
      const seatedGuestIds = new Set<string>();
      (tablesData || []).forEach((t) => t.guestIds.forEach((id) => seatedGuestIds.add(id)));
      const unseated = (guestsData || []).filter(
        (g) => g.rsvpStatus === "accepted" && !seatedGuestIds.has(g.id)
      );
      setUnseatedGuests(unseated);
    } catch (error) {
      console.error("Failed to load seating data:", error);
      toast.error("Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateTable = async (data: CreateTableRequest) => {
    try {
      const table = await seating.createTable(eventId, data);
      setTables((prev) => [
        ...prev,
        { ...table, guests: [] },
      ]);
      setShowCreateModal(false);
      toast.success(data.shape === "scene" ? "Сцена создана" : "Стол создан");
      loadData();
    } catch {
      toast.error("Не удалось создать");
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    try {
      await seating.deleteTable(eventId, tableId);
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      setSelectedTable(null);
      toast.success(table?.shape === "scene" ? "Сцена удалена" : "Стол удалён");
      loadData();
    } catch {
      toast.error("Не удалось удалить");
    }
  };

  const handleAssignGuest = async (tableId: string, guestId: string) => {
    try {
      await seating.assignGuest(eventId, tableId, guestId);
      toast.success("Гость добавлен");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить гостя");
    }
  };

  const handleRemoveGuest = async (tableId: string, guestId: string) => {
    try {
      await seating.removeGuest(eventId, tableId, guestId);
      toast.success("Гость удалён со стола");
      loadData();
    } catch {
      toast.error("Не удалось удалить гостя");
    }
  };

  const handleTableMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    draggingRef.current = tableId;
    setIsDragging(true);
    setSelectedTable(tableId);
    dragOffsetRef.current = {
      x: (e.clientX - rect.left) / zoom - table.positionX,
      y: (e.clientY - rect.top) / zoom - table.positionY,
    };
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const tableId = draggingRef.current;
      const newX = Math.max(
        0,
        Math.min(CANVAS_WIDTH - DEFAULT_TABLE_SIZE, (e.clientX - rect.left) / zoom - dragOffsetRef.current.x)
      );
      const newY = Math.max(
        0,
        Math.min(CANVAS_HEIGHT - DEFAULT_TABLE_SIZE, (e.clientY - rect.top) / zoom - dragOffsetRef.current.y)
      );

      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId ? { ...t, positionX: newX, positionY: newY } : t
        )
      );
    },
    [zoom]
  );

  const handleGuestDragStart = (e: React.DragEvent, guest: Guest) => {
    e.dataTransfer.setData("guestId", guest.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTableDrop = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("guestId");
    if (guestId) {
      await handleAssignGuest(tableId, guestId);
    }
  };

  const handleTableDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const selectedTableData = tables.find((t) => t.id === selectedTable);
  const isSelectedScene = selectedTableData?.shape === "scene";

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Рассадка гостей</h1>
          <p className="text-muted-foreground">
            {stats?.seatedGuests || 0} из {(stats?.seatedGuests || 0) + (stats?.unseatedGuests || 0)} гостей рассажены
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="btn-ghost btn-sm"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="btn-ghost btn-sm"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="btn-ghost btn-sm"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary btn-md">
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Canvas */}
        <div className="flex-1 bg-secondary/50 rounded-lg overflow-auto relative">
          <div
            ref={canvasRef}
            className={cn(
              "relative select-none",
              isDragging ? "cursor-grabbing" : "cursor-default"
            )}
            style={{
              width: CANVAS_WIDTH * zoom,
              height: CANVAS_HEIGHT * zoom,
              backgroundImage: `
                linear-gradient(to right, var(--border) 1px, transparent 1px),
                linear-gradient(to bottom, var(--border) 1px, transparent 1px)
              `,
              backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
            }}
            onMouseMove={handleCanvasMouseMove}
            onClick={() => setSelectedTable(null)}
          >
            {tables.map((table) => (
              <TableElement
                key={table.id}
                table={table}
                zoom={zoom}
                isSelected={selectedTable === table.id}
                isDragging={draggingRef.current === table.id}
                onMouseDown={(e) => handleTableMouseDown(e, table.id)}
                onDrop={(e) => handleTableDrop(e, table.id)}
                onDragOver={handleTableDragOver}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          {/* Selected table info */}
          {selectedTableData && (
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {formatTableName(selectedTableData.number, selectedTableData.name, isSelectedScene)}
                </h3>
                <button
                  onClick={() => handleDeleteTable(selectedTableData.id)}
                  className="btn-ghost btn-sm text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {!isSelectedScene && (
                <>
                  <div className="text-sm text-muted-foreground">
                    {selectedTableData.guests.length} / {selectedTableData.capacity} мест
                  </div>
                  <div className="space-y-2">
                    {selectedTableData.guests.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                      >
                        <span className="text-sm">{guest.name}</span>
                        <button
                          onClick={() => handleRemoveGuest(selectedTableData.id, guest.id)}
                          className="btn-ghost btn-sm text-red-600"
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {selectedTableData.guests.length < selectedTableData.capacity && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="btn-ghost btn-sm w-full"
                    >
                      <UserPlus className="w-4 h-4" />
                      Добавить гостя
                    </button>
                  )}
                </>
              )}
              {isSelectedScene && (
                <div className="text-sm text-muted-foreground">
                  Сцена / декорация
                </div>
              )}
            </div>
          )}

          {/* Unseated guests */}
          <div className="card p-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Нераспределённые</h3>
              <span className="badge-default text-xs">{unseatedGuests.length}</span>
            </div>
            <div className="flex-1 overflow-auto space-y-1">
              {unseatedGuests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Все гости рассажены
                </p>
              ) : (
                unseatedGuests.map((guest) => (
                  <div
                    key={guest.id}
                    draggable
                    onDragStart={(e) => handleGuestDragStart(e, guest)}
                    className="flex items-center gap-2 p-2 bg-secondary rounded-lg cursor-grab hover:bg-secondary/80 transition-colors"
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm flex-1">{guest.name}</span>
                    {guest.plusCount > 0 && (
                      <span className="text-xs text-muted-foreground">+{guest.plusCount}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTable}
        tableCount={tables.length}
        nextTableNumber={Math.max(0, ...tables.filter(t => t.shape !== "scene").map(t => t.number)) + 1}
      />

      {/* Assign Guest Modal */}
      {selectedTableData && !isSelectedScene && (
        <AssignGuestModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onAssign={(guestId) => {
            handleAssignGuest(selectedTableData.id, guestId);
            setShowAssignModal(false);
          }}
          unseatedGuests={unseatedGuests}
          table={selectedTableData}
        />
      )}
    </div>
  );
}

interface TableElementProps {
  table: TableWithGuests;
  zoom: number;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}

function TableElement({
  table,
  zoom,
  isSelected,
  isDragging,
  onMouseDown,
  onDrop,
  onDragOver,
}: TableElementProps) {
  const isScene = table.shape === "scene";
  const isFull = !isScene && table.guests.length >= table.capacity;

  const getShape = () => {
    if (isScene) return "4px";
    if (table.shape === "round" || table.shape === "oval") return "50%";
    return "8px";
  };

  return (
    <div
      className={cn(
        "absolute cursor-grab transition-shadow",
        isSelected && "ring-2 ring-primary ring-offset-2",
        isDragging && "opacity-70 cursor-grabbing",
        isScene ? "bg-amber-100 border-amber-400" : isFull ? "bg-emerald-100" : "bg-white"
      )}
      style={{
        left: table.positionX * zoom,
        top: table.positionY * zoom,
        width: table.width * zoom,
        height: table.height * zoom,
        transform: `rotate(${table.rotation}deg)`,
        borderRadius: getShape(),
        border: isScene ? "2px dashed var(--amber-400)" : "2px solid var(--border)",
        boxShadow: isSelected ? undefined : "0 2px 4px rgba(0,0,0,0.1)",
      }}
      onMouseDown={onMouseDown}
      onDrop={isScene ? undefined : onDrop}
      onDragOver={isScene ? undefined : onDragOver}
    >
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center p-2"
        style={{ transform: `rotate(-${table.rotation}deg)` }}
      >
        {isScene ? (
          <>
            <Theater className="w-5 h-5 text-amber-600 mb-1" />
            <span className="font-medium text-sm truncate w-full text-amber-700">
              {formatTableName(table.number, table.name, true)}
            </span>
          </>
        ) : (
          <>
            <span className="font-medium text-sm truncate w-full">
              {formatTableName(table.number, table.name)}
            </span>
            <span className="text-xs text-muted-foreground">
              {table.guests.length}/{table.capacity}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTableRequest) => void;
  tableCount: number;
  nextTableNumber: number;
}

function CreateTableModal({ isOpen, onClose, onSubmit, tableCount, nextTableNumber }: CreateTableModalProps) {
  const [name, setName] = useState("");
  const [shape, setShape] = useState<TableShape>("round");
  const [capacity, setCapacity] = useState(8);

  const isScene = shape === "scene";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim() || undefined,
      shape,
      capacity: isScene ? 0 : capacity,
      positionX: 100 + (tableCount % 5) * 150,
      positionY: 100 + Math.floor(tableCount / 5) * 150,
      width: isScene ? 200 : DEFAULT_TABLE_SIZE,
      height: isScene ? 80 : DEFAULT_TABLE_SIZE,
    });
    setName("");
    setShape("round");
    setCapacity(8);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Добавить элемент">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Тип</label>
          <div className="grid grid-cols-5 gap-2">
            {(["round", "rect", "square", "oval", "scene"] as TableShape[]).map((s) => {
              const Icon = tableShapeIcons[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShape(s)}
                  className={cn(
                    "p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors",
                    shape === s
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">
                    {s === "round" && "Круг"}
                    {s === "rect" && "Прямоуг."}
                    {s === "square" && "Квадрат"}
                    {s === "oval" && "Овал"}
                    {s === "scene" && "Сцена"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!isScene && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <span className="text-sm text-primary font-medium">
              Будет создан: Стол {nextTableNumber}
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {isScene ? "Название" : "Название (необязательно)"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder={isScene ? "Сцена" : "Друзья, Родственники..."}
          />
          {!isScene && name && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Отображение: Стол {nextTableNumber}: {name}
            </p>
          )}
        </div>

        {!isScene && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Вместимость</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 8)}
              className="input"
              min={1}
              max={50}
            />
          </div>
        )}

        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-ghost btn-md">
            Отмена
          </button>
          <button type="submit" className="btn-primary btn-md">
            Создать
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

interface AssignGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (guestId: string) => void;
  unseatedGuests: Guest[];
  table: TableWithGuests;
}

function AssignGuestModal({
  isOpen,
  onClose,
  onAssign,
  unseatedGuests,
  table,
}: AssignGuestModalProps) {
  const [search, setSearch] = useState("");

  const filteredGuests = unseatedGuests.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Добавить гостя - ${formatTableName(table.number, table.name)}`}>
      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          placeholder="Поиск гостя..."
          autoFocus
        />

        <div className="max-h-64 overflow-auto space-y-1">
          {filteredGuests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет гостей для добавления
            </p>
          ) : (
            filteredGuests.map((guest) => (
              <button
                key={guest.id}
                onClick={() => onAssign(guest.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <span>{guest.name}</span>
                {guest.plusCount > 0 && (
                  <span className="text-sm text-muted-foreground">+{guest.plusCount}</span>
                )}
              </button>
            ))
          )}
        </div>

        <ModalFooter>
          <button onClick={onClose} className="btn-ghost btn-md">
            Закрыть
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
