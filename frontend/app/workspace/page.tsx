"use client";

import React, { useEffect, useState } from "react";
import { LayoutGrid, Plus, Trash2, ArrowRight } from "lucide-react";
import { fetchCollections, deleteCollection, type Collection } from "@/lib/mustape";
import Link from "next/link";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-tokens";

export default function WorkspacePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections().then((cols) => {
      setCollections(cols);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this collection and all its tapes?")) {
      await deleteCollection(id);
      setCollections(collections.filter(c => c.id !== id));
    }
  }

  if (loading) return <div className="text-ink-500">Loading collections...</div>;

  return (
    <div className="max-w-6xl">
      <header className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.75rem] leading-none tracking-tight text-ink-900">My Collections</h1>
          <p className="mt-3 text-[1.05rem] text-ink-500">Organize your tapes into quiet spaces.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/workspace/claim" className="button-lift touch-target inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-paper-100 px-5 text-sm font-medium text-ink-700 shadow-insetpaper hover:border-brass hover:text-ink-900">
            Import Tape
          </Link>
          <Link href="/workspace/new" className="button-lift touch-target inline-flex items-center gap-2 rounded-full bg-rosewood px-5 text-sm font-medium text-paper-100 hover:bg-ink-900">
            <Plus className="h-4 w-4" />
            New Collection
          </Link>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.length === 0 ? (
          <Link href="/workspace/new" className="button-lift flex h-[14rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-[rgb(var(--border))] text-ink-400 hover:border-rosewood hover:text-rosewood transition group">
            <LayoutGrid className="mb-3 h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-medium tracking-wide">Create your first collection</span>
          </Link>
        ) : (
          collections.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: motionTokens.durations.calm, ease: "easeOut" }}
            >
              <Link href={`/workspace/collections/${col.id}`} className="button-lift group relative flex h-[14rem] flex-col justify-between rounded-[2rem] border border-[rgb(var(--border))] bg-paper-100 p-7 shadow-insetpaper hover:border-brass transition">
                <div>
                  <h3 className="font-display text-3xl text-ink-900 truncate leading-none">{col.name}</h3>
                  {col.recipient_name && <p className="mt-2 text-sm text-ink-500 truncate uppercase tracking-widest">For {col.recipient_name}</p>}
                  <p className="mt-4 text-[0.95rem] text-ink-600 line-clamp-2 leading-relaxed">{col.description}</p>
                </div>
                <div className="flex items-center justify-between mt-6 border-t border-[rgb(var(--border))] pt-5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rosewood group-hover:gap-2 transition-all">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <button onClick={(e) => handleDelete(col.id, e)} className="p-1.5 text-ink-400 hover:text-oxblood" title="Delete Collection">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
