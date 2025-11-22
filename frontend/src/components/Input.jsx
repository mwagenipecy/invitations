import React from 'react'

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  required = false,
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
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            Icon ? 'pl-10' : 'pl-3'
          } pr-3 py-2.5 ${error ? 'border-red-300' : ''} ${className}`}
          style={{ fontSize: '14px', padding: '12px' }}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1" style={{ fontSize: '12px', color: '#C50F11' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default Input

