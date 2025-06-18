import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsInput,
  SettingsRange,
  SettingsDivider 
} from './SettingsPanel'

const NotificationSettings = ({ settings, onChange }) => {
  const notificationSettings = settings.notifications || {}

  const handleChange = (key, value) => {
    onChange('notifications', { ...notificationSettings, [key]: value })
  }

  const handleQuietHoursChange = (key, value) => {
    const quietHours = notificationSettings.quietHours || {}
    handleChange('quietHours', { ...quietHours, [key]: value })
  }

  return (
    <SettingsPanel
      title="Notifications & Alerts"
      description="Configure notification preferences and alert settings"
      helpText="Customize when and how you receive notifications about your YouTube channel activity"
    >
      <div className="space-y-1">
        <SettingsDivider title="Upload & Content Notifications" />

        <SettingsToggle
          label="Upload Complete"
          description="Get notified when video uploads finish processing"
          checked={notificationSettings.uploadComplete !== false}
          onChange={(value) => handleChange('uploadComplete', value)}
        />

        <SettingsToggle
          label="Bulk Operation Complete"
          description="Get notified when bulk upload operations finish"
          checked={notificationSettings.bulkOperationComplete !== false}
          onChange={(value) => handleChange('bulkOperationComplete', value)}
        />

        <SettingsToggle
          label="Scheduled Video Reminders"
          description="Get reminded about upcoming scheduled video publications"
          checked={notificationSettings.scheduledVideoReminders !== false}
          onChange={(value) => handleChange('scheduledVideoReminders', value)}
        />

        <SettingsDivider title="Engagement Notifications" />

        <SettingsToggle
          label="New Comments"
          description="Get notified about new comments on your videos"
          checked={notificationSettings.newComments !== false}
          onChange={(value) => handleChange('newComments', value)}
        />

        <SettingsToggle
          label="Comment Moderation Alerts"
          description="Get alerted when comments need moderation"
          checked={notificationSettings.commentModerationAlerts !== false}
          onChange={(value) => handleChange('commentModerationAlerts', value)}
        />

        <SettingsToggle
          label="New Subscribers"
          description="Get notified when you gain new subscribers"
          checked={notificationSettings.newSubscribers !== false}
          onChange={(value) => handleChange('newSubscribers', value)}
        />

        <SettingsDivider title="Performance & Analytics" />

        <SettingsToggle
          label="Performance Alerts"
          description="Get alerted about significant changes in video performance"
          checked={notificationSettings.performanceAlerts !== false}
          onChange={(value) => handleChange('performanceAlerts', value)}
        />

        <SettingsToggle
          label="Analytics Reports"
          description="Receive periodic analytics summary reports"
          checked={notificationSettings.analyticsReports || false}
          onChange={(value) => handleChange('analyticsReports', value)}
        />

        <SettingsDivider title="System Notifications" />

        <SettingsToggle
          label="System Updates"
          description="Get notified about app updates and news"
          checked={notificationSettings.systemUpdates || false}
          onChange={(value) => handleChange('systemUpdates', value)}
        />

        <SettingsToggle
          label="Error Notifications"
          description="Get notified about errors and issues"
          checked={notificationSettings.errorNotifications !== false}
          onChange={(value) => handleChange('errorNotifications', value)}
        />

        <SettingsDivider title="Notification Delivery" />

        <SettingsToggle
          label="Desktop Notifications"
          description="Show notifications in your system notification area"
          checked={notificationSettings.desktopNotifications !== false}
          onChange={(value) => handleChange('desktopNotifications', value)}
        />

        <SettingsToggle
          label="Sound Enabled"
          description="Play notification sounds"
          checked={notificationSettings.soundEnabled || false}
          onChange={(value) => handleChange('soundEnabled', value)}
        />

        <SettingsDivider title="Quiet Hours" />

        <SettingsToggle
          label="Enable Quiet Hours"
          description="Suppress notifications during specified hours"
          checked={notificationSettings.quietHours?.enabled || false}
          onChange={(value) => handleQuietHoursChange('enabled', value)}
        />

        {notificationSettings.quietHours?.enabled && (
          <div className="ml-6 space-y-3 p-4 bg-gray-50 rounded-lg">
            <SettingsInput
              label="Start Time"
              description="When quiet hours begin"
              type="time"
              value={notificationSettings.quietHours?.startTime || '22:00'}
              onChange={(value) => handleQuietHoursChange('startTime', value)}
            />

            <SettingsInput
              label="End Time"
              description="When quiet hours end"
              type="time"
              value={notificationSettings.quietHours?.endTime || '08:00'}
              onChange={(value) => handleQuietHoursChange('endTime', value)}
            />
          </div>
        )}
      </div>

      {/* Notification Preview */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🔔 Notification Preview</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span>Video "My Latest Tutorial" upload complete!</span>
            <span className="text-xs text-gray-500">2 min ago</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span>New comment from @viewer123</span>
            <span className="text-xs text-gray-500">5 min ago</span>
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}

export default NotificationSettings
