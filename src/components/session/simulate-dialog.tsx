import { useState } from 'react'
import { FlaskConical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type SeedingStatus = 'idle' | 'seeding' | 'done'

interface SimulateDialogProps {
  questionCount: number
  onSimulate: (count: number) => Promise<void>
  seedingStatus: SeedingStatus
}

const PRESETS = [10, 20, 40, 80, 120, 200]

export function SimulateDialog({
  questionCount,
  onSimulate,
  seedingStatus,
}: SimulateDialogProps) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(40)
  const [result, setResult] = useState<{ participants: number; responses: number } | null>(null)

  const handleSimulate = async () => {
    setResult(null)
    try {
      await onSimulate(count)
      setResult({
        participants: count,
        responses: count * questionCount,
      })
    } catch {
      // Error toast handled by parent
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setResult(null)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Simulate
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Generate test data</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Simulate Responses</DialogTitle>
          <DialogDescription>
            Generate fake participants with realistic responses for testing. Data can be reset anytime.
          </DialogDescription>
        </DialogHeader>

        {seedingStatus === 'done' && result ? (
          <div className="py-4 text-center space-y-3">
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {result.participants} participants
            </div>
            <p className="text-sm text-muted-foreground">
              {result.responses} responses created across {questionCount} question{questionCount !== 1 ? 's' : ''}
            </p>
            <DialogFooter className="pt-2">
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Participants
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        count === n
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                This will create{' '}
                <span className="font-semibold text-foreground">{count} participants</span>{' '}
                with responses for all{' '}
                <span className="font-semibold text-foreground">{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
                <span className="text-xs block mt-1 text-muted-foreground/70">
                  ({(count * questionCount).toLocaleString()} total responses)
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSimulate}
                disabled={seedingStatus === 'seeding' || questionCount === 0}
              >
                {seedingStatus === 'seeding' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Simulating...
                  </>
                ) : (
                  'Simulate'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
