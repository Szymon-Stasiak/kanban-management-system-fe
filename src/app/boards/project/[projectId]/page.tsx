"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authRequest } from "@/lib/auth";
import SharedLayout from "@/components/layouts/SharedLayout";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  column_id: number;
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

  // View task modal
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

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

              // fetch tasks for every column
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

  const handleAddColumn = (boardId: number) => {
    router.push(`/columns/create?boardId=${boardId}&projectId=${projectId}`);
  };

  const handleOpenTaskModal = (boardId: number, columnId: number) => {
    setSelectedBoardId(boardId);
    setSelectedColumnId(columnId);
    setTaskTitle("");
    setTaskDescription("");
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !selectedColumnId) {
      alert("Please enter a task title");
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
        },
      });

      // Update the boards state with the new task
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
    } catch (err) {
      console.error(err);
      alert("Failed to create task");
    }
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
  };

  const handleRenameColumn = async (
    boardId: number,
    columnId: number,
    currentName: string,
  ) => {
    const newName = prompt("Enter new column name:", currentName);
    if (!newName) return;

    try {
      await authRequest({
        method: "put",
        url: `/columns/${columnId}`,
        data: {
          name: newName,
          board_id: boardId
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

    // Refetch columns for this board to get updated positions
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
        board.id === boardId
          ? { ...board, columns: columnsWithTasks }
          : board
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

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setTaskTitle("");
                  setTaskDescription("");
                  setSelectedColumnId(null);
                  setSelectedBoardId(null);
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

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Title
              </label>
              <p className="text-lg font-semibold">{viewingTask.title}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Description
              </label>
              {viewingTask.description ? (
                <p className="text-gray-600 whitespace-pre-wrap">
                  {viewingTask.description}
                </p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingTask(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div className="max-w-5xl mx-auto mt-16">
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

                  {/* COLUMNS WITH TASKS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {board.columns?.length ? (
                        board.columns
                          .sort((a, b) => a.position - b.position)
                          .map((col) => (
                            <div
                              key={col.id}
                              className="bg-gray-50 p-5 rounded-lg shadow-sm border"
                            >
                          {/* Column Header */}
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {col.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Position: {col.position} | Tasks: {col.tasks?.length || 0}
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleRenameColumn(
                                        board.id,
                                        col.id,
                                        col.name
                                      )
                                    }
                                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                                  >
                                    Rename
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDeleteColumn(board.id, col.id)
                                    }
                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>

                          {/* TASKS LIST */}
                          <div className="space-y-3 mb-4">
                            {col.tasks && col.tasks.length > 0 ? (
                              col.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  onClick={() => handleViewTask(task)}
                                  className="bg-white p-3 rounded shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                  <h4 className="font-medium">{task.title}</h4>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-400 text-sm">
                                No tasks.
                              </p>
                            )}
                          </div>

                          {/* Add Task */}
                          <button
                            onClick={() => handleOpenTaskModal(board.id, col.id)}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            + Add Task
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No columns found.</p>
                    )}
                  </div>

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