import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import SettingsPanel, {
  SettingsToggle,
  SettingsSelect,
  SettingsDivider
} from './SettingsPanel'

const AppSettings = ({ settings, onChange }) => {
  const appSettings = settings.app || {}
  const { theme, changeTheme } = useTheme()

  console.log('🔴 AppSettings rendering:', { theme, appSettings, changeTheme: !!changeTheme })

  const handleChange = (key, value) => {
    console.log('🎨 AppSettings: handleChange called', key, value)

    // Update settings service - this will trigger the integration service
    onChange('app', { ...appSettings, [key]: value })

    // For theme, also update ThemeContext directly as backup
    if (key === 'theme') {
      console.log('🎨 AppSettings: Also updating ThemeContext directly')
      changeTheme(value)
    }
  }

  const themeOptions = [
    { value: 'light', label: 'Light Theme' },
    { value: 'dark', label: 'Dark Theme' },
    { value: 'system', label: 'Follow System' }
  ]

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh', label: '中文' }
  ]

  const logLevelOptions = [
    { value: 'error', label: 'Error Only' },
    { value: 'warn', label: 'Warnings' },
    { value: 'info', label: 'Info (Recommended)' },
    { value: 'debug', label: 'Debug' },
    { value: 'verbose', label: 'Verbose' }
  ]

  return (
    <SettingsPanel
      title="App Settings"
      description="General application preferences and system integration"
      helpText="Configure how the application looks, behaves, and integrates with your system"
    >
      <div className="space-y-1">
        <SettingsDivider title="Appearance" />

        <SettingsSelect
          label="Theme"
          description="Choose your preferred app theme"
          value={theme || appSettings.theme || 'light'}
          onChange={(value) => handleChange('theme', value)}
          options={themeOptions}
        />

        {/* Debug Info */}
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm border-2 border-red-500">
          <div><strong>🔧 Debug Info:</strong></div>
          <div>ThemeContext theme: {String(theme || 'undefined')}</div>
          <div>Settings theme: {String(appSettings.theme || 'undefined')}</div>
          <div>Document classes: {document.documentElement.className}</div>
          <div>Has dark class: {document.documentElement.classList.contains('dark') ? 'YES' : 'NO'}</div>

          {/* Test Buttons */}
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                console.log('🔴 TEST: Clicking Test Dark button')
                changeTheme('dark')
                console.log('🔴 TEST: After changeTheme call')
              }}
              className="px-3 py-1 bg-gray-800 text-white rounded text-xs"
            >
              🌙 Test Dark
            </button>
            <button
              onClick={() => {
                console.log('🔴 TEST: Clicking Test Light button')
                changeTheme('light')
                console.log('🔴 TEST: After changeTheme call')
              }}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-xs"
            >
              ☀️ Test Light
            </button>
            <button
              onClick={() => {
                console.log('🔴 TEST: Manual DOM manipulation')
                document.documentElement.classList.toggle('dark')
                console.log('🔴 TEST: Toggled dark class')
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              🔄 Toggle DOM
            </button>
          </div>
        </div>

        <SettingsSelect
          label="Language"
          description="Select your preferred language"
          value={appSettings.language || 'en'}
          onChange={(value) => handleChange('language', value)}
          options={languageOptions}
        />

        <SettingsDivider title="System Integration" />

        <SettingsToggle
          label="Auto-Start with Windows"
          description="Start the app automatically when Windows starts"
          checked={appSettings.autoStart || false}
          onChange={(value) => handleChange('autoStart', value)}
        />

        <SettingsToggle
          label="Minimize to System Tray"
          description="Minimize to system tray instead of closing the app"
          checked={appSettings.minimizeToTray !== false}
          onChange={(value) => handleChange('minimizeToTray', value)}
        />

        <SettingsToggle
          label="Check for Updates"
          description="Automatically check for app updates"
          checked={appSettings.checkUpdates !== false}
          onChange={(value) => handleChange('checkUpdates', value)}
        />

        <SettingsDivider title="Advanced Features" />

        <SettingsToggle
          label="Enable Beta Features"
          description="Access experimental features and early previews"
          checked={appSettings.enableBetaFeatures || false}
          onChange={(value) => handleChange('enableBetaFeatures', value)}
        />

        <SettingsToggle
          label="Debug Mode"
          description="Enable debug mode for troubleshooting (may affect performance)"
          checked={appSettings.debugMode || false}
          onChange={(value) => handleChange('debugMode', value)}
        />

        <SettingsSelect
          label="Log Level"
          description="Amount of detail in application logs"
          value={appSettings.logLevel || 'info'}
          onChange={(value) => handleChange('logLevel', value)}
          options={logLevelOptions}
        />
      </div>

      {/* System Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">💻 System Information</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">App Version:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <span className="font-medium">Windows</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Electron:</span>
              <span className="font-medium">Latest</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Node.js:</span>
              <span className="font-medium">18.x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Architecture:</span>
              <span className="font-medium">x64</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory:</span>
              <span className="font-medium">~150 MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Features Preview */}
      {appSettings.enableBetaFeatures && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-900 mb-2">🧪 Beta Features Enabled</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>You have access to experimental features:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Advanced AI content analysis</li>
              <li>Experimental upload algorithms</li>
              <li>Enhanced analytics predictions</li>
              <li>New workflow automation tools</li>
            </ul>
            <p className="text-xs text-yellow-700 mt-2">
              ⚠️ Beta features may be unstable and could affect app performance
            </p>
          </div>
        </div>
      )}

      {/* Debug Information */}
      {appSettings.debugMode && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-900 mb-2">🐛 Debug Mode Active</h4>
          <div className="text-sm text-red-800 space-y-1">
            <p>Debug features enabled:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Detailed console logging</li>
              <li>Performance monitoring</li>
              <li>API request/response logging</li>
              <li>Error stack traces</li>
            </ul>
            <p className="text-xs text-red-700 mt-2">
              ⚠️ Debug mode may impact performance and generate large log files
            </p>
          </div>
        </div>
      )}

      {/* Update Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🔄 Updates & Maintenance</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">Last Update Check:</span>
            <span className="text-sm font-medium text-blue-900">Today, 2:30 PM</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">Update Status:</span>
            <span className="text-sm font-medium text-green-700">Up to date</span>
          </div>
          <button className="w-full p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors text-sm">
            Check for Updates Now
          </button>
        </div>
      </div>

      {/* Performance Impact */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">⚡ Performance Impact</h4>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-green-800">
              {appSettings.debugMode ? 'High' : 'Low'}
            </div>
            <div className="text-green-700">CPU Usage</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-green-800">
              {appSettings.enableBetaFeatures ? 'Medium' : 'Low'}
            </div>
            <div className="text-green-700">Memory</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-green-800">
              {appSettings.autoStart ? 'Always' : 'Manual'}
            </div>
            <div className="text-green-700">Startup</div>
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}

export default AppSettings
