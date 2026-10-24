# DPSG Übergabe-Tool

Werkzeug für **Amtsübergaben** in der DPSG: Die scheidende Person spricht ihr Wissen pro
Themenkomplex und Unterthema als **Sprachnachricht** ein – das Tool transkribiert lokal, verdichtet
den Text per KI zu **Stichpunkten** und macht alles für die Nachfolge **durchsuchbar**. Ergänzt um
hochgeladene Dokumente und Links wird daraus ein vollständiges, nachschlagbares Übergabe-Archiv.

Entstanden für die Übergabe von Annka (DPSG-Bundesverband); läuft unter
`uebergabe.dpsgonline.de`.

## Zwei Branches

| Branch | Zweck |
|--------|-------|
| **`main`** | Vollständiges Tool mit KI: Aufnahme, lokale Transkription (faster-whisper), Stichpunkt-Generierung (OpenAI), Bearbeitung, Nutzer-/Zugriffsverwaltung. Die **wiederverwendbare Basis** für künftige Übergaben. |
| **`archiv`** | Schlankes **Lese-Endprodukt**: nur Login, Leseansicht, Volltextsuche, Audio-/Datei-Download. Kein Python/Whisper, kein OpenAI → kleines Image, minimaler Ressourcenbedarf. Für den dauerhaften, kostengünstigen Archivbetrieb nach abgeschlossener Übergabe. |

Das Archiv ist eine Ableitung von `main` – gleiches Datenmodell und Auth, nur ohne die
schreibenden/KI-Teile. Eine bestehende Datenbank lässt sich unverändert vom vollen Tool ins Archiv
übernehmen.

## Funktionen (main)

- **Aufnahme** im Browser pro Themenkomplex/Unterthema (MediaRecorder)
- **Transkription lokal** über faster-whisper (Modell `medium`, CPU) – keine Audio-Daten in der Cloud
- **Stichpunkte** aus dem Transkript über die OpenAI-API (`gpt-4o-mini`), mit Begriffs-/Namenskontext je Übergabe für bessere Eigennamen-Erkennung
- **Bearbeiten**: Stichpunkte und Transkript korrigieren, neu generieren, Eintrag neu aufnehmen oder löschen
- **Materialien**: Dateien (max. 25 MB) und Links je Unterthema
- **Rollen & Einladungen**: ADMIN/EDITOR/VIEWER, Einladungslinks mit selbstgesetztem PIN, Lesezugriff pro Übergabe
- **Leseansicht** mit Volltextsuche für die Empfänger:innen

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Prisma 6 · PostgreSQL 16 · Docker · Traefik v2.11.
`main` zusätzlich: Python + faster-whisper (lokal), OpenAI-API. Auth: eigene Library (jose-JWT,
bcrypt-PIN).

## Setup

1. `.env` aus `.env.example` erzeugen und befüllen (DB, `APP_SECRET`, `OPENAI_API_KEY`, Admin-Bootstrap).
2. Externes Docker-Netz anlegen bzw. vorhandenes nutzen (Traefik).
3. `docker compose -f docker-compose.prod.yml up -d --build`
4. Schema anlegen: `docker compose -f docker-compose.prod.yml exec app npx prisma@6 db push`
5. Erst-Admin: `curl -X POST https://<host>/api/auth/bootstrap` (einmalig, solange kein User existiert).

Details und die gelernten Deployment-Eigenheiten stehen in den Kommentaren von `Dockerfile` und
`docker-compose.prod.yml`.

## Hinweise

- `output: "standalone"` in `next.config.ts` ist Pflicht.
- Debian-Basis (`node:22-slim`), nicht Alpine – wegen der faster-whisper/PyAV-Wheels.
- `.env` ist bewusst nicht eingecheckt; Secrets gehören nicht ins Repo.
