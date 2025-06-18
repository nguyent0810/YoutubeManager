import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsSelect, 
  SettingsDivider 
} from './SettingsPanel'

const WorkspaceSettings = ({ settings, onChange }) => {
  const workspaceSettings = settings.workspace || {}

  const handleChange = (key, value) => {
    onChange('workspace', { ...workspaceSettings, [key]: value })
  }

  const defaultViewOptions = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'videos', label: 'Video Manager' },
    { value: 'upload', label: 'Upload' },
    { value: 'calendar', label: 'Content Calendar' }
  ]

  return (
    <SettingsPanel
      title="Creator Workspace"
      description="Customize your workspace layout and interface preferences"
      helpText="Configure how your workspace looks and behaves when you start the app"
    >
      <div className="space-y-1">
        <SettingsSelect
          label="Default View"
          description="Choose which page to show when the app starts"
          value={workspaceSettings.defaultView || 'dashboard'}
          onChange={(value) => handleChange('defaultView', value)}
          options={defaultViewOptions}
        />

        <SettingsDivider title="Interface" />

        <SettingsToggle
          label="Collapse Sidebar by Default"
          description="Start with the sidebar collapsed to maximize content area"
          checked={workspaceSettings.sidebarCollapsed || false}
          onChange={(value) => handleChange('sidebarCollapsed', value)}
        />

        <SettingsToggle
          label="Show Quick Actions"
          description="Display quick action buttons in the header for common tasks"
          checked={workspaceSettings.showQuickActions !== false}
          onChange={(value) => handleChange('showQuickActions', value)}
        />

        <SettingsDivider title="Productivity" />

        <SettingsToggle
          label="Enable Keyboard Shortcuts"
          description="Use keyboard shortcuts for faster navigation and actions"
          checked={workspaceSettings.enableKeyboardShortcuts !== false}
          onChange={(value) => handleChange('enableKeyboardShortcuts', value)}
        />
      </div>

      {/* Keyboard Shortcuts Reference */}
      {workspaceSettings.enableKeyboardShortcuts !== false && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Keyboard Shortcuts</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Quick Upload</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl+U</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Analytics</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl+A</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Comments</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl+C</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Toggle Sidebar</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl+B</kbd>
            </div>
          </div>
        </div>
      )}
    </SettingsPanel>
  )
}

export default WorkspaceSettings
