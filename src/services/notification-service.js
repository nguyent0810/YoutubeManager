/**
 * Notification Service for YouTube Manager
 * Handles in-app notifications, system notifications, and notification preferences
 */

export class NotificationService {
  constructor() {
    this.notifications = []
    this.listeners = new Set()
    this.maxNotifications = 50
    this.storageKey = 'ytm_notifications'
    this.loadNotifications()
  }

  /**
   * Add a new notification
   */
  addNotification(notification) {
    const newNotification = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    }

    this.notifications.unshift(newNotification)
    
    // Keep only the latest notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    this.saveNotifications()
    this.notifyListeners('notification-added', newNotification)

    // Show system notification if enabled
    if (notification.showSystem && this.isSystemNotificationEnabled()) {
      this.showSystemNotification(newNotification)
    }

    return newNotification
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      this.saveNotifications()
      this.notifyListeners('notification-read', notification)
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    let hasChanges = false
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true
        hasChanges = true
      }
    })

    if (hasChanges) {
      this.saveNotifications()
      this.notifyListeners('all-notifications-read')
    }
  }

  /**
   * Remove notification
   */
  removeNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      const removed = this.notifications.splice(index, 1)[0]
      this.saveNotifications()
      this.notifyListeners('notification-removed', removed)
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications() {
    this.notifications = []
    this.saveNotifications()
    this.notifyListeners('all-notifications-cleared')
  }

  /**
   * Get all notifications
   */
  getNotifications() {
    return this.notifications
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read)
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return this.getUnreadNotifications().length
  }

  /**
   * Create different types of notifications
   */
  
  // Video upload notifications
  notifyVideoUploaded(videoTitle, videoId) {
    return this.addNotification({
      type: 'video_upload',
      title: 'Video Uploaded Successfully',
      message: `"${videoTitle}" has been uploaded to YouTube`,
      icon: 'upload',
      action: {
        label: 'View Video',
        url: `/videos/${videoId}`
      },
      showSystem: true
    })
  }

  notifyVideoUploadFailed(videoTitle, error) {
    return this.addNotification({
      type: 'video_upload_error',
      title: 'Video Upload Failed',
      message: `Failed to upload "${videoTitle}": ${error}`,
      icon: 'alert-circle',
      severity: 'error',
      showSystem: true
    })
  }

  // Comment notifications
  notifyNewComment(videoTitle, commentAuthor, commentText) {
    return this.addNotification({
      type: 'new_comment',
      title: 'New Comment',
      message: `${commentAuthor} commented on "${videoTitle}": ${commentText.substring(0, 100)}...`,
      icon: 'message-circle',
      action: {
        label: 'View Comment',
        url: '/comments'
      },
      showSystem: true
    })
  }

  // Analytics notifications
  notifyMilestoneReached(milestone, metric) {
    return this.addNotification({
      type: 'milestone',
      title: 'Milestone Reached!',
      message: `Congratulations! You've reached ${milestone} ${metric}`,
      icon: 'trophy',
      severity: 'success',
      showSystem: true
    })
  }

  // System notifications
  notifySystemUpdate(version) {
    return this.addNotification({
      type: 'system_update',
      title: 'Update Available',
      message: `YouTube Manager ${version} is available for download`,
      icon: 'download',
      action: {
        label: 'Download',
        url: '/settings?tab=updates'
      }
    })
  }

  notifySettingsChanged(settingName) {
    return this.addNotification({
      type: 'settings_changed',
      title: 'Settings Updated',
      message: `${settingName} has been updated successfully`,
      icon: 'settings',
      severity: 'info'
    })
  }

  /**
   * Show system notification
   */
  async showSystemNotification(notification) {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }

    if (Notification.permission === 'granted') {
      try {
        // Try Electron notification first
        if (window.electronAPI?.showNotification) {
          await window.electronAPI.showNotification({
            title: notification.title,
            body: notification.message,
            icon: '/assets/icon.png'
          })
        } else {
          // Fallback to web notification
          new Notification(notification.title, {
            body: notification.message,
            icon: '/assets/icon.png',
            tag: notification.id
          })
        }
      } catch (error) {
        console.error('Failed to show system notification:', error)
      }
    }
  }

  /**
   * Check if system notifications are enabled
   */
  isSystemNotificationEnabled() {
    // This would check user preferences
    return Notification.permission === 'granted'
  }

  /**
   * Add listener for notification events
   */
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        console.error('Notification listener error:', error)
      }
    })
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Save notifications to localStorage
   */
  saveNotifications() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notifications))
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }

  /**
   * Load notifications from localStorage
   */
  loadNotifications() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.notifications = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      this.notifications = []
    }
  }

  /**
   * Create initial welcome notifications (disabled - only real notifications)
   */
  createWelcomeNotifications() {
    // Disabled - no automatic notifications
    // Notifications will only be created by real user actions
  }
}

// Create singleton instance
export const notificationService = new NotificationService()
