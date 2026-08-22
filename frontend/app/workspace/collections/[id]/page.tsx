"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Disc3, Trash2, Settings, ArrowRight } from "lucide-react";
import { fetchCollection, fetchCollectionTapes, deleteTape, type Collection, type SavedTape } from "@/lib/mustape";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-tokens";

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
    <div className="max-w-6xl">
      <div className="mb-10">
        <Link href="/workspace" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-400 hover:text-rosewood transition">
          <ChevronLeft className="h-3.5 w-3.5" />
          Collections
        </Link>
      </div>

      <header className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between border-b border-[rgb(var(--border))] pb-10">
        <div>
          <h1 className="font-display text-[3.5rem] leading-[0.95] tracking-tight text-ink-900">{collection.name}</h1>
          {collection.recipient_name && (
            <p className="mt-3 text-sm uppercase tracking-widest text-ink-500">For {collection.recipient_name}</p>
          )}
          {collection.description && (
            <p className="mt-5 max-w-2xl text-[1.1rem] text-ink-600 leading-relaxed">{collection.description}</p>
          )}
        </div>
        <Link href={`/workspace/collections/${collection.id}/compose`} className="button-lift touch-target inline-flex shrink-0 items-center gap-2 rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-paper-100 hover:bg-ink-900">
          <Plus className="h-4 w-4" />
          Create Tape
        </Link>
      </header>

      <div>
        <h2 className="mb-6 font-display text-3xl text-ink-900">Tapes <span className="text-ink-400">({tapes.length})</span></h2>
        {tapes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[rgb(var(--border))] bg-paper-100/50 py-24 text-ink-400">
            <Disc3 className="mb-4 h-10 w-10 opacity-40" />
            <p className="text-lg">No tapes in this collection yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tapes.map((tape, i) => (
              <motion.div
                key={tape.shareId}
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: motionTokens.durations.calm, ease: "easeOut" }}
                className="group relative flex flex-col justify-between rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.6)] p-7 shadow-insetpaper hover:border-brass transition"
              >
                <div>
                  <h3 className="font-display text-2xl text-ink-900 truncate leading-none">{tape.title}</h3>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-400">
                    {new Date(tape.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-[rgb(var(--border))] pt-5">
                  <a href={`/tape/${tape.shareId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-rosewood transition-all group-hover:gap-2">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <div className="flex items-center gap-1">
                    <a href={`/workspace/collections/${collection.id}/tapes/${tape.shareId}/edit`} className="button-lift rounded-full p-2 text-ink-400 hover:bg-paper-200 hover:text-ink-900" title="Edit Tape">
                      <Settings className="h-4 w-4" />
                    </a>
                    <button onClick={() => handleDeleteTape(tape.shareId)} className="button-lift rounded-full p-2 text-ink-400 hover:bg-oxblood/10 hover:text-oxblood" title="Delete Tape">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
