/**
 * Enhanced Settings Service for YouTube Creators
 * Provides comprehensive settings management with categorization, validation, and persistence
 */

export class SettingsService {
  constructor() {
    this.settings = {}
    this.listeners = new Set()
    this.storageKey = 'ytm_creator_settings'
    this.version = '1.0.0'
    
    // Initialize with default settings
    this.initializeDefaults()
    this.loadSettings()
  }

  /**
   * Initialize default settings structure for YouTube creators
   */
  initializeDefaults() {
    this.defaultSettings = {
      version: this.version,
      lastUpdated: new Date().toISOString(),
      
      // Creator Workspace Settings
      workspace: {
        defaultView: 'dashboard',
        sidebarCollapsed: false,
        showQuickActions: true,
        enableKeyboardShortcuts: true
      },

      // Upload & Publishing Settings
      upload: {
        defaultPrivacy: 'private',
        defaultCategory: '22', // People & Blogs
        defaultTags: [],
        defaultDescription: '',
        autoGenerateThumbnails: true,
        uploadQuality: 'hd',
        skipWarnings: true, // User preference from memory
        enableScheduling: true,
        defaultScheduleTime: '19:00', // 7 PM
        timezoneOffset: 0,
        autoAddToPlaylist: false,
        defaultPlaylist: '',
        enableBrandWatermark: false,
        compressionPreset: 'balanced'
      },

      // Analytics & Insights Settings
      analytics: {
        defaultTimeRange: '30',
        enableRealTimeUpdates: true,
        showAdvancedMetrics: true,
        enablePerformanceAlerts: true,
        alertThresholds: {
          viewsDropPercent: 20,
          engagementDropPercent: 15,
          subscriberLossCount: 10,
          commentModerationNeeded: 5
        },
        dashboardLayout: 'default',
        enableAIInsights: true,
        dataRetentionDays: 365,
        exportFormat: 'csv'
      },

      // Notifications & Alerts
      notifications: {
        uploadComplete: true,
        newComments: true,
        newSubscribers: true,
        systemUpdates: false,
        performanceAlerts: true,
        scheduledVideoReminders: true,
        commentModerationAlerts: true,
        analyticsReports: false,
        bulkOperationComplete: true,
        errorNotifications: true,
        desktopNotifications: true,
        soundEnabled: false,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      },

      // Brand & Content Management
      brand: {
        channelBranding: {
          primaryColor: '#FF0000',
          secondaryColor: '#FFFFFF',
          logoUrl: '',
          bannerUrl: '',
          watermarkUrl: ''
        },
        defaultThumbnailTemplate: '',
        contentTemplates: [],
        seriesSettings: {
          autoNumbering: true,
          defaultNamingPattern: '[Series] - Episode [Number]: [Title]',
          enableSeriesPlaylists: true
        },
        brandKit: {
          fonts: [],
          colors: [],
          logos: [],
          overlays: []
        }
      },

      // Workflow & Automation
      workflow: {
        enableBulkOperations: true,
        bulkUploadDefaults: {
          batchSize: 5,
          uploadInterval: 300, // 5 minutes
          enableScheduleIncrement: true,
          scheduleIncrementHours: 24
        },
        autoTagging: {
          enabled: false,
          rules: []
        },
        contentPipeline: {
          enableStages: true,
          defaultStages: ['idea', 'script', 'record', 'edit', 'upload', 'promote']
        },
        shortcuts: {
          quickUpload: 'Ctrl+U',
          openAnalytics: 'Ctrl+A',
          openComments: 'Ctrl+C',
          toggleSidebar: 'Ctrl+B'
        }
      },

      // Performance & Quality Settings
      performance: {
        uploadOptimization: {
          enableParallelUploads: false,
          maxConcurrentUploads: 1,
          enableResumableUploads: true,
          chunkSize: 8388608, // 8MB
          retryAttempts: 3
        },
        qualityPresets: {
          '4k': { width: 3840, height: 2160, bitrate: 45000 },
          '1440p': { width: 2560, height: 1440, bitrate: 16000 },
          '1080p': { width: 1920, height: 1080, bitrate: 8000 },
          '720p': { width: 1280, height: 720, bitrate: 5000 }
        },
        bandwidthManagement: {
          enableThrottling: false,
          maxUploadSpeed: 0, // 0 = unlimited
          scheduleUploads: false,
          offPeakHours: {
            start: '02:00',
            end: '06:00'
          }
        }
      },

      // Account & Privacy Settings
      privacy: {
        analyticsSharing: false,
        crashReporting: true,
        enableTelemetry: false,
        dataRetention: 'auto',
        enableSecureStorage: true,
        twoFactorBackup: false
      },

      // App Settings
      app: {
        theme: 'light',
        autoStart: false,
        minimizeToTray: true,
        checkUpdates: true,
        language: 'en',
        enableBetaFeatures: false,
        debugMode: false,
        logLevel: 'info'
      },

      // Accessibility & Personalization
      accessibility: {
        enableHighContrast: false,
        fontSize: 'normal', // small, normal, large, extra-large
        enableScreenReader: false,
        enableKeyboardNavigation: true,
        reduceMotion: false,
        enableTooltips: true,
        customCSSEnabled: false,
        customCSS: ''
      }
    }

    this.settings = { ...this.defaultSettings }
  }

  /**
   * Load settings from storage
   */
  loadSettings() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        
        // Merge with defaults to ensure all new settings are present
        this.settings = this.mergeWithDefaults(parsedSettings)
        
        // Handle version migrations if needed
        this.migrateSettings()
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      this.settings = { ...this.defaultSettings }
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      this.settings.lastUpdated = new Date().toISOString()
      
      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings))
      
      // Try to save to secure storage for backup
      if (window.electronAPI?.secureStore) {
        try {
          await window.electronAPI.secureStore.set(
            `${this.storageKey}_backup`, 
            JSON.stringify(this.settings)
          )
        } catch (error) {
          console.warn('Failed to backup settings to secure storage:', error)
        }
      }
      
      // Notify listeners
      this.notifyListeners('settings-saved', this.settings)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to save settings:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get a setting value by path (e.g., 'upload.defaultPrivacy')
   */
  get(path) {
    return this.getNestedValue(this.settings, path)
  }

  /**
   * Set a setting value by path
   */
  set(path, value) {
    this.setNestedValue(this.settings, path, value)
    this.notifyListeners('setting-changed', { path, value })
  }

  /**
   * Get entire settings category
   */
  getCategory(category) {
    return this.settings[category] || {}
  }

  /**
   * Set entire settings category
   */
  setCategory(category, values) {
    this.settings[category] = { ...this.settings[category], ...values }
    this.notifyListeners('category-changed', { category, values })
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults() {
    this.settings = { ...this.defaultSettings }
    this.notifyListeners('settings-reset', this.settings)
  }

  /**
   * Reset specific category to defaults
   */
  resetCategory(category) {
    if (this.defaultSettings[category]) {
      this.settings[category] = { ...this.defaultSettings[category] }
      this.notifyListeners('category-reset', { category })
    }
  }

  /**
   * Export settings for backup
   */
  exportSettings() {
    return {
      settings: this.settings,
      exportDate: new Date().toISOString(),
      version: this.version
    }
  }

  /**
   * Import settings from backup
   */
  importSettings(importData) {
    try {
      if (importData.settings) {
        this.settings = this.mergeWithDefaults(importData.settings)
        this.notifyListeners('settings-imported', this.settings)
        return { success: true }
      }
      return { success: false, error: 'Invalid import data' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Add settings change listener
   */
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        console.error('Settings listener error:', error)
      }
    })
  }

  /**
   * Merge settings with defaults to ensure completeness
   */
  mergeWithDefaults(settings) {
    const merged = { ...this.defaultSettings }

    Object.keys(settings).forEach(key => {
      if (typeof settings[key] === 'object' && !Array.isArray(settings[key])) {
        merged[key] = { ...merged[key], ...settings[key] }
      } else {
        merged[key] = settings[key]
      }
    })

    return merged
  }

  /**
   * Handle settings migrations between versions
   */
  migrateSettings() {
    // Add migration logic here when needed
    if (!this.settings.version || this.settings.version !== this.version) {
      console.log('Migrating settings to version', this.version)
      this.settings.version = this.version
    }
  }

  /**
   * Get nested object value by dot notation path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Set nested object value by dot notation path
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  /**
   * Validate settings against schema (basic validation)
   */
  validateSettings(settings = this.settings) {
    const errors = []

    // Add validation rules here
    if (settings.upload?.defaultPrivacy && !['public', 'unlisted', 'private'].includes(settings.upload.defaultPrivacy)) {
      errors.push('Invalid default privacy setting')
    }

    if (settings.analytics?.alertThresholds?.viewsDropPercent &&
        (settings.analytics.alertThresholds.viewsDropPercent < 0 || settings.analytics.alertThresholds.viewsDropPercent > 100)) {
      errors.push('Views drop percentage must be between 0 and 100')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Search settings by keyword
   */
  searchSettings(query) {
    const results = []
    const searchInObject = (obj, path = '') => {
      Object.keys(obj).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key
        const value = obj[key]

        if (typeof value === 'object' && !Array.isArray(value)) {
          searchInObject(value, currentPath)
        } else {
          if (key.toLowerCase().includes(query.toLowerCase()) ||
              String(value).toLowerCase().includes(query.toLowerCase())) {
            results.push({
              path: currentPath,
              key,
              value,
              category: path.split('.')[0]
            })
          }
        }
      })
    }

    searchInObject(this.settings)
    return results
  }

  /**
   * Get settings categories with metadata
   */
  getCategories() {
    return {
      workspace: {
        title: 'Creator Workspace',
        description: 'Customize your workspace and interface preferences',
        icon: 'Layout',
        order: 1
      },
      upload: {
        title: 'Upload & Publishing',
        description: 'Default settings for video uploads and publishing',
        icon: 'Upload',
        order: 2
      },
      analytics: {
        title: 'Analytics & Insights',
        description: 'Configure analytics dashboard and performance alerts',
        icon: 'BarChart3',
        order: 3
      },
      notifications: {
        title: 'Notifications & Alerts',
        description: 'Manage notification preferences and alert settings',
        icon: 'Bell',
        order: 4
      },
      brand: {
        title: 'Brand & Content',
        description: 'Brand kit, templates, and content management settings',
        icon: 'Palette',
        order: 5
      },
      workflow: {
        title: 'Workflow & Automation',
        description: 'Automation rules, shortcuts, and workflow preferences',
        icon: 'Zap',
        order: 6
      },
      performance: {
        title: 'Performance & Quality',
        description: 'Upload optimization, quality presets, and bandwidth settings',
        icon: 'Gauge',
        order: 7
      },
      privacy: {
        title: 'Account & Privacy',
        description: 'Privacy settings, data retention, and security options',
        icon: 'Shield',
        order: 8
      },
      app: {
        title: 'App Settings',
        description: 'General application preferences and system settings',
        icon: 'Settings',
        order: 9
      },
      accessibility: {
        title: 'Accessibility & Personalization',
        description: 'Accessibility options and interface customization',
        icon: 'Eye',
        order: 10
      }
    }
  }
}

// Create singleton instance
export const settingsService = new SettingsService()
