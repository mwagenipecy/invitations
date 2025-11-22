import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Table, Button, Badge, Input, Modal } from '../components'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Mail, 
  Phone, 
  CheckCircle, 
  XCircle,
  Plus,
  Edit,
  Trash2,
  Link,
  Copy,
  Check,
  QrCode,
  Scan,
  RefreshCw
} from 'lucide-react'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [invitees, setInvitees] = useState([])
  const [filteredInvitees, setFilteredInvitees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, confirmed, pending
  const [showAddInviteeModal, setShowAddInviteeModal] = useState(false)
  const [newInvitee, setNewInvitee] = useState({ phone: '' })
  const [linkCopied, setLinkCopied] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInData, setCheckInData] = useState({ phone: '', qr_code: '' })
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInError, setCheckInError] = useState('')
  const [checkInSuccess, setCheckInSuccess] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  useEffect(() => {
    fetchEventDetails()
    
    // Auto-refresh every 5 seconds to get latest confirmation status
    const refreshInterval = setInterval(() => {
      fetchEventDetails(true)
    }, 5000)
    
    return () => clearInterval(refreshInterval)
  }, [id])

  useEffect(() => {
    filterInvitees()
  }, [filter, invitees])

  const fetchEventDetails = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const token = localStorage.getItem('token')
      
      // Fetch event details
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const eventResponse = await fetch(`${apiUrl}/events/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setEvent(eventData.event || eventData)
      } else {
        // Mock event data
        setEvent({
          id: parseInt(id),
          title: 'Summer Gala 2025',
          description: 'An elegant evening celebration with dinner and entertainment',
          location: 'Grand Ballroom, Hyatt Hotel',
          start_time: '2025-12-20T18:00:00',
          end_time: '2025-12-20T23:00:00',
          status: 'upcoming'
        })
      }

      // Fetch invitees for this event
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const inviteesResponse = await fetch(`${apiUrl}/events/${id}/invitees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (inviteesResponse.ok) {
        const inviteesData = await inviteesResponse.json()
        const inviteesList = inviteesData.invitees || inviteesData
        // Ensure confirmed and checked_in are boolean (handle 1/0 from database)
        const formattedInvitees = inviteesList.map(inv => ({
          ...inv,
          confirmed: Boolean(inv.confirmed === 1 || inv.confirmed === true),
          checked_in: Boolean(inv.checked_in === 1 || inv.checked_in === true)
        }))
        setInvitees(formattedInvitees)
      } else {
        // Mock invitees data
        setInvitees([
          { id: 1, phone: '+255712345678', email: 'john@example.com', name: 'John Doe', confirmed: true, confirmed_at: '2025-01-15T10:30:00' },
          { id: 2, phone: '+255723456789', email: 'jane@example.com', name: 'Jane Smith', confirmed: true, confirmed_at: '2025-01-16T14:20:00' },
          { id: 3, phone: '+255734567890', email: null, name: null, confirmed: false, confirmed_at: null },
          { id: 4, phone: '+255745678901', email: 'bob@example.com', name: 'Bob Johnson', confirmed: true, confirmed_at: '2025-01-17T09:15:00' },
          { id: 5, phone: '+255756789012', email: null, name: null, confirmed: false, confirmed_at: null },
          { id: 6, phone: '+255767890123', email: 'alice@example.com', name: 'Alice Brown', confirmed: false, confirmed_at: null },
          { id: 7, phone: '+255778901234', email: 'charlie@example.com', name: 'Charlie Wilson', confirmed: true, confirmed_at: '2025-01-18T16:45:00' }
        ])
      }
    } catch (error) {
      console.error('Error fetching event details:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchEventDetails(true)
  }

  const filterInvitees = () => {
    if (filter === 'all') {
      setFilteredInvitees(invitees)
    } else if (filter === 'confirmed') {
      setFilteredInvitees(invitees.filter(inv => inv.confirmed === true || inv.confirmed === 1))
    } else if (filter === 'pending') {
      setFilteredInvitees(invitees.filter(inv => !inv.confirmed || inv.confirmed === 0 || inv.confirmed === false))
    }
  }

  const handleAddInvitee = async () => {
    if (!newInvitee.phone) {
      alert('Please enter a phone number')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const response = await fetch(`${apiUrl}/events/${id}/invitees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: newInvitee.phone })
      })

      const data = await response.json()

      if (response.ok) {
        setShowAddInviteeModal(false)
        setNewInvitee({ phone: '', email: '' })
        fetchEventDetails()
        alert('Invitee added successfully!')
      } else {
        alert(data.error || 'Failed to add invitee')
      }
    } catch (error) {
      console.error('Error adding invitee:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleCheckIn = async () => {
    if (!checkInData.phone && !checkInData.qr_code) {
      setCheckInError('Please enter phone number or QR code')
      return
    }

    setCheckInError('')
    setCheckInLoading(true)
    setCheckInSuccess(false)

    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const response = await fetch(`${apiUrl}/invitees/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: checkInData.phone || null,
          qr_code: checkInData.qr_code || null,
          event_id: parseInt(id)
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCheckInSuccess(true)
        setCheckInData({ phone: '', qr_code: '' })
        fetchEventDetails()
        setTimeout(() => {
          setShowCheckInModal(false)
          setCheckInSuccess(false)
        }, 2000)
      } else {
        setCheckInError(data.error || 'Failed to check in invitee')
      }
    } catch (error) {
      console.error('Error checking in invitee:', error)
      setCheckInError('An error occurred. Please try again.')
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleManualConfirm = async (inviteeId, confirmed) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const response = await fetch(`${apiUrl}/invitees/${inviteeId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmed })
      })

      const data = await response.json()

      if (response.ok) {
        fetchEventDetails()
        alert(confirmed ? 'Invitee confirmed successfully!' : 'Invitee confirmation removed!')
      } else {
        alert(data.error || 'Failed to update invitee')
      }
    } catch (error) {
      console.error('Error updating invitee:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleManualCheckIn = async (inviteeId, checkedIn) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '/api');
      const response = await fetch(`${apiUrl}/invitees/${inviteeId}/checkin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checked_in: checkedIn })
      })

      const data = await response.json()

      if (response.ok) {
        fetchEventDetails()
        alert(checkedIn ? 'Invitee checked in successfully!' : 'Check-in removed!')
      } else {
        alert(data.error || 'Failed to update check-in status')
      }
    } catch (error) {
      console.error('Error updating check-in status:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getEventStatus = () => {
    if (!event) return 'upcoming'
    const now = new Date()
    const startDate = new Date(event.start_time)
    const endDate = new Date(event.end_time)

    if (now > endDate) return 'completed'
    if (now > startDate && now < endDate) return 'ongoing'
    return 'upcoming'
  }

  const confirmedCount = invitees.filter(inv => inv.confirmed === true || inv.confirmed === 1).length
  const pendingCount = invitees.filter(inv => !inv.confirmed || inv.confirmed === 0 || inv.confirmed === false).length
  const checkedInCount = invitees.filter(inv => (inv.confirmed === true || inv.confirmed === 1) && (inv.checked_in === true || inv.checked_in === 1)).length

  const inviteeColumns = [
    { key: 'phone', label: 'Phone Number', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'confirmed',
      label: 'Status',
      render: (value) => {
        const isConfirmed = value === true || value === 1
        return (
          <Badge variant={isConfirmed ? 'success' : 'warning'}>
            {isConfirmed ? 'Confirmed' : 'Pending'}
          </Badge>
        )
      }
    },
    {
      key: 'confirmed_at',
      label: 'Confirmed At',
      render: (value) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      key: 'checked_in',
      label: 'Checked In',
      render: (value, row) => {
        const isCheckedIn = value === true || value === 1
        return (
          <Badge variant={isCheckedIn ? 'success' : 'secondary'}>
            {isCheckedIn ? 'Yes' : 'No'}
          </Badge>
        )
      }
    },
    {
      key: 'checked_in_at',
      label: 'Checked In At',
      render: (value) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      key: 'confirmation_link',
      label: 'Confirmation Link',
      render: (_, row) => {
        const link = `${window.location.origin}/confirm?event_id=${id}`
        return (
          <button
            onClick={() => {
              navigator.clipboard.writeText(link)
              alert('Confirmation link copied to clipboard!')
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            style={{ color: '#C50F11', fontSize: '12px' }}
            title="Copy confirmation link"
          >
            <Copy size={12} />
            Copy Link
          </button>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const isConfirmed = row.confirmed === true || row.confirmed === 1
        const isCheckedIn = row.checked_in === true || row.checked_in === 1
        return (
          <div className="flex items-center gap-2">
            {!isConfirmed ? (
              <button
                onClick={() => handleManualConfirm(row.id, true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#10B981' }}
                title="Confirm"
              >
                <CheckCircle size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleManualConfirm(row.id, false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: '#F59E0B' }}
                  title="Unconfirm"
                >
                  <XCircle size={16} />
                </button>
                {!isCheckedIn ? (
                  <button
                    onClick={() => handleManualCheckIn(row.id, true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: '#3B82F6' }}
                    title="Check In"
                  >
                    <Scan size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleManualCheckIn(row.id, false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: '#6B7280' }}
                    title="Remove Check-In"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </>
            )}
            <button
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
    }
  ]

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <p style={{ fontSize: '14px', color: '#374151' }}>Loading event details...</p>
        </div>
      </Layout>
    )
  }

  if (!event) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <p style={{ fontSize: '14px', color: '#374151' }}>Event not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/events')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Events
        </Button>

        <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-bold text-2xl" style={{ color: '#111827', fontSize: '20px' }}>
                  {event.title}
                </h1>
                <Badge variant={getEventStatus() === 'upcoming' ? 'info' : getEventStatus() === 'ongoing' ? 'warning' : 'success'}>
                  {getEventStatus()}
                </Badge>
              </div>
              {event.description && (
                <p className="text-gray-600 mb-4" style={{ fontSize: '14px' }}>
                  {event.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2"
                onClick={() => {
                  const confirmationLink = `${window.location.origin}/confirm?event_id=${id}`
                  navigator.clipboard.writeText(confirmationLink)
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                }}
              >
                {linkCopied ? (
                  <>
                    <Check size={16} />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Confirmation Link
                  </>
                )}
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <Edit size={16} />
                Edit Event
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Link size={18} style={{ color: '#C50F11', marginTop: '2px' }} />
              <div className="flex-1">
                <p className="font-semibold mb-1" style={{ fontSize: '14px', color: '#111827' }}>
                  Confirmation Link
                </p>
                <p className="text-gray-600 mb-2" style={{ fontSize: '12px' }}>
                  Share this link with invitees so they can confirm their attendance:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/confirm?event_id=${id}`}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                    style={{ fontSize: '12px' }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const confirmationLink = `${window.location.origin}/confirm?event_id=${id}`
                      navigator.clipboard.writeText(confirmationLink)
                      setLinkCopied(true)
                      setTimeout(() => setLinkCopied(false), 2000)
                    }}
                    className="flex items-center gap-1"
                  >
                    {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                <Calendar size={18} style={{ color: '#C50F11' }} />
              </div>
              <div>
                <p className="font-medium text-gray-600 mb-1" style={{ fontSize: '12px' }}>Start Date & Time</p>
                <p className="font-semibold" style={{ fontSize: '14px', color: '#111827' }}>
                  {new Date(event.start_time).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                <Clock size={18} style={{ color: '#C50F11' }} />
              </div>
              <div>
                <p className="font-medium text-gray-600 mb-1" style={{ fontSize: '12px' }}>End Date & Time</p>
                <p className="font-semibold" style={{ fontSize: '14px', color: '#111827' }}>
                  {new Date(event.end_time).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:col-span-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                <MapPin size={18} style={{ color: '#C50F11' }} />
              </div>
              <div>
                <p className="font-medium text-gray-600 mb-1" style={{ fontSize: '12px' }}>Location</p>
                <p className="font-semibold" style={{ fontSize: '14px', color: '#111827' }}>
                  {event.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="font-bold text-lg mb-2" style={{ color: '#C50F11', fontSize: '16px' }}>
                Invitees ({invitees.length})
              </h2>
              <div className="flex items-center gap-4" style={{ fontSize: '12px' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: '#10B981' }} />
                  <span className="text-gray-600">Confirmed: {confirmedCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle size={14} style={{ color: '#F59E0B' }} />
                  <span className="text-gray-600">Pending: {pendingCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scan size={14} style={{ color: '#3B82F6' }} />
                  <span className="text-gray-600">Checked In: {checkedInCount}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filter === 'all' ? 'font-semibold' : ''
                  }`}
                  style={{
                    backgroundColor: filter === 'all' ? '#FEF2F2' : 'transparent',
                    color: filter === 'all' ? '#C50F11' : '#374151',
                    fontSize: '14px'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('confirmed')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filter === 'confirmed' ? 'font-semibold' : ''
                  }`}
                  style={{
                    backgroundColor: filter === 'confirmed' ? '#FEF2F2' : 'transparent',
                    color: filter === 'confirmed' ? '#C50F11' : '#374151',
                    fontSize: '14px'
                  }}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filter === 'pending' ? 'font-semibold' : ''
                  }`}
                  style={{
                    backgroundColor: filter === 'pending' ? '#FEF2F2' : 'transparent',
                    color: filter === 'pending' ? '#C50F11' : '#374151',
                    fontSize: '14px'
                  }}
                >
                  Pending
                </button>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2"
                title="Refresh invitees list"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <Button variant="primary" onClick={() => setShowCheckInModal(true)} className="flex items-center gap-2">
                <Scan size={16} />
                Check In
              </Button>
              <Button variant="primary" onClick={() => setShowAddInviteeModal(true)} className="flex items-center gap-2">
                <Plus size={16} />
                Add Invitee
              </Button>
            </div>
          </div>

          <Table
            columns={inviteeColumns}
            data={filteredInvitees}
            title=""
            searchable
            exportable
            pagination
            pageSize={10}
          />
        </div>

        <Modal
          isOpen={showAddInviteeModal}
          onClose={() => setShowAddInviteeModal(false)}
          title="Add Invitee"
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Phone Number"
              placeholder="+255712345678"
              value={newInvitee.phone}
              onChange={(e) => setNewInvitee({ phone: e.target.value })}
              required
              icon={Phone}
            />
            <p className="text-gray-600" style={{ fontSize: '12px' }}>
              Only phone number is required. Email and name will be collected when the invitee confirms attendance.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowAddInviteeModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddInvitee}>
                Add Invitee
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showCheckInModal}
          onClose={() => {
            setShowCheckInModal(false)
            setCheckInData({ phone: '', qr_code: '' })
            setCheckInError('')
            setCheckInSuccess(false)
          }}
          title="Check In Invitee"
          size="md"
        >
          <div className="space-y-4">
            {checkInSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800" style={{ fontSize: '14px' }}>
                  ✓ Invitee checked in successfully!
                </p>
              </div>
            )}
            {checkInError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800" style={{ fontSize: '14px' }}>
                  {checkInError}
                </p>
              </div>
            )}
            <Input
              label="Phone Number"
              placeholder="+255712345678"
              value={checkInData.phone}
              onChange={(e) => {
                setCheckInData({ ...checkInData, phone: e.target.value, qr_code: '' })
                setCheckInError('')
              }}
              icon={Phone}
            />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500" style={{ fontSize: '12px' }}>OR</span>
              </div>
            </div>
            <Input
              label="QR Code"
              placeholder="Enter QR code"
              value={checkInData.qr_code}
              onChange={(e) => {
                setCheckInData({ ...checkInData, qr_code: e.target.value, phone: '' })
                setCheckInError('')
              }}
              icon={QrCode}
            />
            <p className="text-gray-600" style={{ fontSize: '12px' }}>
              Enter either phone number or QR code to check in an invitee.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowCheckInModal(false)
                  setCheckInData({ phone: '', qr_code: '' })
                  setCheckInError('')
                  setCheckInSuccess(false)
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCheckIn}
                disabled={checkInLoading || checkInSuccess}
                loading={checkInLoading}
              >
                {checkInLoading ? 'Checking In...' : 'Check In'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}

export default EventDetail

