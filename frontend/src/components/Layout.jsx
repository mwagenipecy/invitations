import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const Layout = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:block flex-shrink-0">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      </aside>
      
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside 
            className="fixed left-0 top-0 h-full z-40 lg:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar isOpen={true} toggleSidebar={() => setMobileMenuOpen(false)} />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={toggleMobileMenu} user={user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

