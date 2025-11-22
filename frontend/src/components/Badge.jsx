import React from 'react'

const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary text-white',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-lg ${variants[variant]} ${sizes[size]}`}
      style={{ fontSize: size === 'sm' ? '12px' : size === 'md' ? '12px' : '14px' }}
    >
      {children}
    </span>
  )
}

export default Badge

