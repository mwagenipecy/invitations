import React, { useState, useRef, useEffect } from 'react'
import { Layout, Button, Badge, Modal } from '../components'
import { QrCode, CheckCircle, XCircle, Camera, Loader } from 'lucide-react'
import { apiRequest } from '../utils/api'
import jsQR from 'jsqr'

const QRScanner = () => {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showResultModal, setShowResultModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setError('')
      setResult(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setScanning(true)
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      const scanInterval = setInterval(async () => {
        if (!videoRef.current || !scanning) {
          clearInterval(scanInterval)
          return
        }
        
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        
        try {
          const qrCode = scanQRCode(imageData)
          if (qrCode) {
            clearInterval(scanInterval)
            handleQRCodeScanned(qrCode)
          }
        } catch (err) {
          console.error('QR scan error:', err)
        }
      }, 1000)
    } catch (err) {
      setError('Failed to access camera. Please check permissions.')
      console.error('Camera error:', err)
    }
  }

  const scanQRCode = (imageData) => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      return code?.data || null
    } catch (error) {
      console.error('QR scan error:', error)
      return null
    }
  }

  const handleQRCodeScanned = async (qrCode) => {
    stopScanning()
    setLoading(true)
    
    try {
      const response = await apiRequest(`/invitees/qr/${qrCode}`, {
        method: 'GET'
      })
      
      setResult(response.invitee || response)
      setShowResultModal(true)
    } catch (err) {
      setError(err.message || 'Invalid QR code or invitation not found')
    } finally {
      setLoading(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const handleManualInput = () => {
    const qrCode = prompt('Enter QR code:')
    if (qrCode) {
      handleQRCodeScanned(qrCode)
    }
  }

  return (
    <Layout user={user}>
      <div className="space-y-5 max-w-2xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#C50F11' }}>QR Scanner</h1>
          <p className="text-sm text-gray-600 mt-1">Scan QR codes from invitations</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {!scanning && !loading && (
            <div className="text-center py-10">
              <QrCode size={64} className="mx-auto mb-4" style={{ color: '#C50F11' }} />
              <p className="text-gray-600 mb-5" style={{ fontSize: '14px' }}>
                Click the button below to start scanning QR codes
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={startScanning}
                  size="lg"
                >
                  <Camera size={18} className="mr-2" />
                  Start Scanning
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleManualInput}
                  size="lg"
                >
                  Enter QR Code Manually
                </Button>
              </div>
            </div>
          )}

          {scanning && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1/1', maxWidth: '500px', margin: '0 auto' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 border-4" style={{ borderColor: '#C50F11', borderRadius: '8px' }} />
              </div>
              <div className="text-center">
                <Button
                  variant="secondary"
                  onClick={stopScanning}
                >
                  Stop Scanning
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-10">
              <Loader className="animate-spin mx-auto mb-4" size={32} style={{ color: '#C50F11' }} />
              <p className="text-gray-600" style={{ fontSize: '14px' }}>Verifying QR code...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-sm text-center" style={{ color: '#C50F11' }}>{error}</p>
            </div>
          )}
        </div>

        {showResultModal && result && (
          <Modal
            title="Invitation Details"
            onClose={() => {
              setShowResultModal(false)
              setResult(null)
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Name</label>
                <p className="text-sm text-gray-900">{result.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Email</label>
                <p className="text-sm text-gray-900">{result.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Phone</label>
                <p className="text-sm text-gray-900">{result.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Event</label>
                <p className="text-sm text-gray-900">{result.title || result.event_title || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Status</label>
                <Badge variant={result.confirmed ? 'success' : 'default'}>
                  {result.confirmed ? (
                    <>
                      <CheckCircle size={14} className="mr-1" />
                      Confirmed
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
              {result.confirmed_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Confirmed At</label>
                  <p className="text-sm text-gray-900">
                    {new Date(result.confirmed_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  )
}

export default QRScanner

