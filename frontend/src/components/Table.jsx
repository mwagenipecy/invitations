import React, { useState, useMemo } from 'react'
import { Download, FileText, FileSpreadsheet, ChevronDown, ChevronUp, Search } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

const Table = ({ 
  columns, 
  data, 
  title = 'Table',
  searchable = true,
  exportable = true,
  pagination = true,
  pageSize = 10
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key]
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }, [data, searchTerm, columns])

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text(title, 14, 15)
    
    const tableData = sortedData.map(row =>
      columns.map(col => {
        const value = row[col.key]
        if (col.render) {
          return col.render(value, row)
        }
        return value?.toString() || ''
      })
    )

    doc.autoTable({
      head: [columns.map(col => col.label)],
      body: tableData,
      startY: 25,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [197, 15, 17] }
    })

    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportToExcel = () => {
    const worksheetData = [
      columns.map(col => col.label),
      ...sortedData.map(row =>
        columns.map(col => {
          const value = row[col.key]
          if (col.render) {
            return col.render(value, row)
          }
          return value || ''
        })
      )
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-bold text-lg" style={{ color: '#C50F11', fontSize: '16px' }}>
            {title}
          </h3>
          
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  style={{ fontSize: '14px', width: '200px' }}
                />
              </div>
            )}

            {exportable && (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontSize: '14px', color: '#374151' }}
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-t-lg transition-colors text-left"
                    style={{ fontSize: '14px', color: '#374151' }}
                  >
                    <FileText size={16} />
                    Export PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-b-lg transition-colors text-left"
                    style={{ fontSize: '14px', color: '#374151' }}
                  >
                    <FileSpreadsheet size={16} />
                    Export Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col, index) => (
                <th
                  key={index}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-4 py-3 text-left font-semibold ${
                    col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ fontSize: '14px', color: '#374151' }}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable !== false && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp size={14} style={{ color: '#C50F11' }} /> : 
                        <ChevronDown size={14} style={{ color: '#C50F11' }} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500" style={{ fontSize: '14px' }}>
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-4 py-3" style={{ fontSize: '14px', color: '#374151' }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-gray-600" style={{ fontSize: '14px' }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              style={{ fontSize: '14px', color: '#374151' }}
            >
              Previous
            </button>
            <span className="px-3 py-1.5" style={{ fontSize: '14px', color: '#374151' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              style={{ fontSize: '14px', color: '#374151' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table

