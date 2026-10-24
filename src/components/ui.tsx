"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Klickbarer Text, der zum Input wird; speichert bei Enter/Blur.
export function InlineEdit({
  value,
  onSave,
  className = "",
  multiline = false,
  placeholder = "",
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function commit() {
    setEditing(false);
    if (val === value) return;
    setBusy(true);
    try {
      await onSave(val);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        rows={4}
        className={`w-full rounded border border-dpsg-blue px-2 py-1 ${className}`}
      />
    ) : (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className={`rounded border border-dpsg-blue px-2 py-1 ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-text hover:bg-neutral-100 rounded px-1 ${busy ? "opacity-50" : ""} ${className}`}
      title="Zum Bearbeiten klicken"
    >
      {value || <span className="text-neutral-400">{placeholder || "—"}</span>}
    </span>
  );
}

export function DeleteButton({
  onDelete,
  label = "Löschen",
  confirmText = "Wirklich löschen?",
}: {
  onDelete: () => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handle() {
    if (!confirm(confirmText)) return;
    setBusy(true);
    try {
      await onDelete();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handle}
      disabled={busy}
      className="text-xs text-neutral-400 hover:text-dpsg-red disabled:opacity-50"
    >
      {busy ? "…" : label}
    </button>
  );
}

export function AddInput({
  onAdd,
  placeholder,
  buttonLabel = "+",
}: {
  onAdd: (text: string) => Promise<void>;
  placeholder: string;
  buttonLabel?: string;
}) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handle() {
    if (!val.trim()) return;
    setBusy(true);
    try {
      await onAdd(val.trim());
      setVal("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handle()}
        placeholder={placeholder}
        className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dpsg-blue"
      />
      <button
        onClick={handle}
        disabled={busy}
        className="rounded bg-dpsg-blue px-3 py-1 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "…" : buttonLabel}
      </button>
    </div>
  );
}
