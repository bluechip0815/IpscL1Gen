# IpscL1Gen

IpscL1Gen ist ein browserbasierter Generator fuer Unterlagen zu IPSC Level-I-Matches im BDS/GROI-Kontext.

Die Anwendung richtet sich an Matchveranstalter, Range Officer und Vereine, die wiederkehrend einfache Level-I-Matches vorbereiten und dafuer konsistente, pruefbare Unterlagen erzeugen wollen. Sie sammelt Match-Stammdaten und Stage-Informationen in einem Formular, prueft zentrale Plausibilitaets- und Sicherheitsregeln und erzeugt anschliessend ein ZIP-Archiv mit getrennten PDF-Dokumenten.

## Was die Anwendung erzeugt

- GROI-Anschreiben fuer die Sanktionierung
- Rahmenbeschreibung mit Stage-Uebersicht, Summen und Sicherheitsstatus
- Stage Briefings als zusammenhaengendes PDF mit einer Seite pro Stage
- schematische Stage-Vorschau mit Fault Line und Stahllinie

## Wichtige Funktionen

- automatische Berechnung der Gesamtschusszahl aus den einzelnen Stages
- Klassifizierung der Stages als Short, Medium oder Long Course
- Pruefung der Mindestschusszahl fuer Level I
- Pruefung des Abstandes zwischen vorderster Fault Line und Stahlzielen
- Live-Validierung vor dem PDF-/ZIP-Export
- vollstaendige Ausfuehrung im Browser, ohne Server-Backend

## Projektstruktur

```text
app/        React/Vite-Web-App
plan.md    urspruenglicher Umsetzungsplan
```

## Lokaler Start

```bash
cd app
npm install
npm run dev
```

Vite zeigt danach die lokale URL an, typischerweise `http://localhost:5173/`.

## Produktionsbuild

```bash
cd app
npm run build
```

## Wichtige BDS-Unterlagen

Die App ersetzt keine Pruefung der jeweils aktuellen BDS-/GROI-Unterlagen. Vor der Einreichung sollten insbesondere diese offiziellen Seiten und Dokumente herangezogen werden:

- [BDS IPSC Sporthandbuch / Regelwerk](https://www.bdsnet.de/ipsc/sporthandbuch.html)
- [BDS Sportordnung IPSC Kurzwaffe, Fassung 27.06.2025](https://www.bdsnet.de/ressourcen/downloads/bds_shb_ipsc_kurzwaffe_27_06_2025-klein.pdf)
- [BDS Matchsanktionierung / Match veranstalten](https://www.bdsnet.de/ipsc/sanktionierung.html)
- [BDS Kalender fuer Termineintragungen](https://www.bdsnet.de/kalender.html)
- [BDS IPSC Kontaktseite](https://www.bdsnet.de/ipsc/kontakt.html)

Auf der Sanktionierungsseite liegen auch die jeweils aktuellen Sanktionierungsantraege fuer Handgun, Rifle und Shotgun sowie die Checkliste zur Sanktionierung.

## Hinweis

Die Validierungen in dieser Anwendung sind eine technische Hilfe zur Vorbereitung der Unterlagen. Die endgueltige Verantwortung fuer regelkonforme Stage-Aufbauten, korrekte Briefings, fristgerechte Einreichung und die Abstimmung mit dem zustaendigen Sanktionierer bleibt beim Veranstalter.
