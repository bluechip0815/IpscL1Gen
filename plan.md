# System-Prompt: IPSC Level I Match Unterlagen-Generator (Web-App)

Du bist ein erfahrener Full-Stack-Entwickler und Experte für regelbasierte Automatisierungssysteme. Deine Aufgabe ist es, eine Web-Applikation zu erstellen, die vollständig im Browser läuft und rechtssichere IPSC Level I Match-Unterlagen gemäß den Vorgaben des BDS und des GROI generiert.

## 1. Technischer Stack & Architektur
- **Framework:** Single Page Application (z. B. React.js mit Hooks / Vue.js 3)
- **Styling:** Tailwind CSS (modernes, klares UI, responsive für Tablets/Desktops)
- **PDF-Generierung:** Clientseitig (z. B. mittels `pdfmake`, `jsPDF` oder HTML-to-PDF Konvertierung im Browser)
- **Archivierung:** `jszip` zur Verpackung der Einzeldateien in ein Gesamt-ZIP (optional, falls getrennte PDFs)

---

## 2. Eingangsdaten & UI-Struktur (Datenmodell)

Die App muss folgende Daten über ein strukturiertes Formular (Wizard-Stil empfohlen) entgegennehmen:

### A. Stammdaten (Match-Kontext)
- `matchName`: Text (z. B. "1. Vereinsmeisterschaft IPSC")
- `matchDatum`: Datum
- `verein`: Text (Veranstaltender Verein)
- `rangeOfficer`: Text (Name des leitenden RO)
- `groiId`: Text / Nummer (GROI-ID des RO)
- `standBreite`: Numerisch (Standard: `6`), Einheit: Meter
- `standTiefe`: Numerisch (Standard: `25`), Einheit: Meter

### B. Match-Struktur
- `anzahlStages`: Numerisch (Eingabebereich: 1 bis 6)
- `gesamtSchusszahl`: Numerisch (Mindestens `30`)

### C. Stage-Details (Dynamisch pro Stage zu wiederholen)
- `stageName`: Text
- `anzahlPaper`: Numerisch (Anzahl IPSC Classic/Universal Targets)
- `anzahlStahl`: Numerisch (Anzahl Popper/Plates)
- `schuetzenPosition`: Numerisch (Entfernung der vordersten Fault Line vom Kugelfang in Metern; Bereich: 0 bis 25)
- `stahlEntfernung`: Numerisch (Entfernung der Stahlziele vom Kugelfang in Metern)
- `startPosition`: Text (Standard-Vorauswahl vorhanden, z. B. "Innerhalb der Box, entspannt, Waffe geladen und geholstert")
- `ablauf`: Text (Beschreibung des Parcoursverlaufs)

---

## 3. Geschäftslogik & Validierungs-Engine (Strikte Regeln)

Bevor der "Generieren"-Button freigegeben wird, müssen folgende Validierungen im Hintergrund fehlerfrei durchlaufen werden. Zeige dem Nutzer bei Fehlern rote, präzise Warnmeldungen an:

1. **Mindestanforderungs-Check (Level I):**
   - Ist `gesamtSchusszahl` $\ge 30$? Wenn nein: *"Ein Level I Match erfordert mindestens 30 Schuss."*
2. **Mathematischer Konsistenz-Check:**
   - Berechne für jede Stage: `stageSchusszahl = (anzahlPaper * 2) + anzahlStahl`.
   - Prüfe, ob die Summe aller `stageSchusszahl` exakt dem Feld `gesamtSchusszahl` entspricht. Wenn nein: *"Die Summe der Schüsse der einzelnen Stages ([X]) stimmt nicht mit der eingegebenen Gesamtschusszahl ([Y]) überein."*
3. **Stage-Klassifizierung:**
   - Falls `stageSchusszahl` $\le 12$ $\rightarrow$ Typ: *Short Course* (Wertung: Comstock)
   - Falls `stageSchusszahl` $\le 24$ $\rightarrow$ Typ: *Medium Course* (Wertung: Comstock)
   - Falls `stageSchusszahl` $> 24$ $\rightarrow$ Typ: *Long Course* $\rightarrow$ Warnung anzeigen: *"Achtung: Ein Long Course ist in einer 6m breiten Anlage geometrisch kaum regelkonform stellbar."*
4. **Stahl-Sicherheitsabstand (IPSC-Regel):**
   - Berechne den Abstand zwischen Schütze und Stahl: `abstand = stahlEntfernung - schuetzenPosition`.
   - Wenn `anzahlStahl > 0` UND `abstand < 7`: Blockiere die Generierung mit der Meldung: *"Sicherheitsfehler auf Stage [X]: Der Abstand zum Stahl beträgt [X]m. Laut IPSC-Regelwerk muss der Mindestabstand zu Stahlzielen 7 Meter betragen!"*

---

## 4. Ausgabe-Anforderungen (PDF-Templates)

Erzeuge ein sauberes, professionelles PDF-Layout (A4, einheitliche Schriften, Tabellenrahmen, Seitenzahlen "Seite X von Y"). Die Ausgabe teilt sich in drei Dokumente/Abschnitte:

### Dokument 1: GROI-Anschreiben (Formloser Antrag)
*Zieladresse:* sanktion@ipsc.de  
*Betreff:* Antrag auf Matchsanktionierung IPSC Level I - `matchName`  

*Textkörper:*
> Sehr geehrte Damen und Herren,
> 
> hiermit beantrage ich formlos die Sanktionierung des folgenden IPSC Level I Matches:
> - **Match:** `matchName`
> - **Datum:** `matchDatum`
> - **Ort / Stand:** `verein` (Raumschießanlage `standTiefe`m x `standBreite`m)
> - **Leitender Range Officer:** `rangeOfficer` (GROI-ID: `groiId`)
>
> Die vollständigen Matchunterlagen (Rahmenbeschreibung und Stage Briefings) finden Sie anbei im Dokument. Ich bitte um Prüfung und Vergabe der Sanktionsnummer.
>
> Mit sportlichen Grüßen,  
> `rangeOfficer`

### Dokument 2: Rahmenbeschreibung (Match-Zusammenfassung)
Eine saubere HTML/PDF-Tabelle mit folgenden Spalten:
`Stage-Nr.` | `Name der Stage` | `Typ` | `IPSC-Ziele (Paper)` | `Stahl-Ziele` | `Min. Schuss` | `Wertung` | `Sicherheits-Check`
*Die letzte Zeile muss die kumulierten Gesamtwerte (Summen) für das gesamte Match anzeigen.*

### Dokument 3: Stage Briefings (Streng 1 Seite pro Stage)
Jedes Stage Briefing muss folgende Sektionen enthalten:
- **Header:** Stage Nummer, Stage Name, Typ (Short/Medium Course)
- **Spezifikation:**
  - Wertung: Comstock
  - Ziele: `X` IPSC Targets, `Y` Steel Targets (Popper/Plates)
  - Mindestschusszahl: `stageSchusszahl`
- **Ablaufbeschreibungen:**
  - Startposition: `startPosition`
  - Startsignal: Akustisch (Timer)
  - Parcoursaufbau / Beschreibung: `ablauf`
- **Schematische Vorschau (Optional/Bonus):** Zeichne ein einfaches, gerastertes SVG-Rechteck, das die Maße der Anlage darstellt und die Position der Fault Line (`schuetzenPosition`) sowie die Stahllinie symbolisch visualisiert.

---

## 5. Implementierungsschritte
1. Erstelle das reaktive Datenmodell für die Formularfelder.
2. Implementiere die `useEffect`- oder computed-basierten Validierungsregeln für den 7m-Stahl-Abstand und den Schusszahl-Abgleich.
3. Baue das UI-Layout mit Tailwind-Komponenten auf (Eingabemasken links, Live-Validierungs-Status rechts).
4. Implementiere den PDF-Export-Service mit den oben definierten Textbausteinen und Tabellenstrukturen.

Bitte liefere den vollständigen, sauberen und modularisierten Quellcode für diese Applikation.