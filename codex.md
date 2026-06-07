# Codex Notes

## Projekt

IpscL1Gen ist eine React/Vite-Web-App unter `app/`. Sie erzeugt IPSC Level-I-Matchunterlagen fuer den BDS/GROI-Kontext komplett im Browser:

- GROI-Anschreiben
- Rahmenbeschreibung
- Stage-Briefings
- ZIP-Export mit getrennten PDFs

Das GitHub-Repository ist `https://github.com/bluechip0815/IpscL1Gen.git`, Branch `main`.

## Wichtige technische Entscheidungen

- Stack: React, Vite, Tailwind CSS, TypeScript.
- PDF/ZIP: `pdfmake` + `jszip`, komplett clientseitig.
- `pdfmake` ist Version `0.3.x`; wichtig:
  - `getBlob()` gibt ein Promise zurueck.
  - Fonts muessen ueber `addVirtualFileSystem(...)` geladen werden.
- Die Gesamtschusszahl wird automatisch aus den Stage-Zielen berechnet:
  - `stageSchusszahl = anzahlPaper * 2 + anzahlStahl`
- Der ZIP-Export setzt den Button nach Fehlern zurueck und zeigt eine Alert-Meldung.

## Stage-Designs

Die Stage-Vorschau und die PDF-Vorschau verwenden dieselbe SVG-Logik in:

```text
app/src/stagePlan.tsx
```

Es gibt vier waehlebare Basisdesigns unter:

```text
app/src/stageDesigns/
```

Jeder Typ besteht aus:

- `*.svg` als Basisskizze/Vorlage
- `*.json` mit Informationen zu:
  - `faultLine`
  - `barriers`
  - `paperSlots`
  - `steelSlots`

Wichtig: In den JSON-Dateien sind X-Koordinaten relativ:

- `x: 0` = linke Standkante
- `x: 1` = rechte Standkante

Y-Koordinaten bleiben Meter ab Kugelfang. Dadurch skalieren alle Objekte korrekt mit der eingestellten Standbreite.

## SVG-Editor

Es gibt eine zweite App-Seite `SVG-Editor`, erreichbar ueber die Umschaltung im Header. Die Komponente liegt in:

```text
app/src/SvgEditor.tsx
```

Der Editor kann im Browser einfache Designvorlagen erstellen und exportieren:

- Paper-Ziel-Slots
- Stahl-Ziel-Slots
- Barrieren
- Fault-Line-Segmente
- Startpositionen

Der Export erzeugt SVG und JSON. Die JSON-Struktur ist kompatibel mit den Stage-Design-Grunddaten: X relativ von `0` bis `1`, Y in Metern ab Kugelfang.

## Validierung

Die zentrale Validierungslogik liegt in:

```text
app/src/validation.ts
```

Bei mehrteiligen Fault Lines wird fuer den Stahlabstand die vorderste Fault-Line-Tiefe des gewaehlten Designs verwendet. Die Design-Geometrie wird relativ zum Feld `schuetzenPosition` verschoben.

## Relevante Dateien

```text
app/src/App.tsx              UI und Formularlogik
app/src/pdfService.ts        PDF- und ZIP-Erzeugung
app/src/stagePlan.tsx        gemeinsame SVG-Vorschau fuer UI und PDF
app/src/SvgEditor.tsx        zweite Seite zum Erstellen von SVG/JSON-Designs
app/src/stageDesigns.ts      Registry der Stage-Designs
app/src/stageDesigns/        Design-Dateien
app/src/types.ts             zentrale Typen
app/src/validation.ts        Validierungslogik
app/src/matchDefaults.ts     Defaults fuer neue Matches/Stages
```

## Build/Test

```bash
cd app
npm.cmd run build
```

Der Build ist bisher erfolgreich. Vite warnt wegen grosser Bundles, weil `pdfmake`/`jszip` im Client-Bundle liegen.

## Git-Hinweise

Beim Push aus dieser Umgebung wurde wegen lokaler Windows-Zertifikatsprobleme genutzt:

```bash
git -c http.sslVerify=false push
```

Git meldet ausserdem wiederholt:

```text
unable to access 'C:\Users\truoe/.config/git/ignore': Permission denied
```

Das hat die Arbeit nicht blockiert.

## Letzte wichtige Commits

- `f5ec9c1` Fix ZIP export for pdfmake 0.3
- `e410fa7` Refine stage briefing header
- `5ad26d8` Adjust match data layout
- `859ed7c` Show stage plan preview in editor
- `3fa24a4` Add selectable stage design templates
- `2d712ed` Use relative stage design positions
- SVG-Editor wurde danach als zweite Seite ergaenzt.
