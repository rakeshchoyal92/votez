import { useParams, Link } from 'react-router-dom'
import { Loader2, HelpCircle, Users, BarChart3 } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { useSessionEditor } from '@/hooks/useSessionEditor'
import { SessionHeader } from '@/components/session/session-header'
import { ShareBar } from '@/components/session/share-bar'
import { SettingsPanel } from '@/components/session/settings-panel'
import { QuestionsSection } from '@/components/session/questions-tab'
import { ResultsSection } from '@/components/session/results-tab'
import { AddQuestionDropdown } from '@/components/session/add-question-dropdown'
import { DeleteQuestionDialog } from '@/components/session/delete-question-dialog'

export function SessionEditorPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const editor = useSessionEditor(sessionId as Id<'sessions'>)

  if (editor.isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!editor.session) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-muted-foreground mb-4">Session not found</p>
        <Button variant="link" asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <SessionHeader
        title={editor.session.title}
        isEditable={editor.isEditable}
        isLive={editor.isLive}
        isEnded={editor.isEnded}
        editingTitle={editor.editingTitle}
        titleDraft={editor.titleDraft}
        statusConfig={editor.statusConfig}
        onEditTitle={editor.startEditingTitle}
        onTitleChange={editor.setTitleDraft}
        onSaveTitle={editor.handleSaveTitle}
      />

      {/* Share bar — for draft/active */}
      {!editor.isEnded && (
        <ShareBar
          code={editor.session.code}
          showQR={editor.showQR}
          showSettings={editor.showSettings}
          hasData={editor.hasData}
          stats={editor.stats ?? null}
          onCopyCode={editor.copyJoinCode}
          onToggleQR={() => editor.setShowQR(!editor.showQR)}
          onToggleSettings={() => editor.setShowSettings(!editor.showSettings)}
        />
      )}

      {/* Stats bar for ended sessions */}
      {editor.isEnded && editor.hasData && editor.stats && (
        <div className="flex items-center gap-6 mb-6 px-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            <span className="font-medium tabular-nums">{editor.stats.questionCount}</span>
            <span>questions</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="font-medium tabular-nums">{editor.stats.participantCount}</span>
            <span>participants</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium tabular-nums">{editor.stats.responseCount}</span>
            <span>responses</span>
          </div>
        </div>
      )}

      {/* Settings panel (expandable) */}
      {editor.showSettings && (
        <SettingsPanel
          showQR={editor.showQR}
          joinUrl={editor.joinUrl}
          maxParticipants={editor.session.maxParticipants}
          onCopyUrl={editor.copyJoinUrl}
          onChangeMaxParticipants={editor.handleChangeMaxParticipants}
        />
      )}

      {/* Draft: editable questions list */}
      {editor.isEditable && (
        <>
          {editor.sortedQuestions.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Questions
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({editor.sortedQuestions.length})
                </span>
              </h2>
              <AddQuestionDropdown onAdd={editor.handleAddQuestion} />
            </div>
          )}
          <QuestionsSection
            isEditable={editor.isEditable}
            isLive={editor.isLive}
            isEnded={editor.isEnded}
            sortedQuestions={editor.sortedQuestions}
            editingQuestion={editor.editingQuestion}
            questionDraft={editor.questionDraft}
            optionsDraft={editor.optionsDraft}
            responseCounts={editor.responseCounts}
            onAddQuestion={editor.handleAddQuestion}
            onStartEdit={editor.startEditingQuestion}
            onCancelEdit={editor.cancelEditingQuestion}
            onQuestionDraftChange={editor.setQuestionDraft}
            onOptionsDraftChange={editor.setOptionsDraft}
            onSaveQuestion={editor.handleSaveQuestion}
            onDeleteQuestion={editor.handleDeleteQuestion}
            onReorderQuestions={editor.handleReorderQuestions}
          />
        </>
      )}

      {/* Active / Ended: results view */}
      {!editor.isEditable && (
        <ResultsSection sortedQuestions={editor.sortedQuestions} />
      )}

      {/* Delete question confirmation */}
      <DeleteQuestionDialog
        questionId={editor.deletingQuestionId}
        responseCount={
          editor.deletingQuestionId
            ? (editor.responseCounts?.[editor.deletingQuestionId] ?? 0)
            : 0
        }
        onConfirm={() => {
          if (editor.deletingQuestionId) editor.confirmDeleteQuestion(editor.deletingQuestionId)
        }}
        onCancel={() => editor.setDeletingQuestionId(null)}
      />
    </div>
  )
}
