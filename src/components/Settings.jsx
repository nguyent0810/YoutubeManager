import React, { useState, useEffect, useMemo } from 'react'
import {
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  Key,
  Globe,
  Monitor,
  Save,
  Search,
  Upload,
  BarChart3,
  Palette,
  Zap,
  Gauge,
  Settings as SettingsIcon,
  Eye,
  Layout,
  ChevronRight,
  RotateCcw,
  FileDown,
  FileUp,
  HelpCircle,
  X
} from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { settingsService } from '../services/settings-service'
import toast from 'react-hot-toast'

// Settings Components
import WorkspaceSettings from './Settings/WorkspaceSettings'
import UploadSettings from './Settings/UploadSettings'
import AnalyticsSettings from './Settings/AnalyticsSettings'
import NotificationSettings from './Settings/NotificationSettings'
import BrandSettings from './Settings/BrandSettings'
import WorkflowSettings from './Settings/WorkflowSettings'
import PerformanceSettings from './Settings/PerformanceSettings'
import PrivacySettings from './Settings/PrivacySettings'
import AppSettings from './Settings/AppSettings'
import AccessibilitySettings from './Settings/AccessibilitySettings'

const Settings = () => {
  const { accounts, activeAccount, removeAccount } = useAuth()
  const [activeCategory, setActiveCategory] = useState('workspace')
  const [searchQuery, setSearchQuery] = useState('')
  const [settings, setSettings] = useState(settingsService.settings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Get categories with metadata
  const categories = settingsService.getCategories()

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories

    const searchResults = settingsService.searchSettings(searchQuery)
    const matchingCategories = new Set(searchResults.map(result => result.category))

    return Object.fromEntries(
      Object.entries(categories).filter(([key]) => matchingCategories.has(key))
    )
  }, [searchQuery, categories])

  // Load settings on component mount
  useEffect(() => {
    const unsubscribe = settingsService.addListener((event, data) => {
      if (event === 'setting-changed' || event === 'category-changed') {
        setSettings({ ...settingsService.settings })
        setHasUnsavedChanges(true)
      }
    })

    return unsubscribe
  }, [])

  const handleSettingChange = (path, value) => {
    console.log('🔧 Settings: Setting changed', path, value)
    settingsService.set(path, value)
    setHasUnsavedChanges(true)
  }

  const handleCategoryChange = (category, values) => {
    console.log('🔧 Settings: Category changed', category, values)
    settingsService.setCategory(category, values)
    setHasUnsavedChanges(true)
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const result = await settingsService.saveSettings()
      if (result.success) {
        toast.success('Settings saved successfully!')
        setHasUnsavedChanges(false)
      } else {
        toast.error('Failed to save settings: ' + result.error)
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetCategory = () => {
    if (window.confirm(`Reset ${categories[activeCategory]?.title} to default values?`)) {
      settingsService.resetCategory(activeCategory)
      setSettings({ ...settingsService.settings })
      setHasUnsavedChanges(true)
      toast.success('Category reset to defaults')
    }
  }

  const handleExportSettings = async () => {
    try {
      console.log('🔧 Starting settings export...')
      const exportData = settingsService.exportSettings()
      console.log('🔧 Export data:', exportData)

      if (window.electronAPI?.exportSettings) {
        // Use Electron native file dialog
        console.log('🔧 Using Electron native export...')
        const result = await window.electronAPI.exportSettings(exportData)
        console.log('🔧 Export result:', result)

        if (result.success) {
          console.log('✅ Settings exported to:', result.filePath)
          toast.success('Settings exported successfully!')
        } else if (result.canceled) {
          console.log('ℹ️ Export canceled by user')
        } else {
          console.error('❌ Export failed:', result.error)
          toast.error('Failed to export settings: ' + result.error)
        }
      } else {
        // Fallback to web API
        console.log('🔧 Using web API fallback...')
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ytm-settings-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        console.log('✅ Settings export completed (web API)')
        toast.success('Settings exported successfully!')
      }
    } catch (error) {
      console.error('❌ Export error:', error)
      toast.error('Failed to export settings: ' + error.message)
    }
  }

  const handleImportSettings = async (event) => {
    try {
      console.log('🔧 Starting settings import...')

      if (window.electronAPI?.importSettings) {
        // Use Electron native file dialog
        console.log('🔧 Using Electron native import...')
        const result = await window.electronAPI.importSettings()
        console.log('🔧 Import result:', result)

        if (result.success) {
          console.log('🔧 Import data:', result.data)
          const importResult = settingsService.importSettings(result.data)
          console.log('🔧 Settings service import result:', importResult)

          if (importResult.success) {
            setSettings({ ...settingsService.settings })
            setHasUnsavedChanges(true)
            console.log('✅ Settings imported successfully')
            toast.success('Settings imported successfully!')
          } else {
            console.error('❌ Settings service import failed:', importResult.error)
            toast.error('Failed to import settings: ' + importResult.error)
          }
        } else if (result.canceled) {
          console.log('ℹ️ Import canceled by user')
        } else {
          console.error('❌ Import failed:', result.error)
          toast.error('Failed to import settings: ' + result.error)
        }
      } else {
        // Fallback to web API
        console.log('🔧 Using web API fallback...')
        const file = event.target.files[0]
        console.log('🔧 Import file selected:', file)

        if (!file) {
          console.log('❌ No file selected')
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            console.log('🔧 File read, parsing JSON...')
            const importData = JSON.parse(e.target.result)
            console.log('🔧 Import data:', importData)

            const result = settingsService.importSettings(importData)
            console.log('🔧 Import result:', result)

            if (result.success) {
              setSettings({ ...settingsService.settings })
              setHasUnsavedChanges(true)
              console.log('✅ Settings imported successfully')
              toast.success('Settings imported successfully!')
            } else {
              console.error('❌ Import failed:', result.error)
              toast.error('Failed to import settings: ' + result.error)
            }
          } catch (error) {
            console.error('❌ JSON parse error:', error)
            toast.error('Invalid settings file: ' + error.message)
          }
        }

        reader.onerror = (error) => {
          console.error('❌ File read error:', error)
          toast.error('Failed to read file')
        }

        reader.readAsText(file)
      }
    } catch (error) {
      console.error('❌ Import error:', error)
      toast.error('Failed to import settings: ' + error.message)
    }

    setShowImportModal(false)
  }

  const handleRemoveAccount = async (channelId) => {
    if (window.confirm('Are you sure you want to remove this account? This action cannot be undone.')) {
      const result = await removeAccount(channelId)
      if (result.success) {
        toast.success('Account removed successfully')
      } else {
        toast.error(result.error || 'Failed to remove account')
      }
    }
  }

  // Icon mapping for categories
  const getIconComponent = (iconName) => {
    const icons = {
      Layout, Upload, BarChart3, Bell, Palette, Zap, Gauge, Shield, SettingsIcon, Eye, User
    }
    return icons[iconName] || SettingsIcon
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Settings Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Customize your YouTube creator workspace
          </p>

          {/* Search */}
          <div className="relative mt-4">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube-red focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-1">
            {Object.entries(filteredCategories)
              .sort(([,a], [,b]) => a.order - b.order)
              .map(([key, category]) => {
                const IconComponent = getIconComponent(category.icon)
                const isActive = activeCategory === key

                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-youtube-red text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{category.title}</div>
                      <div className={`text-sm truncate ${isActive ? 'text-red-100' : 'text-gray-500'}`}>
                        {category.description}
                      </div>
                    </div>
                    {isActive && <ChevronRight size={16} />}
                  </button>
                )
              })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleExportSettings}
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FileDown size={16} />
            <span>Export Settings</span>
          </button>

          <button
            onClick={window.electronAPI?.importSettings ? handleImportSettings : () => setShowImportModal(true)}
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FileUp size={16} />
            <span>Import Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header with Actions */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {categories[activeCategory]?.title}
              </h2>
              <p className="text-gray-600 mt-1">
                {categories[activeCategory]?.description}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  Unsaved changes
                </span>
              )}

              <button
                onClick={handleResetCategory}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>

              <button
                onClick={handleSaveSettings}
                disabled={isLoading || !hasUnsavedChanges}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save size={16} />
                    <span>Save Changes</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="space-y-6">
            {renderSettingsContent()}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import Settings</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Select a settings file to import. This will overwrite your current settings.
            </p>

            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Render settings content based on active category
  function renderSettingsContent() {
    switch (activeCategory) {
      case 'workspace':
        return <WorkspaceSettings settings={settings} onChange={handleCategoryChange} />

      case 'upload':
        return <UploadSettings settings={settings} onChange={handleCategoryChange} />

      case 'analytics':
        return <AnalyticsSettings settings={settings} onChange={handleCategoryChange} />

      case 'notifications':
        return <NotificationSettings settings={settings} onChange={handleCategoryChange} />

      case 'brand':
        return <BrandSettings settings={settings} onChange={handleCategoryChange} />

      case 'workflow':
        return <WorkflowSettings settings={settings} onChange={handleCategoryChange} />

      case 'performance':
        return <PerformanceSettings settings={settings} onChange={handleCategoryChange} />

      case 'privacy':
        return <PrivacySettings settings={settings} onChange={handleCategoryChange} />

      case 'app':
        return <AppSettings settings={settings} onChange={handleCategoryChange} />

      case 'accessibility':
        return <AccessibilitySettings settings={settings} onChange={handleCategoryChange} />

      default:
        return <ConnectedAccountsSettings />
    }
  }

  // Connected Accounts Settings (legacy component)
  function ConnectedAccountsSettings() {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User size={24} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
          </div>
          <p className="text-gray-600 mt-1">Manage your YouTube accounts</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.channelId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img
                    src={account.picture || account.channelThumbnail}
                    alt={account.channelName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{account.channelName}</h3>
                    <p className="text-sm text-gray-600">{account.email}</p>
                    {activeAccount?.channelId === account.channelId && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveAccount(account.channelId)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Account"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // All settings components are now fully implemented!
}

export default Settings
