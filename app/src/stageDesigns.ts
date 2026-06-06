import centerChannel from './stageDesigns/center-channel.json'
import offsetWalls from './stageDesigns/offset-walls.json'
import openLane from './stageDesigns/open-lane.json'
import splitPorts from './stageDesigns/split-ports.json'
import type { StageDesign } from './types'

export const stageDesigns = [openLane, splitPorts, offsetWalls, centerChannel] as StageDesign[]

export const defaultStageDesignId = stageDesigns[0].id

export const getStageDesign = (id: string) => stageDesigns.find((design) => design.id === id) ?? stageDesigns[0]

export const getDeepestFaultLineDistance = (id: string) =>
  Math.max(...getStageDesign(id).faultLine.flatMap((segment) => [segment.from[1], segment.to[1]]))

export const getFaultLineOffset = (id: string, selectedDeepestDistance: number) =>
  selectedDeepestDistance - getDeepestFaultLineDistance(id)

export const getClosestFaultLineDistance = (id: string, selectedDeepestDistance: number) => {
  const offset = getFaultLineOffset(id, selectedDeepestDistance)

  return Math.min(...getStageDesign(id).faultLine.flatMap((segment) => [segment.from[1] + offset, segment.to[1] + offset]))
}
