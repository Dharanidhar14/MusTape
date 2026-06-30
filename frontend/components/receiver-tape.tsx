"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ReceiverExperience } from "@/components/receiver-experience";
import { fetchTape, type SavedTape } from "@/lib/mustape";

export function ReceiverTape({ shareId }: { shareId: string }) {
  const [tape, setTape] = useState<SavedTape | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    fetchTape(shareId)
      .then((nextTape) => {
        if (alive) setTape(nextTape);
      })
      .catch((fetchError) => {
        if (alive) setError(fetchError instanceof Error ? fetchError.message : "This tape could not be opened.");
      });

    return () => {
      alive = false;
    };
  }, [shareId]);

  if (tape) return <ReceiverExperience tape={tape} />;

  return (
    <main className="min-h-screen overflow-x-hidden text-ink-800">
      <section className="paper-grain cinematic-room grid min-h-screen place-items-center px-5 py-10">
        {error ? (
          <div className="relative z-10 mx-auto max-w-xl rounded-[2rem] border border-oxblood/30 bg-[rgb(var(--surface)/0.78)] p-8 text-center shadow-object">
            <p className="font-display text-4xl text-ink-900">The envelope is quiet.</p>
            <p className="mt-4 leading-7 text-ink-500">{error}</p>
            <Link href="/" className="touch-target mt-7 inline-flex items-center justify-center rounded-full bg-rosewood px-5 text-sm text-paper-100 transition hover:bg-ink-900">
              Return
            </Link>
          </div>
        ) : (
          <div className="relative z-10 mx-auto flex items-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] px-5 py-4 text-ink-600 shadow-insetpaper">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening the tape
          </div>
        )}
      </section>
    </main>
  );
}
