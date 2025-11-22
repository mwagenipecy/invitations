import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Mail, 
  QrCode, 
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: Users, label: 'Invitees', path: '/invitees' },
    { icon: Mail, label: 'Invitations', path: '/invitations' },
    { icon: QrCode, label: 'QR Scanner', path: '/scanner' },
    { icon: UserCog, label: 'Users', path: '/users' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div 
      className={`bg-white border-r border-gray-200 transition-all duration-300 h-full ${
        isOpen ? 'w-64' : 'w-16'
      }`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {isOpen && (
            <h2 className="font-bold text-lg" style={{ color: '#C50F11' }}>
              Invitation System
            </h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: '#C50F11' }}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  active 
                    ? 'font-semibold' 
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: active ? '#FEF2F2' : 'transparent',
                  color: active ? '#C50F11' : '#374151',
                  fontSize: '14px'
                }}
              >
                <Icon size={18} />
                {isOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default Sidebar

