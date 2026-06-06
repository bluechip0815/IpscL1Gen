import type { CourseType, MatchData, StageSummary, ValidationIssue, ValidationResult } from './types'
import { getClosestFaultLineDistance } from './stageDesigns'

const classifyStage = (rounds: number): CourseType => {
  if (rounds <= 12) return 'Short Course'
  if (rounds <= 24) return 'Medium Course'
  return 'Long Course'
}

export const getStageRounds = (paper: number, steel: number) => paper * 2 + steel

export const validateMatch = (match: MatchData): ValidationResult => {
  const issues: ValidationIssue[] = []
  const stageSummaries: StageSummary[] = match.stages.map((stage, index) => {
    const stageSchusszahl = getStageRounds(stage.anzahlPaper, stage.anzahlStahl)
    const courseType = classifyStage(stageSchusszahl)
    const closestFaultLine = getClosestFaultLineDistance(stage.stageDesignId, stage.schuetzenPosition)
    const stahlAbstand =
      stage.anzahlStahl > 0 ? Number((closestFaultLine - stage.stahlEntfernung).toFixed(2)) : null
    const safetyStatus = stage.anzahlStahl === 0 ? 'Nicht relevant' : stahlAbstand !== null && stahlAbstand >= 8 ? 'OK' : 'Fehler'

    return {
      ...stage,
      stageNumber: index + 1,
      stageSchusszahl,
      courseType,
      stahlAbstand,
      safetyStatus,
    }
  })

  const requiredTextFields: Array<[keyof MatchData, string]> = [
    ['matchName', 'Matchname'],
    ['matchDatum', 'Matchdatum'],
    ['verein', 'Verein / Stand'],
    ['rangeOfficer', 'Leitender Range Officer'],
    ['groiId', 'GROI-ID'],
  ]

  requiredTextFields.forEach(([field, label]) => {
    if (!String(match[field]).trim()) {
      issues.push({ id: `required-${field}`, level: 'error', message: `${label} ist erforderlich.` })
    }
  })

  const stageRoundSum = stageSummaries.reduce((sum, stage) => sum + stage.stageSchusszahl, 0)

  if (stageRoundSum < 30) {
    issues.push({
      id: 'min-rounds-bds',
      level: 'error',
      message: 'Ein Level I Match erfordert mindestens 30 Schuss.',
    })
  } else if (stageRoundSum < 40) {
    issues.push({
      id: 'recommended-rounds-ipsc',
      level: 'warning',
      message: 'IPSC Appendix A1 empfiehlt für Level I Handgun mindestens 40 Schuss. Bitte mit dem Sanktionierer abstimmen.',
    })
  }

  if (match.anzahlStages < 1 || match.anzahlStages > 6) {
    issues.push({ id: 'stage-count', level: 'error', message: 'Die Anzahl der Stages muss zwischen 1 und 6 liegen.' })
  }

  if (match.standBreite <= 0 || match.standTiefe <= 0) {
    issues.push({ id: 'range-size', level: 'error', message: 'Standbreite und Standtiefe müssen größer als 0 sein.' })
  }

  stageSummaries.forEach((stage) => {
    if (!stage.stageName.trim()) {
      issues.push({ id: `stage-name-${stage.id}`, level: 'error', message: `Stage ${stage.stageNumber}: Name ist erforderlich.` })
    }

    if (stage.stageSchusszahl > 32) {
      issues.push({
        id: `stage-rounds-${stage.id}`,
        level: 'error',
        message: `Stage ${stage.stageNumber}: Ein IPSC Handgun Long Course darf nicht mehr als 32 Schuss erfordern.`,
      })
    } else if (stage.courseType === 'Long Course') {
      issues.push({
        id: `long-course-${stage.id}`,
        level: 'warning',
        message: `Stage ${stage.stageNumber}: Long Course. In einer ${match.standBreite}m breiten Anlage ist das oft schwer regelkonform zu stellen.`,
      })
    }

    if (stage.schuetzenPosition < 0 || stage.schuetzenPosition > match.standTiefe) {
      issues.push({
        id: `fault-line-range-${stage.id}`,
        level: 'error',
        message: `Stage ${stage.stageNumber}: Die vorderste Fault Line muss innerhalb der Standtiefe liegen.`,
      })
    }

    if (stage.anzahlStahl > 0) {
      if (stage.stahlEntfernung < 0 || stage.stahlEntfernung > match.standTiefe) {
        issues.push({
          id: `steel-range-${stage.id}`,
          level: 'error',
          message: `Stage ${stage.stageNumber}: Die Stahllinie muss innerhalb der Standtiefe liegen.`,
        })
      }

      if (stage.stahlAbstand !== null && stage.stahlAbstand < 7) {
        issues.push({
          id: `steel-min-${stage.id}`,
          level: 'error',
          message: `Sicherheitsfehler auf Stage ${stage.stageNumber}: Der Abstand zum Stahl beträgt ${stage.stahlAbstand}m. Laut IPSC-Regelwerk muss der Mindestabstand zu Metallzielen 7 Meter betragen.`,
        })
      } else if (stage.stahlAbstand !== null && stage.stahlAbstand < 8) {
        issues.push({
          id: `steel-faultline-${stage.id}`,
          level: 'error',
          message: `Sicherheitsfehler auf Stage ${stage.stageNumber}: Fault Lines zu Metallzielen müssen mindestens 8m entfernt sein, damit ein versehentliches Übertreten nicht unter 7m führt.`,
        })
      }
    }
  })

  issues.push({
    id: 'source-note',
    level: 'info',
    message: 'Regelbasis: GROI-Sanktionierungshinweise ab Januar 2026, IPSC Handgun Rules Januar 2026, App-interne Geometrieprüfung.',
  })

  const errors = issues.filter((issue) => issue.level === 'error')
  const warnings = issues.filter((issue) => issue.level === 'warning')
  const infos = issues.filter((issue) => issue.level === 'info')

  return {
    issues,
    stageSummaries,
    stageRoundSum,
    errors,
    warnings,
    infos,
    canGenerate: errors.length === 0,
  }
}
