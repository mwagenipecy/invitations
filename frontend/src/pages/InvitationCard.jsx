import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Calendar, MapPin, Clock, User, Mail, Phone } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

const InvitationCard = () => {
  const [searchParams] = useSearchParams()
  const inviteeId = searchParams.get('invitee_id')
  const qrCode = searchParams.get('qr_code')
  
  const [invitee, setInvitee] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [qrCodeImage, setQrCodeImage] = useState(null)

  useEffect(() => {
    if (inviteeId || qrCode) {
      fetchInvitationData()
    }
  }, [inviteeId, qrCode])

  useEffect(() => {
    if (invitee?.qr_code) {
      generateQRCode(invitee.qr_code)
    }
  }, [invitee])

  const fetchInvitationData = async () => {
    try {
      let response
      if (inviteeId) {
        response = await fetch(`http://localhost:5001/api/invitees/${inviteeId}`)
      } else if (qrCode) {
        response = await fetch(`http://localhost:5001/api/invitees/qr/${encodeURIComponent(qrCode)}`)
      }

      if (response && response.ok) {
        const data = await response.json()
        setInvitee(data.invitee)
        setEvent(data.event || data.invitee)
      }
    } catch (error) {
      console.error('Error fetching invitation:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (data) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(data, { 
        width: 200, 
        margin: 2,
        color: {
          dark: '#C50F11',
          light: '#FFFFFF'
        }
      })
      setQrCodeImage(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const downloadAsPDF = async () => {
    setDownloading(true)
    try {
      const element = document.getElementById('invitation-card')
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('portrait', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `${event?.title || 'invitation'}_${invitee?.name || 'invitee'}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const downloadAsImage = async () => {
    setDownloading(true)
    try {
      const element = document.getElementById('invitation-card')
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      })
      
      const link = document.createElement('a')
      link.download = `${event?.title || 'invitation'}_${invitee?.name || 'invitee'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to download image. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <p style={{ fontSize: '14px', color: '#374151' }}>Loading invitation...</p>
      </div>
    )
  }

  if (!invitee || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p style={{ fontSize: '14px', color: '#374151' }}>Invitation not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={downloadAsPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            style={{ fontSize: '14px' }}
          >
            <Download size={16} />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={downloadAsImage}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white disabled:opacity-50 transition-all"
            style={{ fontSize: '14px' }}
          >
            <Download size={16} />
            Download Image
          </button>
        </div>

        <div
          id="invitation-card"
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(197, 15, 17, 0.15)' }}
        >
          <div
            className="text-center py-8 px-6"
            style={{ background: 'linear-gradient(135deg, #C50F11 0%, #A00D0F 100%)' }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">You're Invited!</h1>
            <h2 className="text-2xl font-semibold text-white">{event.title || event.event_title}</h2>
          </div>

          <div className="p-8">
            {invitee.name && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                  <User size={18} style={{ color: '#C50F11' }} />
                  <p className="font-semibold" style={{ color: '#C50F11', fontSize: '16px' }}>
                    {invitee.name}
                  </p>
                </div>
              </div>
            )}

            {event.description && (
              <p className="text-center text-gray-600 mb-8" style={{ fontSize: '14px' }}>
                {event.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#C50F11' }}>
                  <Calendar size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#111827', fontSize: '14px' }}>Date & Time</p>
                  <p className="text-gray-700" style={{ fontSize: '14px' }}>
                    {new Date(event.start_time).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#C50F11' }}>
                  <MapPin size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#111827', fontSize: '14px' }}>Location</p>
                  <p className="text-gray-700" style={{ fontSize: '14px' }}>
                    {event.location}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center py-8">
              <div className="inline-block p-6 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '3px solid #C50F11' }}>
                {qrCodeImage ? (
                  <img
                    src={qrCodeImage}
                    alt="QR Code"
                    className="mx-auto mb-4"
                    style={{ width: '200px', height: '200px' }}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] mx-auto mb-4 bg-gray-200 flex items-center justify-center rounded">
                    <p style={{ fontSize: '12px', color: '#666' }}>Loading QR Code...</p>
                  </div>
                )}
                <p className="font-bold mt-4" style={{ color: '#C50F11', fontSize: '16px' }}>
                  Your QR Code
                </p>
                <p className="text-gray-600 mt-2" style={{ fontSize: '12px' }}>
                  Present this QR code at the entrance
                </p>
              </div>
            </div>

            {(invitee.email || invitee.phone) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600 mb-4" style={{ fontSize: '12px' }}>Your Details</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {invitee.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} style={{ color: '#C50F11' }} />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{invitee.email}</span>
                    </div>
                  )}
                  {invitee.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} style={{ color: '#C50F11' }} />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{invitee.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2" style={{ fontSize: '14px' }}>
                We look forward to seeing you!
              </p>
              <p className="font-semibold" style={{ color: '#C50F11', fontSize: '16px' }}>
                ✨ See you there! ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvitationCard

