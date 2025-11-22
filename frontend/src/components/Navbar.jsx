import React, { useState } from 'react'
import { Bell, Search, User, LogOut, Menu } from 'lucide-react'

const Navbar = ({ onMenuClick, user }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <nav 
      className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          style={{ color: '#C50F11' }}
        >
          <Menu size={20} />
        </button>

        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            style={{ fontSize: '14px', padding: '10px 12px' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: '#374151' }}
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="hidden md:block font-medium" style={{ fontSize: '14px', color: '#374151' }}>
              {user?.name || 'User'}
            </span>
          </button>

          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowProfileMenu(false)}
              ></div>
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="font-semibold" style={{ fontSize: '14px', color: '#111827' }}>
                      {user?.name || 'User'}
                    </p>
                    <p className="text-gray-600" style={{ fontSize: '12px' }}>
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    style={{ fontSize: '14px', color: '#C50F11' }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

