import React, { useState, useEffect } from 'react'
import { Layout, Table, Button, Badge, Modal, Input } from '../components'
import { Plus, Edit, Trash2, UserCog, Mail, Search } from 'lucide-react'
import { apiRequest } from '../utils/api'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  })

  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/users', {
        method: 'GET'
      })
      setUsers(response.users || response || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      })
      setShowCreateModal(false)
      setNewUser({ name: '', email: '', password: '', role: 'user' })
      fetchUsers()
    } catch (error) {
      alert(error.message || 'Failed to create user')
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    if (id === user.id) {
      alert('You cannot delete your own account')
      return
    }

    try {
      await apiRequest(`/users/${id}`, {
        method: 'DELETE'
      })
      fetchUsers()
    } catch (error) {
      alert(error.message || 'Failed to delete user')
    }
  }

  const filteredUsers = users.filter(userItem => {
    return !searchTerm || 
      userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const tableColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <Badge variant={value === 'admin' ? 'danger' : 'default'}>
          {value || 'user'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleDeleteUser(row.id)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-red-600"
            title="Delete"
            disabled={row.id === user.id}
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
            <h1 className="text-xl font-bold" style={{ color: '#C50F11' }}>Users</h1>
            <p className="text-sm text-gray-600 mt-1">Manage system users</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="md"
          >
            <Plus size={16} className="mr-1" />
            Add User
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500" style={{ fontSize: '14px' }}>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500" style={{ fontSize: '14px' }}>No users found</p>
            </div>
          ) : (
            <Table
              columns={tableColumns}
              data={filteredUsers}
              searchable={false}
              exportable={true}
              pagination={true}
              pageSize={10}
            />
          )}
        </div>

        {showCreateModal && (
          <Modal
            title="Add New User"
            onClose={() => {
              setShowCreateModal(false)
              setNewUser({ name: '', email: '', password: '', role: 'user' })
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Name <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <Input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Email <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Password <span style={{ color: '#C50F11' }}>*</span>
                </label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  style={{ fontSize: '14px' }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewUser({ name: '', email: '', password: '', role: 'user' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateUser}
                >
                  Add User
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  )
}

export default Users

