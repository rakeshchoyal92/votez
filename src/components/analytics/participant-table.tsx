import { useState, useMemo } from 'react'
import { Search, X, ArrowUpDown, User, Users, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ParticipantRow {
  participantId: string
  name: string | null
  joinedAt: number
  questionsAnswered: number
  totalQuestions: number
  engagementRate: number
}

interface ParticipantTableProps {
  participants: ParticipantRow[]
  isLoading?: boolean
}

type SortField = 'name' | 'questionsAnswered' | 'engagementRate'
type SortDir = 'asc' | 'desc'

export function ParticipantTable({ participants, isLoading }: ParticipantTableProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('engagementRate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    let rows = [...participants]

    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((p) => (p.name || 'anonymous').toLowerCase().includes(q))
    }

    rows.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = (a.name || 'zzz').localeCompare(b.name || 'zzz')
      } else if (sortField === 'questionsAnswered') {
        cmp = a.questionsAnswered - b.questionsAnswered
      } else {
        cmp = a.engagementRate - b.engagementRate
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [participants, search, sortField, sortDir])

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="divide-y divide-border/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (participants.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <User className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No participants yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Accordion header */}
      <button
        type="button"
        className={cn(
          'w-full px-5 sm:px-6 py-4 flex items-center gap-2.5 bg-muted/20 text-left transition-colors hover:bg-muted/30',
          open && 'border-b border-border/40'
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Users className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Participant Engagement</h3>
          <p className="text-[11px] text-muted-foreground">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-muted-foreground/50 transition-transform duration-200 flex-shrink-0',
            open && 'rotate-90'
          )}
        />
      </button>

      {open && <>
      {/* Search */}
      <div className="flex items-center gap-2 p-4 border-b border-border/40">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participants..."
            className="pl-9 pr-8 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="text-left px-4 py-3">
                <SortButton
                  label="Name"
                  active={sortField === 'name'}
                  dir={sortField === 'name' ? sortDir : undefined}
                  onClick={() => toggleSort('name')}
                />
              </th>
              <th className="text-left px-4 py-3">
                <SortButton
                  label="Answered"
                  active={sortField === 'questionsAnswered'}
                  dir={sortField === 'questionsAnswered' ? sortDir : undefined}
                  onClick={() => toggleSort('questionsAnswered')}
                />
              </th>
              <th className="text-left px-4 py-3 min-w-[200px]">
                <SortButton
                  label="Engagement"
                  active={sortField === 'engagementRate'}
                  dir={sortField === 'engagementRate' ? sortDir : undefined}
                  onClick={() => toggleSort('engagementRate')}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((p) => (
              <tr key={p.participantId} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className={cn('text-sm', p.name ? 'font-medium text-foreground' : 'text-muted-foreground italic')}>
                      {p.name || 'Anonymous'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm tabular-nums">
                    {p.questionsAnswered}/{p.totalQuestions}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          p.engagementRate >= 0.8
                            ? 'bg-emerald-500'
                            : p.engagementRate >= 0.5
                              ? 'bg-amber-500'
                              : 'bg-red-400'
                        )}
                        style={{ width: `${Math.round(p.engagementRate * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium tabular-nums w-10 text-right">
                      {Math.round(p.engagementRate * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>}
    </Card>
  )
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir?: SortDir
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-auto px-0 py-0 font-medium text-xs uppercase tracking-wider hover:bg-transparent', active && 'text-foreground')}
      onClick={onClick}
    >
      {label}
      <ArrowUpDown className={cn('ml-1 h-3 w-3', active ? 'opacity-100' : 'opacity-40')} />
    </Button>
  )
}
