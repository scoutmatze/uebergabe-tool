#!/usr/bin/env python3
"""
Lokale Transkription via faster-whisper (CPU).
argv[1] = Audio-Datei, argv[2] = optionaler Kontext-Prompt (Themenkomplex/Unterthema)
"""
import sys
from faster_whisper import WhisperModel

if len(sys.argv) < 2:
    print("Usage: transcribe.py <audio_file> [initial_prompt]", file=sys.stderr)
    sys.exit(1)

audio_path = sys.argv[1]
initial_prompt = sys.argv[2] if len(sys.argv) > 2 else None

try:
    # "medium": deutlich genauer als "base", auf 4 Kernen / 8 GB gut machbar.
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        audio_path,
        language="de",
        beam_size=5,
        initial_prompt=initial_prompt,
    )
    print("".join(seg.text for seg in segments))
except Exception as e:
    print(f"Fehler: {e}", file=sys.stderr)
    sys.exit(1)
