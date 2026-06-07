import { getFaultLineOffset, getStageDesign } from './stageDesigns'
import type { MatchData, Point, StageLine, StageSummary } from './types'

type MeterPoint = {
  x: number
  y: number
}

const metersFromPoint = (match: MatchData, point: Point): MeterPoint => ({
  x: point.x * match.standBreite,
  y: point.y,
})

const lineToMeters = (match: MatchData, line: StageLine, yOffset = 0) => ({
  from: {
    x: line.from[0] * match.standBreite,
    y: line.from[1] + yOffset,
  },
  to: {
    x: line.to[0] * match.standBreite,
    y: line.to[1] + yOffset,
  },
})

const distance = (from: MeterPoint, to: MeterPoint) => Math.hypot(from.x - to.x, from.y - to.y)

const orientation = (a: MeterPoint, b: MeterPoint, c: MeterPoint) => (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)

const onSegment = (a: MeterPoint, b: MeterPoint, c: MeterPoint) =>
  b.x <= Math.max(a.x, c.x) + 0.0001 &&
  b.x + 0.0001 >= Math.min(a.x, c.x) &&
  b.y <= Math.max(a.y, c.y) + 0.0001 &&
  b.y + 0.0001 >= Math.min(a.y, c.y)

const segmentsIntersect = (a: MeterPoint, b: MeterPoint, c: MeterPoint, d: MeterPoint) => {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)

  if (o1 * o2 < 0 && o3 * o4 < 0) return true
  if (Math.abs(o1) < 0.0001 && onSegment(a, c, b)) return true
  if (Math.abs(o2) < 0.0001 && onSegment(a, d, b)) return true
  if (Math.abs(o3) < 0.0001 && onSegment(c, a, d)) return true
  if (Math.abs(o4) < 0.0001 && onSegment(c, b, d)) return true

  return false
}

const sampleLine = (line: { from: MeterPoint; to: MeterPoint }, stepMeters = 0.25) => {
  const length = distance(line.from, line.to)
  const steps = Math.max(1, Math.ceil(length / stepMeters))

  return Array.from({ length: steps + 1 }, (_, index) => {
    const ratio = index / steps

    return {
      x: line.from.x + (line.to.x - line.from.x) * ratio,
      y: line.from.y + (line.to.y - line.from.y) * ratio,
    }
  })
}

const repeatSlots = (slots: Point[], count: number) =>
  Array.from({ length: count }, (_, index) => {
    const slot = slots[index % Math.max(1, slots.length)] ?? { x: 0.5, y: 3 }
    const rowOffset = Math.floor(index / Math.max(1, slots.length)) * 0.35

    return {
      x: slot.x,
      y: slot.y + rowOffset,
    }
  })

const isVisible = (from: MeterPoint, to: MeterPoint, barriers: Array<{ from: MeterPoint; to: MeterPoint }>) =>
  barriers.every((barrier) => !segmentsIntersect(from, to, barrier.from, barrier.to))

export const getVisibleSteelDistance = (match: MatchData, stage: StageSummary) => {
  if (stage.anzahlStahl <= 0) return null

  const design = getStageDesign(stage.stageDesignId)
  const yOffset = getFaultLineOffset(stage.stageDesignId, stage.schuetzenPosition)
  const barriers = design.barriers.map((barrier) => lineToMeters(match, barrier, yOffset))
  const shooterPoints = design.faultLine.flatMap((segment) => sampleLine(lineToMeters(match, segment, yOffset)))
  const steelPoints = repeatSlots(design.steelSlots, stage.anzahlStahl).map((point) => metersFromPoint(match, point))
  let minDistance = Number.POSITIVE_INFINITY

  steelPoints.forEach((steel) => {
    shooterPoints.forEach((shooter) => {
      if (!isVisible(shooter, steel, barriers)) return

      const candidate = distance(shooter, steel)
      minDistance = Math.min(minDistance, candidate)
    })
  })

  return Number.isFinite(minDistance) ? Number(minDistance.toFixed(2)) : null
}
