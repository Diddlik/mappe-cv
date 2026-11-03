# Mappe CV

Dienst zum Erstellen von Lebensläufen: Daten eintragen und speichern, als PDF exportieren und als Online-Seite veröffentlichen. Das Aussehen kommt aus importierbaren Vorlagen, zum Beispiel je Beruf.

## Starten mit Docker

```
docker run -d -p 8080:8080 -v mappe-data:/data ghcr.io/diddlik/mappe-cv:latest
```

oder `docker compose up -d`. Danach http://localhost:8080 öffnen und ein Konto anlegen.

Das Image baut die GitHub-Action `.github/workflows/docker.yml` bei jedem Push auf `main` (Tag `latest`) und bei Tags `v*`.

Einstellungen über Umgebungsvariablen:

- `Mappe__AllowSignup`: `false` sperrt neue Konten (Standard `true`)
- `Mappe__DataDir`: Ordner für Datenbank und Schlüssel (im Image `/data`)

## Entwicklung

```
dotnet run --project src/Mappe
```

Das Backend (`src/Mappe`, ASP.NET Core, SQLite) liefert die Seiten aus `prototype/` aus und speichert Konten, Lebensläufe, Vorlagen und veröffentlichte Seiten. Ohne Backend (`npx serve prototype`) liegen die Daten im Browser.

## Aufbau des Prototyps

- `js/templates.js`: mitgelieferte Vorlagen und Beispieldaten
- `js/engine.js`: Rendern, Seitenumbrüche, PDF-Export, Vorlagen-Import
- `js/store.js`: Speicherschicht, spricht mit `/api` oder dem Browser-Speicher
- `login.html`: Anmelden und Konto anlegen
- `js/app.js`: Oberfläche

## Vorlagenformat

Eine Vorlage ist ein JSON-Paket im Format `mappe-template/1` mit `name`, `field`, `fonts`, `accents`, `html` (Mustache) und `css`. Die Regeln stehen im Auftragstext `designPrompt` in `js/engine.js`.

## Geplant

- PDF-Erzeugung mit Playwright, damit der Text auswählbar bleibt (im Prototyp sind die Seiten Bilder)
