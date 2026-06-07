import type { StageDesign } from './types'

const designModules = import.meta.glob('./stageDesigns/*.json', { eager: true }) as Record<string, { default: StageDesign }>

export const stageDesigns = Object.values(designModules)
  .map((module) => module.default)
  .sort((left, right) => left.name.localeCompare(right.name, 'de-DE'))

export const defaultStageDesignId = stageDesigns[0]?.id ?? ''

export const getStageDesign = (id: string) => stageDesigns.find((design) => design.id === id) ?? stageDesigns[0]

export const getDeepestFaultLineDistance = (id: string) =>
  Math.max(...getStageDesign(id).faultLine.flatMap((segment) => [segment.from[1], segment.to[1]]))

export const getFaultLineOffset = (id: string, selectedDeepestDistance: number) =>
  selectedDeepestDistance - getDeepestFaultLineDistance(id)

export const getClosestFaultLineDistance = (id: string, selectedDeepestDistance: number) => {
  const offset = getFaultLineOffset(id, selectedDeepestDistance)

  return Math.min(...getStageDesign(id).faultLine.flatMap((segment) => [segment.from[1] + offset, segment.to[1] + offset]))
}
