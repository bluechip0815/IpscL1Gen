import { useMemo, useState } from 'react'
import { createInitialMatch, createStage, defaultStartPositions } from './matchDefaults'
import { generateMatchZip } from './pdfService'
import type { MatchData, StageData } from './types'
import { validateMatch } from './validation'

type NumberFieldProps = {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  suffix?: string
}

const numberOrZero = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function NumberField({ label, value, min = 0, max, step = 1, onChange, suffix }: NumberFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="flex overflow-hidden rounded border border-slate-300 bg-white focus-within:border-teal-700">
        <input
          className="min-w-0 flex-1 px-3 py-2 text-slate-950 outline-none"
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(numberOrZero(event.target.value))}
        />
        {suffix ? <span className="border-l border-slate-200 bg-slate-50 px-3 py-2 text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  )
}

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}

function TextField({ label, value, onChange, type = 'text', placeholder }: TextFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <textarea
        className="min-h-24 rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function App() {
  const [match, setMatch] = useState<MatchData>(() => createInitialMatch())
  const [selectedStage, setSelectedStage] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const validation = useMemo(() => validateMatch(match), [match])
  const activeStage = match.stages[selectedStage] ?? match.stages[0]
  const activeSummary = validation.stageSummaries[selectedStage] ?? validation.stageSummaries[0]

  const updateMatch = <K extends keyof MatchData>(key: K, value: MatchData[K]) => {
    setMatch((current) => ({ ...current, [key]: value }))
  }

  const updateStage = <K extends keyof StageData>(key: K, value: StageData[K]) => {
    setMatch((current) => ({
      ...current,
      stages: current.stages.map((stage, index) => (index === selectedStage ? { ...stage, [key]: value } : stage)),
    }))
  }

  const setStageCount = (count: number) => {
    const bounded = Math.min(6, Math.max(1, Math.round(count)))
    setMatch((current) => {
      const nextStages = [...current.stages]
      while (nextStages.length < bounded) nextStages.push(createStage(nextStages.length + 1))
      return {
        ...current,
        anzahlStages: bounded,
        stages: nextStages.slice(0, bounded),
      }
    })
    setSelectedStage((current) => Math.min(current, bounded - 1))
  }

  const handleGenerate = async () => {
    if (!validation.canGenerate) return
    setIsGenerating(true)
    try {
      await generateMatchZip(match, validation)
    } catch (error) {
      console.error(error)
      window.alert('Der ZIP-Export ist fehlgeschlagen. Bitte pruefe die Eingaben und versuche es erneut.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">IPSC Level I</p>
            <h1 className="text-2xl font-semibold text-slate-950">Match-Unterlagen Generator</h1>
          </div>
          <button
            type="button"
            disabled={!validation.canGenerate || isGenerating}
            onClick={handleGenerate}
            className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isGenerating ? 'ZIP wird erstellt...' : 'PDFs als ZIP generieren'}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="grid gap-5">
          <div className="rounded border border-slate-200 bg-white p-4">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Stammdaten</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Verein / Stand" value={match.verein} onChange={(value) => updateMatch('verein', value)} />
              <TextField label="Matchname" value={match.matchName} onChange={(value) => updateMatch('matchName', value)} />
              <TextField label="Matchdatum" type="date" value={match.matchDatum} onChange={(value) => updateMatch('matchDatum', value)} />
              <TextField label="Leitender Range Officer" value={match.rangeOfficer} onChange={(value) => updateMatch('rangeOfficer', value)} />
              <TextField label="GROI-ID" value={match.groiId} onChange={(value) => updateMatch('groiId', value)} />
              <div className="min-h-[70px] rounded border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gesamtschusszahl</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{validation.stageRoundSum}</p>
                <p className="text-xs text-slate-500">Automatisch aus allen Stages berechnet</p>
              </div>
              <NumberField label="Standbreite" value={match.standBreite} min={1} step={0.1} suffix="m" onChange={(value) => updateMatch('standBreite', value)} />
              <NumberField label="Standtiefe" value={match.standTiefe} min={1} step={0.1} suffix="m" onChange={(value) => updateMatch('standTiefe', value)} />
              <NumberField label="Anzahl Stages" value={match.anzahlStages} min={1} max={6} onChange={setStageCount} />
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">Stage-Details</h2>
              <div className="flex flex-wrap gap-2">
                {match.stages.map((stage, index) => (
                  <button
                    type="button"
                    key={stage.id}
                    onClick={() => setSelectedStage(index)}
                    className={`rounded border px-3 py-1.5 text-sm font-semibold ${
                      index === selectedStage
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {activeStage ? (
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Stage Name" value={activeStage.stageName} onChange={(value) => updateStage('stageName', value)} />
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Berechnet</p>
                    <p className="mt-1 text-sm text-slate-950">
                      {activeSummary?.courseType} · {activeSummary?.stageSchusszahl ?? 0} Schuss · Stahlabstand{' '}
                      {activeSummary?.stahlAbstand ?? '-'}m
                    </p>
                  </div>
                  <NumberField label="IPSC Targets (Paper)" value={activeStage.anzahlPaper} min={0} onChange={(value) => updateStage('anzahlPaper', value)} />
                  <NumberField label="Stahl-Ziele" value={activeStage.anzahlStahl} min={0} onChange={(value) => updateStage('anzahlStahl', value)} />
                  <NumberField
                    label="Vorderste Fault Line vom Kugelfang"
                    value={activeStage.schuetzenPosition}
                    min={0}
                    max={match.standTiefe}
                    step={0.1}
                    suffix="m"
                    onChange={(value) => updateStage('schuetzenPosition', value)}
                  />
                  <NumberField
                    label="Stahllinie vom Kugelfang"
                    value={activeStage.stahlEntfernung}
                    min={0}
                    max={match.standTiefe}
                    step={0.1}
                    suffix="m"
                    onChange={(value) => updateStage('stahlEntfernung', value)}
                  />
                </div>

                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  <span>Start position</span>
                  <select
                    className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
                    value={activeStage.startPosition}
                    onChange={(event) => updateStage('startPosition', event.target.value)}
                  >
                    {defaultStartPositions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Firearm ready condition"
                    value={activeStage.firearmReadyCondition}
                    onChange={(value) => updateStage('firearmReadyCondition', value)}
                  />
                  <TextField
                    label="Competitor ready condition"
                    value={activeStage.competitorReadyCondition}
                    onChange={(value) => updateStage('competitorReadyCondition', value)}
                  />
                </div>
                <TextAreaField label="Procedure" value={activeStage.ablauf} onChange={(value) => updateStage('ablauf', value)} />
              </div>
            ) : null}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">Live-Validierung</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-red-50 px-2 py-3">
                <p className="text-2xl font-semibold text-red-700">{validation.errors.length}</p>
                <p className="text-xs text-red-900">Fehler</p>
              </div>
              <div className="rounded bg-amber-50 px-2 py-3">
                <p className="text-2xl font-semibold text-amber-700">{validation.warnings.length}</p>
                <p className="text-xs text-amber-900">Hinweise</p>
              </div>
              <div className="rounded bg-teal-50 px-2 py-3">
                <p className="text-2xl font-semibold text-teal-700">{validation.stageRoundSum}</p>
                <p className="text-xs text-teal-900">Stage-Schüsse</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {validation.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`rounded border px-3 py-2 text-sm ${
                    issue.level === 'error'
                      ? 'border-red-200 bg-red-50 text-red-900'
                      : issue.level === 'warning'
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {issue.message}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">Match-Übersicht</h2>
            <div className="mt-3 overflow-hidden rounded border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Typ</th>
                    <th className="px-2 py-2">Schuss</th>
                    <th className="px-2 py-2">Stahl</th>
                  </tr>
                </thead>
                <tbody>
                  {validation.stageSummaries.map((stage) => (
                    <tr key={stage.id} className="border-t border-slate-200">
                      <td className="px-2 py-2">{stage.stageNumber}</td>
                      <td className="px-2 py-2">{stage.courseType.replace(' Course', '')}</td>
                      <td className="px-2 py-2">{stage.stageSchusszahl}</td>
                      <td className="px-2 py-2">{stage.anzahlStahl > 0 ? `${stage.stahlAbstand}m` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default App
