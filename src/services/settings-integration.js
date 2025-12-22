/**
 * Settings Integration Service
 * Connects the settings service with app functionality
 */

import { settingsService } from './settings-service'

export class SettingsIntegrationService {
  constructor() {
    this.initialized = false
    this.themeContext = null
    this.integrations = new Map()
  }

  /**
   * Initialize settings integration
   */
  init() {
    if (this.initialized) return

    console.log('🔧 Initializing Settings Integration...')
    
    // Listen for settings changes
    settingsService.addListener(this.handleSettingsChange.bind(this))
    
    // Apply initial settings
    this.applyAllSettings()
    
    this.initialized = true
    console.log('✅ Settings Integration initialized')
  }

  /**
   * Register theme context for integration
   */
  registerThemeContext(themeContext) {
    this.themeContext = themeContext
    console.log('🎨 Theme context registered')
  }

  /**
   * Handle settings changes
   */
  handleSettingsChange(event, data) {
    console.log('⚙️ Settings changed:', event, data)
    
    switch (event) {
      case 'setting-changed':
        this.applySingleSetting(data.path, data.value)
        break
      case 'category-changed':
        this.applyCategorySettings(data.category, data.values)
        break
      case 'settings-imported':
      case 'settings-reset':
        this.applyAllSettings()
        break
    }
  }

  /**
   * Apply a single setting change
   */
  applySingleSetting(path, value) {
    const [category, setting] = path.split('.')
    
    switch (category) {
      case 'app':
        this.applyAppSetting(setting, value)
        break
      case 'accessibility':
        this.applyAccessibilitySetting(setting, value)
        break
      case 'workspace':
        this.applyWorkspaceSetting(setting, value)
        break
      case 'notifications':
        this.applyNotificationSetting(setting, value)
        break
      default:
        console.log(`No integration for setting: ${path}`)
    }
  }

  /**
   * Apply category settings
   */
  applyCategorySettings(category, values) {
    console.log('🔧 Integration: Applying category settings', category, values)
    Object.entries(values).forEach(([setting, value]) => {
      console.log('🔧 Integration: Applying single setting', `${category}.${setting}`, value)
      this.applySingleSetting(`${category}.${setting}`, value)
    })
  }

  /**
   * Apply all settings
   */
  applyAllSettings() {
    const settings = settingsService.settings
    
    // Apply app settings
    if (settings.app) {
      Object.entries(settings.app).forEach(([key, value]) => {
        this.applyAppSetting(key, value)
      })
    }
    
    // Apply accessibility settings
    if (settings.accessibility) {
      Object.entries(settings.accessibility).forEach(([key, value]) => {
        this.applyAccessibilitySetting(key, value)
      })
    }
    
    // Apply workspace settings
    if (settings.workspace) {
      Object.entries(settings.workspace).forEach(([key, value]) => {
        this.applyWorkspaceSetting(key, value)
      })
    }
  }

  /**
   * Apply app settings
   */
  applyAppSetting(setting, value) {
    switch (setting) {
      case 'theme':
        this.applyTheme(value)
        break
      case 'language':
        this.applyLanguage(value)
        break
      case 'autoStart':
        this.applyAutoStart(value)
        break
      case 'minimizeToTray':
        this.applyMinimizeToTray(value)
        break
      default:
        console.log(`No integration for app setting: ${setting}`)
    }
  }

  /**
   * Apply theme setting
   */
  applyTheme(theme) {
    console.log('🎨 Applying theme:', theme)

    // Apply to ThemeContext if available - this is the primary method
    if (this.themeContext && this.themeContext.changeTheme) {
      console.log('🎨 Using ThemeContext to change theme')
      this.themeContext.changeTheme(theme)
    } else {
      console.log('🎨 ThemeContext not available, applying directly')
      // Fallback: Apply directly to document classes
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark')
      } else if (theme === 'system') {
        // Follow system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
  }

  /**
   * Apply accessibility settings
   */
  applyAccessibilitySetting(setting, value) {
    switch (setting) {
      case 'enableHighContrast':
        this.applyHighContrast(value)
        break
      case 'fontSize':
        this.applyFontSize(value)
        break
      case 'reduceMotion':
        this.applyReduceMotion(value)
        break
      case 'customCSSEnabled':
        this.applyCustomCSS(value)
        break
      case 'customCSS':
        if (settingsService.get('accessibility.customCSSEnabled')) {
          this.applyCustomCSSContent(value)
        }
        break
      default:
        console.log(`No integration for accessibility setting: ${setting}`)
    }
  }

  /**
   * Apply high contrast mode
   */
  applyHighContrast(enabled) {
    console.log('🔍 Applying high contrast:', enabled)
    
    if (enabled) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }

  /**
   * Apply font size setting
   */
  applyFontSize(size) {
    console.log('📝 Applying font size:', size)
    
    // Remove existing font size classes
    document.documentElement.className = document.documentElement.className
      .replace(/font-size-\w+/g, '')
      .trim()
    
    // Add new font size class
    document.documentElement.classList.add(`font-size-${size}`)
  }

  /**
   * Apply reduce motion setting
   */
  applyReduceMotion(enabled) {
    console.log('🎬 Applying reduce motion:', enabled)
    
    if (enabled) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }

  /**
   * Apply custom CSS
   */
  applyCustomCSS(enabled) {
    const styleId = 'custom-settings-css'
    const existingStyle = document.getElementById(styleId)
    
    if (!enabled && existingStyle) {
      existingStyle.remove()
    } else if (enabled) {
      const customCSS = settingsService.get('accessibility.customCSS')
      if (customCSS) {
        this.applyCustomCSSContent(customCSS)
      }
    }
  }

  /**
   * Apply custom CSS content
   */
  applyCustomCSSContent(css) {
    const styleId = 'custom-settings-css'
    let styleElement = document.getElementById(styleId)
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }
    
    styleElement.textContent = css
  }

  /**
   * Apply workspace settings
   */
  applyWorkspaceSetting(setting, value) {
    switch (setting) {
      case 'sidebarCollapsed':
        this.applySidebarCollapsed(value)
        break
      case 'enableKeyboardShortcuts':
        this.applyKeyboardShortcuts(value)
        break
      default:
        console.log(`No integration for workspace setting: ${setting}`)
    }
  }

  /**
   * Apply sidebar collapsed state
   */
  applySidebarCollapsed(collapsed) {
    console.log('📱 Applying sidebar collapsed:', collapsed)
    
    // This would need to be integrated with the sidebar component
    // For now, we'll store it for the next app load
    localStorage.setItem('sidebar-collapsed', collapsed.toString())
  }

  /**
   * Apply keyboard shortcuts
   */
  applyKeyboardShortcuts(enabled) {
    console.log('⌨️ Keyboard shortcuts disabled by configuration')
    this.unregisterKeyboardShortcuts()
  }

  /**
   * Register keyboard shortcuts
   */
  registerKeyboardShortcuts() {
    // Intentionally disabled
  }

  /**
   * Unregister keyboard shortcuts
   */
  unregisterKeyboardShortcuts() {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler)
      this.keyboardHandler = null
    }
  }

  /**
   * Get key combination string
   */
  getKeyCombo(event) {
    const parts = []
    
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    if (event.metaKey) parts.push('Meta')
    
    parts.push(event.key.toUpperCase())
    
    return parts.join('+')
  }

  /**
   * Execute keyboard shortcut
   */
  executeShortcut(action) {
    console.log('⌨️ Executing shortcut:', action)
    
    switch (action) {
      case 'quickUpload':
        window.location.hash = '#/upload'
        break
      case 'openAnalytics':
        window.location.hash = '#/analytics'
        break
      case 'openComments':
        window.location.hash = '#/comments'
        break
      case 'toggleSidebar':
        // This would need sidebar integration
        console.log('Toggle sidebar shortcut triggered')
        break
      default:
        console.log(`Unknown shortcut action: ${action}`)
    }
  }

  /**
   * Apply language setting
   */
  applyLanguage(language) {
    console.log('🌍 Applying language:', language)
    document.documentElement.lang = language
  }

  /**
   * Apply auto start setting
   */
  applyAutoStart(enabled) {
    console.log('🚀 Applying auto start:', enabled)
    
    // This would need Electron main process integration
    if (window.electronAPI && window.electronAPI.setAutoStart) {
      window.electronAPI.setAutoStart(enabled)
    }
  }

  /**
   * Apply minimize to tray setting
   */
  applyMinimizeToTray(enabled) {
    console.log('📱 Applying minimize to tray:', enabled)
    
    // This would need Electron main process integration
    if (window.electronAPI && window.electronAPI.setMinimizeToTray) {
      window.electronAPI.setMinimizeToTray(enabled)
    }
  }

  /**
   * Apply notification setting
   */
  applyNotificationSetting(setting, value) {
    console.log('🔔 Applying notification setting:', setting, value)
    
    // This would integrate with the notification system
    // For now, we'll just log it
  }
}

// Create singleton instance
export const settingsIntegration = new SettingsIntegrationService()
