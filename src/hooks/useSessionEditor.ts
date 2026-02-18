import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id, Doc } from '../../convex/_generated/dataModel'
import { toast } from 'sonner'
import { STATUS_CONFIG, type QuestionType } from '@/components/session/constants'
import type { ChartLayout } from '@/components/chart-type-selector'

type ShowResults = 'always' | 'after_submit' | 'after_close'
export type SaveStatus = 'saved' | 'unsaved' | 'saving'

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
  const updateBranding = useMutation(api.sessions.updateBranding)
  const clearBrandingImage = useMutation(api.sessions.clearBrandingImage)
  const resetSessionMutation = useMutation(api.sessions.resetSession)
  const resetResultsMutation = useMutation(api.responses.resetResults)
  const seedResponsesMutation = useMutation(api.seed.seedResponses)

  // --- Save status ---
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // --- Local UI state ---
  const [showQR, setShowQR] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [questionDraft, setQuestionDraft] = useState('')
  const [optionsDraft, setOptionsDraft] = useState<string[]>([])
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)

  // New field drafts
  const [typeDraft, setTypeDraft] = useState<QuestionType>('multiple_choice')
  const [chartLayoutDraft, setChartLayoutDraft] = useState<ChartLayout>('bars')
  const [allowMultipleDraft, setAllowMultipleDraft] = useState(false)
  const [correctAnswerDraft, setCorrectAnswerDraft] = useState<string>('')
  const [showResultsDraft, setShowResultsDraft] = useState<ShowResults>('always')
  const [timeLimitDraft, setTimeLimitDraft] = useState<number>(0)

  // 3-panel: selected question
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  // When true, user intentionally deselected to view session settings
  const [showSessionSettings, setShowSessionSettings] = useState(false)

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

  // --- 3-panel: load question data into drafts ---
  const loadQuestionDrafts = useCallback((q: Doc<'questions'>) => {
    setSelectedQuestionId(q._id)
    setTypeDraft(q.type as QuestionType)
    setQuestionDraft(q.title)
    setOptionsDraft(q.options ?? [])
    setChartLayoutDraft((q.chartLayout as ChartLayout) ?? 'bars')
    setAllowMultipleDraft(q.allowMultiple ?? false)
    setCorrectAnswerDraft(q.correctAnswer ?? '')
    setShowResultsDraft((q.showResults as ShowResults) ?? 'always')
    setTimeLimitDraft(q.timeLimit ?? 0)
  }, [])

  // --- 3-panel: auto-save current selection ---
  const autoSaveRef = useRef({
    selectedQuestionId,
    typeDraft,
    questionDraft,
    optionsDraft,
    chartLayoutDraft,
    allowMultipleDraft,
    correctAnswerDraft,
    showResultsDraft,
    timeLimitDraft,
    sortedQuestions,
    isEditable,
  })
  autoSaveRef.current = {
    selectedQuestionId,
    typeDraft,
    questionDraft,
    optionsDraft,
    chartLayoutDraft,
    allowMultipleDraft,
    correctAnswerDraft,
    showResultsDraft,
    timeLimitDraft,
    sortedQuestions,
    isEditable,
  }

  const autoSaveSelectedQuestion = useCallback(() => {
    const s = autoSaveRef.current
    if (!s.isEditable) return
    if (!s.selectedQuestionId) return

    const title = s.questionDraft.trim()
    const cleanedOptions = s.optionsDraft.map(o => o.trim()).filter(Boolean)
    const question = s.sortedQuestions.find(q => q._id === s.selectedQuestionId)
    if (!question) return
    const isMC = s.typeDraft === 'multiple_choice'

    updateQuestion({
      questionId: s.selectedQuestionId as Id<'questions'>,
      type: s.typeDraft,
      title,
      options: isMC ? cleanedOptions : undefined,
      timeLimit: s.timeLimitDraft,
      chartLayout: isMC ? s.chartLayoutDraft : undefined,
      allowMultiple: isMC ? s.allowMultipleDraft : undefined,
      correctAnswer: isMC ? s.correctAnswerDraft || undefined : undefined,
      showResults: s.showResultsDraft,
    }).catch(() => {
      toast.error('Failed to save question')
      setSaveStatus('unsaved')
    })
  }, [updateQuestion])

  // --- Debounced auto-save ---
  const debouncedAutoSave = useCallback(() => {
    setSaveStatus('unsaved')
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving')
      const s = autoSaveRef.current
      if (!s.isEditable || !s.selectedQuestionId) {
        setSaveStatus('saved')
        return
      }
      const title = s.questionDraft.trim()
      const cleanedOptions = s.optionsDraft.map(o => o.trim()).filter(Boolean)
      const question = s.sortedQuestions.find(q => q._id === s.selectedQuestionId)
      if (!question) {
        setSaveStatus('saved')
        return
      }
      const isMC = s.typeDraft === 'multiple_choice'
      updateQuestion({
        questionId: s.selectedQuestionId as Id<'questions'>,
        type: s.typeDraft,
        title,
        options: isMC ? cleanedOptions : undefined,
        timeLimit: s.timeLimitDraft,
        chartLayout: isMC ? s.chartLayoutDraft : undefined,
        allowMultiple: isMC ? s.allowMultipleDraft : undefined,
        correctAnswer: isMC ? s.correctAnswerDraft || undefined : undefined,
        showResults: s.showResultsDraft,
      }).then(() => setSaveStatus('saved'))
        .catch(() => {
          toast.error('Failed to save question')
          setSaveStatus('unsaved')
        })
    }, 2000)
  }, [updateQuestion])

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [])

  // --- Wrapped draft setters that trigger auto-save ---
  const setQuestionDraftWithAutoSave = useCallback((val: string) => {
    setQuestionDraft(val)
    debouncedAutoSave()
  }, [debouncedAutoSave])

  const setOptionsDraftWithAutoSave = useCallback((opts: string[]) => {
    setOptionsDraft(opts)
    debouncedAutoSave()
  }, [debouncedAutoSave])

  const setChartLayoutDraftWithAutoSave = useCallback((val: ChartLayout) => {
    setChartLayoutDraft(val)
    debouncedAutoSave()
  }, [debouncedAutoSave])

  const setAllowMultipleDraftWithAutoSave = useCallback((val: boolean) => {
    setAllowMultipleDraft(val)
    debouncedAutoSave()
  }, [debouncedAutoSave])

  const setCorrectAnswerDraftWithAutoSave = useCallback((val: string) => {
    setCorrectAnswerDraft(val)
    debouncedAutoSave()
  }, [debouncedAutoSave])

  const setShowResultsDraftWithAutoSave = useCallback((val: ShowResults) => {
    setShowResultsDraft(val)
    debouncedAutoSave()
  }, [debouncedAutoSave])

  const setTimeLimitDraftWithAutoSave = useCallback((val: number) => {
    setTimeLimitDraft(val)
    debouncedAutoSave()
  }, [debouncedAutoSave])

  // --- 3-panel: select a question ---
  const selectQuestion = useCallback((id: string) => {
    if (id === autoSaveRef.current.selectedQuestionId) return

    // Auto-save the current question before switching
    autoSaveSelectedQuestion()
    setShowSessionSettings(false)

    // Load the new question
    const q = autoSaveRef.current.sortedQuestions.find(q => q._id === id)
    if (q) {
      loadQuestionDrafts(q)
    }
  }, [autoSaveSelectedQuestion, loadQuestionDrafts])

  // --- 3-panel: auto-select first question ---
  useEffect(() => {
    if (sortedQuestions.length === 0) {
      if (selectedQuestionId !== null) setSelectedQuestionId(null)
      return
    }
    // Don't auto-select if user is intentionally viewing session settings
    if (showSessionSettings) return
    // If no selection, or selected question no longer exists, select first
    if (selectedQuestionId === null || !sortedQuestions.some(q => q._id === selectedQuestionId)) {
      loadQuestionDrafts(sortedQuestions[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedQuestions, showSessionSettings])

  // --- Handlers ---
  const handleAddQuestion = async (type: QuestionType) => {
    // Auto-save current before adding
    autoSaveSelectedQuestion()

    const defaultOptions = type === 'multiple_choice' ? ['', ''] : undefined
    const id = await createQuestion({
      sessionId,
      title: '',
      type,
      options: defaultOptions,
    })

    const idStr = id as string
    // Select the new question
    setSelectedQuestionId(idStr)
    setEditingQuestion(idStr)
    setTypeDraft(type)
    setQuestionDraft('')
    setOptionsDraft(defaultOptions ?? [])
    setChartLayoutDraft('bars')
    setAllowMultipleDraft(false)
    setCorrectAnswerDraft('')
    setShowResultsDraft('always')
    setTimeLimitDraft(0)
  }

  const handleTypeChange = (newType: QuestionType) => {
    const oldType = typeDraft
    if (newType === oldType) return

    setTypeDraft(newType)

    // Switching to MC: initialize default options
    if (newType === 'multiple_choice' && oldType !== 'multiple_choice') {
      setOptionsDraft(['', ''])
      setChartLayoutDraft('bars')
      setAllowMultipleDraft(false)
      setCorrectAnswerDraft('')
    }

    // Switching away from MC: clear MC-specific fields
    if (newType !== 'multiple_choice' && oldType === 'multiple_choice') {
      setOptionsDraft([])
      setChartLayoutDraft('bars')
      setAllowMultipleDraft(false)
      setCorrectAnswerDraft('')
    }

    debouncedAutoSave()
  }

  const handleDuplicateQuestion = async (questionId: string) => {
    const question = sortedQuestions.find(q => q._id === questionId)
    if (!question) return

    // Auto-save current before duplicating
    autoSaveSelectedQuestion()

    const isMC = question.type === 'multiple_choice'
    const id = await createQuestion({
      sessionId,
      title: question.title + ' (copy)',
      type: question.type as QuestionType,
      options: isMC ? question.options : undefined,
    })

    // Also update the extra fields
    const idStr = id as string
    await updateQuestion({
      questionId: idStr as Id<'questions'>,
      type: question.type as QuestionType,
      title: question.title + ' (copy)',
      options: isMC ? question.options : undefined,
      timeLimit: question.timeLimit ?? 0,
      chartLayout: isMC ? (question.chartLayout as ChartLayout) ?? 'bars' : undefined,
      allowMultiple: isMC ? question.allowMultiple ?? false : undefined,
      correctAnswer: isMC ? question.correctAnswer || undefined : undefined,
      showResults: (question.showResults as ShowResults) ?? 'always',
    }).catch(() => {})

    // Select the new question
    setSelectedQuestionId(idStr)
    setTypeDraft(question.type as QuestionType)
    setQuestionDraft(question.title + ' (copy)')
    setOptionsDraft(question.options ?? [])
    setChartLayoutDraft((question.chartLayout as ChartLayout) ?? 'bars')
    setAllowMultipleDraft(question.allowMultiple ?? false)
    setCorrectAnswerDraft(question.correctAnswer ?? '')
    setShowResultsDraft((question.showResults as ShowResults) ?? 'always')
    setTimeLimitDraft(question.timeLimit ?? 0)
    setSaveStatus('saved')

    toast.success('Question duplicated')
  }

  const handleSaveQuestion = async () => {
    const targetId = selectedQuestionId ?? editingQuestion
    if (!targetId) return

    const title = questionDraft.trim()
    const cleanedOptions = optionsDraft.map(o => o.trim()).filter(Boolean)
    const isMC = typeDraft === 'multiple_choice'

    await updateQuestion({
      questionId: targetId as Id<'questions'>,
      type: typeDraft,
      title,
      options: isMC ? cleanedOptions : undefined,
      timeLimit: timeLimitDraft,
      chartLayout: isMC ? chartLayoutDraft : undefined,
      allowMultiple: isMC ? allowMultipleDraft : undefined,
      correctAnswer: isMC ? correctAnswerDraft || undefined : undefined,
      showResults: showResultsDraft,
    })
    toast.success('Question saved')
    // Don't clear selectedQuestionId (3-panel keeps selection)
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

    // If deleting the selected question, select the next/prev one
    if (selectedQuestionId === questionId) {
      const currentIndex = sortedQuestions.findIndex(q => q._id === questionId)
      const remaining = sortedQuestions.filter(q => q._id !== questionId)
      if (remaining.length > 0) {
        const nextIndex = Math.min(currentIndex, remaining.length - 1)
        loadQuestionDrafts(remaining[nextIndex])
      } else {
        setSelectedQuestionId(null)
      }
    }

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
    setTypeDraft(question.type as QuestionType)
    setQuestionDraft(question.title)
    setOptionsDraft(question.options ?? [])
    setChartLayoutDraft((question.chartLayout as ChartLayout) ?? 'bars')
    setAllowMultipleDraft(question.allowMultiple ?? false)
    setCorrectAnswerDraft(question.correctAnswer ?? '')
    setShowResultsDraft((question.showResults as ShowResults) ?? 'always')
    setTimeLimitDraft(question.timeLimit ?? 0)
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
    setOptimisticOrder(questionIds)

    if (optimisticTimeoutRef.current) clearTimeout(optimisticTimeoutRef.current)
    optimisticTimeoutRef.current = setTimeout(() => setOptimisticOrder(null), 3000)

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

  const handleResetResults = async (questionId: string) => {
    const count = await resetResultsMutation({ questionId: questionId as Id<'questions'> })
    toast.success(`Cleared ${count} response${count !== 1 ? 's' : ''}`)
  }

  // --- Branding handlers ---
  const handleUpdateBranding = useCallback((updates: {
    brandBgColor?: string
    brandAccentColor?: string
    brandTextColor?: string
  }) => {
    updateBranding({ sessionId, ...updates })
  }, [updateBranding, sessionId])

  const handleUploadImage = useCallback((field: 'brandLogoId' | 'brandBackgroundImageId', storageId: string) => {
    updateBranding({ sessionId, [field]: storageId })
  }, [updateBranding, sessionId])

  const handleRemoveImage = useCallback((field: 'brandLogoId' | 'brandBackgroundImageId') => {
    clearBrandingImage({ sessionId, field })
  }, [clearBrandingImage, sessionId])

  const handleResetSession = useCallback(async () => {
    await resetSessionMutation({ sessionId })
    toast.success('Session data reset')
  }, [resetSessionMutation, sessionId])

  const deselectQuestion = useCallback(() => {
    autoSaveSelectedQuestion()
    setSelectedQuestionId(null)
    setShowSessionSettings(true)
  }, [autoSaveSelectedQuestion])

  // --- Seed simulation ---
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'seeding' | 'done'>('idle')

  const handleSeedResponses = async (participantCount: number) => {
    setSeedingStatus('seeding')
    try {
      const result = await seedResponsesMutation({ sessionId, participantCount })
      toast.success(`Created ${result.participantsCreated} participants with ${result.responsesCreated} responses`)
      setSeedingStatus('done')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to simulate responses')
      setSeedingStatus('idle')
      throw err
    }
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

    // Save status
    saveStatus,

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

    // Question editing (old card mode)
    editingQuestion,
    questionDraft,
    setQuestionDraft: setQuestionDraftWithAutoSave,
    optionsDraft,
    setOptionsDraft: setOptionsDraftWithAutoSave,
    startEditingQuestion,
    cancelEditingQuestion,
    handleSaveQuestion,

    // 3-panel selection
    selectedQuestionId,
    selectQuestion,
    autoSaveSelectedQuestion,

    // Type & field drafts
    typeDraft,
    handleTypeChange,
    chartLayoutDraft,
    setChartLayoutDraft: setChartLayoutDraftWithAutoSave,
    allowMultipleDraft,
    setAllowMultipleDraft: setAllowMultipleDraftWithAutoSave,
    correctAnswerDraft,
    setCorrectAnswerDraft: setCorrectAnswerDraftWithAutoSave,
    showResultsDraft,
    setShowResultsDraft: setShowResultsDraftWithAutoSave,
    timeLimitDraft,
    setTimeLimitDraft: setTimeLimitDraftWithAutoSave,

    // Question CRUD
    handleAddQuestion,
    handleDuplicateQuestion,
    handleDeleteQuestion,
    handleReorderQuestions,
    handleResetResults,

    // Delete confirmation
    deletingQuestionId,
    setDeletingQuestionId,
    confirmDeleteQuestion,

    // Share
    copyJoinCode,
    copyJoinUrl,

    // Settings
    handleChangeMaxParticipants,

    // Branding
    handleUpdateBranding,
    handleUploadImage,
    handleRemoveImage,
    handleResetSession,
    deselectQuestion,

    // Seed simulation
    seedingStatus,
    handleSeedResponses,
  }
}
