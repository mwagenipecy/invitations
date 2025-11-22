import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Table, Button, Badge, Modal, Input, Select } from '../components'
import { Plus, Eye, Edit, Trash2, Mail, Phone, CheckCircle, XCircle, Search } from 'lucide-react'
import { apiRequest } from '../utils/api'

const Invitees = () => {
  const navigate = useNavigate()
  const [invitees, setInvitees] = useState([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvitee, setSelectedInvitee] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEvent, setFilterEvent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [newInvitee, setNewInvitee] = useState({
    name: '',
    email: '',
    phone: '',
    event_id: '',
    notes: ''
  })

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  useEffect(() => {
    fetchInvitees()
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await apiRequest('/events', {
        method: 'GET'
      })
      setEvents(response.events || response || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchInvitees = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/invitees/list', {
        method: 'GET'
      })
      setInvitees(response.invitees || response || [])
    } catch (error) {
      console.error('Error fetching invitees:', error)
      setInvitees([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvitee = async () => {
    if (!newInvitee.phone || !newInvitee.event_id) {
      alert('Phone number and Event are required')
      return
    }

    try {
      await apiRequest('/invitees', {
        method: 'POST',
        body: JSON.stringify(newInvitee)
      })
      setShowCreateModal(false)
      setNewInvitee({ name: '', email: '', phone: '', event_id: '', notes: '' })
      fetchInvitees()
    } catch (error) {
      alert(error.message || 'Failed to create invitee')
    }
  }

  const handleDeleteInvitee = async (id) => {
    if (!confirm('Are you sure you want to delete this invitee?')) return

    try {
      await apiRequest(`/invitees/${id}`, {
        method: 'DELETE'
      })
      fetchInvitees()
    } catch (error) {
      alert(error.message || 'Failed to delete invitee')
    }
  }

  const filteredInvitees = invitees.filter(invitee => {
    const matchesSearch = !searchTerm || 
      invitee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitee.phone?.includes(searchTerm)
    
    const matchesEvent = !filterEvent || invitee.event_id == filterEvent
    const matchesStatus = !filterStatus || 
      (filterStatus === 'confirmed' && invitee.confirmed) ||
      (filterStatus === 'pending' && !invitee.confirmed)
    
    return matchesSearch && matchesEvent && matchesStatus
  })

  const tableColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { 
      key: 'event_title', 
      label: 'Event', 
      render: (value, row) => value || 'N/A'
    },
    {
      key: 'confirmed',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Confirmed' : 'Pending'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/invitation?invitee_id=${row.id}`)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            style={{ color: '#C50F11' }}
            title="View Invitation"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleDeleteInvitee(row.id)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <Layout user={user}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#C50F11' }}>Invitees</h1>
            <p className="text-sm text-gray-600 mt-1">Manage event invitees</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="md"
          >
            <Plus size={16} className="mr-1" />
            Add Invitee
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
            <Select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              placeholder="Filter by Event"
              style={{ minWidth: '180px' }}
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              placeholder="Filter by Status"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500" style={{ fontSize: '14px' }}>Loading invitees...</p>
            </div>
          ) : filteredInvitees.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500" style={{ fontSize: '14px' }}>No invitees found</p>
            </div>
          ) : (
            <Table
              columns={tableColumns}
              data={filteredInvitees}
              searchable={false}
              exportable={true}
              pagination={true}
              pageSize={10}
            />
          )}
        </div>

        {showCreateModal && (
          <Modal
            title="Add New Invitee"
            onClose={() => {
              setShowCreateModal(false)
              setNewInvitee({ name: '', email: '', phone: '', event_id: '', notes: '' })
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Event <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <Select
                  value={newInvitee.event_id}
                  onChange={(e) => setNewInvitee({ ...newInvitee, event_id: e.target.value })}
                  required
                >
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Phone Number <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <Input
                  type="tel"
                  value={newInvitee.phone}
                  onChange={(e) => setNewInvitee({ ...newInvitee, phone: e.target.value })}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Name
                </label>
                <Input
                  type="text"
                  value={newInvitee.name}
                  onChange={(e) => setNewInvitee({ ...newInvitee, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Email
                </label>
                <Input
                  type="email"
                  value={newInvitee.email}
                  onChange={(e) => setNewInvitee({ ...newInvitee, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className="flex gap-3 justify-end pt-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewInvitee({ name: '', email: '', phone: '', event_id: '', notes: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateInvitee}
                >
                  Add Invitee
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  )
}

export default Invitees

