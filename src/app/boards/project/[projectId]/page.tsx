"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { authRequest } from "@/lib/auth";
import SharedLayout from "@/components/layouts/SharedLayout";
import { TaskModal } from "@/components/modals/TaskModal";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  column_id: number;
  position?: number;
  due_date?: string | null;
  priority?: string | null;
  completed?: boolean;
};

type Column = {
  id: number;
  name: string;
  position: number;
  tasks?: Task[];
};

type Board = {
  id: number;
  name: string;
  color?: string;
  description?: string | null;
  columns?: Column[];
};

const renderPriorityBadge = (p?: string | null) => {
  const label = p ? String(p).charAt(0).toUpperCase() + String(p).slice(1) : "No priority";
  const base = "inline-block px-2 py-0.5 rounded text-xs font-semibold";
  if (!p) return <span className={`${base} bg-gray-100 text-gray-700`}>{label}</span>;

  if (p === "low") return <span className={`${base} bg-green-100 text-green-800`}>{label}</span>;
  if (p === "medium") return <span className={`${base} bg-yellow-100 text-yellow-800`}>{label}</span>;
  if (p === "high") return <span className={`${base} bg-red-100 text-red-800`}>{label}</span>;

  return <span className={`${base} bg-gray-100 text-gray-700`}>{label}</span>;
};

// Sortable Column Component
function SortableColumn({
  column,
  boardId,
  sensors,
  onRename,
  onDelete,
  onAddTask,
  onViewTask,
}: {
  column: Column;
  boardId: number;
  sensors: any;
  onRename: (boardId: number, columnId: number, currentName: string) => void;
  onDelete: (boardId: number, columnId: number) => void;
  onAddTask: (boardId: number, columnId: number) => void;
  onViewTask: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-50 p-5 rounded-lg shadow-sm border">
      {/* Column Header with Drag Handle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
            title="Drag to reorder"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div>
            <h3 className="font-semibold text-lg">{column.name}</h3>
            <p className="text-sm text-gray-500">
              Position: {column.position} | Tasks: {column.tasks?.length || 0}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onRename(boardId, column.id, column.name)}
            className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
          >
            Rename
          </button>

          <button
            onClick={() => onDelete(boardId, column.id)}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3 mb-4">
        {column.tasks && column.tasks.length > 0 ? (
          <SortableContext items={[...column.tasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((t) => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {column.tasks
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((task) => (
                  <SortableTask key={task.id} task={task} onViewTask={onViewTask} />
                ))}
            </div>
          </SortableContext>
        ) : (
          <p className="text-gray-400 text-sm">No tasks.</p>
        )}
      </div>

      {/* Add Task Button */}
      <button
        onClick={() => onAddTask(boardId, column.id)}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Add Task
      </button>
    </div>
  );
}

// Sortable Task Component
function SortableTask({ task, onViewTask }: { task: Task; onViewTask: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 rounded shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3"
      onClick={() => onViewTask(task)}
    >
      {/* Drag handle only - attach listeners/attributes here so clicking the card doesn't start drag */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        title="Drag task"
        aria-label="Drag task"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>

      <div className="flex-1">
        <h4 className={`${task.completed ? 'font-medium line-through text-gray-400' : 'font-medium'}`}>{task.title}</h4>
        <div className="flex items-center justify-between gap-2">
          <div>
            {task.due_date ? (
              <p className="text-sm text-gray-500">Due: {new Date(task.due_date).toLocaleString()}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No due date</p>
            )}
          </div>
          <div>{renderPriorityBadge(task.priority)}</div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectBoardsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId;

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Edit board modal
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("");

  // Create task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [taskDueDate, setTaskDueDate] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );

  // View task modal
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("medium");
  const [editTaskCompleted, setEditTaskCompleted] = useState(false);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!projectId) return;

    const fetchBoards = async () => {
      try {
        const data = await authRequest<Board[]>({
          method: "get",
          url: `/boards/project/${projectId}`,
        });

        const boardsWithColumns = await Promise.all(
          data.map(async (board) => {
            try {
              const columns = await authRequest<Column[]>({
                method: "get",
                url: `/columns/${board.id}`,
              });

              const columnsWithTasks = await Promise.all(
                columns.map(async (col) => {
                  const tasks = await authRequest<Task[]>({
                    method: "get",
                    url: `/tasks/${col.id}`,
                  });
                  return { ...col, tasks };
                })
              );

              return { ...board, columns: columnsWithTasks };
            } catch {
              return { ...board, columns: [] };
            }
          })
        );

        setBoards(boardsWithColumns);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch boards");
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [projectId]);

  const handleDragStart = useCallback((event: any) => {
    const activeId = String(event.active.id);
    if (!activeId.startsWith("task-")) {
      setActiveDragTask(null);
      return;
    }
    const taskId = Number(activeId.replace("task-", ""));
    // find the task in boards
    for (const b of boards) {
      for (const c of b.columns ?? []) {
        const t = c.tasks?.find((x) => x.id === taskId);
        if (t) {
          setActiveDragTask(t);
          return;
        }
      }
    }
    setActiveDragTask(null);
  }, [boards]);

  const handleDragEnd = async (event: DragEndEvent, boardId: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const board = boards.find((b) => b.id === boardId);
    if (!board || !board.columns) return;

    // Use the same sorted order as rendered to compute indices
    const sorted = [...board.columns].sort((a, b) => a.position - b.position);
    const oldIndex = sorted.findIndex((col) => col.id === active.id);
    const newIndex = sorted.findIndex((col) => col.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedSorted = arrayMove(sorted, oldIndex, newIndex);

    // Recompute positions based on new visual order
    const updatedWithPositions = reorderedSorted.map((col, idx) => ({
      ...col,
      position: idx + 1,
    }));

    // Merge back into original board.columns by id (in case backend expects position field)
    const updatedColumnsById = new Map(updatedWithPositions.map((c) => [c.id, c]));
    const mergedColumns = board.columns.map((c) => updatedColumnsById.get(c.id) ?? c);

    // Optimistically update UI
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, columns: mergedColumns } : b))
    );

    try {
      // Persist new position for the moved column
      await authRequest({
        method: "put",
        url: `/columns/${active.id}/reorder`,
        data: { new_position: newIndex + 1 },
      });

      // Optionally, refresh columns to ensure consistency
      const refreshed = await authRequest<Column[]>({ method: "get", url: `/columns/${boardId}` });
      const columnsWithTasks = await Promise.all(
        refreshed.map(async (col) => {
          const tasks = await authRequest<Task[]>({ method: "get", url: `/tasks/${col.id}` });
          return { ...col, tasks };
        })
      );

      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, columns: columnsWithTasks } : b))
      );
    } catch (err) {
      console.warn("Reorder request failed; keeping optimistic order.", err);

      // Optionally refresh data silently to resync if backend updated
      const original = await authRequest<Column[]>({ method: "get", url: `/columns/${boardId}` });
      const columnsWithTasks = await Promise.all(
        original.map(async (col) => {
          const tasks = await authRequest<Task[]>({ method: "get", url: `/tasks/${col.id}` });
          return { ...col, tasks };
        })
      );

      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, columns: columnsWithTasks } : b))
      );
    }
  };

  // Unified handler: deduce board from active item and delegate
  const handleUnifiedDragEnd = async (event: DragEndEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    let board: Board | undefined;

    if (activeId.startsWith("task-")) {
      const taskId = Number(activeId.replace("task-", ""));
      board = boards.find((b) => b.columns?.some((c) => c.tasks?.some((t) => t.id === taskId)));
    } else {
      const maybeColId = Number(active.id as any);
      if (!isNaN(maybeColId)) {
        board = boards.find((b) => b.columns?.some((c) => c.id === maybeColId));
      }
    }

    if (!board) {
      setActiveDragTask(null);
      return;
    }

    if (activeId.startsWith("task-")) {
      await handleTaskDragEnd(event, board.id);
    } else {
      await handleDragEnd(event, board.id);
    }

    setActiveDragTask(null);
  };

  // Task drag end handler (supports moving between columns)
  const handleTaskDragEnd = async (event: DragEndEvent, boardId: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    if (!activeId.startsWith("task-")) return; // only handle tasks here
    const taskId = Number(activeId.replace("task-", ""));

    const board = boards.find((b) => b.id === boardId);
    if (!board || !board.columns) return;

    // Find source column and indexes
    const sourceColumn = board.columns.find((c) => c.tasks?.some((t) => t.id === taskId));
    if (!sourceColumn) return;
    const sourceTasks = [...(sourceColumn.tasks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const oldIndex = sourceTasks.findIndex((t) => t.id === taskId);
    if (oldIndex === -1) return;

    // Determine destination column and index
    const overId = String(over.id);
    let destColumnId: number | null = null;
    let destIndex = 0;

    if (overId.startsWith("task-")) {
      const overTaskId = Number(overId.replace("task-", ""));
      const destColumn = board.columns.find((c) => c.tasks?.some((t) => t.id === overTaskId));
      if (!destColumn) return;
      destColumnId = destColumn.id;
      const destTasks = [...(destColumn.tasks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      destIndex = destTasks.findIndex((t) => t.id === overTaskId);
      if (destIndex === -1) destIndex = destTasks.length;
    } else {
      // dropped on a column area - try to parse numeric id
      const parsed = Number(overId.replace("column-", ""));
      if (!isNaN(parsed) && parsed > 0 && board.columns.some((c) => c.id === parsed)) {
        destColumnId = parsed;
        const destCol = board.columns.find((c) => c.id === destColumnId)!;
        const destTasks = [...(destCol.tasks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        destIndex = destTasks.length; // append
      } else {
        const num = Number(overId);
        if (!isNaN(num) && board.columns.some((c) => c.id === num)) {
          destColumnId = num;
          const destCol = board.columns.find((c) => c.id === destColumnId)!;
          const destTasks = [...(destCol.tasks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          destIndex = destTasks.length;
        } else {
          return;
        }
      }
    }

    if (destColumnId === null) return;

    // Moving within same column
    if (sourceColumn.id === destColumnId) {
      const col = sourceColumn;
      const sorted = [...(col.tasks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      const newIndex = destIndex;
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sorted, oldIndex, newIndex);
      const updatedWithPositions = reordered.map((t, idx) => ({ ...t, position: idx + 1 }));

      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId
            ? {
                ...b,
                columns: b.columns?.map((c) => (c.id === col.id ? { ...c, tasks: updatedWithPositions } : c)),
              }
            : b
        )
      );

      try {
        await authRequest({ method: "put", url: `/tasks/update/${taskId}`, data: { position: newIndex + 1, column_id: col.id } });
        const refreshed = await authRequest<Task[]>({ method: "get", url: `/tasks/${col.id}` });
        setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, columns: b.columns?.map((c) => (c.id === col.id ? { ...c, tasks: refreshed } : c)) } : b)));
      } catch (err) {
        console.error("Failed to persist task reorder", err);
        const original = await authRequest<Task[]>({ method: "get", url: `/tasks/${col.id}` });
        setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, columns: b.columns?.map((c) => (c.id === col.id ? { ...c, tasks: original } : c)) } : b)));
      }

      return;
    }

    // Moving across columns
    const destCol = board.columns.find((c) => c.id === destColumnId)!;

    const sourceTasksCopy = [...(sourceColumn.tasks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const destTasksCopy = [...(destCol.tasks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Remove from source
    const [moved] = sourceTasksCopy.splice(oldIndex, 1);
    // Insert into dest at destIndex
    const insertIndex = destIndex >= 0 ? destIndex : destTasksCopy.length;
    destTasksCopy.splice(insertIndex, 0, moved);

    const updatedSource = sourceTasksCopy.map((t, idx) => ({ ...t, position: idx + 1 }));
    const updatedDest = destTasksCopy.map((t, idx) => ({ ...t, position: idx + 1 }));

    setBoards((prev) =>
      prev.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns?.map((c) => {
                if (c.id === sourceColumn.id) return { ...c, tasks: updatedSource };
                if (c.id === destCol.id) return { ...c, tasks: updatedDest };
                return c;
              }),
            }
          : b
      )
    );

    try {
      await authRequest({ method: "put", url: `/tasks/update/${taskId}`, data: { column_id: destCol.id, position: insertIndex + 1 } });

      // Refresh both columns to ensure consistency
      const [refSource, refDest] = await Promise.all([
        authRequest<Task[]>({ method: "get", url: `/tasks/${sourceColumn.id}` }),
        authRequest<Task[]>({ method: "get", url: `/tasks/${destCol.id}` }),
      ]);

      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId
            ? {
                ...b,
                columns: b.columns?.map((c) => {
                  if (c.id === sourceColumn.id) return { ...c, tasks: refSource };
                  if (c.id === destCol.id) return { ...c, tasks: refDest };
                  return c;
                }),
              }
            : b
        )
      );
    } catch (err) {
      console.error("Failed to move task", err);
      // Re-fetch affected columns to revert
      const [origSource, origDest] = await Promise.all([
        authRequest<Task[]>({ method: "get", url: `/tasks/${sourceColumn.id}` }),
        authRequest<Task[]>({ method: "get", url: `/tasks/${destCol.id}` }),
      ]);
      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId
            ? {
                ...b,
                columns: b.columns?.map((c) => {
                  if (c.id === sourceColumn.id) return { ...c, tasks: origSource };
                  if (c.id === destCol.id) return { ...c, tasks: origDest };
                  return c;
                }),
              }
            : b
        )
      );
    }
  };

  const handleAddColumn = (boardId: number) => {
    router.push(`/columns/create?boardId=${boardId}&projectId=${projectId}`);
  };

  const handleOpenTaskModal = (boardId: number, columnId: number) => {
    setSelectedBoardId(boardId);
    setSelectedColumnId(columnId);
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate(new Date().toISOString().slice(0, 16));
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !selectedColumnId) {
      alert("Please enter a task title");
      return;
    }

    if (!taskDueDate) {
      alert("Please select a due date");
      return;
    }

    try {
      const newTask = await authRequest<Task>({
        method: "post",
        url: `/tasks/create`,
        data: {
          title: taskTitle,
          description: taskDescription,
          column_id: selectedColumnId,
          due_date: new Date(taskDueDate).toISOString(),
        },
      });

      setBoards((prev) =>
        prev.map((board) =>
          board.id === selectedBoardId
            ? {
                ...board,
                columns: board.columns?.map((col) =>
                  col.id === selectedColumnId
                    ? { ...col, tasks: [...(col.tasks || []), newTask] }
                    : col
                ),
              }
            : board
        )
      );

      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setSelectedColumnId(null);
      setSelectedBoardId(null);
      setTaskDueDate(new Date().toISOString().slice(0, 16));
    } catch (err) {
      console.error(err);
      alert("Failed to create task");
    }
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
  };

  const handleStartEditTask = () => {
    if (!viewingTask) return;
    setIsEditingTask(true);
    setEditTaskTitle(viewingTask.title);
    setEditTaskDescription(viewingTask.description ?? "");
    setEditTaskPriority(viewingTask.priority ?? "medium");
    setEditTaskCompleted(!!viewingTask.completed);
  };

  const handleCancelEditTask = () => {
    setIsEditingTask(false);
    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskPriority("medium");
    setEditTaskCompleted(false);
  };

  const handleSaveTask = async () => {
    if (!viewingTask) return;

    try {
      const updated = await authRequest<Task>({
        method: "put",
        url: `/tasks/update/${viewingTask.id}`,
        data: {
          title: editTaskTitle,
          description: editTaskDescription,
          priority: editTaskPriority,
          completed: editTaskCompleted,
        },
      });

      // Update local state
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          columns: board.columns?.map((col) => ({
            ...col,
            tasks: col.tasks?.map((t) => (t.id === updated.id ? updated : t)),
          })),
        }))
      );

      setViewingTask(updated);
      setIsEditingTask(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update task");
    }
  };

  const handleToggleComplete = async () => {
    if (!viewingTask) return;

    try {
      const updated = await authRequest<Task>({
        method: "put",
        url: `/tasks/update/${viewingTask.id}`,
        data: {
          completed: !viewingTask.completed,
        },
      });

      // Update local boards state
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          columns: board.columns?.map((col) => ({
            ...col,
            tasks: col.tasks?.map((t) => (t.id === updated.id ? updated : t)),
          })),
        }))
      );

      setViewingTask(updated);
    } catch (err) {
      console.error(err);
      alert("Failed to update completed status");
    }
  };

  const handleDeleteTask = async () => {
    if (!viewingTask) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await authRequest({ method: "delete", url: `/tasks/${viewingTask.id}` });

      // Remove from local state
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          columns: board.columns?.map((col) => ({
            ...col,
            tasks: col.tasks?.filter((t) => t.id !== viewingTask.id),
          })),
        }))
      );

      setViewingTask(null);
      setIsEditingTask(false);
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  };

  const handleRenameColumn = async (
    boardId: number,
    columnId: number,
    currentName: string
  ) => {
    const newName = prompt("Enter new column name:", currentName);
    if (!newName) return;

    try {
      await authRequest({
        method: "put",
        url: `/columns/${columnId}`,
        data: {
          name: newName,
          board_id: boardId,
        },
      });

      setBoards((prev) =>
        prev.map((board) =>
          board.id === boardId
            ? {
                ...board,
                columns: board.columns?.map((col) =>
                  col.id === columnId ? { ...col, name: newName } : col
                ),
              }
            : board
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to rename column");
    }
  };

  const handleDeleteColumn = async (boardId: number, columnId: number) => {
    if (!confirm("Are you sure you want to delete this column?")) return;

    try {
      await authRequest({ method: "delete", url: `/columns/${columnId}` });

      const updatedColumns = await authRequest<Column[]>({
        method: "get",
        url: `/columns/${boardId}`,
      });

      const columnsWithTasks = await Promise.all(
        updatedColumns.map(async (col) => {
          const tasks = await authRequest<Task[]>({
            method: "get",
            url: `/tasks/${col.id}`,
          });
          return { ...col, tasks };
        })
      );

      setBoards((prev) =>
        prev.map((board) =>
          board.id === boardId ? { ...board, columns: columnsWithTasks } : board
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete column");
    }
  };

  const handleDeleteBoard = async (boardId: number) => {
    if (!confirm("Are you sure you want to delete this board?")) return;

    try {
      await authRequest({
        method: "delete",
        url: `/boards/${boardId}/project/${projectId}`,
      });

      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete board");
    }
  };
  
  const handleDownloadPdfForBoard = async (boardId: number) => {
    const pid = Array.isArray(projectId) ? projectId[0] : projectId;
    if (!pid) return;
    setDownloadingPdf(true);
    try {
      const data = await authRequest<Blob>({
        method: "get",
        url: `/projects/pdf/${pid}?board_id=${boardId}`,
        responseType: "blob",
      });

      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      let projectTitle = await getProjectTitle(pid.toString());
      a.download = `project_${projectTitle.toString().replace(/\s+/g, "_")}_board_${boardId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF for board", err);
      alert("Failed to download PDF for board");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsvForBoard = async (boardId: number) => {
    const pid = Array.isArray(projectId) ? projectId[0] : projectId;
    if (!pid) return;
    setDownloadingCsv(true);
    try {
      const data = await authRequest<Blob>({
        method: "get",
        url: `/projects/csv/${pid}?board_id=${boardId}`,
        responseType: "blob",
      });

      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const projectTitle = await getProjectTitle(pid.toString());
      a.download = `${projectTitle.toString().replace(/\s+/g, "_")}_board_${boardId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download CSV for board", err);
      alert("Failed to export CSV for board");
    } finally {
      setDownloadingCsv(false);
    }
  };
  const getProjectTitle = async (id: string): Promise<string> => {
    // Fetch project info from backend and return its name for filename.
    try {
      const project = await authRequest<any>({ method: "get", url: `/projects/${id}` });
      if (project && project.name) return project.name;
      console.warn("Project fetched but name missing, falling back to id", id);
      return `project_${id}`;
    } catch (err) {
      console.error("Failed to fetch project title", err);
      return `project_${id}`;
    }
  };

  const handleDownloadPdf = async () => {
    const pid = Array.isArray(projectId) ? projectId[0] : projectId;
    if (!pid) return;
    setDownloadingPdf(true);
    try {
      const data = await authRequest<Blob>({
        method: "get",
        url: `/projects/pdf/${pid}`,
        responseType: "blob",
      });

      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      let projectTitle = await getProjectTitle(pid.toString());
      a.download = `Project_${projectTitle.toString().replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    const pid = Array.isArray(projectId) ? projectId[0] : projectId;
    if (!pid) return;
    setDownloadingCsv(true);
    try {
      const data = await authRequest<Blob>({
        method: "get",
        url: `/projects/csv/${pid}`,
        responseType: "blob",
      });

      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const projectTitle = await getProjectTitle(pid.toString());
      a.download = `${projectTitle.toString().replace(/\s+/g, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download CSV", err);
      alert("Failed to export CSV");
    } finally {
      setDownloadingCsv(false);
    }
  };

  const openEditModal = (board: Board) => {
    setEditingBoard(board);
    setEditName(board.name);
    setEditDescription(board.description ?? "");
    setEditColor(board.color ?? "#f3f4f6");
  };

  const handleSaveBoard = async () => {
    if (!editingBoard) return;

    try {
      await authRequest({
        method: "put",
        url: `/boards/update/${editingBoard.id}`,
        data: {
          name: editName,
          description: editDescription,
          color: editColor,
        },
      });

      setBoards((prev) =>
        prev.map((b) =>
          b.id === editingBoard.id
            ? {
                ...b,
                name: editName,
                description: editDescription,
                color: editColor,
              }
            : b
        )
      );

      setEditingBoard(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update board");
    }
  };

  return (
    <SharedLayout>
      {/* EDIT BOARD MODAL */}
      {editingBoard && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Edit Board</h2>

            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2 mb-3 border rounded"
            />

            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full p-2 mb-3 border rounded"
            />

            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="w-16 h-10 mb-4 cursor-pointer"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingBoard(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveBoard}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create Task</h2>

            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full p-2 mb-3 border rounded"
              placeholder="Enter task title"
            />

            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
              rows={4}
              placeholder="Enter task description (optional)"
            />

            <label className="block text-sm font-medium mb-1">Due date</label>
            <input
              type="datetime-local"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setTaskTitle("");
                  setTaskDescription("");
                  setSelectedColumnId(null);
                  setSelectedBoardId(null);
                  setTaskDueDate(new Date().toISOString().slice(0, 16));
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TASK MODAL */}
      <TaskModal
        task={viewingTask}
        isOpen={!!viewingTask}
        isEditing={isEditingTask}
        editTaskTitle={editTaskTitle}
        editTaskDescription={editTaskDescription}
        editTaskPriority={editTaskPriority}
        editTaskCompleted={editTaskCompleted}
        onClose={() => setViewingTask(null)}
        onStartEdit={handleStartEditTask}
        onCancelEdit={handleCancelEditTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        onTitleChange={setEditTaskTitle}
        onDescriptionChange={setEditTaskDescription}
        onPriorityChange={setEditTaskPriority}
        onCompletedChange={setEditTaskCompleted}
      />

      {/* PAGE CONTENT */}
      <div className="max-w-7xl mx-auto mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Boards</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {downloadingPdf ? "Downloading..." : "Export as PDF"}
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={downloadingCsv}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {downloadingCsv ? "Exporting..." : "Export CSV"}
            </button>

            <button
              onClick={() => router.push(`/boards/create/project/${projectId}`)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + Create Board
            </button>
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="space-y-10">
            {boards.length > 0 ? (
              boards.map((board) => (
                <div
                  key={board.id}
                  className="p-6 rounded-2xl shadow"
                  style={{
                    background: `linear-gradient(to right, #ffffff, ${
                      board.color ?? "#f3f4f6"
                    })`,
                  }}
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold">{board.name}</h2>
                      <p className="text-slate-600">{board.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadPdfForBoard(board.id)}
                        className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                      >
                        PDF
                      </button>

                      <button
                        onClick={() => handleDownloadCsvForBoard(board.id)}
                        className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
                      >
                        CSV
                      </button>

                      <button
                        onClick={() => openEditModal(board)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteBoard(board.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* COLUMNS WITH DRAG AND DROP */}
                  {board.columns?.length ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleUnifiedDragEnd}
                    >
                      <SortableContext
                        // Ensure items reflect the same order used for rendering
                        items={[...board.columns].sort((a, b) => a.position - b.position).map((col) => col.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                          {board.columns
                            .sort((a, b) => a.position - b.position)
                            .map((col) => (
                              <SortableColumn
                                key={col.id}
                                column={col}
                                boardId={board.id}
                                sensors={sensors}
                                onRename={handleRenameColumn}
                                onDelete={handleDeleteColumn}
                                onAddTask={handleOpenTaskModal}
                                onViewTask={handleViewTask}
                              />
                            ))}
                        </div>
                      </SortableContext>

                      <DragOverlay>
                        {activeDragTask ? (
                          <div className="bg-white p-3 rounded shadow-md border w-80">
                            <h4 className={`${activeDragTask.completed ? 'font-medium line-through text-gray-400' : 'font-medium'}`}>{activeDragTask.title}</h4>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <div>
                                {activeDragTask.due_date ? (
                                  <p className="text-sm text-gray-500">Due: {new Date(activeDragTask.due_date).toLocaleString()}</p>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">No due date</p>
                                )}
                              </div>
                              <div>{renderPriorityBadge(activeDragTask.priority)}</div>
                            </div>
                          </div>
                        ) : null}
                      </DragOverlay>

                    </DndContext>
                  ) : (
                    <p className="mb-6">No columns found.</p>
                  )}

                  <button
                    onClick={() => handleAddColumn(board.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    + Add Column
                  </button>
                </div>
              ))
            ) : (
              <p>No boards found.</p>
            )}
          </div>
        )}
      </div>
    </SharedLayout>
  );
}