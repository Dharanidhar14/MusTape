"use client";

import React from "react";
import { LayoutGrid } from "lucide-react";

export default function WorkspacePage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink-900">My Collections</h1>
          <p className="mt-2 text-ink-500">Organize your tapes into quiet spaces.</p>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for Collection Cards */}
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] text-ink-400 hover:border-rosewood hover:text-rosewood transition">
          <LayoutGrid className="mb-3 h-6 w-6" />
          <span className="text-sm font-medium">No collections yet</span>
        </div>
      </div>
    </div>
  );
}
