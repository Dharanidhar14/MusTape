"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createCollection } from "@/lib/mustape";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewCollectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    recipientName: "",
    description: ""
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("A collection name is required.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await createCollection({
        name: form.name.trim(),
        recipient_name: form.recipientName.trim(),
        description: form.description.trim()
      });
      router.push("/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/workspace" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-rosewood">
          <ChevronLeft className="h-4 w-4" />
          Back to Collections
        </Link>
      </div>

      <h1 className="mb-2 font-display text-4xl text-ink-900">New Collection</h1>
      <p className="mb-8 text-ink-500">Create a dedicated space to organize tapes for a specific person or occasion.</p>

      {error && <div className="mb-6 rounded-[1rem] bg-oxblood/10 px-4 py-3 text-sm text-oxblood">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.6rem] border border-[rgb(var(--border))] bg-paper-100 p-8 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-ink-700">Collection Name</label>
          <input
            autoFocus
            type="text"
            className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-paper-200 px-4 py-3 text-ink-900 focus:border-rosewood focus:outline-none"
            placeholder="e.g. For Sarah, Summer '24, Wedding Playlist"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700">Recipient Name <span className="text-ink-400 font-normal">(Optional)</span></label>
          <input
            type="text"
            className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-paper-200 px-4 py-3 text-ink-900 focus:border-rosewood focus:outline-none"
            placeholder="Sarah Jenkins"
            value={form.recipientName}
            onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700">Description <span className="text-ink-400 font-normal">(Optional)</span></label>
          <textarea
            rows={3}
            className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-paper-200 px-4 py-3 text-ink-900 focus:border-rosewood focus:outline-none resize-none"
            placeholder="A short note about this collection..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[rgb(var(--border))]">
          <Link href="/workspace" className="text-sm font-medium text-ink-600 hover:text-ink-900">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-rosewood px-6 py-2.5 text-sm font-medium text-paper-100 hover:bg-ink-900 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Collection"}
          </button>
        </div>
      </form>
    </div>
  );
}
