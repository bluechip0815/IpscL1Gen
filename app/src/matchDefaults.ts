import type { MatchData, StageData } from './types'

export const defaultStartPositions = [
  'Standing anywhere, as demonstrated',
  'Standing inside shooting area, hands relaxed at sides',
  'Standing on position A, both feet touching marks, as demonstrated',
]

export const createStage = (index: number): StageData => ({
  id: crypto.randomUUID(),
  stageName: `Stage ${index}`,
  stageDesignId: 'open-lane',
  anzahlPaper: 5,
  anzahlStahl: 2,
  schuetzenPosition: 20,
  stahlEntfernung: 10,
  startPosition: defaultStartPositions[0],
  firearmReadyCondition: 'Loaded and holstered',
  competitorReadyCondition: 'Standing relaxed, facing downrange',
  ablauf: 'Engage all targets.',
})

export const createInitialMatch = (): MatchData => ({
  matchName: '1. Vereinsmeisterschaft IPSC',
  matchDatum: new Date().toISOString().slice(0, 10),
  verein: '',
  rangeOfficer: '',
  groiId: '',
  standBreite: 6,
  standTiefe: 25,
  anzahlStages: 3,
  stages: [createStage(1), createStage(2), createStage(3)],
})
