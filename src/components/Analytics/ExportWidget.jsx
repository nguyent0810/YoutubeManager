import React, { useState } from 'react'
import { 
  Download, 
  FileText, 
  Image, 
  Calendar, 
  Settings,
  Share2,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { exportService } from '../../services/export-service'

const ExportWidget = ({ 
  analyticsData,
  currentFilters = {},
  isEditMode,
  title = "Export & Reports",
  viewMode = "desktop" 
}) => {
  const [activeTab, setActiveTab] = useState('export')
  const [exportFormat, setExportFormat] = useState('csv')
  const [reportTemplate, setReportTemplate] = useState('overview')
  const [socialTemplate, setSocialTemplate] = useState('instagram-story')
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState(null)
  const [automatedReports, setAutomatedReports] = useState([
    { id: 1, name: 'Weekly Overview', frequency: 'weekly', enabled: true, lastSent: '2024-01-15' },
    { id: 2, name: 'Monthly Performance', frequency: 'monthly', enabled: false, lastSent: '2024-01-01' }
  ])

  const tabs = [
    { id: 'export', label: 'Export Data', icon: Download },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'social', label: 'Social Graphics', icon: Image },
    { id: 'automated', label: 'Automated', icon: Calendar }
  ]

  const exportFormats = exportService.getExportFormats()
  const reportTemplates = exportService.getReportTemplates()
  const socialTemplates = exportService.getSocialTemplates()

  const handleExport = async () => {
    if (!analyticsData) {
      setExportStatus({ type: 'error', message: 'No data available to export' })
      return
    }

    setIsExporting(true)
    setExportStatus(null)

    try {
      const filename = `analytics-${new Date().toISOString().split('T')[0]}`
      await exportService.exportData(analyticsData, exportFormat, {
        filename,
        includeCharts: true,
        dateRange: currentFilters.dateRange
      })
      
      setExportStatus({ type: 'success', message: 'Export completed successfully!' })
    } catch (error) {
      setExportStatus({ type: 'error', message: `Export failed: ${error.message}` })
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!analyticsData) {
      setExportStatus({ type: 'error', message: 'No data available for report' })
      return
    }

    setIsExporting(true)
    setExportStatus(null)

    try {
      const report = await exportService.createAutomatedReport(analyticsData, reportTemplate)
      const filename = `report-${reportTemplate}-${new Date().toISOString().split('T')[0]}`
      
      // Export report as PDF
      await exportService.exportData(report, 'pdf', { filename })
      
      setExportStatus({ type: 'success', message: 'Report generated successfully!' })
    } catch (error) {
      setExportStatus({ type: 'error', message: `Report generation failed: ${error.message}` })
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateSocial = async () => {
    if (!analyticsData) {
      setExportStatus({ type: 'error', message: 'No data available for social graphic' })
      return
    }

    setIsExporting(true)
    setExportStatus(null)

    try {
      await exportService.generateSocialGraphic(analyticsData, socialTemplate, 'Check out my latest analytics!')
      setExportStatus({ type: 'success', message: 'Social graphic generated successfully!' })
    } catch (error) {
      setExportStatus({ type: 'error', message: `Social graphic generation failed: ${error.message}` })
    } finally {
      setIsExporting(false)
    }
  }

  const toggleAutomatedReport = (reportId) => {
    setAutomatedReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, enabled: !report.enabled }
          : report
      )
    )
  }

  const renderExportTab = () => (
    <div className="space-y-6">
      {/* Export Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Export Format:</label>
        <div className="grid grid-cols-2 gap-3">
          {exportFormats.map(format => (
            <button
              key={format.id}
              onClick={() => setExportFormat(format.id)}
              disabled={isEditMode}
              className={`p-3 border rounded-lg text-left transition-colors ${
                exportFormat === format.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium">{format.label}</div>
              <div className="text-xs text-gray-500">{format.extension}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" disabled={isEditMode} />
            <span className="text-sm">Include charts and visualizations</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" disabled={isEditMode} />
            <span className="text-sm">Apply current filters</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" disabled={isEditMode} />
            <span className="text-sm">Include raw data</span>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || isEditMode}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={20} />
        <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
      </button>
    </div>
  )

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Report Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Report Template:</label>
        <div className="space-y-2">
          {reportTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => setReportTemplate(template.id)}
              disabled={isEditMode}
              className={`w-full p-3 border rounded-lg text-left transition-colors ${
                reportTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium text-gray-900">{template.name}</div>
              <div className="text-sm text-gray-600">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Report Button */}
      <button
        onClick={handleGenerateReport}
        disabled={isExporting || isEditMode}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText size={20} />
        <span>{isExporting ? 'Generating...' : 'Generate Report'}</span>
      </button>
    </div>
  )

  const renderSocialTab = () => (
    <div className="space-y-6">
      {/* Social Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Social Platform:</label>
        <div className="grid grid-cols-1 gap-2">
          {socialTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => setSocialTemplate(template.id)}
              disabled={isEditMode}
              className={`p-3 border rounded-lg text-left transition-colors ${
                socialTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">
                    {template.dimensions.width} × {template.dimensions.height}
                  </div>
                </div>
                <Share2 size={16} className="text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Text:</label>
        <input
          type="text"
          placeholder="Add custom text to your graphic..."
          disabled={isEditMode}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Generate Social Graphic Button */}
      <button
        onClick={handleGenerateSocial}
        disabled={isExporting || isEditMode}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image size={20} />
        <span>{isExporting ? 'Creating...' : 'Create Social Graphic'}</span>
      </button>
    </div>
  )

  const renderAutomatedTab = () => (
    <div className="space-y-6">
      {/* Automated Reports List */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Scheduled Reports</h4>
        <div className="space-y-3">
          {automatedReports.map(report => (
            <div key={report.id} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{report.name}</div>
                <div className="text-sm text-gray-600">
                  {report.frequency} • Last sent: {report.lastSent}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  report.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {report.enabled ? (
                    <>
                      <CheckCircle size={12} className="mr-1" />
                      Active
                    </>
                  ) : (
                    'Inactive'
                  )}
                </span>
                <button
                  onClick={() => toggleAutomatedReport(report.id)}
                  disabled={isEditMode}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Automated Report */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Create New Automated Report</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Name:</label>
            <input
              type="text"
              placeholder="e.g., Weekly Performance Summary"
              disabled={isEditMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency:</label>
              <select disabled={isEditMode} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template:</label>
              <select disabled={isEditMode} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                {reportTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            disabled={isEditMode}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Automated Report
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Widget Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Download size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Export data and generate reports</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={isEditMode}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <IconComponent size={14} />
                <span className={viewMode === 'mobile' ? 'hidden sm:inline' : ''}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'export' && renderExportTab()}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'social' && renderSocialTab()}
        {activeTab === 'automated' && renderAutomatedTab()}
      </div>

      {/* Status Messages */}
      {exportStatus && (
        <div className="px-6 pb-6">
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            exportStatus.type === 'success' 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {exportStatus.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span className="text-sm">{exportStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportWidget
