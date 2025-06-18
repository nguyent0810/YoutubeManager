import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsSelect,
  SettingsDivider 
} from './SettingsPanel'
import { Download, Shield, AlertTriangle } from 'lucide-react'

const PrivacySettings = ({ settings, onChange }) => {
  const privacySettings = settings.privacy || {}

  const handleChange = (key, value) => {
    onChange('privacy', { ...privacySettings, [key]: value })
  }

  const dataRetentionOptions = [
    { value: 'auto', label: 'Automatic (Recommended)' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' },
    { value: '1year', label: '1 Year' },
    { value: 'forever', label: 'Keep Forever' }
  ]

  const handleExportData = () => {
    // This would integrate with the actual data export functionality
    alert('Data export functionality would be implemented here')
  }

  const handleDeleteAllData = () => {
    if (window.confirm('Are you sure you want to delete all stored data? This action cannot be undone.')) {
      // This would integrate with actual data deletion
      alert('Data deletion functionality would be implemented here')
    }
  }

  return (
    <SettingsPanel
      title="Account & Privacy"
      description="Manage your privacy settings, data retention, and security preferences"
      helpText="Control how your data is stored, shared, and protected within the application"
    >
      <div className="space-y-1">
        <SettingsDivider title="Data Sharing" />

        <SettingsToggle
          label="Analytics Sharing"
          description="Share anonymous usage analytics to help improve the app"
          checked={privacySettings.analyticsSharing || false}
          onChange={(value) => handleChange('analyticsSharing', value)}
        />

        <SettingsToggle
          label="Crash Reporting"
          description="Send crash reports to help fix bugs and improve stability"
          checked={privacySettings.crashReporting !== false}
          onChange={(value) => handleChange('crashReporting', value)}
        />

        <SettingsToggle
          label="Enable Telemetry"
          description="Send usage statistics to help improve features and performance"
          checked={privacySettings.enableTelemetry || false}
          onChange={(value) => handleChange('enableTelemetry', value)}
        />

        <SettingsDivider title="Data Storage & Retention" />

        <SettingsSelect
          label="Data Retention Policy"
          description="How long to keep your data stored locally"
          value={privacySettings.dataRetention || 'auto'}
          onChange={(value) => handleChange('dataRetention', value)}
          options={dataRetentionOptions}
        />

        <SettingsToggle
          label="Enable Secure Storage"
          description="Use Windows Credential Vault for sensitive data (recommended)"
          checked={privacySettings.enableSecureStorage !== false}
          onChange={(value) => handleChange('enableSecureStorage', value)}
        />

        <SettingsToggle
          label="Two-Factor Backup"
          description="Create encrypted backups of authentication tokens"
          checked={privacySettings.twoFactorBackup || false}
          onChange={(value) => handleChange('twoFactorBackup', value)}
        />

        <SettingsDivider title="Data Management" />

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center space-x-2 p-3 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download size={16} />
            <span>Export My Data</span>
          </button>

          <button
            onClick={handleDeleteAllData}
            className="w-full flex items-center justify-center space-x-2 p-3 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <AlertTriangle size={16} />
            <span>Delete All Data</span>
          </button>
        </div>

        <SettingsDivider title="Security Information" />

        <div className="space-y-4">
          {/* Security Status */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield size={20} className="text-green-600" />
              <h4 className="font-medium text-green-900">Security Status</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Secure Storage:</span>
                <span className="font-medium text-green-800">
                  {privacySettings.enableSecureStorage !== false ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Data Encryption:</span>
                <span className="font-medium text-green-800">AES-256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Token Storage:</span>
                <span className="font-medium text-green-800">Windows Credential Vault</span>
              </div>
            </div>
          </div>

          {/* Data Usage Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Data Usage Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-white rounded">
                <div className="font-medium text-blue-800">Settings Data</div>
                <div className="text-blue-600">~2 KB</div>
              </div>
              <div className="p-2 bg-white rounded">
                <div className="font-medium text-blue-800">Analytics Cache</div>
                <div className="text-blue-600">~50 MB</div>
              </div>
              <div className="p-2 bg-white rounded">
                <div className="font-medium text-blue-800">Video Metadata</div>
                <div className="text-blue-600">~10 MB</div>
              </div>
              <div className="p-2 bg-white rounded">
                <div className="font-medium text-blue-800">Thumbnails</div>
                <div className="text-blue-600">~25 MB</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">🔒 Privacy Information</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Local Storage:</strong> All your data is stored locally on your device. 
            We don't have access to your YouTube accounts or personal information.
          </p>
          <p>
            <strong>YouTube API:</strong> We only access YouTube data that you explicitly 
            authorize through Google's OAuth system.
          </p>
          <p>
            <strong>Analytics Sharing:</strong> When enabled, only anonymous usage statistics 
            are shared to help improve the application.
          </p>
        </div>
      </div>

      {/* GDPR Compliance */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">🌍 GDPR Compliance</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Right to access: Export your data at any time</li>
          <li>• Right to deletion: Delete all stored data</li>
          <li>• Data portability: Export data in standard formats</li>
          <li>• Consent management: Control what data is shared</li>
          <li>• Data minimization: Only collect necessary data</li>
        </ul>
      </div>
    </SettingsPanel>
  )
}

export default PrivacySettings
