import { Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { QUESTION_TYPES, type QuestionType } from './constants'

interface AddQuestionDropdownProps {
  onAdd: (type: QuestionType) => void
  variant?: 'default' | 'dashed' | 'slide'
}

export function AddQuestionDropdown({ onAdd, variant = 'default' }: AddQuestionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'dashed' ? (
          <Button
            variant="outline"
            className="w-full py-6 h-auto border-2 border-dashed border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        ) : variant === 'slide' ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 gap-1.5 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            New slide
          </Button>
        ) : (
          <Button size="sm" className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Add Question
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        {QUESTION_TYPES.map((qt) => {
          const Icon = qt.icon
          return (
            <DropdownMenuItem
              key={qt.type}
              onClick={() => onAdd(qt.type)}
              className="flex items-start gap-3 py-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{qt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{qt.description}</div>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
