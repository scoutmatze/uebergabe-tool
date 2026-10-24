"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Recorder({
  unterthemaId,
  replaceEintragId,
  label = "Aufnahme starten",
}: {
  unterthemaId: string;
  replaceEintragId?: string;
  label?: string;
}) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const router = useRouter();

  async function start() {
    setError(null);
    setAudioBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      mr.onstop = () => {
        setAudioBlob(new Blob(chunks.current, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
    } catch {
      setError("Mikrofon-Zugriff nicht möglich.");
    }
  }

  function stop() {
    mediaRecorder.current?.stop();
    setRecording(false);
  }

  async function process() {
    if (!audioBlob) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", audioBlob, "aufnahme.webm");
      form.append("unterthemaId", unterthemaId);
      if (replaceEintragId) form.append("replaceEintragId", replaceEintragId);
      const res = await fetch("/api/process", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verarbeitung fehlgeschlagen.");
      setAudioBlob(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {!recording ? (
          <button
            onClick={start}
            disabled={busy}
            className="rounded-lg bg-dpsg-red px-4 py-2 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            ● {label}
          </button>
        ) : (
          <button
            onClick={stop}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-white text-sm font-bold hover:opacity-90 transition animate-pulse"
          >
            ■ Stoppen
          </button>
        )}
        {audioBlob && !recording && (
          <>
            <audio controls src={URL.createObjectURL(audioBlob)} className="h-8" />
            <button
              onClick={process}
              disabled={busy}
              className="rounded-lg bg-dpsg-blue px-4 py-2 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {busy ? "Verarbeite … (kann dauern)" : "Verarbeiten"}
            </button>
          </>
        )}
      </div>
      {error && <p className="text-dpsg-red text-sm">{error}</p>}
    </div>
  );
}
