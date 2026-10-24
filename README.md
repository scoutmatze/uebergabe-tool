# DPSG Übergabe – Archiv

Schlanke **Lese-Variante** der Übergabe-App. Nur noch Nachschlagen, kein Erzeugen:

- **Login** mit bestehenden Konten/PINs (unveränderte Auth-Library)
- **Dashboard**: Liste der zugänglichen Übergaben (Admin sieht alle)
- **Leseansicht** mit **clientseitiger Volltextsuche** über Stichpunkte, Transkripte, Unterthemen und Materialien
- **Audio-Wiedergabe** und **Datei-Download** (hinter demselben Zugriffsschutz)

**Bewusst entfernt** gegenüber der vollen App: Aufnahme + Pipeline (`/api/process`), faster-whisper
(Python/ffmpeg), OpenAI, alle Editier-/Verwaltungs-Funktionen, Admin-Nutzerverwaltung,
Einladungs-Flow. Dadurch: kleineres Image, kein Modell-Download, minimaler RAM-Bedarf, keine
laufenden KI-Kosten. Das Archiv ist auf DB-Ebene **rein lesend**.

## Stack

Next.js 15 · TypeScript · Tailwind v4 · Prisma 6 · PostgreSQL 16 · Docker. Kein eigener Traefik –
klinkt sich auf dem bundesamt-Server in das bestehende `dpsg-reisekosten_web` ein.

## Deployment & Migration

Siehe **RUNBOOK.md** – vollständiger Ablauf: Daten vom alten Server sichern, übertragen, Archiv
aufsetzen, testen, Domain umziehen, alten Server abschalten. Bestehende Logins bleiben gültig.

## Betrieb

- Rein lesend: kein `prisma db push` im Normalbetrieb nötig (das Schema kommt mit dem DB-Dump).
- Datensicherung: gelegentlicher `pg_dump` plus die Volumes `…_audio` / `…_material` genügen.
