import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id, Doc } from '../../convex/_generated/dataModel'
import { toast } from 'sonner'
import { STATUS_CONFIG, type QuestionType } from '@/components/session/constants'

export function useSessionEditor(sessionId: Id<'sessions'>) {
  // --- Queries ---
  const session = useQuery(api.sessions.get, { sessionId })
  const questions = useQuery(api.questions.listBySession, { sessionId })
  const stats = useQuery(api.sessions.getStats, { sessionId })
  const responseCounts = useQuery(api.responses.getResponseCountsBySession, { sessionId })

  // --- Mutations ---
  const createQuestion = useMutation(api.questions.create)
  const updateQuestion = useMutation(api.questions.update)
  const removeQuestion = useMutation(api.questions.remove)
  const updateTitle = useMutation(api.sessions.updateTitle)
  const updateMaxParticipants = useMutation(api.sessions.updateMaxParticipants)

  // --- Local UI state ---
  const [showQR, setShowQR] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [questionDraft, setQuestionDraft] = useState('')
  const [optionsDraft, setOptionsDraft] = useState<string[]>([])
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)

  // --- Computed values ---
  const isLoading = session === undefined || questions === undefined
  const joinUrl = session ? `${window.location.origin}/join/${session.code}` : ''
  const statusConfig = session ? STATUS_CONFIG[session.status] : STATUS_CONFIG.draft
  const isEditable = session?.status === 'draft'
  const isLive = session?.status === 'active'
  const isEnded = session?.status === 'ended'
  const hasData = (stats?.participantCount ?? 0) > 0 || (stats?.responseCount ?? 0) > 0
  const sortedQuestions = [...(questions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  // --- Handlers ---
  const handleAddQuestion = async (type: QuestionType) => {
    const defaultOptions = type === 'multiple_choice' ? ['Option 1', 'Option 2'] : undefined
    const id = await createQuestion({
      sessionId,
      title: 'Untitled Question',
      type,
      options: defaultOptions,
    })
    setEditingQuestion(id as string)
    setQuestionDraft('Untitled Question')
    setOptionsDraft(defaultOptions ?? [])
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return
    await updateQuestion({
      questionId: editingQuestion as Id<'questions'>,
      title: questionDraft,
      options: optionsDraft.length > 0 ? optionsDraft : undefined,
    })
    setEditingQuestion(null)
  }

  const handleDeleteQuestion = (questionId: string) => {
    const count = responseCounts?.[questionId] ?? 0
    if (count > 0) {
      setDeletingQuestionId(questionId)
    } else {
      confirmDeleteQuestion(questionId)
    }
  }

  const confirmDeleteQuestion = async (questionId: string) => {
    await removeQuestion({ questionId: questionId as Id<'questions'> })
    if (editingQuestion === questionId) setEditingQuestion(null)
    setDeletingQuestionId(null)
  }

  const handleSaveTitle = async () => {
    if (!titleDraft.trim()) return
    await updateTitle({ sessionId, title: titleDraft.trim() })
    setEditingTitle(false)
  }

  const startEditingTitle = () => {
    if (!isEditable || !session) return
    setEditingTitle(true)
    setTitleDraft(session.title)
  }

  const startEditingQuestion = (question: Doc<'questions'>) => {
    setEditingQuestion(question._id)
    setQuestionDraft(question.title)
    setOptionsDraft(question.options ?? [])
  }

  const cancelEditingQuestion = () => {
    setEditingQuestion(null)
  }

  const copyJoinCode = () => {
    if (!session) return
    navigator.clipboard.writeText(session.code)
    toast.success('Join code copied!')
  }

  const copyJoinUrl = () => {
    navigator.clipboard.writeText(joinUrl)
    toast.success('Join URL copied!')
  }

  const handleChangeMaxParticipants = (val: number | undefined) => {
    updateMaxParticipants({
      sessionId,
      maxParticipants: val && val > 0 ? val : undefined,
    })
  }

  return {
    // Data
    session,
    sortedQuestions,
    stats,
    responseCounts,

    // Loading
    isLoading,

    // Computed
    joinUrl,
    statusConfig,
    isEditable,
    isLive,
    isEnded,
    hasData,

    // QR & Settings
    showQR,
    setShowQR,
    showSettings,
    setShowSettings,

    // Title editing
    editingTitle,
    titleDraft,
    setTitleDraft,
    startEditingTitle,
    handleSaveTitle,

    // Question editing
    editingQuestion,
    questionDraft,
    setQuestionDraft,
    optionsDraft,
    setOptionsDraft,
    startEditingQuestion,
    cancelEditingQuestion,
    handleSaveQuestion,

    // Question CRUD
    handleAddQuestion,
    handleDeleteQuestion,

    // Delete confirmation
    deletingQuestionId,
    setDeletingQuestionId,
    confirmDeleteQuestion,

    // Share
    copyJoinCode,
    copyJoinUrl,

    // Settings
    handleChangeMaxParticipants,
  }
}
