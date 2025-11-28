'use client';

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authRequest } from "@/lib/auth";
import SharedLayout from "@/components/layouts/SharedLayout";

function CreateColumnForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardId = searchParams.get("boardId");
  const projectId = searchParams.get("projectId");

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!boardId || !projectId) {
      setError("Missing boardId or projectId");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authRequest({
        method: "post",
        url: "/columns/create",
        data: {
          name,
          board_id: parseInt(boardId),
        },
      });
      router.push(`/boards/project/${projectId}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to create column");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-16 bg-white p-8 rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Create Column</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Column Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {loading ? "Creating..." : "Create Column"}
        </button>
      </form>
    </div>
  );
}

export default function CreateColumnPage() {
  return (
    <SharedLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <CreateColumnForm />
      </Suspense>
    </SharedLayout>
  );
}