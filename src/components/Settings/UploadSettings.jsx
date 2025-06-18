import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsSelect, 
  SettingsInput,
  SettingsDivider 
} from './SettingsPanel'

const UploadSettings = ({ settings, onChange }) => {
  const uploadSettings = settings.upload || {}

  const handleChange = (key, value) => {
    onChange('upload', { ...uploadSettings, [key]: value })
  }

  const privacyOptions = [
    { value: 'private', label: 'Private' },
    { value: 'unlisted', label: 'Unlisted' },
    { value: 'public', label: 'Public' }
  ]

  const categoryOptions = [
    { value: '1', label: 'Film & Animation' },
    { value: '2', label: 'Autos & Vehicles' },
    { value: '10', label: 'Music' },
    { value: '15', label: 'Pets & Animals' },
    { value: '17', label: 'Sports' },
    { value: '19', label: 'Travel & Events' },
    { value: '20', label: 'Gaming' },
    { value: '22', label: 'People & Blogs' },
    { value: '23', label: 'Comedy' },
    { value: '24', label: 'Entertainment' },
    { value: '25', label: 'News & Politics' },
    { value: '26', label: 'Howto & Style' },
    { value: '27', label: 'Education' },
    { value: '28', label: 'Science & Technology' }
  ]

  const qualityOptions = [
    { value: 'hd', label: 'HD (1080p)' },
    { value: '4k', label: '4K (2160p)' },
    { value: 'sd', label: 'SD (720p)' },
    { value: 'auto', label: 'Auto (Best Available)' }
  ]

  const compressionOptions = [
    { value: 'fast', label: 'Fast (Lower Quality)' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'quality', label: 'High Quality (Slower)' }
  ]

  return (
    <SettingsPanel
      title="Upload & Publishing"
      description="Set default preferences for video uploads and publishing"
      helpText="These settings will be applied to new uploads by default. You can override them for individual videos."
    >
      <div className="space-y-1">
        <SettingsSelect
          label="Default Privacy"
          description="Default visibility setting for new uploads"
          value={uploadSettings.defaultPrivacy || 'private'}
          onChange={(value) => handleChange('defaultPrivacy', value)}
          options={privacyOptions}
        />

        <SettingsSelect
          label="Default Category"
          description="Default YouTube category for your videos"
          value={uploadSettings.defaultCategory || '22'}
          onChange={(value) => handleChange('defaultCategory', value)}
          options={categoryOptions}
        />

        <SettingsInput
          label="Default Description Template"
          description="Template text that will be pre-filled in video descriptions"
          value={uploadSettings.defaultDescription || ''}
          onChange={(value) => handleChange('defaultDescription', value)}
          placeholder="Enter your default description template..."
        />

        <SettingsDivider title="Upload Quality & Processing" />

        <SettingsSelect
          label="Upload Quality"
          description="Default quality setting for video uploads"
          value={uploadSettings.uploadQuality || 'hd'}
          onChange={(value) => handleChange('uploadQuality', value)}
          options={qualityOptions}
        />

        <SettingsSelect
          label="Compression Preset"
          description="Balance between upload speed and video quality"
          value={uploadSettings.compressionPreset || 'balanced'}
          onChange={(value) => handleChange('compressionPreset', value)}
          options={compressionOptions}
        />

        <SettingsDivider title="Upload Behavior" />

        <SettingsToggle
          label="Skip Upload Warnings"
          description="Automatically skip permission and warning dialogs during upload"
          checked={uploadSettings.skipWarnings !== false}
          onChange={(value) => handleChange('skipWarnings', value)}
        />

        <SettingsToggle
          label="Auto-Generate Thumbnails"
          description="Automatically generate thumbnail options from video frames"
          checked={uploadSettings.autoGenerateThumbnails !== false}
          onChange={(value) => handleChange('autoGenerateThumbnails', value)}
        />

        <SettingsToggle
          label="Enable Brand Watermark"
          description="Add your channel watermark to uploaded videos"
          checked={uploadSettings.enableBrandWatermark || false}
          onChange={(value) => handleChange('enableBrandWatermark', value)}
        />

        <SettingsDivider title="Scheduling" />

        <SettingsToggle
          label="Enable Scheduling by Default"
          description="Show scheduling options in the upload form by default"
          checked={uploadSettings.enableScheduling !== false}
          onChange={(value) => handleChange('enableScheduling', value)}
        />

        <SettingsInput
          label="Default Schedule Time"
          description="Default time for scheduled uploads (24-hour format)"
          type="time"
          value={uploadSettings.defaultScheduleTime || '19:00'}
          onChange={(value) => handleChange('defaultScheduleTime', value)}
        />

        <SettingsDivider title="Playlists" />

        <SettingsToggle
          label="Auto-Add to Playlist"
          description="Automatically add new uploads to a default playlist"
          checked={uploadSettings.autoAddToPlaylist || false}
          onChange={(value) => handleChange('autoAddToPlaylist', value)}
        />

        {uploadSettings.autoAddToPlaylist && (
          <SettingsInput
            label="Default Playlist"
            description="Playlist ID or name for auto-adding videos"
            value={uploadSettings.defaultPlaylist || ''}
            onChange={(value) => handleChange('defaultPlaylist', value)}
            placeholder="Enter playlist name or ID..."
          />
        )}
      </div>

      {/* Upload Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Upload Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use "Private" as default to review videos before publishing</li>
          <li>• Enable scheduling to maintain consistent upload times</li>
          <li>• Skip warnings can speed up bulk uploads significantly</li>
          <li>• Higher quality settings require more upload time</li>
        </ul>
      </div>
    </SettingsPanel>
  )
}

export default UploadSettings
