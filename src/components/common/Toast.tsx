import { useState } from 'react'
import { useToastStore } from '../../stores/toastStore'
import { CheckCircle, XCircle, Info, X, Clipboard, Check } from 'lucide-react'

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info
}

const colorMap = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500'
}

const bgMap = {
  success: 'bg-green-50 dark:bg-green-900/20',
  error: 'bg-red-50 dark:bg-red-900/20',
  info: 'bg-blue-50 dark:bg-blue-900/20'
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: import('../../stores/toastStore').Toast; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const Icon = iconMap[toast.type]

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`pointer-events-auto flex flex-col w-80 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg border-l-4 ${colorMap[toast.type]} ${bgMap[toast.type]} animate-slide-up`}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${
          toast.type === 'success' ? 'text-green-500' :
          toast.type === 'error' ? 'text-red-500' : 'text-blue-500'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{toast.title}</p>
          {toast.message && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{toast.message}</p>
          )}
          {toast.linkCommand && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <code className="flex-1 text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-1 rounded text-gray-600 dark:text-gray-400 break-all">
                {toast.linkCommand}
              </code>
              <button
                onClick={() => handleCopy(toast.linkCommand!)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0"
                title="复制命令"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Clipboard className="w-3 h-3 text-gray-400" />}
              </button>
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0">
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
      {/* Countdown bar */}
      <div className="h-0.5 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
        <div className={`h-full animate-shrink origin-left ${
          toast.type === 'success' ? 'bg-green-400' :
          toast.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
        }`} />
      </div>
    </div>
  )
}
