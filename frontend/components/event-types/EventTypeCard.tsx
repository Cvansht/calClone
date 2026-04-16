"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { EventType } from "@/types";

export function EventTypeCard({ eventType, onDelete }: { eventType: EventType; onDelete: () => Promise<void> }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const publicPath = `/admin/${eventType.slug}`;
  const publicUrl = useMemo(() => `${origin}${publicPath}`, [origin, publicPath]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl || publicPath);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${eventType.title}?`)) {
      return;
    }

    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 h-2 w-14 rounded-full" style={{ backgroundColor: eventType.color }} />
          <h2 className="truncate text-base font-semibold text-zinc-950">{eventType.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{eventType.description || "No description"}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600">
          <Clock3 className="h-3.5 w-3.5" />
          {eventType.duration}m
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/event-types/${eventType.id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
        <Link
          href={publicPath}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-blue-500 hover:text-blue-700"
        >
          <ExternalLink className="h-4 w-4" />
          Open
        </Link>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-blue-500 hover:text-blue-700"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}
