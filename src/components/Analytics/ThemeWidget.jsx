import React, { useState, useEffect } from 'react'
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Check,
  Settings
} from 'lucide-react'
import { themeService } from '../../services/theme-service'

const ThemeWidget = ({ 
  isEditMode,
  title = "Theme Settings",
  viewMode = "desktop" 
}) => {
  const [currentTheme, setCurrentTheme] = useState('auto')
  const [effectiveTheme, setEffectiveTheme] = useState('light')
  const [isDark, setIsDark] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const themes = themeService.getAvailableThemes()

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = themeService.subscribe((themeInfo) => {
      setCurrentTheme(themeInfo.current)
      setEffectiveTheme(themeInfo.effective)
      setIsDark(themeInfo.isDark)
    })

    // Set initial state
    setCurrentTheme(themeService.getCurrentTheme())
    setEffectiveTheme(themeService.getEffectiveTheme())
    setIsDark(themeService.isDarkMode())

    return unsubscribe
  }, [])

  const handleThemeChange = (themeId) => {
    if (!isEditMode) {
      themeService.setTheme(themeId)
    }
  }

  const toggleTheme = () => {
    if (!isEditMode) {
      themeService.toggleTheme()
    }
  }

  const getThemeIcon = (themeId) => {
    switch (themeId) {
      case 'light':
        return <Sun size={20} className="text-yellow-500" />
      case 'dark':
        return <Moon size={20} className="text-blue-400" />
      case 'auto':
        return <Monitor size={20} className="text-gray-500" />
      default:
        return <Palette size={20} className="text-purple-500" />
    }
  }

  const getThemeDescription = (themeId) => {
    switch (themeId) {
      case 'light':
        return 'Clean, bright interface'
      case 'dark':
        return 'Easy on the eyes'
      case 'auto':
        return 'Follows system preference'
      default:
        return 'Custom theme'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 theme-surface">
      {/* Widget Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 theme-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Palette size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white theme-text">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 theme-text-secondary">
                Current: {effectiveTheme === 'dark' ? 'Dark' : 'Light'} mode
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quick Toggle */}
            <button
              onClick={toggleTheme}
              disabled={isEditMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun size={16} className="text-yellow-500" />
              ) : (
                <Moon size={16} className="text-blue-400" />
              )}
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              disabled={isEditMode}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Theme Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Quick Theme Selector */}
        <div className="flex space-x-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              disabled={isEditMode}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentTheme === theme.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {getThemeIcon(theme.id)}
              <span className={viewMode === 'mobile' ? 'hidden sm:inline' : ''}>{theme.name}</span>
              {currentTheme === theme.id && (
                <Check size={14} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Details */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Current Theme Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              {getThemeIcon(effectiveTheme)}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white theme-text">
                  {effectiveTheme === 'dark' ? 'Dark Mode' : 'Light Mode'} Active
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 theme-text-secondary">
                  {getThemeDescription(effectiveTheme)}
                </p>
              </div>
            </div>
            
            {currentTheme === 'auto' && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                <Monitor size={12} className="inline mr-1" />
                Following system preference
              </div>
            )}
          </div>

          {/* Theme Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Sun size={24} className="text-yellow-500 mx-auto mb-2" />
              <h5 className="font-medium text-gray-900 dark:text-white theme-text">Light Mode</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 theme-text-secondary">
                Better for daytime use and detailed work
              </p>
            </div>
            
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Moon size={24} className="text-blue-400 mx-auto mb-2" />
              <h5 className="font-medium text-gray-900 dark:text-white theme-text">Dark Mode</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 theme-text-secondary">
                Reduces eye strain in low light
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      {showSettings && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 theme-border">
          <div className="pt-6 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white theme-text">Advanced Settings</h4>
            
            {/* Theme Preferences */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  disabled={isEditMode}
                  className="mr-2 rounded" 
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 theme-text">
                  Remember theme preference
                </span>
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  disabled={isEditMode}
                  className="mr-2 rounded" 
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 theme-text">
                  Smooth theme transitions
                </span>
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  defaultChecked={currentTheme === 'auto'} 
                  disabled={isEditMode}
                  className="mr-2 rounded" 
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 theme-text">
                  Follow system theme changes
                </span>
              </label>
            </div>

            {/* Theme Preview */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white theme-text mb-3">Theme Preview</h5>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-8 bg-blue-500 rounded"></div>
                <div className="h-8 bg-green-500 rounded"></div>
                <div className="h-8 bg-yellow-500 rounded"></div>
                <div className="h-8 bg-red-500 rounded"></div>
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 theme-text-secondary">
                Colors adapt automatically to your theme
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg theme-border">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400 theme-text-secondary">
            Theme applies to entire application
          </p>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 theme-text-secondary">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeWidget
