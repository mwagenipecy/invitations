import React from 'react'
import { ChevronDown } from 'lucide-react'

const Select = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
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
        <select
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full appearance-none border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pl-3 pr-10 py-2.5 ${
            error ? 'border-red-300' : ''
          } ${className}`}
          style={{ fontSize: '14px', padding: '12px' }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option key={index} value={typeof option === 'object' ? option.value : option}>
              {typeof option === 'object' ? option.label : option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={16}
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

export default Select

