import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, Phone, User, CheckCircle, AlertCircle, Calendar, MapPin, Clock } from 'lucide-react'
import { Input, Button, Alert } from '../components'

const ConfirmAttendance = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const eventId = searchParams.get('event_id')
  
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: ''
  })
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [inviteeData, setInviteeData] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false)

  useEffect(() => {
    if (!eventId) {
      setError('Event ID is required')
      return
    }
    // Validate event ID is a number
    if (isNaN(parseInt(eventId))) {
      setError('Invalid event ID in URL')
      return
    }
    // Optionally fetch event details to display
    fetchEventDetails()
  }, [eventId])

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data.event || data)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    }
  }

  const checkInviteeStatus = async (phone) => {
    if (!phone || !eventId) return
    
    setCheckingStatus(true)
    setError('')
    setAlreadyConfirmed(false)
    
    try {
      const response = await fetch('http://localhost:5001/api/invitees/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phone,
          event_id: parseInt(eventId)
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.invitee) {
          if (data.invitee.confirmed) {
            setAlreadyConfirmed(true)
            setInviteeData(data.invitee)
            setFormData({
              phone: data.invitee.phone || phone,
              email: data.invitee.email || '',
              name: data.invitee.name || ''
            })
          } else {
            setAlreadyConfirmed(false)
            setFormData(prev => ({
              ...prev,
              phone: phone,
              email: data.invitee.email || prev.email,
              name: data.invitee.name || prev.name
            }))
          }
        }
      } else {
        // Phone number not found in invitees list
        if (response.status === 404) {
          setError('Phone number not found in invitation list for this event. Please contact the event organizer.')
        }
      }
    } catch (error) {
      console.error('Error checking invitee status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
    if (alreadyConfirmed) setAlreadyConfirmed(false)
    
    // Check status when phone number is entered
    if (name === 'phone' && value.length >= 10) {
      checkInviteeStatus(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.phone) {
      setError('Phone number is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:5001/api/invitees/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: formData.phone.trim(),
          email: formData.email ? formData.email.trim() : null,
          name: formData.name ? formData.name.trim() : null,
          event_id: parseInt(eventId)
        })
      })

      let data;
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        setError(`Server error: ${response.status} ${response.statusText}`)
        setLoading(false)
        return
      }

      if (response.ok) {
        setSuccess(true)
        setInviteeData(data.invitee)
        setAlreadyConfirmed(false)
        setError('')
        // Don't clear form data, keep it for display
      } else {
        if (data && data.error) {
          if (data.error.includes('already confirmed')) {
            setAlreadyConfirmed(true)
            // Try to fetch the invitee data
            checkInviteeStatus(formData.phone)
          } else if (data.error.includes('not found in invitation list') || data.error.includes('not found')) {
            setError('Phone number not found in invitation list for this event. Please contact the event organizer.')
          } else {
            setError(data.error)
          }
        } else {
          setError(`Failed to confirm attendance. ${response.status ? `Status: ${response.status}` : ''}`)
        }
      }
    } catch (error) {
      console.error('Error confirming attendance:', error)
      if (error.message) {
        setError(`Network error: ${error.message}. Please check your connection and try again.`)
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success && inviteeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} style={{ color: '#10B981' }} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827', fontSize: '20px' }}>
                Confirmation Successful!
              </h1>
              <p className="text-gray-600" style={{ fontSize: '14px' }}>
                Your attendance has been confirmed
              </p>
            </div>

            {event && (
              <div className="bg-gray-50 rounded-lg p-5 mb-6">
                <h2 className="font-bold text-lg mb-4" style={{ color: '#C50F11', fontSize: '16px' }}>
                  {event.title}
                </h2>
                {event.description && (
                  <p className="text-gray-600 mb-4" style={{ fontSize: '14px' }}>
                    {event.description}
                  </p>
                )}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar size={18} style={{ color: '#C50F11', marginTop: '2px' }} />
                    <div>
                      <p className="font-medium text-gray-600 mb-1" style={{ fontSize: '12px' }}>Date & Time</p>
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
                    <MapPin size={18} style={{ color: '#C50F11', marginTop: '2px' }} />
                    <div>
                      <p className="font-medium text-gray-600 mb-1" style={{ fontSize: '12px' }}>Location</p>
                      <p className="font-semibold" style={{ fontSize: '14px', color: '#111827' }}>
                        {event.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {inviteeData.email && (
              <Alert
                type="success"
                message="Check your email for the invitation card with QR code!"
              />
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4" style={{ fontSize: '14px' }}>
                We look forward to seeing you at the event!
              </p>
              <Button variant="primary" onClick={() => navigate('/')}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-2" style={{ color: '#C50F11', fontSize: '18px' }}>
              Confirm Your Attendance
            </h1>
            <p className="text-gray-600" style={{ fontSize: '14px' }}>
              Please enter your details to receive your invitation
            </p>
          </div>

          {event && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="font-bold mb-2" style={{ color: '#111827', fontSize: '16px' }}>
                {event.title}
              </h2>
              <p className="text-gray-600 text-sm" style={{ fontSize: '12px' }}>
                {new Date(event.start_time).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} at {event.location}
              </p>
            </div>
          )}

          {alreadyConfirmed && inviteeData && (
            <Alert
              type="success"
              message={`You have already confirmed your attendance on ${inviteeData.confirmed_at ? new Date(inviteeData.confirmed_at).toLocaleString() : 'previously'}.`}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+255712345678"
                value={formData.phone}
                onChange={handleChange}
                required
                icon={Phone}
              />
              {checkingStatus && (
                <p className="text-gray-500 text-xs mt-1" style={{ fontSize: '12px' }}>
                  Checking status...
                </p>
              )}
            </div>

            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              icon={User}
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={Mail}
            />

            {error && (
              <Alert
                type="error"
                message={error}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading || alreadyConfirmed || checkingStatus}
              loading={loading}
              className="w-full"
            >
              {loading ? 'Confirming...' : alreadyConfirmed ? 'Already Confirmed' : 'Confirm Attendance'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm" style={{ fontSize: '12px' }}>
              Make sure the phone number matches the one on your invitation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmAttendance

