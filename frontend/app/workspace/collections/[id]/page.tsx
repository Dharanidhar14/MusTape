"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Disc3, Trash2, Edit3, Settings } from "lucide-react";
import { fetchCollection, fetchCollectionTapes, deleteTape, type Collection, type SavedTape } from "@/lib/mustape";

export default function CollectionPage() {
  const params = useParams();
  const collectionId = params.id as string;
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [tapes, setTapes] = useState<SavedTape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCollection(collectionId),
      fetchCollectionTapes(collectionId)
    ]).then(([col, tps]) => {
      setCollection(col);
      setTapes(tps);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [collectionId]);

  async function handleDeleteTape(shareId: string) {
    if (confirm("Are you sure you want to permanently delete this tape?")) {
      try {
        await deleteTape(shareId, ""); // Token not required when authenticated owner
        setTapes(tapes.filter(t => t.shareId !== shareId));
      } catch (err) {
        alert("Failed to delete tape.");
      }
    }
  }

  if (loading) return <div className="text-ink-500">Loading collection...</div>;
  if (!collection) return <div className="text-oxblood">Collection not found.</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <Link href="/workspace" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-rosewood">
          <ChevronLeft className="h-4 w-4" />
          Back to Collections
        </Link>
      </div>

      <header className="mb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-5xl text-ink-900">{collection.name}</h1>
            {collection.recipient_name && (
              <p className="mt-2 text-lg text-ink-500">For {collection.recipient_name}</p>
            )}
            {collection.description && (
              <p className="mt-4 max-w-2xl text-ink-600 leading-relaxed">{collection.description}</p>
            )}
          </div>
          <Link href={`/workspace/collections/${collection.id}/compose`} className="button-lift touch-target inline-flex items-center gap-2 rounded-full bg-rosewood px-6 py-2.5 text-sm font-medium text-paper-100 hover:bg-ink-900">
            <Plus className="h-4 w-4" />
            Create Tape
          </Link>
        </div>
      </header>

      <div>
        <h2 className="mb-6 font-display text-2xl text-ink-900">Tapes ({tapes.length})</h2>
        {tapes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] py-20 text-ink-400">
            <Disc3 className="mb-4 h-8 w-8 opacity-50" />
            <p>No tapes in this collection yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tapes.map(tape => (
              <div key={tape.shareId} className="group relative flex flex-col justify-between rounded-xl border border-[rgb(var(--border))] bg-paper-100 p-5 shadow-sm hover:border-brass transition">
                <div>
                  <h3 className="font-display text-xl text-ink-900 truncate">{tape.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ink-400">
                    {new Date(tape.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-[rgb(var(--border))] pt-4">
                  <a href={`/tape/${tape.shareId}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-ink-600 hover:text-rosewood">
                    Open Tape
                  </a>
                  <div className="flex items-center gap-2">
                    <a href={`/workspace/collections/${collection.id}/tapes/${tape.shareId}/edit`} className="p-1.5 text-ink-400 hover:text-ink-900" title="Edit Tape">
                      <Settings className="h-4 w-4" />
                    </a>
                    <button onClick={() => handleDeleteTape(tape.shareId)} className="p-1.5 text-ink-400 hover:text-oxblood" title="Delete Tape">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
