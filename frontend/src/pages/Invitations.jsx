import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Table, Button, Badge, Modal, Input, Select } from '../components'
import { Mail, Eye, Download, Send, CheckCircle, XCircle, Search } from 'lucide-react'
import { apiRequest } from '../utils/api'

const Invitations = () => {
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [selectedInvitation, setSelectedInvitation] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEvent, setFilterEvent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  useEffect(() => {
    fetchInvitations()
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

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/invitees/list', {
        method: 'GET'
      })
      const invitees = response.invitees || response || []
      setInvitations(invitees.filter(inv => inv.qr_code))
    } catch (error) {
      console.error('Error fetching invitations:', error)
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvitation = async (invitee) => {
    if (!invitee.email) {
      alert('Email is required to send invitation')
      return
    }

    try {
      await apiRequest('/invitees/send', {
        method: 'POST',
        body: JSON.stringify({
          invitee_id: invitee.id,
          event_id: invitee.event_id
        })
      })
      alert('Invitation sent successfully!')
      fetchInvitations()
    } catch (error) {
      alert(error.message || 'Failed to send invitation')
    }
  }

  const handleViewInvitation = (invitee) => {
    navigate(`/invitation?invitee_id=${invitee.id}`)
  }

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = !searchTerm || 
      invitation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.phone?.includes(searchTerm)
    
    const matchesEvent = !filterEvent || invitation.event_id == filterEvent
    const matchesStatus = !filterStatus || 
      (filterStatus === 'confirmed' && invitation.confirmed) ||
      (filterStatus === 'pending' && !invitation.confirmed)
    
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
            onClick={() => handleViewInvitation(row)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            style={{ color: '#C50F11' }}
            title="View Invitation"
          >
            <Eye size={16} />
          </button>
          {!row.email_sent && row.email && (
            <button
              onClick={() => handleSendInvitation(row)}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              style={{ color: '#C50F11' }}
              title="Send Invitation"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <Layout user={user}>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#C50F11' }}>Invitations</h1>
          <p className="text-sm text-gray-600 mt-1">Manage sent invitations</p>
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
              <p className="text-gray-500" style={{ fontSize: '14px' }}>Loading invitations...</p>
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500" style={{ fontSize: '14px' }}>No invitations found</p>
            </div>
          ) : (
            <Table
              columns={tableColumns}
              data={filteredInvitations}
              searchable={false}
              exportable={true}
              pagination={true}
              pageSize={10}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Invitations

