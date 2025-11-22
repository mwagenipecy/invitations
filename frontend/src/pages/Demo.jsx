import React, { useState } from 'react'
import { Layout, Table, Button, Input, Modal, StatsBox, Badge, Alert } from '../components'
import { Users, Calendar, Mail, QrCode } from 'lucide-react'

const Demo = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [alertVisible, setAlertVisible] = useState(true)

  const tableColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      render: (value) => (
        <Badge variant={value === 'Active' ? 'success' : 'default'}>
          {value}
        </Badge>
      )
    },
    { key: 'date', label: 'Date', sortable: true }
  ]

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', date: '2025-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', date: '2025-01-16' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active', date: '2025-01-17' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Active', date: '2025-01-18' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'Pending', date: '2025-01-19' }
  ]

  const user = {
    name: 'Admin User',
    email: 'admin@example.com'
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {alertVisible && (
          <Alert
            type="success"
            title="Welcome!"
            message="This is a demo page showcasing all reusable components."
            onClose={() => setAlertVisible(false)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsBox
            title="Total Events"
            value="24"
            icon={Calendar}
            trend={12}
            subtitle="Last 30 days"
          />
          <StatsBox
            title="Total Invitees"
            value="1,234"
            icon={Users}
            trend={8}
            subtitle="Across all events"
          />
          <StatsBox
            title="Invitations Sent"
            value="856"
            icon={Mail}
            trend={-3}
            subtitle="This month"
          />
          <StatsBox
            title="QR Scans"
            value="432"
            icon={QrCode}
            trend={15}
            subtitle="Today"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 className="font-bold mb-4" style={{ color: '#C50F11', fontSize: '16px' }}>
            Component Examples
          </h3>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button loading>Loading Button</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error="This field is required"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>

          <Button onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>
        </div>

        <Table
          columns={tableColumns}
          data={tableData}
          title="Sample Data Table"
          searchable
          exportable
          pagination
          pageSize={5}
        />

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Sample Modal"
          size="md"
        >
          <div className="space-y-4">
            <p style={{ fontSize: '14px', color: '#374151' }}>
              This is a sample modal dialog. You can add any content here.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}

export default Demo

