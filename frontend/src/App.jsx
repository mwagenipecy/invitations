import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import ConfirmAttendance from './pages/ConfirmAttendance'
import InvitationCard from './pages/InvitationCard'
import Invitees from './pages/Invitees'
import Invitations from './pages/Invitations'
import QRScanner from './pages/QRScanner'
import Users from './pages/Users'
import Settings from './pages/Settings'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/confirm" element={<ConfirmAttendance />} />
        <Route path="/invitation" element={<InvitationCard />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/events" 
          element={
            <PrivateRoute>
              <Events />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/events/:id" 
          element={
            <PrivateRoute>
              <EventDetail />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/invitees" 
          element={
            <PrivateRoute>
              <Invitees />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/invitations" 
          element={
            <PrivateRoute>
              <Invitations />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/scanner" 
          element={
            <PrivateRoute>
              <QRScanner />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App

