'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authRequest } from "@/lib/auth"; 
import SharedLayout from "@/components/layouts/SharedLayout";
import { UUID } from "crypto";

type Column = {
  id: number;
  name: string;
  position: number;
};

type Board = {
  id: number;
  name: string;
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
              return { ...board, columns };
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

  const handleRenameColumn = async (boardId: number, columnId: number, currentName: string, currentPosition: number) => {
    const newName = prompt("Enter new column name:", currentName);
    if (!newName) return;

    try {
      await authRequest({
        method: "put",
        url: `/columns/${columnId}`,
        data: {
          name: newName,
          position: currentPosition,
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

      setBoards((prev) =>
        prev.map((board) =>
          board.id === boardId
            ? {
                ...board,
                columns: board.columns?.filter((col) => col.id !== columnId),
              }
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
      await authRequest({ method: "delete", url: `/boards/${boardId}/project/${projectId}` });

      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete board");
    }
  };

  return (
    <SharedLayout>
      <div className="max-w-4xl mx-auto mt-16">
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
          <div className="space-y-6">
            {boards.length > 0 ? (
              boards.map((board) => (
                <div
                  key={board.id}
                  className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{board.name}</h2>
                      <p className="text-slate-500">{board.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBoard(board.id)}
                      style={{ 
                        backgroundColor: '#ef4444', 
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >
                      Delete Board
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {board.columns && board.columns.length > 0 ? (
                      board.columns.map((col) => (
                        <div
                          key={col.id}
                          className="bg-gray-100 p-4 rounded-lg shadow-sm flex justify-between items-center"
                        >
                          <div>
                            <h3 className="font-medium">{col.name}</h3>
                            <p className="text-sm text-gray-500">Position: {col.position}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRenameColumn(board.id, col.id, col.name, col.position)}
                              style={{ 
                                backgroundColor: '#eab308', 
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ca8a04'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eab308'}
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => handleDeleteColumn(board.id, col.id)}
                              style={{ 
                                backgroundColor: '#ef4444', 
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">No columns found.</p>
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
