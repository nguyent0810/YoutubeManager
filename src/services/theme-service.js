/**
 * Theme Service
 * Manages dark/light theme switching and persistence
 */

export class ThemeService {
  constructor() {
    this.themes = {
      light: {
        id: 'light',
        name: 'Light',
        colors: {
          primary: '#1976d2',
          secondary: '#dc004e',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#212529',
          textSecondary: '#6c757d',
          border: '#dee2e6',
          success: '#28a745',
          warning: '#ffc107',
          error: '#dc3545',
          info: '#17a2b8'
        }
      },
      dark: {
        id: 'dark',
        name: 'Dark',
        colors: {
          primary: '#64b5f6',
          secondary: '#f48fb1',
          background: '#121212',
          surface: '#1e1e1e',
          text: '#ffffff',
          textSecondary: '#b0b0b0',
          border: '#333333',
          success: '#4caf50',
          warning: '#ff9800',
          error: '#f44336',
          info: '#2196f3'
        }
      },
      auto: {
        id: 'auto',
        name: 'Auto',
        description: 'Follow system preference'
      }
    }

    this.currentTheme = 'auto'
    this.systemPreference = 'light'
    this.listeners = new Set()

    // Initialize theme
    this.init()
  }

  /**
   * Initialize theme service
   */
  init() {
    // Load saved theme preference
    this.loadThemePreference()

    // Listen for system theme changes
    this.setupSystemThemeListener()

    // Apply initial theme
    this.applyTheme()
  }

  /**
   * Load theme preference from storage
   */
  loadThemePreference() {
    try {
      const saved = localStorage.getItem('theme_preference')
      if (saved && this.themes[saved]) {
        this.currentTheme = saved
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error)
    }
  }

  /**
   * Save theme preference to storage
   */
  saveThemePreference(theme) {
    try {
      localStorage.setItem('theme_preference', theme)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  /**
   * Setup system theme change listener
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      // Set initial system preference
      this.systemPreference = mediaQuery.matches ? 'dark' : 'light'

      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this.systemPreference = e.matches ? 'dark' : 'light'
        if (this.currentTheme === 'auto') {
          this.applyTheme()
        }
      })
    }
  }

  /**
   * Get current effective theme (resolves 'auto' to actual theme)
   */
  getEffectiveTheme() {
    if (this.currentTheme === 'auto') {
      return this.systemPreference
    }
    return this.currentTheme
  }

  /**
   * Get theme configuration
   */
  getThemeConfig(themeId = null) {
    const effectiveTheme = themeId || this.getEffectiveTheme()
    return this.themes[effectiveTheme] || this.themes.light
  }

  /**
   * Set theme
   */
  setTheme(themeId) {
    if (!this.themes[themeId]) {
      console.warn(`Unknown theme: ${themeId}`)
      return
    }

    this.currentTheme = themeId
    this.saveThemePreference(themeId)
    this.applyTheme()
    this.notifyListeners()
  }

  /**
   * Apply theme to document
   */
  applyTheme() {
    const effectiveTheme = this.getEffectiveTheme()
    const themeConfig = this.getThemeConfig(effectiveTheme)

    // Apply theme class to document
    document.documentElement.className = document.documentElement.className
      .replace(/theme-\w+/g, '')
      .trim()
    document.documentElement.classList.add(`theme-${effectiveTheme}`)

    // Apply CSS custom properties
    if (themeConfig.colors) {
      const root = document.documentElement
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value)
      })
    }

    // Apply meta theme-color for mobile browsers
    this.updateMetaThemeColor(themeConfig.colors?.primary || '#1976d2')
  }

  /**
   * Update meta theme-color for mobile browsers
   */
  updateMetaThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.name = 'theme-color'
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.content = color
  }

  /**
   * Get available themes
   */
  getAvailableThemes() {
    return Object.values(this.themes)
  }

  /**
   * Get current theme ID
   */
  getCurrentTheme() {
    return this.currentTheme
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode() {
    return this.getEffectiveTheme() === 'dark'
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const effectiveTheme = this.getEffectiveTheme()
    const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark'
    this.setTheme(newTheme)
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify listeners of theme changes
   */
  notifyListeners() {
    const themeInfo = {
      current: this.currentTheme,
      effective: this.getEffectiveTheme(),
      config: this.getThemeConfig(),
      isDark: this.isDarkMode()
    }

    this.listeners.forEach(callback => {
      try {
        callback(themeInfo)
      } catch (error) {
        console.error('Theme listener error:', error)
      }
    })
  }

  /**
   * Get theme-aware color
   */
  getColor(colorKey) {
    const themeConfig = this.getThemeConfig()
    return themeConfig.colors?.[colorKey] || '#000000'
  }

  /**
   * Generate theme-aware CSS classes
   */
  getThemeClasses(baseClasses = '') {
    const effectiveTheme = this.getEffectiveTheme()
    const themeClass = `theme-${effectiveTheme}`
    return `${baseClasses} ${themeClass}`.trim()
  }

  /**
   * Get contrast color (for text on colored backgrounds)
   */
  getContrastColor(backgroundColor) {
    // Simple contrast calculation
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#000000' : '#ffffff'
  }

  /**
   * Create theme-aware styles object
   */
  createStyles(lightStyles, darkStyles = {}) {
    const effectiveTheme = this.getEffectiveTheme()
    if (effectiveTheme === 'dark') {
      return { ...lightStyles, ...darkStyles }
    }
    return lightStyles
  }

  /**
   * Export theme configuration for external use
   */
  exportThemeConfig() {
    return {
      current: this.currentTheme,
      effective: this.getEffectiveTheme(),
      system: this.systemPreference,
      config: this.getThemeConfig(),
      isDark: this.isDarkMode(),
      colors: this.getThemeConfig().colors
    }
  }
}

// Create singleton instance
export const themeService = new ThemeService()
