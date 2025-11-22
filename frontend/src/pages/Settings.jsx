import React, { useState, useEffect } from 'react'
import { Layout, Button, Input, Modal } from '../components'
import { Settings as SettingsIcon, Save, User, Lock, Mail, Bell } from 'lucide-react'
import { apiRequest } from '../utils/api'

const Settings = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  })
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: false
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  useEffect(() => {
    setProfile({
      name: user.name || '',
      email: user.email || ''
    })
  }, [user])

  const handleUpdateProfile = async () => {
    if (!profile.name || !profile.email) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    setSuccess('')
    
    try {
      await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      })
      const updatedUser = { ...user, ...profile }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      alert(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!password.current || !password.new || !password.confirm) {
      alert('Please fill in all password fields')
      return
    }

    if (password.new !== password.confirm) {
      alert('New passwords do not match')
      return
    }

    if (password.new.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setSuccess('')
    
    try {
      await apiRequest('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: password.current,
          new_password: password.new
        })
      })
      setSuccess('Password changed successfully!')
      setPassword({ current: '', new: '', confirm: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      alert(error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSettings = async () => {
    setLoading(true)
    setSuccess('')
    
    try {
      await apiRequest('/users/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      })
      setSuccess('Settings updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      alert(error.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout user={user}>
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#C50F11' }}>Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your account settings</p>
        </div>

        {success && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <p className="text-sm text-center" style={{ color: '#16A34A' }}>{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 mb-4">
            <User size={20} style={{ color: '#C50F11' }} />
            <h2 className="text-lg font-semibold" style={{ fontSize: '16px' }}>Profile Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                Name
              </label>
              <Input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                Email
              </label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                <Save size={16} className="mr-1" />
                Update Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Lock size={20} style={{ color: '#C50F11' }} />
            <h2 className="text-lg font-semibold" style={{ fontSize: '16px' }}>Change Password</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                Current Password
              </label>
              <Input
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                New Password
              </label>
              <Input
                type="password"
                value={password.new}
                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                Confirm New Password
              </label>
              <Input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleChangePassword}
                disabled={loading}
              >
                <Save size={16} className="mr-1" />
                Change Password
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Bell size={20} style={{ color: '#C50F11' }} />
            <h2 className="text-lg font-semibold" style={{ fontSize: '16px' }}>Notification Settings</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-primary"
                style={{ accentColor: '#C50F11' }}
              />
              <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Email Notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.sms_notifications}
                onChange={(e) => setSettings({ ...settings, sms_notifications: e.target.checked })}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-primary"
                style={{ accentColor: '#C50F11' }}
              />
              <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>SMS Notifications</span>
            </label>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleUpdateSettings}
                disabled={loading}
              >
                <Save size={16} className="mr-1" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Settings

