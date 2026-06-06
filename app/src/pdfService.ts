import JSZip from 'jszip'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { MatchData, StageSummary, ValidationResult } from './types'

type PdfContent = Record<string, unknown> | string | Array<Record<string, unknown> | string>
type PdfDefinition = Record<string, unknown>
const pdfRuntime = pdfMake as unknown as {
  vfs: Record<string, string>
  addVirtualFileSystem?: (vfs: Record<string, string>) => void
  createPdf: (definition: PdfDefinition) => {
    getBlob: ((callback: (blob: Blob) => void) => void) | (() => Promise<Blob>)
  }
}

const fontVfs = pdfFonts as unknown as { vfs?: Record<string, string> } & Record<string, string>
const resolvedFontVfs = fontVfs.vfs ?? fontVfs
pdfRuntime.vfs = resolvedFontVfs
pdfRuntime.addVirtualFileSystem?.(resolvedFontVfs)

const pageFooter = (currentPage: number, pageCount: number) => ({
  text: `Seite ${currentPage} von ${pageCount}`,
  alignment: 'right' as const,
  margin: [0, 0, 40, 0],
  fontSize: 8,
  color: '#526173',
})

const documentBase = (content: PdfContent[]): PdfDefinition => ({
  pageSize: 'A4',
  pageMargins: [40, 42, 40, 48],
  footer: pageFooter,
  defaultStyle: {
    font: 'Roboto',
    fontSize: 10,
    lineHeight: 1.25,
    color: '#1d2633',
  },
  styles: {
    h1: { fontSize: 18, bold: true, margin: [0, 0, 0, 16], color: '#143642' },
    h2: { fontSize: 13, bold: true, margin: [0, 16, 0, 8], color: '#143642' },
    small: { fontSize: 8, color: '#526173' },
    tableHeader: { bold: true, fillColor: '#dbe8ee', color: '#143642' },
  },
  content,
})

const asDate = (value: string) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('de-DE').format(new Date(`${value}T00:00:00`))
}

const sanitizeFilePart = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'IPSC_Level_I'

const pdfBlob = (definition: PdfDefinition) => {
  const pdf = pdfRuntime.createPdf(definition)
  const maybeBlob = (pdf.getBlob as () => Promise<Blob> | Blob | undefined)()

  if (maybeBlob instanceof Blob) {
    return Promise.resolve(maybeBlob)
  }

  if (maybeBlob && typeof maybeBlob.then === 'function') {
    return maybeBlob
  }

  return new Promise<Blob>((resolve) => {
    ;(pdf.getBlob as (callback: (blob: Blob) => void) => void)((blob) => resolve(blob))
  })
}

const sourceNote = {
  text:
    'Regelhinweis: Erstellt anhand der GROI-Sanktionierungshinweise ab Januar 2026 und der IPSC Handgun Rules Januar 2026. Vor Einreichung bitte mit dem aktuellen Sanktionierungsantrag abgleichen.',
  style: 'small',
  margin: [0, 16, 0, 0],
}

export const createCoverLetterDefinition = (match: MatchData): PdfDefinition =>
  documentBase([
    { text: 'GROI-Anschreiben', style: 'h1' },
    { text: 'An: sanktion@ipsc.de', margin: [0, 0, 0, 4] },
    { text: `Betreff: Antrag auf Matchsanktionierung IPSC Level I - ${match.matchName}`, bold: true, margin: [0, 0, 0, 20] },
    { text: 'Sehr geehrte Damen und Herren,', margin: [0, 0, 0, 10] },
    {
      text: 'hiermit beantrage ich formlos die Sanktionierung des folgenden IPSC Level I Matches:',
      margin: [0, 0, 0, 8],
    },
    {
      ul: [
        `Match: ${match.matchName}`,
        `Datum: ${asDate(match.matchDatum)}`,
        `Ort / Stand: ${match.verein} (Raumschiessanlage ${match.standTiefe}m x ${match.standBreite}m)`,
        `Leitender Range Officer: ${match.rangeOfficer} (GROI-ID: ${match.groiId})`,
      ],
      margin: [0, 0, 0, 14],
    },
    {
      text:
        'Die vollstaendigen Matchunterlagen (Rahmenbeschreibung und Stage Briefings) finden Sie anbei. Ich bitte um Pruefung und Vergabe der Sanktionsnummer.',
      margin: [0, 0, 0, 18],
    },
    { text: 'Mit sportlichen Gruessen,', margin: [0, 0, 0, 22] },
    { text: match.rangeOfficer },
    sourceNote,
  ])

export const createSummaryDefinition = (match: MatchData, validation: ValidationResult): PdfDefinition => {
  const totals = validation.stageSummaries.reduce(
    (sum, stage) => ({
      paper: sum.paper + stage.anzahlPaper,
      steel: sum.steel + stage.anzahlStahl,
      rounds: sum.rounds + stage.stageSchusszahl,
    }),
    { paper: 0, steel: 0, rounds: 0 },
  )

  return documentBase([
    { text: 'Rahmenbeschreibung', style: 'h1' },
    {
      columns: [
        [
          { text: `Match: ${match.matchName}` },
          { text: `Datum: ${asDate(match.matchDatum)}` },
          { text: `Verein / Stand: ${match.verein}` },
        ],
        [
          { text: `Leitender RO: ${match.rangeOfficer}` },
          { text: `GROI-ID: ${match.groiId}` },
          { text: `Anlage: ${match.standTiefe}m x ${match.standBreite}m` },
        ],
      ],
      columnGap: 24,
      margin: [0, 0, 0, 16],
    },
    {
      table: {
        headerRows: 1,
        widths: [35, '*', 62, 44, 44, 48, 48, 64],
        body: [
          ['Stage', 'Name der Stage', 'Typ', 'Paper', 'Stahl', 'Min. Schuss', 'Wertung', 'Sicherheits-Check'].map((text) => ({
            text,
            style: 'tableHeader',
          })),
          ...validation.stageSummaries.map((stage) => [
            String(stage.stageNumber),
            stage.stageName,
            stage.courseType,
            String(stage.anzahlPaper),
            String(stage.anzahlStahl),
            String(stage.stageSchusszahl),
            'Comstock',
            stage.safetyStatus === 'OK' ? `OK (${stage.stahlAbstand}m)` : stage.safetyStatus,
          ]),
          [
            { text: 'Summe', bold: true },
            { text: `${validation.stageSummaries.length} Stages`, bold: true },
            '',
            { text: String(totals.paper), bold: true },
            { text: String(totals.steel), bold: true },
            { text: String(totals.rounds), bold: true },
            '',
            validation.canGenerate ? 'OK' : 'Fehler',
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
    { text: 'Validierungsstatus', style: 'h2' },
    {
      ul: validation.issues.map((issue) => `${issue.level.toUpperCase()}: ${issue.message}`),
    },
    sourceNote,
  ])
}

const createStagePlanSvg = (match: MatchData, stage: StageSummary) => {
  const width = 500
  const height = 220
  const pad = 28
  const plotW = width - pad * 2
  const yFor = (metersFromBackstop: number) => pad + (metersFromBackstop / match.standTiefe) * (height - pad * 2)
  const faultY = yFor(stage.schuetzenPosition)
  const steelY = yFor(stage.stahlEntfernung)
  const targetDots = Array.from({ length: stage.anzahlPaper }, (_, index) => {
    const x = pad + 35 + ((index % 6) * (plotW - 70)) / Math.max(1, Math.min(stage.anzahlPaper, 6) - 1)
    const y = pad + 24 + Math.floor(index / 6) * 20
    return `<rect x="${x - 5}" y="${y - 7}" width="10" height="14" rx="1" fill="#e9c46a" stroke="#806400" />`
  }).join('')
  const steelDots = Array.from({ length: stage.anzahlStahl }, (_, index) => {
    const x = pad + 45 + ((index % 8) * (plotW - 90)) / Math.max(1, Math.min(stage.anzahlStahl, 8) - 1)
    return `<circle cx="${x}" cy="${steelY}" r="5" fill="#9aa7b4" stroke="#526173" />`
  }).join('')

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${pad}" y="${pad}" width="${plotW}" height="${height - pad * 2}" fill="#f7fafc" stroke="#143642" stroke-width="2"/>
    ${Array.from({ length: 6 }, (_, i) => {
      const y = pad + (i * (height - pad * 2)) / 5
      return `<line x1="${pad}" x2="${width - pad}" y1="${y}" y2="${y}" stroke="#d7e0e8" stroke-width="1"/>`
    }).join('')}
    <line x1="${pad}" x2="${width - pad}" y1="${faultY}" y2="${faultY}" stroke="#d62828" stroke-width="3"/>
    <text x="${width - pad - 130}" y="${faultY - 6}" font-size="11" fill="#9d1c1c">Fault Line ${stage.schuetzenPosition}m</text>
    <line x1="${pad}" x2="${width - pad}" y1="${steelY}" y2="${steelY}" stroke="#526173" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="${pad + 8}" y="${steelY - 6}" font-size="11" fill="#526173">Steel ${stage.stahlEntfernung}m</text>
    <text x="${pad + 8}" y="${pad - 8}" font-size="11" fill="#143642">Kugelfang / Backstop</text>
    <text x="${pad + 8}" y="${height - 8}" font-size="11" fill="#143642">Rueckraum</text>
    ${targetDots}
    ${steelDots}
  </svg>`
}

export const createStageBriefingsDefinition = (match: MatchData, validation: ValidationResult): PdfDefinition =>
  documentBase(
    validation.stageSummaries.flatMap((stage, index) => {
      const content: PdfContent[] = [
        index > 0 ? { text: '', pageBreak: 'before' } : { text: '' },
        { text: `Stage ${stage.stageNumber}: ${stage.stageName}`, style: 'h1' },
        { text: `${stage.courseType} | Comstock | Minimum number of rounds required: ${stage.stageSchusszahl}`, margin: [0, 0, 0, 10] },
        {
          columns: [
            [
              { text: 'Scoring targets:', bold: true },
              { text: `${stage.anzahlPaper} IPSC Target (IT), ${stage.anzahlStahl} IPSC Metal Plate / Popper` },
              { text: 'Minimum number of rounds required:', bold: true, margin: [0, 8, 0, 0] },
              { text: String(stage.stageSchusszahl) },
              { text: 'Number of scoring hits for paper targets:', bold: true, margin: [0, 8, 0, 0] },
              { text: '2' },
            ],
            [
              { text: 'Firearm ready condition:', bold: true },
              { text: stage.firearmReadyCondition },
              { text: 'Competitor ready condition:', bold: true, margin: [0, 8, 0, 0] },
              { text: stage.competitorReadyCondition },
              { text: 'Start position:', bold: true, margin: [0, 8, 0, 0] },
              { text: stage.startPosition },
            ],
          ],
          columnGap: 24,
          margin: [0, 0, 0, 12],
        },
        {
          table: {
            widths: ['*'],
            body: [
              [{ text: 'Time starts: audible signal', bold: true, fillColor: '#eef4f7' }],
              [{ text: `Procedure: ${stage.ablauf}` }],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },
        { svg: createStagePlanSvg(match, stage), width: 500, margin: [0, 0, 0, 8] },
        {
          text: `Geometrie: vorderste Fault Line ${stage.schuetzenPosition}m vom Kugelfang, Stahl ${stage.stahlEntfernung}m vom Kugelfang, Abstand ${stage.stahlAbstand ?? '-'}m.`,
          style: 'small',
        },
      ]
      return content
    }),
  )

export const generateMatchZip = async (match: MatchData, validation: ValidationResult) => {
  const zip = new JSZip()
  const baseName = sanitizeFilePart(match.matchName)

  const documents = [
    ['01_GROI-Anschreiben.pdf', createCoverLetterDefinition(match)],
    ['02_Rahmenbeschreibung.pdf', createSummaryDefinition(match, validation)],
    ['03_Stage-Briefings.pdf', createStageBriefingsDefinition(match, validation)],
  ] as const

  const blobs = await Promise.all(documents.map(async ([name, definition]) => [name, await pdfBlob(definition)] as const))
  blobs.forEach(([name, blob]) => zip.file(name, blob))

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${baseName}_Sanktionierungsunterlagen.zip`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
