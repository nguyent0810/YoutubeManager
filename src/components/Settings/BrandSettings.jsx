import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsInput,
  SettingsColorPicker,
  SettingsDivider 
} from './SettingsPanel'

const BrandSettings = ({ settings, onChange }) => {
  const brandSettings = settings.brand || {}

  const handleChange = (key, value) => {
    onChange('brand', { ...brandSettings, [key]: value })
  }

  const handleBrandingChange = (key, value) => {
    const branding = brandSettings.channelBranding || {}
    handleChange('channelBranding', { ...branding, [key]: value })
  }

  const handleSeriesChange = (key, value) => {
    const seriesSettings = brandSettings.seriesSettings || {}
    handleChange('seriesSettings', { ...seriesSettings, [key]: value })
  }

  return (
    <SettingsPanel
      title="Brand & Content Management"
      description="Manage your brand assets, templates, and content consistency"
      helpText="Set up your brand kit and content templates to maintain consistency across all your videos"
    >
      <div className="space-y-1">
        <SettingsDivider title="Channel Branding" />

        <SettingsColorPicker
          label="Primary Brand Color"
          description="Main color for your channel branding"
          value={brandSettings.channelBranding?.primaryColor || '#FF0000'}
          onChange={(value) => handleBrandingChange('primaryColor', value)}
        />

        <SettingsColorPicker
          label="Secondary Brand Color"
          description="Secondary color for accents and highlights"
          value={brandSettings.channelBranding?.secondaryColor || '#FFFFFF'}
          onChange={(value) => handleBrandingChange('secondaryColor', value)}
        />

        <SettingsInput
          label="Logo URL"
          description="URL to your channel logo image"
          value={brandSettings.channelBranding?.logoUrl || ''}
          onChange={(value) => handleBrandingChange('logoUrl', value)}
          placeholder="https://example.com/logo.png"
        />

        <SettingsInput
          label="Banner URL"
          description="URL to your channel banner image"
          value={brandSettings.channelBranding?.bannerUrl || ''}
          onChange={(value) => handleBrandingChange('bannerUrl', value)}
          placeholder="https://example.com/banner.jpg"
        />

        <SettingsInput
          label="Watermark URL"
          description="URL to your video watermark image"
          value={brandSettings.channelBranding?.watermarkUrl || ''}
          onChange={(value) => handleBrandingChange('watermarkUrl', value)}
          placeholder="https://example.com/watermark.png"
        />

        <SettingsDivider title="Content Templates" />

        <SettingsInput
          label="Default Thumbnail Template"
          description="Template URL or path for generating thumbnails"
          value={brandSettings.defaultThumbnailTemplate || ''}
          onChange={(value) => handleChange('defaultThumbnailTemplate', value)}
          placeholder="Path to thumbnail template"
        />

        <SettingsDivider title="Content Series Management" />

        <SettingsToggle
          label="Auto-Number Episodes"
          description="Automatically number episodes in content series"
          checked={brandSettings.seriesSettings?.autoNumbering !== false}
          onChange={(value) => handleSeriesChange('autoNumbering', value)}
        />

        <SettingsInput
          label="Series Naming Pattern"
          description="Template for naming series episodes (use [Series], [Number], [Title] placeholders)"
          value={brandSettings.seriesSettings?.defaultNamingPattern || '[Series] - Episode [Number]: [Title]'}
          onChange={(value) => handleSeriesChange('defaultNamingPattern', value)}
          placeholder="[Series] - Episode [Number]: [Title]"
        />

        <SettingsToggle
          label="Enable Series Playlists"
          description="Automatically create playlists for content series"
          checked={brandSettings.seriesSettings?.enableSeriesPlaylists !== false}
          onChange={(value) => handleSeriesChange('enableSeriesPlaylists', value)}
        />
      </div>

      {/* Brand Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">🎨 Brand Preview</h4>
        <div className="space-y-3">
          {/* Color Preview */}
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: brandSettings.channelBranding?.primaryColor || '#FF0000' }}
            ></div>
            <div 
              className="w-12 h-12 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: brandSettings.channelBranding?.secondaryColor || '#FFFFFF' }}
            ></div>
            <span className="text-sm text-gray-600">Your brand colors</span>
          </div>

          {/* Series Naming Preview */}
          {brandSettings.seriesSettings?.defaultNamingPattern && (
            <div className="p-3 bg-white rounded border">
              <span className="text-sm text-gray-600">Series naming preview:</span>
              <div className="font-medium text-gray-900 mt-1">
                {brandSettings.seriesSettings.defaultNamingPattern
                  .replace('[Series]', 'My Tutorial Series')
                  .replace('[Number]', '5')
                  .replace('[Title]', 'Advanced Techniques')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Brand Kit Tips */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">🎯 Brand Consistency Tips</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Use consistent colors across all thumbnails and graphics</li>
          <li>• Set up series naming patterns for better organization</li>
          <li>• Upload brand assets to cloud storage for easy access</li>
          <li>• Create thumbnail templates to speed up video publishing</li>
          <li>• Use watermarks to protect your content and build recognition</li>
        </ul>
      </div>
    </SettingsPanel>
  )
}

export default BrandSettings
