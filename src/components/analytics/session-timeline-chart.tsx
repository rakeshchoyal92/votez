import { useMemo, useState } from 'react'
import { getChartColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Activity, ChevronRight } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface QuestionTimeline {
  questionId: Id<'questions'>
  questionTitle: string
  responses: { answeredAt: number }[]
}

interface SessionTimelineChartProps {
  timeline: QuestionTimeline[]
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function SessionTimelineChart({ timeline }: SessionTimelineChartProps) {
  const [open, setOpen] = useState(false)
  const [hoveredDot, setHoveredDot] = useState<{
    questionLabel: string
    elapsed: string
    x: number
    y: number
  } | null>(null)

  const { lanes, timeRange, ticks } = useMemo(() => {
    // Gather all timestamps to find session range
    let min = Infinity
    let max = -Infinity
    for (const qt of timeline) {
      for (const r of qt.responses) {
        if (r.answeredAt < min) min = r.answeredAt
        if (r.answeredAt > max) max = r.answeredAt
      }
    }

    if (min === Infinity || max === min) {
      return { lanes: [], timeRange: { min: 0, max: 1 }, ticks: [] }
    }

    const range = max - min

    // Build lanes — only questions with responses
    const lanesData = timeline
      .filter((qt) => qt.responses.length > 0)
      .map((qt, i) => ({
        id: qt.questionId,
        label:
          qt.questionTitle.length > 35
            ? qt.questionTitle.slice(0, 33) + '...'
            : qt.questionTitle || 'Untitled',
        color: getChartColor(i),
        dots: qt.responses.map((r) => ({
          position: (r.answeredAt - min) / range,
          elapsed: (r.answeredAt - min) / 1000,
        })),
        responseCount: qt.responses.length,
      }))

    // Time axis ticks (5-7 marks)
    const tickCount = 6
    const ticksData = Array.from({ length: tickCount + 1 }, (_, i) => {
      const frac = i / tickCount
      const elapsed = (frac * range) / 1000
      return { position: frac, label: formatElapsed(elapsed) }
    })

    return { lanes: lanesData, timeRange: { min, max }, ticks: ticksData }
  }, [timeline])

  if (lanes.length === 0) return null

  return (
    <Card className="overflow-hidden border-border/60">
      <button
        type="button"
        className={cn(
          'w-full px-5 sm:px-6 py-4 flex items-center gap-2.5 bg-muted/20 text-left transition-colors hover:bg-muted/30',
          open && 'border-b border-border/40'
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Response Flow</h3>
          <p className="text-[11px] text-muted-foreground">
            Each dot is a response — clusters show bursts of activity
          </p>
        </div>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-muted-foreground/50 transition-transform duration-200 flex-shrink-0',
            open && 'rotate-90'
          )}
        />
      </button>

      {open && <div className="p-5 sm:p-6 relative">
        {/* Swimlanes */}
        <div className="space-y-0">
          {lanes.map((lane) => (
            <div key={lane.id} className="flex items-center gap-3 group">
              {/* Label */}
              <div className="w-[140px] sm:w-[180px] flex-shrink-0 pr-2 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: lane.color }}
                  />
                  <span className="text-[11px] text-muted-foreground truncate leading-tight">
                    {lane.label}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/40 pl-4 tabular-nums">
                  {lane.responseCount} response{lane.responseCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Track */}
              <div className="flex-1 relative h-10">
                {/* Track line */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  <div className="w-full h-px bg-border/40" />
                </div>

                {/* Dots */}
                {lane.dots.map((dot, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform duration-150 hover:scale-[2] cursor-default"
                    style={{ left: `${dot.position * 100}%` }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHoveredDot({
                        questionLabel: lane.label,
                        elapsed: formatElapsed(dot.elapsed),
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      })
                    }}
                    onMouseLeave={() => setHoveredDot(null)}
                  >
                    <div
                      className="w-[6px] h-[6px] rounded-full"
                      style={{
                        backgroundColor: lane.color,
                        boxShadow: `0 0 4px ${lane.color}60`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Time axis */}
        <div className="flex items-center gap-3 mt-1">
          <div className="w-[140px] sm:w-[180px] flex-shrink-0" />
          <div className="flex-1 relative h-5">
            {ticks.map((tick, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-muted-foreground/50 tabular-nums -translate-x-1/2"
                style={{ left: `${tick.position * 100}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {hoveredDot && (
          <div
            className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-lg border border-border bg-popover text-[11px] shadow-lg -translate-x-1/2 -translate-y-full"
            style={{
              left: hoveredDot.x,
              top: hoveredDot.y - 8,
            }}
          >
            <span className="text-foreground font-medium">At {hoveredDot.elapsed}</span>
          </div>
        )}
      </div>}
    </Card>
  )
}
