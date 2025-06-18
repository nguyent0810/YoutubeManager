import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsSelect,
  SettingsRange,
  SettingsDivider 
} from './SettingsPanel'

const AnalyticsSettings = ({ settings, onChange }) => {
  const analyticsSettings = settings.analytics || {}

  const handleChange = (key, value) => {
    onChange('analytics', { ...analyticsSettings, [key]: value })
  }

  const handleThresholdChange = (key, value) => {
    const thresholds = analyticsSettings.alertThresholds || {}
    handleChange('alertThresholds', { ...thresholds, [key]: value })
  }

  const timeRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' }
  ]

  const layoutOptions = [
    { value: 'default', label: 'Default Layout' },
    { value: 'compact', label: 'Compact View' },
    { value: 'detailed', label: 'Detailed View' },
    { value: 'custom', label: 'Custom Layout' }
  ]

  const exportFormatOptions = [
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel' },
    { value: 'json', label: 'JSON' },
    { value: 'pdf', label: 'PDF Report' }
  ]

  const retentionOptions = [
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '6 months' },
    { value: 365, label: '1 year' },
    { value: 730, label: '2 years' }
  ]

  return (
    <SettingsPanel
      title="Analytics & Insights"
      description="Configure analytics dashboard and performance monitoring"
      helpText="Customize how analytics data is displayed and when you receive performance alerts"
    >
      <div className="space-y-1">
        <SettingsDivider title="Dashboard Settings" />

        <SettingsSelect
          label="Default Time Range"
          description="Default time period for analytics data"
          value={analyticsSettings.defaultTimeRange || '30'}
          onChange={(value) => handleChange('defaultTimeRange', value)}
          options={timeRangeOptions}
        />

        <SettingsSelect
          label="Dashboard Layout"
          description="Choose your preferred analytics dashboard layout"
          value={analyticsSettings.dashboardLayout || 'default'}
          onChange={(value) => handleChange('dashboardLayout', value)}
          options={layoutOptions}
        />

        <SettingsToggle
          label="Real-Time Updates"
          description="Automatically refresh analytics data in real-time"
          checked={analyticsSettings.enableRealTimeUpdates !== false}
          onChange={(value) => handleChange('enableRealTimeUpdates', value)}
        />

        <SettingsToggle
          label="Show Advanced Metrics"
          description="Display advanced analytics metrics and calculations"
          checked={analyticsSettings.showAdvancedMetrics !== false}
          onChange={(value) => handleChange('showAdvancedMetrics', value)}
        />

        <SettingsDivider title="AI Insights & Recommendations" />

        <SettingsToggle
          label="Enable AI Insights"
          description="Get AI-powered insights and recommendations"
          checked={analyticsSettings.enableAIInsights !== false}
          onChange={(value) => handleChange('enableAIInsights', value)}
        />

        <SettingsDivider title="Performance Alerts" />

        <SettingsToggle
          label="Enable Performance Alerts"
          description="Get alerted when performance metrics change significantly"
          checked={analyticsSettings.enablePerformanceAlerts !== false}
          onChange={(value) => handleChange('enablePerformanceAlerts', value)}
        />

        {analyticsSettings.enablePerformanceAlerts !== false && (
          <div className="ml-6 space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Alert Thresholds</h4>
            
            <SettingsRange
              label="Views Drop Alert"
              description="Alert when views drop by this percentage"
              value={analyticsSettings.alertThresholds?.viewsDropPercent || 20}
              onChange={(value) => handleThresholdChange('viewsDropPercent', value)}
              min={5}
              max={50}
              step={5}
              unit="%"
            />

            <SettingsRange
              label="Engagement Drop Alert"
              description="Alert when engagement drops by this percentage"
              value={analyticsSettings.alertThresholds?.engagementDropPercent || 15}
              onChange={(value) => handleThresholdChange('engagementDropPercent', value)}
              min={5}
              max={50}
              step={5}
              unit="%"
            />

            <SettingsRange
              label="Subscriber Loss Alert"
              description="Alert when losing this many subscribers"
              value={analyticsSettings.alertThresholds?.subscriberLossCount || 10}
              onChange={(value) => handleThresholdChange('subscriberLossCount', value)}
              min={1}
              max={100}
              step={1}
              unit=" subs"
            />

            <SettingsRange
              label="Comment Moderation Alert"
              description="Alert when this many comments need moderation"
              value={analyticsSettings.alertThresholds?.commentModerationNeeded || 5}
              onChange={(value) => handleThresholdChange('commentModerationNeeded', value)}
              min={1}
              max={50}
              step={1}
              unit=" comments"
            />
          </div>
        )}

        <SettingsDivider title="Data Management" />

        <SettingsSelect
          label="Data Retention"
          description="How long to keep analytics data locally"
          value={analyticsSettings.dataRetentionDays || 365}
          onChange={(value) => handleChange('dataRetentionDays', value)}
          options={retentionOptions}
        />

        <SettingsSelect
          label="Export Format"
          description="Default format for exporting analytics data"
          value={analyticsSettings.exportFormat || 'csv'}
          onChange={(value) => handleChange('exportFormat', value)}
          options={exportFormatOptions}
        />
      </div>

      {/* Analytics Tips */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">📊 Analytics Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Set conservative alert thresholds to avoid notification fatigue</li>
          <li>• Real-time updates use more bandwidth but provide instant insights</li>
          <li>• Advanced metrics help identify optimization opportunities</li>
          <li>• AI insights can suggest content strategy improvements</li>
          <li>• Regular data exports help track long-term trends</li>
        </ul>
      </div>
    </SettingsPanel>
  )
}

export default AnalyticsSettings
