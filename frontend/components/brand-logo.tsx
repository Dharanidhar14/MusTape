import { Music2 } from "lucide-react";
import Link from "next/link";

export function BrandLogo({
  href = "#compose"
}: {
  href?: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-full text-sm text-ink-600 transition hover:text-ink-900">
      <span className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.72)] shadow-insetpaper">
        <Music2 aria-hidden className="h-4 w-4" />
      </span>
      <span className="font-display text-[1.35rem] leading-none tracking-normal text-ink-900">MusTape</span>
    </Link>
  );
}
