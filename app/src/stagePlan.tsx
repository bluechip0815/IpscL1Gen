import type { MatchData, StageSummary } from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const targetPositions = (count: number, minX: number, maxX: number) =>
  Array.from({ length: count }, (_, index) => {
    const visiblePerRow = Math.min(count, 6)
    const row = Math.floor(index / 6)
    const positionInRow = index % 6
    const denominator = Math.max(1, visiblePerRow - 1)

    return {
      x: minX + (positionInRow * (maxX - minX)) / denominator,
      row,
    }
  })

export const createStagePlanSvg = (match: MatchData, stage: StageSummary, width = 500, height = 220) => {
  const pad = 28
  const plotW = width - pad * 2
  const plotH = height - pad * 2
  const yFor = (metersFromBackstop: number) => pad + (clamp(metersFromBackstop, 0, match.standTiefe) / match.standTiefe) * plotH
  const faultY = yFor(stage.schuetzenPosition)
  const steelY = yFor(stage.stahlEntfernung)
  const targetDots = targetPositions(stage.anzahlPaper, pad + 45, width - pad - 45)
    .map(({ x, row }) => {
      const y = pad + 34 + row * 20
      return `<rect x="${x - 5}" y="${y - 7}" width="10" height="14" rx="1.5" fill="#e9c46a" stroke="#806400" />`
    })
    .join('')
  const steelDots = targetPositions(stage.anzahlStahl, pad + 60, width - pad - 60)
    .map(({ x, row }) => {
      const y = steelY + row * 14
      return `<circle cx="${x}" cy="${y}" r="5.5" fill="#9aa7b4" stroke="#526173" />`
    })
    .join('')

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schematische Stage-Vorschau">
    <rect x="${pad}" y="${pad}" width="${plotW}" height="${plotH}" fill="#f7fafc" stroke="#143642" stroke-width="2"/>
    ${Array.from({ length: 6 }, (_, i) => {
      const y = pad + (i * plotH) / 5
      return `<line x1="${pad}" x2="${width - pad}" y1="${y}" y2="${y}" stroke="#d7e0e8" stroke-width="1"/>`
    }).join('')}
    <line x1="${pad}" x2="${width - pad}" y1="${steelY}" y2="${steelY}" stroke="#526173" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="${pad + 10}" y="${steelY - 8}" font-size="11" fill="#526173">Steel ${stage.stahlEntfernung}m</text>
    <line x1="${pad}" x2="${width - pad}" y1="${faultY}" y2="${faultY}" stroke="#d62828" stroke-width="3"/>
    <text x="${width - pad - 150}" y="${faultY - 8}" font-size="11" fill="#b91c1c">Fault Line ${stage.schuetzenPosition}m</text>
    <text x="${pad + 10}" y="${pad - 8}" font-size="11" fill="#143642">Kugelfang / Backstop</text>
    <text x="${pad + 10}" y="${height - 8}" font-size="11" fill="#143642">Rueckraum</text>
    ${targetDots}
    ${steelDots}
  </svg>`
}

export function StagePlanPreview({ match, stage }: { match: MatchData; stage: StageSummary }) {
  return (
    <div className="overflow-x-auto bg-white px-2 py-3">
      <div
        className="mx-auto w-full min-w-[520px] max-w-[720px]"
        dangerouslySetInnerHTML={{ __html: createStagePlanSvg(match, stage, 640, 250) }}
      />
    </div>
  )
}
