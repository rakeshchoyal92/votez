import { ListChecks, Cloud, MessageSquare, Star } from 'lucide-react'

export type QuestionType = 'multiple_choice' | 'word_cloud' | 'open_ended' | 'rating'

export const QUESTION_TYPES: {
  type: QuestionType
  label: string
  icon: typeof ListChecks
  description: string
}[] = [
  { type: 'multiple_choice', label: 'Multiple Choice', icon: ListChecks, description: 'Pick from options' },
  { type: 'word_cloud', label: 'Word Cloud', icon: Cloud, description: 'Short text answers' },
  { type: 'open_ended', label: 'Open Ended', icon: MessageSquare, description: 'Free text responses' },
  { type: 'rating', label: 'Rating', icon: Star, description: 'Rate 1-5 stars' },
]

export const STATUS_CONFIG = {
  draft: { label: 'Draft', variant: 'secondary' as const, dot: 'bg-muted-foreground' },
  active: { label: 'Live', variant: 'success' as const, dot: 'bg-green-500' },
  ended: { label: 'Ended', variant: 'outline' as const, dot: 'bg-muted-foreground/50' },
}
