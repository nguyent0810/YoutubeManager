import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsSelect,
  SettingsInput,
  SettingsDivider 
} from './SettingsPanel'

const AccessibilitySettings = ({ settings, onChange }) => {
  const accessibilitySettings = settings.accessibility || {}

  const handleChange = (key, value) => {
    onChange('accessibility', { ...accessibilitySettings, [key]: value })
  }

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' }
  ]

  const getFontSizePreview = (size) => {
    const sizes = {
      'small': '12px',
      'normal': '14px',
      'large': '16px',
      'extra-large': '18px'
    }
    return sizes[size] || '14px'
  }

  return (
    <SettingsPanel
      title="Accessibility & Personalization"
      description="Customize the interface for better accessibility and personal preferences"
      helpText="Configure accessibility features to make the app more comfortable and usable for your needs"
    >
      <div className="space-y-1">
        <SettingsDivider title="Visual Accessibility" />

        <SettingsToggle
          label="High Contrast Mode"
          description="Increase contrast for better visibility"
          checked={accessibilitySettings.enableHighContrast || false}
          onChange={(value) => handleChange('enableHighContrast', value)}
        />

        <SettingsSelect
          label="Font Size"
          description="Adjust text size throughout the application"
          value={accessibilitySettings.fontSize || 'normal'}
          onChange={(value) => handleChange('fontSize', value)}
          options={fontSizeOptions}
        />

        <SettingsToggle
          label="Reduce Motion"
          description="Minimize animations and transitions"
          checked={accessibilitySettings.reduceMotion || false}
          onChange={(value) => handleChange('reduceMotion', value)}
        />

        <SettingsDivider title="Screen Reader Support" />

        <SettingsToggle
          label="Enable Screen Reader Support"
          description="Optimize interface for screen readers"
          checked={accessibilitySettings.enableScreenReader || false}
          onChange={(value) => handleChange('enableScreenReader', value)}
        />

        <SettingsToggle
          label="Enhanced Tooltips"
          description="Show detailed tooltips and descriptions"
          checked={accessibilitySettings.enableTooltips !== false}
          onChange={(value) => handleChange('enableTooltips', value)}
        />

        <SettingsDivider title="Keyboard Navigation" />

        <SettingsToggle
          label="Enable Keyboard Navigation"
          description="Navigate the app using keyboard shortcuts"
          checked={accessibilitySettings.enableKeyboardNavigation !== false}
          onChange={(value) => handleChange('enableKeyboardNavigation', value)}
        />

        {accessibilitySettings.enableKeyboardNavigation !== false && (
          <div className="ml-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-blue-800">Navigate Settings</span>
                <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs">Tab</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-blue-800">Toggle Setting</span>
                <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs">Space</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-blue-800">Search Settings</span>
                <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs">Ctrl+F</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-blue-800">Save Changes</span>
                <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs">Ctrl+S</kbd>
              </div>
            </div>
          </div>
        )}

        <SettingsDivider title="Custom Styling" />

        <SettingsToggle
          label="Enable Custom CSS"
          description="Apply custom CSS styles for personalization"
          checked={accessibilitySettings.customCSSEnabled || false}
          onChange={(value) => handleChange('customCSSEnabled', value)}
        />

        {accessibilitySettings.customCSSEnabled && (
          <div className="ml-6 space-y-3">
            <SettingsInput
              label="Custom CSS"
              description="Enter custom CSS to modify the app's appearance"
              value={accessibilitySettings.customCSS || ''}
              onChange={(value) => handleChange('customCSS', value)}
              placeholder="/* Enter your custom CSS here */"
            />
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ Custom CSS can affect app functionality. Use with caution.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Accessibility Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">👁️ Accessibility Preview</h4>
        <div 
          className={`p-4 rounded border transition-all ${
            accessibilitySettings.enableHighContrast 
              ? 'bg-black text-white border-white' 
              : 'bg-white text-gray-900 border-gray-200'
          }`}
          style={{ 
            fontSize: getFontSizePreview(accessibilitySettings.fontSize || 'normal'),
            animation: accessibilitySettings.reduceMotion ? 'none' : undefined
          }}
        >
          <h5 className="font-medium mb-2">Sample Content</h5>
          <p className="mb-2">
            This is how text will appear with your current accessibility settings.
          </p>
          <button 
            className={`px-3 py-1 rounded text-sm ${
              accessibilitySettings.enableHighContrast
                ? 'bg-white text-black'
                : 'bg-blue-500 text-white'
            }`}
          >
            Sample Button
          </button>
        </div>
      </div>

      {/* Accessibility Checklist */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">✅ Accessibility Checklist</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={accessibilitySettings.enableKeyboardNavigation !== false}
              readOnly
              className="rounded"
            />
            <span className="text-green-800">Keyboard navigation enabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={accessibilitySettings.enableTooltips !== false}
              readOnly
              className="rounded"
            />
            <span className="text-green-800">Tooltips and descriptions enabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={accessibilitySettings.fontSize !== 'small'}
              readOnly
              className="rounded"
            />
            <span className="text-green-800">Readable font size selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={accessibilitySettings.enableHighContrast || false}
              readOnly
              className="rounded"
            />
            <span className="text-green-800">High contrast (if needed)</span>
          </div>
        </div>
      </div>

      {/* Accessibility Resources */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">📚 Accessibility Resources</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Use Tab key to navigate between elements</li>
          <li>• Press Space or Enter to activate buttons</li>
          <li>• Use arrow keys to navigate within components</li>
          <li>• Screen readers will announce all interactive elements</li>
          <li>• High contrast mode improves visibility</li>
          <li>• Larger font sizes reduce eye strain</li>
        </ul>
      </div>

      {/* WCAG Compliance */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🌐 WCAG 2.1 Compliance</h4>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-blue-800">AA</div>
            <div className="text-blue-700">Color Contrast</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-blue-800">AA</div>
            <div className="text-blue-700">Keyboard Access</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-blue-800">AAA</div>
            <div className="text-blue-700">Text Scaling</div>
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}

export default AccessibilitySettings
