"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { fetchCollections, claimTape, type Collection } from "@/lib/mustape";

export default function ClaimTapePage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    managementUrl: "",
    collectionId: ""
  });

  useEffect(() => {
    fetchCollections().then(cols => {
      setCollections(cols);
      if (cols.length > 0) {
        setForm(prev => ({ ...prev, collectionId: cols[0].id }));
      }
      setFetching(false);
    }).catch(() => setFetching(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.managementUrl.trim()) {
      setError("Please paste a management link.");
      return;
    }
    if (!form.collectionId) {
      setError("Please select a collection to put the tape into.");
      return;
    }

    let token = form.managementUrl.trim();
    // Extract token if they pasted the full URL
    if (token.includes("/manage/")) {
      const parts = token.split("/manage/");
      token = parts[1].split("?")[0].split("#")[0].split("/")[0];
    }

    setLoading(true);
    setError("");

    try {
      await claimTape(token, form.collectionId);
      router.push(`/workspace/collections/${form.collectionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim tape.");
      setLoading(false);
    }
  }

  if (fetching) return <div className="p-8 text-ink-500">Loading workspace...</div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/workspace" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-rosewood">
          <ChevronLeft className="h-4 w-4" />
          Back to Workspace
        </Link>
      </div>

      <h1 className="mb-2 font-display text-4xl text-ink-900">Import a Tape</h1>
      <p className="mb-8 text-ink-500">Move a legacy tape into your account using its private management link.</p>

      {error && <div className="mb-6 rounded-[1rem] bg-oxblood/10 px-4 py-3 text-sm text-oxblood">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.6rem] border border-[rgb(var(--border))] bg-paper-100 p-8 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-ink-700">Management Link</label>
          <input
            autoFocus
            type="text"
            className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-paper-200 px-4 py-3 text-ink-900 focus:border-rosewood focus:outline-none"
            placeholder="https://mustape.com/manage/..."
            value={form.managementUrl}
            onChange={(e) => setForm({ ...form, managementUrl: e.target.value })}
          />
          <p className="mt-2 text-xs text-ink-400">Paste the secret URL you were given when you originally sealed the tape.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700">Destination Collection</label>
          {collections.length === 0 ? (
            <div className="mt-2 text-sm text-oxblood">
              You don&apos;t have any collections yet. <Link href="/workspace/new" className="underline">Create one first</Link>.
              <p className="text-gray-400 text-sm mt-4 text-center max-w-sm">
                Can&apos;t find your management link? If you created it on this device, it might still be in your local browser history.
              </p>
            </div>
          ) : (
            <select
              className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-paper-200 px-4 py-3 text-ink-900 focus:border-rosewood focus:outline-none"
              value={form.collectionId}
              onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
            >
              {collections.map(col => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[rgb(var(--border))]">
          <button
            type="submit"
            disabled={loading || collections.length === 0}
            className="rounded-full bg-rosewood px-6 py-2.5 text-sm font-medium text-paper-100 hover:bg-ink-900 disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import Tape"}
          </button>
        </div>
      </form>
    </div>
  );
}
