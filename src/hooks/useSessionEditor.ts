import { useState, useMemo, useEffect, useRef } from 'react'
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
  const reorderQuestions = useMutation(api.questions.reorder)
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

  // --- Optimistic reorder state ---
  const [optimisticOrder, setOptimisticOrder] = useState<string[] | null>(null)
  const optimisticTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Clear optimistic state when server data catches up
  useEffect(() => {
    if (!optimisticOrder || !questions) return
    const serverOrder = [...questions]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((q) => q._id)
    const matches =
      serverOrder.length === optimisticOrder.length &&
      optimisticOrder.every((id, i) => serverOrder[i] === id)
    if (matches) {
      setOptimisticOrder(null)
    }
  }, [questions, optimisticOrder])

  // Safety: clear optimistic state after 3s no matter what
  useEffect(() => {
    return () => {
      if (optimisticTimeoutRef.current) clearTimeout(optimisticTimeoutRef.current)
    }
  }, [])

  // --- Computed values ---
  const isLoading = session === undefined || questions === undefined
  const joinUrl = session ? `${window.location.origin}/join/${session.code}` : ''
  const statusConfig = session ? STATUS_CONFIG[session.status] : STATUS_CONFIG.draft
  const isEditable = session?.status === 'draft'
  const isLive = session?.status === 'active'
  const isEnded = session?.status === 'ended'
  const hasData = (stats?.participantCount ?? 0) > 0 || (stats?.responseCount ?? 0) > 0

  const sortedQuestions = useMemo(() => {
    const qs = [...(questions ?? [])]
    if (optimisticOrder) {
      const orderMap = new Map(optimisticOrder.map((id, i) => [id, i]))
      return qs.sort((a, b) => (orderMap.get(a._id) ?? 0) - (orderMap.get(b._id) ?? 0))
    }
    return qs.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [questions, optimisticOrder])

  // --- Handlers ---
  const handleAddQuestion = async (type: QuestionType) => {
    const defaultOptions = type === 'multiple_choice' ? ['', ''] : undefined
    const id = await createQuestion({
      sessionId,
      title: '',
      type,
      options: defaultOptions,
    })
    setEditingQuestion(id as string)
    setQuestionDraft('')
    setOptionsDraft(defaultOptions ?? [])
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return
    const title = questionDraft.trim()
    // Filter out empty options, keep at least the non-empty ones
    const cleanedOptions = optionsDraft.map(o => o.trim()).filter(Boolean)
    await updateQuestion({
      questionId: editingQuestion as Id<'questions'>,
      title,
      options: cleanedOptions.length > 0 ? cleanedOptions : undefined,
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

  const handleReorderQuestions = (questionIds: string[]) => {
    // Optimistic: update UI immediately
    setOptimisticOrder(questionIds)

    // Safety timeout — clear optimistic state even if server never confirms
    if (optimisticTimeoutRef.current) clearTimeout(optimisticTimeoutRef.current)
    optimisticTimeoutRef.current = setTimeout(() => setOptimisticOrder(null), 3000)

    // Fire mutation (don't await — let the subscription handle the real update)
    reorderQuestions({
      sessionId,
      questionIds: questionIds as Id<'questions'>[],
    }).catch(() => {
      toast.error('Failed to reorder questions')
      setOptimisticOrder(null)
    })
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
    handleReorderQuestions,

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
