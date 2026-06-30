"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function ExternalMediaEmbed({
  embedUrl,
  title,
  provider,
  sourceUrl,
  onInteract
}: {
  embedUrl: string;
  title: string;
  provider: "Spotify" | "YouTube";
  sourceUrl: string;
  onInteract?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 5000);
    return () => window.clearTimeout(timer);
  }, [embedUrl]);

  return (
    <div
      className="relative mt-4 overflow-hidden rounded-[1rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.86)] shadow-insetpaper"
      onPointerDown={onInteract}
      onFocus={onInteract}
    >
      {!loaded ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[rgb(var(--paper-100)/0.92)] px-5 text-center">
          <div>
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-rosewood" />
            <p className="mt-3 text-sm text-ink-500">{provider} is placing this trace.</p>
            {slow ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="button-lift mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[rgb(var(--border))] px-4 text-sm text-ink-700 hover:border-brass"
              >
                <ExternalLink className="icon-svg h-4 w-4" />
                Open {provider}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      <iframe
        title={`${provider} player for ${title}`}
        src={embedUrl}
        width="100%"
        height={provider === "Spotify" ? 152 : 220}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="block w-full border-0"
      />
    </div>
  );
}
