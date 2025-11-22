import React from 'react'

const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
          {label}
          {required && <span style={{ color: '#C50F11' }}> *</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-2.5 resize-y ${
          error ? 'border-red-300' : ''
        } ${className}`}
        style={{ fontSize: '14px' }}
        {...props}
      />
      {error && (
        <p className="mt-1" style={{ fontSize: '12px', color: '#C50F11' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default Textarea

