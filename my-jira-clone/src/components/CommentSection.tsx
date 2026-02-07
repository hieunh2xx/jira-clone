import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { CommentDto } from "../service/comment"
import { Send, Plus, X, Image as ImageIcon, File, Maximize2, XCircle } from "lucide-react"
import { CommentService } from "../service/comment"
import { toast } from "sonner"
import { getUserId } from "../helper/auth"
interface CommentSectionProps {
  projectId: number
  taskId: number
  comments: CommentDto[]
  onCommentsChange?: () => void
}
interface FilePreview {
  file: File
  preview: string
  type: 'image' | 'file'
}
interface ImageGalleryProps {
  images: string[]
  onClose: () => void
  initialIndex?: number
}
function ImageGallery({ images, onClose, initialIndex = 0 }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
      if (e.key === 'ArrowRight') setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length, onClose])
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <XCircle className="w-8 h-8" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
            className="absolute left-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
            className="absolute right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
          >
            →
          </button>
        </>
      )}
      <div className="max-w-7xl max-h-[90vh] flex items-center justify-center p-4">
        <img
          src={images[currentIndex]}
          alt={`Hình ảnh ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
export default function CommentSection({ projectId, taskId, comments: initialComments, onCommentsChange }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentDto[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([])
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryIndex, setGalleryIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])
  const loadComments = useCallback(async () => {
    try {
      const loadedComments = await CommentService.getAll(projectId, taskId)
      setComments(loadedComments)
      onCommentsChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải comments')
    }
  }, [projectId, taskId, onCommentsChange])
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          if (file) {
            handleFileAdd([file])
          }
        }
      }
    }
    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener('paste', handlePaste)
      return () => textarea.removeEventListener('paste', handlePaste)
    }
  }, [])
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
    }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
    }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length > 0) {
        handleFileAdd(files)
      }
    }
    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('drop', handleDrop)
    return () => {
      dropZone.removeEventListener('dragover', handleDragOver)
      dropZone.removeEventListener('dragleave', handleDragLeave)
      dropZone.removeEventListener('drop', handleDrop)
    }
  }, [])
  const handleFileAdd = (files: File[]) => {
    files.forEach((file) => {
      const isImage = file.type.startsWith('image/')
      const preview: FilePreview = {
        file,
        preview: isImage ? URL.createObjectURL(file) : '',
        type: isImage ? 'image' : 'file'
      }
      setUploadedFiles((prev) => [...prev, preview])
    })
  }
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileAdd(files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const removed = prev[index]
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() && uploadedFiles.length === 0) return
    try {
      setIsSubmitting(true)
      const userId = getUserId()
      if (!userId) {
        toast.error('Bạn cần đăng nhập để comment')
        return
      }
      const images: File[] = []
      const files: File[] = []
      uploadedFiles.forEach((fp) => {
        if (fp.type === 'image') {
          images.push(fp.file)
        } else {
          files.push(fp.file)
        }
      })
      await CommentService.create(projectId, taskId, {
        content: newComment.trim() || '',
        parentCommentId: replyTo || undefined,
        images: images.length > 0 ? images : undefined,
        files: files.length > 0 ? files : undefined,
      })
      toast.success('Đã thêm comment')
      setNewComment("")
      setUploadedFiles([])
      setReplyTo(null)
      await loadComments()
    } catch (error: any) {
      toast.error(error.message || 'Không thể thêm comment')
    } finally {
      setIsSubmitting(false)
    }
  }
  const openGallery = (images: string[], index: number) => {
    setGalleryImages(images)
    setGalleryIndex(index)
  }
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  const getAllImages = (comment: CommentDto): string[] => {
    const images: string[] = []
    if (comment.primaryImageUrl) images.push(comment.primaryImageUrl)
    if (comment.additionalImages && Array.isArray(comment.additionalImages)) {
      comment.additionalImages.forEach((img: any) => {
        if (img && img.imageUrl) images.push(img.imageUrl)
      })
    }
    return images
  }
  const renderComment = (comment: CommentDto, isReply = false) => {
    const images = getAllImages(comment)
    const hasMultipleImages = images.length > 1
    return (
      <div key={comment.id} className={`${isReply ? "ml-8 mt-3" : "mt-4"}`}>
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-medium text-white">
              {getInitials(comment.fullName || comment.username)}
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {comment.fullName || comment.username}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          {comment.content && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap">{comment.content}</p>
          )}
          {images.length > 0 && (
            <div className={`mt-2 flex flex-wrap gap-2 ${hasMultipleImages ? '' : ''}`}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative cursor-pointer group"
                  onClick={() => openGallery(images, idx)}
                >
                  <img
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className={`object-cover rounded border border-slate-200 dark:border-slate-600 transition-transform group-hover:scale-105 ${
                      hasMultipleImages ? 'w-20 h-20' : 'max-w-xs max-h-64'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {comment.files && Array.isArray(comment.files) && comment.files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {comment.files.map((file: any, idx: number) => (
                <a
                  key={idx}
                  href={file.fileUrl || file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-600 rounded text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  <File className="w-4 h-4" />
                  <span>{file.fileName || file.name || `Tệp ${idx + 1}`}</span>
                </a>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setReplyTo(comment.id)
              textareaRef.current?.focus()
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
          >
            Trả lời
          </button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div>{comment.replies.map((reply) => renderComment(reply, true))}</div>
        )}
      </div>
    )
  }
  return (
    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
      <h3 className="inline-block px-4 py-2 font-medium text-black bg-gray-100 border border-gray-300 rounded-md mb-4">
        Bình luận ({comments.length})
      </h3>
      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
        {comments && comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có bình luận nào</p>
        )}
      </div>
      {replyTo && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span>Replying to comment...</span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Hủy
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div
          ref={dropZoneRef}
          className={`relative border-2 border-dashed rounded-lg p-2 transition-colors ${isDragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-300 dark:border-slate-600'
            }`}
        >
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? "Viết trả lời..." : "Thêm bình luận... (Ctrl+V để dán hình ảnh)"}
            className="w-full px-3 py-2 border-0 bg-transparent text-slate-950 dark:text-dark placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 rounded-lg pointer-events-none">
              <p className="text-blue-600 dark:text-blue-400 font-medium">Kéo thả tệp vào đây</p>
            </div>
          )}
        </div>
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((filePreview, idx) => (
              <div key={idx} className="relative group">
                {filePreview.type === 'image' ? (
                  <div className="relative">
                    <img
                      src={filePreview.preview}
                      alt="preview"
                      className="w-24 h-24 object-cover rounded border border-slate-200 dark:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative px-3 py-2 bg-slate-200 dark:bg-slate-600 rounded text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <File className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{filePreview.file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4" />
            Attach
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </form>
    </div>
  )
}