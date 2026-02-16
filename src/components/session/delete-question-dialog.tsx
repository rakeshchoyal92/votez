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

interface DeleteQuestionDialogProps {
  questionId: string | null
  responseCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteQuestionDialog({
  questionId,
  responseCount,
  onConfirm,
  onCancel,
}: DeleteQuestionDialogProps) {
  return (
    <AlertDialog
      open={!!questionId}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete question?</AlertDialogTitle>
          <AlertDialogDescription>
            This question has{' '}
            <span className="font-semibold text-foreground">
              {responseCount}
            </span>{' '}
            response{responseCount !== 1 ? 's' : ''}.
            Deleting it will permanently remove all responses. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
