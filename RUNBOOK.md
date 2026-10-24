# Migration: Übergabe → schlankes Archiv auf bundesamt (5.75.169.81)

Ziel: Die Übergabe als **reines Lese-Archiv** (Login, Leseansicht, Suche, Audio/Material-Download –
kein Whisper, kein OpenAI, keine Aufnahme) auf den bundesamt-Server bringen, dort ins bestehende
Traefik (`dpsg-reisekosten_web`) einklinken, Daten übernehmen, dann Domain umziehen und den alten
CX33 abschalten.

Bestehende Logins bleiben gültig: Alle PINs liegen als bcrypt-Hash im DB-Dump; durch Übernahme von
`APP_SECRET` + gleicher Domain bleiben sogar eingeloggte Sessions bestehen.

---

## Teil A — Daten auf dem ALTEN Server sichern (142.132.163.204)

```bash
ssh deploy@142.132.163.204
cd /home/deploy/uebergabe
set -a; . ./.env; set +a

# 1) Datenbank-Dump (schema + daten, ohne Owner/ACL für sauberen Restore)
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" --no-owner --no-acl "$POSTGRES_DB" > archiv-db.sql

# 2) Audio- und Material-Dateien aus den Volumes packen
docker run --rm -v uebergabe_audio:/data -v "$PWD":/backup alpine \
  tar czf /backup/archiv-audio.tar.gz -C /data .
docker run --rm -v uebergabe_material:/data -v "$PWD":/backup alpine \
  tar czf /backup/archiv-material.tar.gz -C /data .

# 3) Die alte .env sichern (enthält APP_SECRET + POSTGRES-Werte, die wir übernehmen)
cp .env archiv-env.txt

ls -lh archiv-db.sql archiv-audio.tar.gz archiv-material.tar.gz archiv-env.txt
```

## Teil B — Dateien zum NEUEN Server bringen (über dein Notebook)

```powershell
# Auf dem Notebook: vom alten Server holen …
scp deploy@142.132.163.204:/home/deploy/uebergabe/archiv-db.sql .
scp deploy@142.132.163.204:/home/deploy/uebergabe/archiv-audio.tar.gz .
scp deploy@142.132.163.204:/home/deploy/uebergabe/archiv-material.tar.gz .
scp deploy@142.132.163.204:/home/deploy/uebergabe/archiv-env.txt .

# … und zum neuen Server hochladen (plus den Archiv-Code uebergabe-archiv.tar)
scp uebergabe-archiv.tar deploy@5.75.169.81:/home/deploy/
scp archiv-db.sql archiv-audio.tar.gz archiv-material.tar.gz archiv-env.txt deploy@5.75.169.81:/home/deploy/
```

## Teil C — Archiv auf dem NEUEN Server aufsetzen (5.75.169.81)

```bash
ssh deploy@5.75.169.81
cd /home/deploy
tar -xf uebergabe-archiv.tar          # entpackt nach ./uebergabe-archiv
mv archiv-*.tar.gz archiv-db.sql archiv-env.txt uebergabe-archiv/
cd uebergabe-archiv
```

**C1 — Traefik-Netz & certresolver verifizieren** (Name muss zum laufenden Traefik passen):

```bash
docker network ls | grep dpsg-reisekosten_web          # Netz muss existieren
docker inspect "$(docker ps -qf name=traefik)" \
  --format '{{range .Args}}{{println .}}{{end}}' | grep -i certificatesresolvers
```
Zeigt die Zeile z. B. `--certificatesresolvers.letsencrypt.acme...` → der Name ist `letsencrypt`
(so in der compose voreingestellt). Steht dort ein anderer Name, in `docker-compose.prod.yml`
die Zeile `...tls.certresolver=letsencrypt` entsprechend anpassen.

**C2 — .env anlegen** (aus der alten Datei, KI-Variablen entfallen):

```bash
cp archiv-env.txt .env
nano .env
```
In der `.env`:
- **behalten:** `DATABASE_URL`, `POSTGRES_USER/PASSWORD/DB`, `APP_SECRET`, `APP_URL`,
  `AUDIO_DIR=/data/audio`, `MATERIAL_DIR=/data/material`
- **löschen:** `OPENAI_API_KEY`, `ADMIN_EMAIL`, `ADMIN_PIN` (werden nicht mehr gebraucht)
- `APP_URL` bleibt `https://uebergabe.dpsgonline.de`

**C3 — Bauen & starten** (legt die leeren Volumes an, startet db + app):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**C4 — Daten einspielen:**

```bash
set -a; . ./.env; set +a
# Datenbank
cat archiv-db.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB"
# Audio + Material in die neuen Volumes (uid 1001 bleibt erhalten → App darf lesen)
docker run --rm -v uebergabe-archiv_audio:/data -v "$PWD":/backup alpine \
  tar xzf /backup/archiv-audio.tar.gz -C /data
docker run --rm -v uebergabe-archiv_material:/data -v "$PWD":/backup alpine \
  tar xzf /backup/archiv-material.tar.gz -C /data
docker compose -f docker-compose.prod.yml restart app
```

**C5 — Funktionstest VOR dem DNS-Umzug** (Zert ist hier noch ungültig – das ist normal):

```bash
# Kommen die Nutzer aus dem Dump an?
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB" -c 'SELECT count(*) FROM "User";'
# Routet Traefik zur App? (-k ignoriert das noch fehlende Zert)
curl -sik -H "Host: uebergabe.dpsgonline.de" https://localhost/login -o /dev/null -w "%{http_code}\n"
```
`200` beim curl und eine plausible User-Zahl → das Archiv steht.

## Teil D — Domain umziehen (erst jetzt!)

DNS A-Record **`uebergabe.dpsgonline.de`** von `142.132.163.204` auf **`5.75.169.81`** ändern.
Sobald die Auflösung greift, holt Traefik automatisch das Let's-Encrypt-Zertifikat (~30 s nach dem
ersten Aufruf). Dann im Browser: `https://uebergabe.dpsgonline.de` → grünes Schloss, Login mit
bestehendem PIN, Leseansicht + Suche prüfen, ein Audio abspielen, eine Datei herunterladen.

## Teil E — Alten Server abschalten

Wenn das Archiv sauber läuft: den alten **CX33 (142.132.163.204)** in der Hetzner-Konsole
**löschen** (nicht nur stoppen) – das beendet die ~6,49 €/Monat. Die Sicherungen (`archiv-db.sql`,
die beiden `.tar.gz`, `archiv-env.txt`) am besten noch lokal aufbewahren.

---

### Rollback
Solange die DNS noch auf den alten Server zeigt, läuft die alte Umgebung unverändert weiter – ein
Abbruch ist bis zum DNS-Umzug (Teil D) jederzeit folgenlos möglich.
