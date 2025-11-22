import React from 'react'
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react'

const Alert = ({ type = 'info', title, message, onClose, className = '' }) => {
  const variants = {
    success: {
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#166534',
      icon: CheckCircle
    },
    error: {
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#C50F11',
      icon: XCircle
    },
    warning: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      icon: AlertCircle
    },
    info: {
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1E40AF',
      icon: Info
    }
  }

  const variant = variants[type]
  const Icon = variant.icon

  return (
    <div
      className={`rounded-lg border p-3 flex items-start gap-3 ${className}`}
      style={{
        backgroundColor: variant.bg,
        borderColor: variant.border
      }}
    >
      <Icon size={18} style={{ color: variant.text, flexShrink: 0, marginTop: '2px' }} />
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold mb-1" style={{ color: variant.text, fontSize: '14px' }}>
            {title}
          </h4>
        )}
        {message && (
          <p style={{ color: variant.text, fontSize: '14px' }}>
            {message}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0"
          style={{ color: variant.text }}
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}

export default Alert

