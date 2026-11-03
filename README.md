# Mappe CV

Dienst zum Erstellen von Lebensläufen: Daten eintragen und speichern, als PDF exportieren und als Online-Seite veröffentlichen. Das Aussehen kommt aus importierbaren Vorlagen, zum Beispiel je Beruf.

## Stand

`prototype/` enthält einen klickbaren Prototyp aus HTML und JavaScript, noch ohne eigenes Backend.

Starten über einen kleinen Webserver:

```
npx serve prototype
```

Lokal liegen die Daten im Browser. Die Bibliotheken und Schriften werden von cdnjs und Google Fonts geladen.

## Aufbau des Prototyps

- `js/templates.js`: mitgelieferte Vorlagen und Beispieldaten
- `js/engine.js`: Rendern, Seitenumbrüche, PDF-Export, Vorlagen-Import
- `js/store.js`: Speicherschicht, die das spätere Backend ersetzt
- `js/app.js`: Oberfläche

## Vorlagenformat

Eine Vorlage ist ein JSON-Paket im Format `mappe-template/1` mit `name`, `field`, `fonts`, `accents`, `html` (Mustache) und `css`. Die Regeln stehen im Auftragstext `designPrompt` in `js/engine.js`.

## Geplant

- Backend mit ASP.NET Core und Konten mit Login
- PDF-Erzeugung mit Playwright, damit der Text auswählbar bleibt (im Prototyp sind die Seiten Bilder)
