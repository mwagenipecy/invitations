import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, StatsBox, Table, Badge, Button } from '../components'
import { 
  Calendar, 
  Users, 
  UserCog, 
  Mail, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  TrendingUp,
  Clock
} from 'lucide-react'
import { apiRequest } from '../utils/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalInvitees: 0,
    totalUsers: 0,
    pendingInvitations: 0
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [recentInvitees, setRecentInvitees] = useState([])
  const [systemUsers, setSystemUsers] = useState([])

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsData = await apiRequest('/dashboard/stats', {
        method: 'GET'
      })
      setStats({
        totalEvents: statsData.totalEvents || 0,
        totalInvitees: statsData.totalInvitees || 0,
        totalUsers: statsData.totalUsers || 0,
        pendingInvitations: statsData.pendingInvitations || 0
      })

      // Fetch recent events
      const eventsData = await apiRequest('/events', {
        method: 'GET'
      })
      const events = eventsData.events || eventsData || []
      const formattedEvents = events.slice(0, 5).map(event => {
        const eventDate = event.start_time ? new Date(event.start_time) : null
        return {
          id: event.id,
          title: event.title || 'Untitled Event',
          date: eventDate ? eventDate.toLocaleDateString() : 'N/A',
          status: eventDate && eventDate > new Date() ? 'upcoming' : 'completed',
          invitees: parseInt(event.total_invitees) || 0
        }
      })
      setRecentEvents(formattedEvents)

      // Fetch recent invitees
      const inviteesData = await apiRequest('/invitees/list', {
        method: 'GET'
      })
      const invitees = inviteesData.invitees || inviteesData || []
      const formattedInvitees = invitees.slice(0, 5).map(invitee => ({
        id: invitee.id,
        name: invitee.name || 'N/A',
        email: invitee.email || 'N/A',
        phone: invitee.phone || 'N/A',
        status: invitee.confirmed ? 'confirmed' : 'pending',
        event: invitee.event_title || 'N/A'
      }))
      setRecentInvitees(formattedInvitees)

      // Fetch system users
      const usersData = await apiRequest('/users', {
        method: 'GET'
      })
      const users = usersData.users || usersData || []
      const formattedUsers = users.map(userItem => ({
        id: userItem.id,
        name: userItem.name || 'N/A',
        email: userItem.email || 'N/A',
        role: userItem.role || 'user',
        status: 'active',
        lastLogin: userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'N/A'
      }))
      setSystemUsers(formattedUsers)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStats({
        totalEvents: 0,
        totalInvitees: 0,
        totalUsers: 0,
        pendingInvitations: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const eventColumns = [
    { key: 'title', label: 'Event Title', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'upcoming' ? 'info' : value === 'completed' ? 'success' : 'default'}>
          {value}
        </Badge>
      )
    },
    { key: 'invitees', label: 'Invitees', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/events/${row.id}`)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" 
            style={{ color: '#C50F11' }}
            title="View Event"
          >
            <Eye size={16} />
          </button>
        </div>
      )
    }
  ]

  const inviteeColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'event', label: 'Event', sortable: true },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'confirmed' ? 'success' : 'warning'}>
          {value}
        </Badge>
      )
    }
  ]

  const userColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'role', 
      label: 'Role',
      render: (value) => (
        <Badge variant={value === 'admin' ? 'primary' : 'default'}>
          {value}
        </Badge>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : 'default'}>
          {value}
        </Badge>
      )
    },
    { key: 'lastLogin', label: 'Last Login', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#C50F11' }}>
            <Edit size={16} />
          </button>
          {row.role !== 'admin' && (
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#C50F11' }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <p style={{ fontSize: '14px', color: '#374151' }}>Loading dashboard...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl" style={{ color: '#111827', fontSize: '20px' }}>
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1" style={{ fontSize: '14px' }}>
              Welcome back! Here's an overview of your invitation system.
            </p>
          </div>
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={() => navigate('/events')}
          >
            <Plus size={16} />
            Create Event
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsBox
            title="Total Events"
            value={stats.totalEvents}
            icon={Calendar}
            trend={stats.recentEvents || 0}
            subtitle="Total events"
            onClick={() => navigate('/events')}
          />
          <StatsBox
            title="Total Invitees"
            value={stats.totalInvitees.toLocaleString()}
            icon={Users}
            trend={0}
            subtitle="Across all events"
            onClick={() => navigate('/invitees')}
          />
          <StatsBox
            title="System Users"
            value={stats.totalUsers}
            icon={UserCog}
            trend={0}
            subtitle="Active users"
            onClick={() => navigate('/users')}
          />
          <StatsBox
            title="Pending Invitations"
            value={stats.pendingInvitations}
            icon={Mail}
            trend={0}
            subtitle="Awaiting confirmation"
            onClick={() => navigate('/invitations')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: '#C50F11', fontSize: '16px' }}>
                Recent Events
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
                View All
              </Button>
            </div>
            <Table
              columns={eventColumns}
              data={recentEvents}
              searchable={false}
              exportable={false}
              pagination={false}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: '#C50F11', fontSize: '16px' }}>
                Recent Invitees
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/invitees')}>
                View All
              </Button>
            </div>
            <Table
              columns={inviteeColumns}
              data={recentInvitees}
              searchable={false}
              exportable={false}
              pagination={false}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ color: '#C50F11', fontSize: '16px' }}>
              System Users
            </h2>
            <Button 
              variant="primary" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => navigate('/users')}
            >
              <Plus size={16} />
              Add User
            </Button>
          </div>
          <Table
            columns={userColumns}
            data={systemUsers}
            title=""
            searchable
            exportable
            pagination
            pageSize={10}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard

