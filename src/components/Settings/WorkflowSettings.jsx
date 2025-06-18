import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsSelect,
  SettingsInput,
  SettingsRange,
  SettingsDivider 
} from './SettingsPanel'

const WorkflowSettings = ({ settings, onChange }) => {
  const workflowSettings = settings.workflow || {}

  const handleChange = (key, value) => {
    onChange('workflow', { ...workflowSettings, [key]: value })
  }

  const handleBulkDefaultsChange = (key, value) => {
    const bulkDefaults = workflowSettings.bulkUploadDefaults || {}
    handleChange('bulkUploadDefaults', { ...bulkDefaults, [key]: value })
  }

  const handleAutoTaggingChange = (key, value) => {
    const autoTagging = workflowSettings.autoTagging || {}
    handleChange('autoTagging', { ...autoTagging, [key]: value })
  }

  const handlePipelineChange = (key, value) => {
    const pipeline = workflowSettings.contentPipeline || {}
    handleChange('contentPipeline', { ...pipeline, [key]: value })
  }

  const handleShortcutChange = (key, value) => {
    const shortcuts = workflowSettings.shortcuts || {}
    handleChange('shortcuts', { ...shortcuts, [key]: value })
  }

  const batchSizeOptions = [
    { value: 1, label: '1 video at a time' },
    { value: 3, label: '3 videos at a time' },
    { value: 5, label: '5 videos at a time' },
    { value: 10, label: '10 videos at a time' }
  ]

  return (
    <SettingsPanel
      title="Workflow & Automation"
      description="Streamline your content creation workflow with automation and shortcuts"
      helpText="Configure automation rules and shortcuts to speed up your content creation process"
    >
      <div className="space-y-1">
        <SettingsDivider title="Bulk Operations" />

        <SettingsToggle
          label="Enable Bulk Operations"
          description="Allow uploading and managing multiple videos simultaneously"
          checked={workflowSettings.enableBulkOperations !== false}
          onChange={(value) => handleChange('enableBulkOperations', value)}
        />

        {workflowSettings.enableBulkOperations !== false && (
          <div className="ml-6 space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Bulk Upload Settings</h4>
            
            <SettingsSelect
              label="Batch Size"
              description="Number of videos to process simultaneously"
              value={workflowSettings.bulkUploadDefaults?.batchSize || 5}
              onChange={(value) => handleBulkDefaultsChange('batchSize', parseInt(value))}
              options={batchSizeOptions}
            />

            <SettingsRange
              label="Upload Interval"
              description="Delay between starting each upload (in seconds)"
              value={workflowSettings.bulkUploadDefaults?.uploadInterval || 300}
              onChange={(value) => handleBulkDefaultsChange('uploadInterval', value)}
              min={60}
              max={1800}
              step={60}
              unit=" sec"
            />

            <SettingsToggle
              label="Enable Schedule Increment"
              description="Automatically increment schedule times for bulk uploads"
              checked={workflowSettings.bulkUploadDefaults?.enableScheduleIncrement !== false}
              onChange={(value) => handleBulkDefaultsChange('enableScheduleIncrement', value)}
            />

            {workflowSettings.bulkUploadDefaults?.enableScheduleIncrement !== false && (
              <SettingsRange
                label="Schedule Increment Hours"
                description="Hours to add between each scheduled video"
                value={workflowSettings.bulkUploadDefaults?.scheduleIncrementHours || 24}
                onChange={(value) => handleBulkDefaultsChange('scheduleIncrementHours', value)}
                min={1}
                max={168}
                step={1}
                unit=" hours"
              />
            )}
          </div>
        )}

        <SettingsDivider title="Auto-Tagging" />

        <SettingsToggle
          label="Enable Auto-Tagging"
          description="Automatically suggest and apply tags based on video content"
          checked={workflowSettings.autoTagging?.enabled || false}
          onChange={(value) => handleAutoTaggingChange('enabled', value)}
        />

        {workflowSettings.autoTagging?.enabled && (
          <div className="ml-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              Auto-tagging rules will be configured here. This feature analyzes video titles, descriptions, and metadata to suggest relevant tags.
            </p>
            <div className="text-xs text-blue-600">
              Coming soon: Custom tagging rules, keyword extraction, and category-based suggestions
            </div>
          </div>
        )}

        <SettingsDivider title="Content Pipeline" />

        <SettingsToggle
          label="Enable Content Pipeline"
          description="Track videos through different stages of production"
          checked={workflowSettings.contentPipeline?.enableStages !== false}
          onChange={(value) => handlePipelineChange('enableStages', value)}
        />

        {workflowSettings.contentPipeline?.enableStages !== false && (
          <div className="ml-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Pipeline Stages</h4>
            <div className="flex flex-wrap gap-2">
              {(workflowSettings.contentPipeline?.defaultStages || ['idea', 'script', 'record', 'edit', 'upload', 'promote']).map((stage, index) => (
                <span key={index} className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </span>
              ))}
            </div>
            <p className="text-sm text-green-700 mt-2">
              Track your videos through these production stages for better workflow management
            </p>
          </div>
        )}

        <SettingsDivider title="Keyboard Shortcuts" />

        <div className="space-y-3">
          <SettingsInput
            label="Quick Upload"
            description="Keyboard shortcut to open upload dialog"
            value={workflowSettings.shortcuts?.quickUpload || 'Ctrl+U'}
            onChange={(value) => handleShortcutChange('quickUpload', value)}
            placeholder="Ctrl+U"
          />

          <SettingsInput
            label="Open Analytics"
            description="Keyboard shortcut to open analytics dashboard"
            value={workflowSettings.shortcuts?.openAnalytics || 'Ctrl+A'}
            onChange={(value) => handleShortcutChange('openAnalytics', value)}
            placeholder="Ctrl+A"
          />

          <SettingsInput
            label="Open Comments"
            description="Keyboard shortcut to open comments management"
            value={workflowSettings.shortcuts?.openComments || 'Ctrl+C'}
            onChange={(value) => handleShortcutChange('openComments', value)}
            placeholder="Ctrl+C"
          />

          <SettingsInput
            label="Toggle Sidebar"
            description="Keyboard shortcut to toggle sidebar visibility"
            value={workflowSettings.shortcuts?.toggleSidebar || 'Ctrl+B'}
            onChange={(value) => handleShortcutChange('toggleSidebar', value)}
            placeholder="Ctrl+B"
          />
        </div>
      </div>

      {/* Workflow Tips */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
        <h4 className="font-medium text-indigo-900 mb-2">⚡ Workflow Optimization Tips</h4>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>• Use bulk operations for uploading multiple videos efficiently</li>
          <li>• Set appropriate upload intervals to avoid API rate limits</li>
          <li>• Enable schedule increment for consistent publishing schedules</li>
          <li>• Use keyboard shortcuts to speed up common tasks</li>
          <li>• Track content through pipeline stages for better organization</li>
          <li>• Auto-tagging can save significant time on metadata entry</li>
        </ul>
      </div>

      {/* Productivity Stats Preview */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">📈 Productivity Impact</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-yellow-800">~60%</div>
            <div className="text-yellow-700">Time Saved</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-yellow-800">~5x</div>
            <div className="text-yellow-700">Faster Uploads</div>
          </div>
        </div>
        <p className="text-xs text-yellow-700 mt-2 text-center">
          *Estimated based on workflow automation features
        </p>
      </div>
    </SettingsPanel>
  )
}

export default WorkflowSettings
