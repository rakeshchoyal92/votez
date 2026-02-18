import { useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  label: string
  currentUrl: string | null | undefined
  onUpload: (storageId: string) => void
  onRemove: () => void
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export function ImageUpload({ label, currentUrl, onUpload, onRemove }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl)

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only PNG, JPG, WebP, and SVG images are accepted')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image must be under 2MB')
      return
    }

    setUploading(true)
    try {
      const url = await generateUploadUrl()
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const { storageId } = await res.json()
      onUpload(storageId)
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  if (currentUrl) {
    return (
      <div className="space-y-1.5">
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">
          {label}
        </span>
        <div className="relative group rounded-lg overflow-hidden border border-border/30">
          <img
            src={currentUrl}
            alt={label}
            className="w-full h-24 object-contain bg-muted/10"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">
        {label}
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full h-20 rounded-lg border-2 border-dashed border-border/30 hover:border-primary/30 hover:bg-primary/[0.02] transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/40" />
        ) : (
          <>
            <Upload className="w-4 h-4 text-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground/40">Click to upload</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
