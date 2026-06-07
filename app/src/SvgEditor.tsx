import { useMemo, useState } from 'react'

type EditorTool = 'paper' | 'steel' | 'barrier' | 'faultLine' | 'start'

type EditorPoint = {
  x: number
  y: number
}

type EditorLine = {
  id: string
  from: EditorPoint
  to: EditorPoint
}

type EditorDesign = {
  name: string
  paperSlots: EditorPoint[]
  steelSlots: EditorPoint[]
  barriers: EditorLine[]
  faultLine: EditorLine[]
  startPositions: EditorPoint[]
}

const editorTools: Array<{ id: EditorTool; label: string }> = [
  { id: 'paper', label: 'Paper' },
  { id: 'steel', label: 'Stahl' },
  { id: 'barrier', label: 'Barriere' },
  { id: 'faultLine', label: 'Fault Line' },
  { id: 'start', label: 'Start' },
]

const initialDesign: EditorDesign = {
  name: 'custom-stage-design',
  paperSlots: [
    { x: 0.15, y: 3.3 },
    { x: 0.5, y: 3.3 },
    { x: 0.85, y: 3.3 },
  ],
  steelSlots: [{ x: 0.5, y: 10 }],
  barriers: [{ id: crypto.randomUUID(), from: { x: 0.35, y: 6 }, to: { x: 0.35, y: 19 } }],
  faultLine: [{ id: crypto.randomUUID(), from: { x: 0, y: 20 }, to: { x: 1, y: 20 } }],
  startPositions: [{ x: 0.5, y: 22 }],
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const toSvgPoint = (point: EditorPoint, width: number, height: number, pad: number, standTiefe: number) => ({
  x: pad + clamp(point.x, 0, 1) * (width - pad * 2),
  y: pad + (clamp(point.y, 0, standTiefe) / standTiefe) * (height - pad * 2),
})

const roundPoint = (point: EditorPoint) => ({
  x: Number(point.x.toFixed(3)),
  y: Number(point.y.toFixed(1)),
})

const snapLineEnd = (from: EditorPoint, to: EditorPoint) => {
  const deltaX = Math.abs(to.x - from.x)
  const deltaY = Math.abs(to.y - from.y)

  if (deltaX >= deltaY) {
    return roundPoint({ x: to.x, y: from.y })
  }

  return roundPoint({ x: from.x, y: to.y })
}

const editorJson = (design: EditorDesign) =>
  JSON.stringify(
    {
      id: design.name.trim() || 'custom-stage-design',
      name: design.name.trim() || 'Custom Stage Design',
      description: 'Custom SVG editor design.',
      faultLine: design.faultLine.map((line) => ({
        from: [roundPoint(line.from).x, roundPoint(line.from).y],
        to: [roundPoint(line.to).x, roundPoint(line.to).y],
      })),
      barriers: design.barriers.map((line) => ({
        from: [roundPoint(line.from).x, roundPoint(line.from).y],
        to: [roundPoint(line.to).x, roundPoint(line.to).y],
      })),
      paperSlots: design.paperSlots.map(roundPoint),
      steelSlots: design.steelSlots.map(roundPoint),
      startPositions: design.startPositions.map(roundPoint),
    },
    null,
    2,
  )

const editorSvg = (design: EditorDesign, standTiefe: number, width = 640, height = 250) => {
  const pad = 30
  const plotW = width - pad * 2
  const plotH = height - pad * 2
  const lineSvg = (line: EditorLine, color: string, strokeWidth: number) => {
    const from = toSvgPoint(line.from, width, height, pad, standTiefe)
    const to = toSvgPoint(line.to, width, height, pad, standTiefe)

    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect x="${pad}" y="${pad}" width="${plotW}" height="${plotH}" fill="#f7fafc" stroke="#143642" stroke-width="2"/>
  ${Array.from({ length: 6 }, (_, index) => {
    const y = pad + (index * plotH) / 5
    return `<line x1="${pad}" x2="${width - pad}" y1="${y}" y2="${y}" stroke="#d7e0e8" stroke-width="1"/>`
  }).join('\n  ')}
  ${design.barriers.map((line) => lineSvg(line, '#16a34a', 4)).join('\n  ')}
  ${design.faultLine.map((line) => lineSvg(line, '#d62828', 3.5)).join('\n  ')}
  ${design.paperSlots
    .map((slot) => {
      const point = toSvgPoint(slot, width, height, pad, standTiefe)
      return `<rect x="${point.x - 6}" y="${point.y - 9}" width="12" height="18" rx="1.5" fill="#e9c46a" stroke="#806400"/>`
    })
    .join('\n  ')}
  ${design.steelSlots
    .map((slot) => {
      const point = toSvgPoint(slot, width, height, pad, standTiefe)
      return `<circle cx="${point.x}" cy="${point.y}" r="6" fill="#9aa7b4" stroke="#526173"/>`
    })
    .join('\n  ')}
  ${design.startPositions
    .map((slot) => {
      const point = toSvgPoint(slot, width, height, pad, standTiefe)
      return `<path d="M ${point.x - 8} ${point.y} L ${point.x} ${point.y - 10} L ${point.x + 8} ${point.y} Z" fill="#2563eb" stroke="#1e3a8a"/>`
    })
    .join('\n  ')}
  <text x="${pad + 10}" y="${pad - 8}" font-size="11" fill="#143642">Kugelfang / Backstop</text>
  <text x="${pad + 10}" y="${height - 8}" font-size="11" fill="#143642">Rueckraum</text>
</svg>`
}

const downloadText = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function SvgEditor() {
  const [design, setDesign] = useState<EditorDesign>(initialDesign)
  const [activeTool, setActiveTool] = useState<EditorTool>('paper')
  const [standTiefe, setStandTiefe] = useState(25)
  const [lineStart, setLineStart] = useState<EditorPoint | null>(null)
  const svg = useMemo(() => editorSvg(design, standTiefe), [design, standTiefe])
  const json = useMemo(() => editorJson(design), [design])

  const pointFromEvent = (event: React.MouseEvent<SVGSVGElement>): EditorPoint => {
    const rect = event.currentTarget.getBoundingClientRect()
    const pad = 30
    const x = clamp((event.clientX - rect.left - pad) / Math.max(1, rect.width - pad * 2), 0, 1)
    const y = clamp(((event.clientY - rect.top - pad) / Math.max(1, rect.height - pad * 2)) * standTiefe, 0, standTiefe)

    return roundPoint({ x, y })
  }

  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event)

    if (activeTool === 'paper') {
      setDesign((current) => ({ ...current, paperSlots: [...current.paperSlots, point] }))
      return
    }

    if (activeTool === 'steel') {
      setDesign((current) => ({ ...current, steelSlots: [...current.steelSlots, point] }))
      return
    }

    if (activeTool === 'start') {
      setDesign((current) => ({ ...current, startPositions: [...current.startPositions, point] }))
      return
    }

    if (!lineStart) {
      setLineStart(point)
      return
    }

    const line = { id: crypto.randomUUID(), from: lineStart, to: snapLineEnd(lineStart, point) }
    setDesign((current) =>
      activeTool === 'barrier'
        ? { ...current, barriers: [...current.barriers, line] }
        : { ...current, faultLine: [...current.faultLine, line] },
    )
    setLineStart(null)
  }

  const clearToolObjects = () => {
    setLineStart(null)
    setDesign((current) => {
      if (activeTool === 'paper') return { ...current, paperSlots: [] }
      if (activeTool === 'steel') return { ...current, steelSlots: [] }
      if (activeTool === 'barrier') return { ...current, barriers: [] }
      if (activeTool === 'faultLine') return { ...current, faultLine: [] }
      return { ...current, startPositions: [] }
    })
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">SVG-Editor</h2>
          <div className="flex flex-wrap gap-2">
            {editorTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool.id)
                  setLineStart(null)
                }}
                className={`rounded border px-3 py-1.5 text-sm font-semibold ${
                  activeTool === tool.id ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_160px_120px]">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Design Name</span>
            <input
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
              value={design.name}
              onChange={(event) => setDesign((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Standtiefe</span>
            <input
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
              type="number"
              min={1}
              value={standTiefe}
              onChange={(event) => setStandTiefe(clamp(Number(event.target.value) || 25, 1, 50))}
            />
          </label>
          <button type="button" onClick={clearToolObjects} className="self-end rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Auswahl leeren
          </button>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200 bg-slate-50 p-2">
          <svg viewBox="0 0 640 250" className="min-w-[640px] cursor-crosshair" onClick={handleCanvasClick}>
            <rect x="30" y="30" width="580" height="190" fill="#f7fafc" stroke="#143642" strokeWidth="2" />
            {Array.from({ length: 6 }, (_, index) => {
              const y = 30 + (index * 190) / 5
              return <line key={index} x1="30" x2="610" y1={y} y2={y} stroke="#d7e0e8" strokeWidth="1" />
            })}
            {design.barriers.map((line) => {
              const from = toSvgPoint(line.from, 640, 250, 30, standTiefe)
              const to = toSvgPoint(line.to, 640, 250, 30, standTiefe)
              return <line key={line.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
            })}
            {design.faultLine.map((line) => {
              const from = toSvgPoint(line.from, 640, 250, 30, standTiefe)
              const to = toSvgPoint(line.to, 640, 250, 30, standTiefe)
              return <line key={line.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#d62828" strokeWidth="3.5" strokeLinecap="round" />
            })}
            {design.paperSlots.map((slot, index) => {
              const point = toSvgPoint(slot, 640, 250, 30, standTiefe)
              return <rect key={`${slot.x}-${slot.y}-${index}`} x={point.x - 6} y={point.y - 9} width="12" height="18" rx="1.5" fill="#e9c46a" stroke="#806400" />
            })}
            {design.steelSlots.map((slot, index) => {
              const point = toSvgPoint(slot, 640, 250, 30, standTiefe)
              return <circle key={`${slot.x}-${slot.y}-${index}`} cx={point.x} cy={point.y} r="6" fill="#9aa7b4" stroke="#526173" />
            })}
            {design.startPositions.map((slot, index) => {
              const point = toSvgPoint(slot, 640, 250, 30, standTiefe)
              return <path key={`${slot.x}-${slot.y}-${index}`} d={`M ${point.x - 8} ${point.y} L ${point.x} ${point.y - 10} L ${point.x + 8} ${point.y} Z`} fill="#2563eb" stroke="#1e3a8a" />
            })}
            {lineStart ? (() => {
              const point = toSvgPoint(lineStart, 640, 250, 30, standTiefe)
              return <circle cx={point.x} cy={point.y} r="5" fill="#0f766e" />
            })() : null}
            <text x="42" y="22" fontSize="12" fill="#143642">Kugelfang / Backstop</text>
            <text x="42" y="238" fontSize="12" fill="#143642">Rueckraum</text>
          </svg>
        </div>
      </section>

      <aside className="grid content-start gap-5">
        <div className="rounded border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">Objekte</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700">
            <p>Paper: {design.paperSlots.length}</p>
            <p>Stahl: {design.steelSlots.length}</p>
            <p>Barrieren: {design.barriers.length}</p>
            <p>Fault Lines: {design.faultLine.length}</p>
            <p>Start: {design.startPositions.length}</p>
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">Export</h2>
          <div className="mt-3 grid gap-2">
            <button type="button" onClick={() => downloadText(`${design.name || 'stage-design'}.svg`, svg, 'image/svg+xml')} className="rounded bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">
              SVG herunterladen
            </button>
            <button type="button" onClick={() => downloadText(`${design.name || 'stage-design'}.json`, json, 'application/json')} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              JSON herunterladen
            </button>
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-950">JSON</h2>
          <textarea className="mt-3 h-72 w-full rounded border border-slate-300 bg-slate-50 p-2 font-mono text-xs text-slate-800" readOnly value={json} />
        </div>
      </aside>
    </div>
  )
}

export default SvgEditor
