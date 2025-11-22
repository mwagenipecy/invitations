import React from 'react'

const StatsBox = ({ title, value, icon: Icon, trend, subtitle, onClick }) => {
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-4 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-600" style={{ fontSize: '14px' }}>
          {title}
        </h3>
        {Icon && (
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
            <Icon size={18} style={{ color: '#C50F11' }} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="font-bold text-2xl" style={{ color: '#111827', fontSize: '24px' }}>
          {value}
        </p>
        {trend && (
          <span 
            className={`text-sm font-medium ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}
            style={{ fontSize: '12px' }}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-gray-500" style={{ fontSize: '12px' }}>
          {subtitle}
        </p>
      )}
    </Component>
  )
}

export default StatsBox

