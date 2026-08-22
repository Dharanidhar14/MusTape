"use client";

import React, { useEffect, useState } from "react";
import { LayoutGrid, Plus, Trash2 } from "lucide-react";
import { fetchCollections, deleteCollection, type Collection } from "@/lib/mustape";
import Link from "next/link";

export default function WorkspacePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections().then((cols) => {
      setCollections(cols);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this collection and all its tapes?")) {
      await deleteCollection(id);
      setCollections(collections.filter(c => c.id !== id));
    }
  }

  if (loading) return <div className="p-8 text-ink-500">Loading collections...</div>;

  return (
    <div className="max-w-5xl">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink-900">My Collections</h1>
          <p className="mt-2 text-ink-500">Organize your tapes into quiet spaces.</p>
        </div>
        <Link href="/workspace/new" className="button-lift touch-target inline-flex items-center gap-2 rounded-full bg-rosewood px-5 text-sm font-medium text-paper-100 hover:bg-ink-900">
          <Plus className="h-4 w-4" />
          New Collection
        </Link>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.length === 0 ? (
          <Link href="/workspace/new" className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] text-ink-400 hover:border-rosewood hover:text-rosewood transition group">
            <LayoutGrid className="mb-3 h-6 w-6" />
            <span className="text-sm font-medium">Create your first collection</span>
          </Link>
        ) : (
          collections.map(col => (
            <div key={col.id} className="group relative flex h-48 flex-col justify-between rounded-2xl border border-[rgb(var(--border))] bg-paper-100 p-6 shadow-sm hover:shadow-md transition">
              <div>
                <h3 className="font-display text-2xl text-ink-900 truncate">{col.name}</h3>
                {col.recipient_name && <p className="mt-1 text-sm text-ink-500 truncate">For {col.recipient_name}</p>}
                <p className="mt-3 text-sm text-ink-600 line-clamp-2">{col.description}</p>
              </div>
              <div className="flex items-center justify-between mt-4 border-t border-[rgb(var(--border))] pt-4">
                <Link href={`/workspace/collections/${col.id}`} className="text-sm font-medium text-rosewood hover:underline">
                  Open
                </Link>
                <button onClick={() => handleDelete(col.id)} className="text-ink-400 hover:text-oxblood" title="Delete Collection">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
