import { getFaultLineOffset, getStageDesign } from './stageDesigns'
import type { MatchData, Point, StageDesign, StageLine, StageSummary } from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const repeatSlots = (slots: Point[], count: number) =>
  Array.from({ length: count }, (_, index) => {
    const slot = slots[index % Math.max(1, slots.length)] ?? { x: 0.5, y: 3 }
    const rowOffset = Math.floor(index / Math.max(1, slots.length)) * 0.35

    return {
      x: slot.x,
      y: slot.y + rowOffset,
    }
  })

const scalePoint = (match: MatchData, width: number, height: number, pad: number, point: Point) => ({
  x: pad + clamp(point.x, 0, 1) * (width - pad * 2),
  y: pad + (clamp(point.y, 0, match.standTiefe) / match.standTiefe) * (height - pad * 2),
})

const linePath = (match: MatchData, width: number, height: number, pad: number, line: StageLine, yOffset = 0) => {
  const from = scalePoint(match, width, height, pad, { x: line.from[0], y: line.from[1] + yOffset })
  const to = scalePoint(match, width, height, pad, { x: line.to[0], y: line.to[1] + yOffset })

  return { from, to }
}

const linesSvg = (match: MatchData, design: StageDesign, width: number, height: number, pad: number, yOffset: number) => {
  const barriers = design.barriers
    .map((barrier) => {
      const { from, to } = linePath(match, width, height, pad, barrier, yOffset)
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>`
    })
    .join('')

  const faultLines = design.faultLine
    .map((segment) => {
      const { from, to } = linePath(match, width, height, pad, segment, yOffset)
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#d62828" stroke-width="3.5" stroke-linecap="round"/>`
    })
    .join('')

  return `${barriers}${faultLines}`
}

const targetsSvg = (match: MatchData, design: StageDesign, stage: StageSummary, width: number, height: number, pad: number) => {
  const paperTargets = repeatSlots(design.paperSlots, stage.anzahlPaper)
    .map((slot) => {
      const point = scalePoint(match, width, height, pad, slot)
      return `<rect x="${point.x - 6}" y="${point.y - 9}" width="12" height="18" rx="1.5" fill="#e9c46a" stroke="#806400" />`
    })
    .join('')

  const steelTargets = repeatSlots(design.steelSlots, stage.anzahlStahl)
    .map((slot) => {
      const point = scalePoint(match, width, height, pad, slot)
      return `<circle cx="${point.x}" cy="${point.y}" r="6" fill="#9aa7b4" stroke="#526173" />`
    })
    .join('')

  return `${paperTargets}${steelTargets}`
}

export const createStagePlanSvg = (match: MatchData, stage: StageSummary, width = 500, height = 220) => {
  const design = getStageDesign(stage.stageDesignId)
  const pad = 28
  const plotW = width - pad * 2
  const plotH = height - pad * 2
  const yOffset = getFaultLineOffset(stage.stageDesignId, stage.schuetzenPosition)
  const steelLabel = scalePoint(match, width, height, pad, { x: 0.12, y: stage.stahlEntfernung })
  const deepestFaultY = Math.max(...design.faultLine.flatMap((segment) => [segment.from[1] + yOffset, segment.to[1] + yOffset]))
  const faultLabel = scalePoint(match, width, height, pad, { x: 0.7, y: deepestFaultY })

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schematische Stage-Vorschau: ${design.name}">
    <rect x="${pad}" y="${pad}" width="${plotW}" height="${plotH}" fill="#f7fafc" stroke="#143642" stroke-width="2"/>
    ${Array.from({ length: 6 }, (_, i) => {
      const y = pad + (i * plotH) / 5
      return `<line x1="${pad}" x2="${width - pad}" y1="${y}" y2="${y}" stroke="#d7e0e8" stroke-width="1"/>`
    }).join('')}
    <line x1="${pad}" x2="${width - pad}" y1="${steelLabel.y}" y2="${steelLabel.y}" stroke="#526173" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="${pad + 10}" y="${steelLabel.y - 8}" font-size="11" fill="#526173">Steel ${stage.stahlEntfernung}m</text>
    ${linesSvg(match, design, width, height, pad, yOffset)}
    ${targetsSvg(match, design, stage, width, height, pad)}
    <text x="${faultLabel.x}" y="${faultLabel.y - 8}" font-size="11" fill="#b91c1c">Fault Line ${stage.schuetzenPosition}m</text>
    <text x="${pad + 10}" y="${pad - 8}" font-size="11" fill="#143642">Kugelfang / Backstop</text>
    <text x="${pad + 10}" y="${height - 8}" font-size="11" fill="#143642">Rueckraum</text>
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
