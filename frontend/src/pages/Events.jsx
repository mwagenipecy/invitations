import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Table, Button, Badge, Modal, Input, Select, Textarea } from '../components'
import { Plus, Eye, Edit, Trash2, Calendar, MapPin, Clock } from 'lucide-react'

const Events = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: ''
  })
  const [editEvent, setEditEvent] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: ''
  })

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const response = await fetch(`${apiUrl}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || data)
      } else {
        // Mock data
        setEvents([
          {
            id: 1,
            title: 'Summer Gala 2025',
            description: 'An elegant evening celebration',
            location: 'Grand Ballroom, Hyatt Hotel',
            start_time: '2025-12-20T18:00:00',
            end_time: '2025-12-20T23:00:00',
            status: 'upcoming',
            total_invitees: 150,
            confirmed_invitees: 120
          },
          {
            id: 2,
            title: 'Annual Conference',
            description: 'Annual company conference',
            location: 'Convention Center',
            start_time: '2025-11-15T09:00:00',
            end_time: '2025-11-15T17:00:00',
            status: 'upcoming',
            total_invitees: 200,
            confirmed_invitees: 180
          },
          {
            id: 3,
            title: 'Product Launch',
            description: 'New product launch event',
            location: 'Tech Hub',
            start_time: '2025-10-10T14:00:00',
            end_time: '2025-10-10T18:00:00',
            status: 'completed',
            total_invitees: 100,
            confirmed_invitees: 95
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.location || !newEvent.start_time || !newEvent.end_time) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const response = await fetch(`${apiUrl}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateModal(false)
        setNewEvent({ title: '', description: '', location: '', start_time: '', end_time: '' })
        fetchEvents()
        alert('Event created successfully!')
      } else {
        alert(data.error || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleEditClick = (event) => {
    setSelectedEvent(event)
    // Format datetime for input fields (YYYY-MM-DDTHH:mm)
    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    setEditEvent({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      start_time: formatDateTime(event.start_time),
      end_time: formatDateTime(event.end_time)
    })
    setShowEditModal(true)
  }

  const handleUpdateEvent = async () => {
    if (!editEvent.title || !editEvent.location || !editEvent.start_time || !editEvent.end_time) {
      alert('Please fill in all required fields')
      return
    }

    if (!selectedEvent) {
      alert('No event selected')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const response = await fetch(`${apiUrl}/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editEvent)
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditModal(false)
        setSelectedEvent(null)
        setEditEvent({ title: '', description: '', location: '', start_time: '', end_time: '' })
        fetchEvents()
        alert('Event updated successfully!')
      } else {
        alert(data.error || 'Failed to update event')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getEventStatus = (event) => {
    const now = new Date()
    const startDate = new Date(event.start_time)
    const endDate = new Date(event.end_time)

    if (now > endDate) return 'completed'
    if (now > startDate && now < endDate) return 'ongoing'
    return 'upcoming'
  }

  const eventColumns = [
    { key: 'title', label: 'Event Title', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    {
      key: 'start_time',
      label: 'Start Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const status = getEventStatus(row)
        const variants = {
          upcoming: 'info',
          ongoing: 'warning',
          completed: 'success'
        }
        return <Badge variant={variants[status]}>{status}</Badge>
      }
    },
    {
      key: 'invitees',
      label: 'Invitees',
      render: (_, row) => (
        <span style={{ fontSize: '14px' }}>
          {row.confirmed_invitees || 0} / {row.total_invitees || 0}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/events/${row.id}`)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: '#C50F11' }}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEditClick(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: '#C50F11' }}
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: '#C50F11' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <p style={{ fontSize: '14px', color: '#374151' }}>Loading events...</p>
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
              Events
            </h1>
            <p className="text-gray-600 mt-1" style={{ fontSize: '14px' }}>
              Manage all your events and invitations
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={16} />
            Create Event
          </Button>
        </div>

        <Table
          columns={eventColumns}
          data={events}
          title="All Events"
          searchable
          exportable
          pagination
          pageSize={10}
        />

        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setNewEvent({ title: '', description: '', location: '', start_time: '', end_time: '' })
          }}
          title="Create New Event"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Event Title"
              placeholder="Enter event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              placeholder="Enter event description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              rows={3}
            />
            <Input
              label="Location"
              placeholder="Enter event location"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Start Time <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-2.5"
                  style={{ fontSize: '14px' }}
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  End Time <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-2.5"
                  style={{ fontSize: '14px' }}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => {
                setShowCreateModal(false)
                setNewEvent({ title: '', description: '', location: '', start_time: '', end_time: '' })
              }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateEvent}>
                Create Event
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEvent(null)
            setEditEvent({ title: '', description: '', location: '', start_time: '', end_time: '' })
          }}
          title="Edit Event"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Event Title"
              placeholder="Enter event title"
              value={editEvent.title}
              onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              placeholder="Enter event description"
              value={editEvent.description}
              onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
              rows={3}
            />
            <Input
              label="Location"
              placeholder="Enter event location"
              value={editEvent.location}
              onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Start Time <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={editEvent.start_time}
                  onChange={(e) => setEditEvent({ ...editEvent, start_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-2.5"
                  style={{ fontSize: '14px' }}
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  End Time <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={editEvent.end_time}
                  onChange={(e) => setEditEvent({ ...editEvent, end_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-2.5"
                  style={{ fontSize: '14px' }}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => {
                setShowEditModal(false)
                setSelectedEvent(null)
                setEditEvent({ title: '', description: '', location: '', start_time: '', end_time: '' })
              }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateEvent}>
                Update Event
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}

export default Events

