"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authRequest } from "@/lib/auth";
import SharedLayout from "@/components/layouts/SharedLayout";
import {
  DndContext,
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  column_id: number;
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
  onRename,
  onDelete,
  onAddTask,
  onViewTask,
}: {
  column: Column;
  boardId: number;
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
          column.tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onViewTask(task)}
              className="bg-white p-3 rounded shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors"
            >
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
          ))
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

export default function ProjectBoardsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId;

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDragEnd = async (event: DragEndEvent, boardId: number) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const board = boards.find((b) => b.id === boardId);
    if (!board || !board.columns) return;

    const oldIndex = board.columns.findIndex((col) => col.id === active.id);
    const newIndex = board.columns.findIndex((col) => col.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update UI
    const reorderedColumns = arrayMove(board.columns, oldIndex, newIndex);
    
    setBoards((prev) =>
      prev.map((b) =>
        b.id === boardId ? { ...b, columns: reorderedColumns } : b
      )
    );

    // Send update to backend
    try {
      await authRequest({
        method: "put",
        url: `/columns/${active.id}/reorder`,
        data: {
          new_position: newIndex + 1,
        },
      });

      // Refetch to ensure consistency
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
        prev.map((b) =>
          b.id === boardId ? { ...b, columns: columnsWithTasks } : b
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to reorder column. Refreshing...");
      
      // Revert on error
      const originalColumns = await authRequest<Column[]>({
        method: "get",
        url: `/columns/${boardId}`,
      });

      const columnsWithTasks = await Promise.all(
        originalColumns.map(async (col) => {
          const tasks = await authRequest<Task[]>({
            method: "get",
            url: `/tasks/${col.id}`,
          });
          return { ...col, tasks };
        })
      );

      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId ? { ...b, columns: columnsWithTasks } : b
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
        url: `/tasks/${viewingTask.id}`,
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
        url: `/tasks/${viewingTask.id}`,
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
      {viewingTask && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Task Details</h2>
            {isEditingTask ? (
              <>
                <label className="block text-sm font-medium mb-2 text-gray-700">Title</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full p-2 mb-3 border rounded"
                />

                <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                <textarea
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="w-full p-2 mb-3 border rounded"
                  rows={4}
                />

                <label className="block text-sm font-medium mb-2 text-gray-700">Priority</label>
                <select
                  value={editTaskPriority}
                  onChange={(e) => setEditTaskPriority(e.target.value)}
                  className="w-full p-2 mb-3 border rounded"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <label className="inline-flex items-center gap-2 text-sm mb-4">
                  <input
                    type="checkbox"
                    checked={editTaskCompleted}
                    onChange={(e) => setEditTaskCompleted(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Completed</span>
                </label>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteTask}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEditTask}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSaveTask}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Title</label>
                  <p className="text-lg font-semibold">{viewingTask.title}</p>
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                  {viewingTask.description ? (
                    <p className="text-gray-600 whitespace-pre-wrap">{viewingTask.description}</p>
                  ) : (
                    <p className="text-gray-400 italic">No description provided</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Due date</label>
                  {viewingTask.due_date ? (
                    <p className="text-gray-600">{new Date(viewingTask.due_date).toLocaleString()}</p>
                  ) : (
                    <p className="text-gray-400 italic">No due date</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Priority</label>
                  <div>{renderPriorityBadge(viewingTask.priority)}</div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setViewingTask(null)}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Close
                    </button>

                    <button
                      onClick={handleToggleComplete}
                      className={`px-4 py-2 ${viewingTask.completed ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded`}
                    >
                      {viewingTask.completed ? 'Mark Incomplete' : 'Mark Completed'}
                    </button>

                    <button
                      onClick={handleStartEditTask}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={handleDeleteTask}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div className="max-w-7xl mx-auto mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Boards</h1>

          <button
            onClick={() => router.push(`/boards/create/project/${projectId}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Create Board
          </button>
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
                      onDragEnd={(event) => handleDragEnd(event, board.id)}
                    >
                      <SortableContext
                        items={board.columns.map((col) => col.id)}
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
                                onRename={handleRenameColumn}
                                onDelete={handleDeleteColumn}
                                onAddTask={handleOpenTaskModal}
                                onViewTask={handleViewTask}
                              />
                            ))}
                        </div>
                      </SortableContext>
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