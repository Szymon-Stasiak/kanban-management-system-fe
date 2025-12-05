import React from "react";

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

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  isEditing: boolean;
  editTaskTitle: string;
  editTaskDescription: string;
  editTaskPriority: string;
  editTaskCompleted: boolean;
  onClose: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCompletedChange: (value: boolean) => void;
}

const renderPriorityBadge = (p?: string | null) => {
  const label = p ? String(p).charAt(0).toUpperCase() + String(p).slice(1) : "No priority";
  const base = "inline-block px-2 py-0.5 rounded text-xs font-semibold";
  if (!p) return <span className={`${base} bg-gray-100 text-gray-700`}>{label}</span>;

  if (p === "low") return <span className={`${base} bg-green-100 text-green-800`}>{label}</span>;
  if (p === "medium") return <span className={`${base} bg-yellow-100 text-yellow-800`}>{label}</span>;
  if (p === "high") return <span className={`${base} bg-red-100 text-red-800`}>{label}</span>;

  return <span className={`${base} bg-gray-100 text-gray-700`}>{label}</span>;
};

export function TaskModal({
  task,
  isOpen,
  isEditing,
  editTaskTitle,
  editTaskDescription,
  editTaskPriority,
  editTaskCompleted,
  onClose,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onToggleComplete,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onCompletedChange,
}: TaskModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/30 z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Task Details</h2>
        {isEditing ? (
          <>
            <label className="block text-sm font-medium mb-2 text-gray-700">Title</label>
            <input
              type="text"
              value={editTaskTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full p-2 mb-3 border rounded"
            />

            <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
            <textarea
              value={editTaskDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full p-2 mb-3 border rounded"
              rows={4}
            />

            <label className="block text-sm font-medium mb-2 text-gray-700">Priority</label>
            <select
              value={editTaskPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
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
                onChange={(e) => onCompletedChange(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Completed</span>
            </label>

            <div className="flex justify-between items-center gap-2">
              <div className="flex gap-2">
                <button
                  onClick={onDelete}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onCancelEdit}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>

                <button
                  onClick={onSave}
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
              <p className="text-lg font-semibold">{task.title}</p>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
              {task.description ? (
                <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Due date</label>
              {task.due_date ? (
                <p className="text-gray-600">{new Date(task.due_date).toLocaleString()}</p>
              ) : (
                <p className="text-gray-400 italic">No due date</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Priority</label>
              <div>{renderPriorityBadge(task.priority)}</div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>

              <button
                onClick={onToggleComplete}
                className={`px-4 py-2 ${task.completed ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded`}
              >
                {task.completed ? 'Mark Incomplete' : 'Mark Completed'}
              </button>

              <button
                onClick={onStartEdit}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Edit
              </button>

              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
