export type MatchData = {
  matchName: string
  matchDatum: string
  verein: string
  rangeOfficer: string
  groiId: string
  standBreite: number
  standTiefe: number
  anzahlStages: number
  stages: StageData[]
}

export type StageData = {
  id: string
  stageName: string
  stageDesignId: string
  anzahlPaper: number
  anzahlStahl: number
  schuetzenPosition: number
  stahlEntfernung: number
  startPosition: string
  firearmReadyCondition: string
  competitorReadyCondition: string
  ablauf: string
}

export type CourseType = 'Short Course' | 'Medium Course' | 'Long Course'

export type StageSummary = StageData & {
  stageNumber: number
  stageSchusszahl: number
  courseType: CourseType
  stahlAbstand: number | null
  safetyStatus: 'OK' | 'Nicht relevant' | 'Keine Sichtlinie' | 'Fehler'
}

export type Point = {
  /** Relative horizontal position, 0 = left edge, 1 = right edge. */
  x: number
  /** Distance from backstop in meters. */
  y: number
}

export type StageLine = {
  /** [relative x, meters from backstop] */
  from: [number, number]
  /** [relative x, meters from backstop] */
  to: [number, number]
}

export type StageDesign = {
  id: string
  name: string
  description: string
  faultLine: StageLine[]
  barriers: StageLine[]
  paperSlots: Point[]
  steelSlots: Point[]
}

export type ValidationIssue = {
  id: string
  level: 'error' | 'warning' | 'info'
  message: string
}

export type ValidationResult = {
  issues: ValidationIssue[]
  stageSummaries: StageSummary[]
  stageRoundSum: number
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  infos: ValidationIssue[]
  canGenerate: boolean
}
