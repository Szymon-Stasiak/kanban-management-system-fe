"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authRequest } from "@/lib/auth";
import SharedLayout from "@/components/layouts/SharedLayout";

export default function CreateBoardPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authRequest({
        method: "post",
        url: "/boards/create",
        data: { name, description },
      });
      router.push("/boards"); // go back to boards list
    } catch (err) {
      console.error(err);
      setError("Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SharedLayout>
      <div className="max-w-xl mx-auto mt-16 bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold mb-4">Create Board</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? "Creating..." : "Create Board"}
          </button>
        </form>
      </div>
    </SharedLayout>
  );
}
