import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { authAPI, checkHealth } from '../utils/api'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isServerConnected, setIsServerConnected] = useState(null)

  useEffect(() => {
    const checkConnection = async () => {
      const health = await checkHealth()
      setIsServerConnected(health !== null)
    }
    checkConnection()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const data = await authAPI.login(formData.email, formData.password)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-3 py-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200" style={{ padding: '20px' }}>
          <div className="text-center mb-5">
            <h1 className="text-lg font-bold" style={{ color: '#C50F11', fontSize: '16px' }}>Welcome Back</h1>
            <p className="text-gray-600 mt-1" style={{ fontSize: '14px' }}>Sign in to your account</p>
            {isServerConnected === false && (
              <p className="text-xs mt-2" style={{ color: '#C50F11', fontSize: '12px' }}>
                Unable to connect to server. Please ensure the backend is running.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label htmlFor="email" className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  style={{ fontSize: '14px', padding: '12px', borderRadius: '8px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  style={{ fontSize: '14px', padding: '12px', borderRadius: '8px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  style={{ accentColor: '#C50F11' }}
                />
                <span className="ml-2 text-gray-600" style={{ fontSize: '14px' }}>Remember me</span>
              </label>
              <a href="#" className="font-medium hover:underline" style={{ color: '#C50F11', fontSize: '14px' }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '14px', padding: '12px', borderRadius: '8px', backgroundColor: '#C50F11', '--tw-ring-color': '#C50F11' }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {error && (
            <div className="mt-3 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '12px' }}>
              <p className="text-center" style={{ color: '#C50F11', fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-gray-600" style={{ fontSize: '14px' }}>
              Don't have an account?{' '}
              <a href="#" className="font-medium hover:underline" style={{ color: '#C50F11' }}>
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

