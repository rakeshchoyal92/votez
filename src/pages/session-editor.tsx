import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Loader2, ArrowLeft, Pencil, Play, Eye, Users, Settings, BarChart3, RotateCcw } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { useSessionEditor } from '@/hooks/useSessionEditor'
import { SlideList } from '@/components/session/slide-list'
import { QuestionPreview } from '@/components/session/question-preview'
import { ContentPanel } from '@/components/session/content-panel'
import { DeleteQuestionDialog } from '@/components/session/delete-question-dialog'
import { ShareDropdown } from '@/components/session/share-dropdown'
import { SimulateDialog } from '@/components/session/simulate-dialog'
import { SessionSettingsPanel } from '@/components/session/session-settings-panel'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function SessionEditorPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const editor = useSessionEditor(sessionId as Id<'sessions'>)
  const updateStatus = useMutation(api.sessions.updateStatus)
  const [showReopenConfirm, setShowReopenConfirm] = useState(false)

  const handleReopen = async () => {
    setShowReopenConfirm(false)
    await updateStatus({
      sessionId: sessionId as Id<'sessions'>,
      status: 'active',
    })
  }

  // --- Keyboard shortcuts ---
  const isInputFocused = useCallback(() => {
    const el = document.activeElement
    if (!el) return false
    const tag = el.tagName.toLowerCase()
    if (tag === 'input' || tag === 'textarea') return true
    if ((el as HTMLElement).isContentEditable) return true
    return false
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey

      // Arrow up/down: navigate slides (only when not in input)
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !isInputFocused()) {
        e.preventDefault()
        const qs = editor.sortedQuestions
        if (qs.length === 0) return
        const currentIdx = qs.findIndex(q => q._id === editor.selectedQuestionId)
        let nextIdx: number
        if (e.key === 'ArrowUp') {
          nextIdx = currentIdx <= 0 ? qs.length - 1 : currentIdx - 1
        } else {
          nextIdx = currentIdx >= qs.length - 1 ? 0 : currentIdx + 1
        }
        editor.selectQuestion(qs[nextIdx]._id)
        return
      }

      // Cmd+S: save current question
      if (isMeta && e.key === 's') {
        e.preventDefault()
        editor.autoSaveSelectedQuestion()
        return
      }

      // Cmd+N: add new MC slide
      if (isMeta && e.key === 'n') {
        e.preventDefault()
        editor.handleAddQuestion('multiple_choice')
        return
      }

      // Cmd+D: duplicate selected slide
      if (isMeta && e.key === 'd') {
        e.preventDefault()
        if (editor.selectedQuestionId) {
          editor.handleDuplicateQuestion(editor.selectedQuestionId)
        }
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editor, isInputFocused])

  if (editor.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!editor.session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground mb-4">Session not found</p>
        <Button variant="link" asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const selectedQuestion =
    editor.sortedQuestions.find((q) => q._id === editor.selectedQuestionId) ?? null

  const slideNumber = selectedQuestion
    ? editor.sortedQuestions.findIndex((q) => q._id === selectedQuestion._id) + 1
    : undefined

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* ═══════ Top bar ═══════ */}
        <header className="h-[52px] border-b border-border/50 flex items-center justify-between px-3 flex-shrink-0 bg-background">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Back to sessions</TooltipContent>
            </Tooltip>

            {/* Breadcrumb: Dashboard / Title */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                to="/dashboard"
                className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0"
              >
                Dashboard
              </Link>
              <span className="text-muted-foreground/20 text-xs flex-shrink-0">/</span>

              {editor.editingTitle ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    editor.handleSaveTitle()
                  }}
                  className="flex-1 max-w-[240px]"
                >
                  <Input
                    value={editor.titleDraft}
                    onChange={(e) => editor.setTitleDraft(e.target.value)}
                    autoFocus
                    className="h-7 text-sm font-semibold border-primary/50 focus-visible:ring-primary/20"
                    onBlur={editor.handleSaveTitle}
                  />
                </form>
              ) : (
                <button
                  className={cn(
                    'text-sm font-semibold text-foreground truncate max-w-[200px] group text-left flex items-center gap-1.5',
                    editor.isEditable && 'hover:text-primary transition-colors cursor-pointer'
                  )}
                  onClick={editor.startEditingTitle}
                >
                  <span className="truncate">{editor.session.title}</span>
                  {editor.isEditable && (
                    <Pencil className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </button>
              )}
            </div>

            {/* Status badge */}
            <Badge
              variant={editor.statusConfig.variant}
              className="gap-1.5 text-[10px] h-[22px] px-2 flex-shrink-0"
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  editor.statusConfig.dot,
                  editor.isLive && 'animate-pulse'
                )}
              />
              {editor.statusConfig.label}
            </Badge>

            {/* Gear icon — session settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 flex-shrink-0',
                    !editor.selectedQuestionId && 'bg-muted/50'
                  )}
                  onClick={() => editor.deselectQuestion()}
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Session settings</TooltipContent>
            </Tooltip>

            {/* Progress / Participant count */}
            {editor.isLive ? (
              <div className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 flex-shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <Users className="w-3 h-3" />
                <span className="tabular-nums font-medium">{editor.stats?.participantCount ?? 0}</span>
              </div>
            ) : (
              editor.sortedQuestions.length > 0 && (
                <span className="text-[11px] text-muted-foreground/40 flex-shrink-0 tabular-nums">
                  {slideNumber ?? 0}/{editor.sortedQuestions.length} slides
                </span>
              )
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {!editor.isEnded && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ShareDropdown
                        joinUrl={editor.joinUrl}
                        code={editor.session.code}
                        onCopyUrl={editor.copyJoinUrl}
                        onCopyCode={editor.copyJoinCode}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Share</TooltipContent>
                </Tooltip>

                {import.meta.env.DEV && editor.sortedQuestions.length > 0 && (
                  <SimulateDialog
                    questionCount={editor.sortedQuestions.length}
                    onSimulate={editor.handleSeedResponses}
                    seedingStatus={editor.seedingStatus}
                  />
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-medium"
                  onClick={() => navigate(`/preview/${sessionId}`)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </Button>

                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-medium bg-primary hover:bg-primary/90 shadow-sm"
                  onClick={() => navigate(`/present/${sessionId}`)}
                >
                  <Play className="w-3.5 h-3.5" />
                  Present
                </Button>
              </>
            )}

            {editor.isEnded && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => setShowReopenConfirm(true)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reopen
              </Button>
            )}

            {(editor.isLive || editor.isEnded) && (
              <Button
                variant={editor.isEnded ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => navigate(`/session/${sessionId}/analytics`)}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Analytics
              </Button>
            )}
          </div>
        </header>

        {/* ═══════ 3-panel body ═══════ */}
        <div className="flex-1 flex min-h-0">
          {/* Left — slide list (wider) */}
          <aside className="w-[200px] lg:w-[220px] border-r border-border/40 bg-muted/[0.03] flex-shrink-0 overflow-hidden">
            <SlideList
              questions={editor.sortedQuestions}
              selectedId={editor.selectedQuestionId}
              isEditable={editor.isDraft}
              onSelect={editor.selectQuestion}
              onAddQuestion={editor.handleAddQuestion}
              onReorder={editor.isDraft ? editor.handleReorderQuestions : undefined}
              responseCounts={editor.responseCounts ?? undefined}
              activeQuestionId={editor.session.activeQuestionId ?? undefined}
              sessionStatus={editor.session.status}
              onDeselectAll={editor.deselectQuestion}
            />
          </aside>

          {/* Middle — preview with dot-grid bg */}
          <main
            className="flex-1 overflow-y-auto"
            style={{
              backgroundColor: 'hsl(var(--background))',
              backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <QuestionPreview
              question={selectedQuestion}
              joinUrl={editor.joinUrl}
              code={editor.session.code}
              questionDraft={editor.questionDraft}
              typeDraft={editor.typeDraft}
              optionsDraft={editor.optionsDraft}
              chartLayoutDraft={editor.chartLayoutDraft}
              correctAnswerDraft={editor.correctAnswerDraft}
              onQuestionDraftChange={editor.isEditable ? editor.setQuestionDraft : undefined}
              onResetResults={editor.handleResetResults}
              isEditable={editor.isEditable}
            />
          </main>

          {/* Right — content panel / session settings */}
          <aside className="w-[272px] lg:w-[296px] border-l border-border/40 flex-shrink-0 overflow-hidden bg-background">
            {selectedQuestion ? (
              <ContentPanel
                question={selectedQuestion}
                questionDraft={editor.questionDraft}
                typeDraft={editor.typeDraft}
                optionsDraft={editor.optionsDraft}
                optionImagesDraft={editor.optionImagesDraft}
                chartLayoutDraft={editor.chartLayoutDraft}
                allowMultipleDraft={editor.allowMultipleDraft}
                correctAnswerDraft={editor.correctAnswerDraft}
                showResultsDraft={editor.showResultsDraft}
                timeLimitDraft={editor.timeLimitDraft}
                onQuestionDraftChange={editor.setQuestionDraft}
                onTypeChange={editor.handleTypeChange}
                onOptionsDraftChange={editor.setOptionsDraft}
                onOptionImagesDraftChange={editor.setOptionImagesDraft}
                onChartLayoutChange={editor.setChartLayoutDraft}
                onAllowMultipleChange={editor.setAllowMultipleDraft}
                onCorrectAnswerChange={editor.setCorrectAnswerDraft}
                onShowResultsChange={editor.setShowResultsDraft}
                onTimeLimitChange={editor.setTimeLimitDraft}
                onSave={editor.handleSaveQuestion}
                onDelete={() => {
                  if (editor.selectedQuestionId) {
                    editor.handleDeleteQuestion(editor.selectedQuestionId)
                  }
                }}
                onDuplicate={
                  editor.isDraft && editor.selectedQuestionId
                    ? () => editor.handleDuplicateQuestion(editor.selectedQuestionId!)
                    : undefined
                }
                isEditable={editor.isEditable}
                isDraft={editor.isDraft}
                saveStatus={editor.saveStatus}
                slideNumber={slideNumber}
              />
            ) : (
              <SessionSettingsPanel
                brandBgColor={editor.session.brandBgColor}
                brandAccentColor={editor.session.brandAccentColor}
                brandTextColor={editor.session.brandTextColor}
                brandLogoUrl={editor.session.brandLogoUrl}
                brandBackgroundImageUrl={editor.session.brandBackgroundImageUrl}
                maxParticipants={editor.session.maxParticipants}
                isQuizMode={editor.session.isQuizMode ?? false}
                participantCount={editor.stats?.participantCount ?? 0}
                responseCount={editor.stats?.responseCount ?? 0}
                onUpdateBranding={editor.handleUpdateBranding}
                onUploadImage={editor.handleUploadImage}
                onRemoveImage={editor.handleRemoveImage}
                onChangeMaxParticipants={editor.handleChangeMaxParticipants}
                onToggleQuizMode={editor.handleToggleQuizMode}
                onResetSession={editor.handleResetSession}
              />
            )}
          </aside>
        </div>

        {/* Delete dialog */}
        {/* Delete dialog */}
        <DeleteQuestionDialog
          questionId={editor.deletingQuestionId}
          responseCount={
            editor.deletingQuestionId
              ? (editor.responseCounts?.[editor.deletingQuestionId] ?? 0)
              : 0
          }
          onConfirm={() => {
            if (editor.deletingQuestionId)
              editor.confirmDeleteQuestion(editor.deletingQuestionId)
          }}
          onCancel={() => editor.setDeletingQuestionId(null)}
        />

        {/* Reopen confirmation */}
        <AlertDialog open={showReopenConfirm} onOpenChange={setShowReopenConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reopen this session?</AlertDialogTitle>
              <AlertDialogDescription>
                The session will become live again and participants can resume submitting responses. Existing responses are preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReopen}>
                Reopen Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
