/**
 * Real-time Analytics Service
 * Provides live updates and notifications for YouTube analytics
 */

export class RealtimeAnalyticsService {
  constructor() {
    this.subscribers = new Map()
    this.updateInterval = null
    this.isActive = false
    this.lastUpdate = null
    this.updateFrequency = 30000 // 30 seconds
    this.notifications = []
    this.maxNotifications = 10
  }

  /**
   * Start real-time updates
   */
  start(analyticsHook, channelId) {
    if (this.isActive) return

    this.isActive = true
    this.analyticsHook = analyticsHook
    this.channelId = channelId
    this.lastUpdate = new Date()

    // Start periodic updates
    this.updateInterval = setInterval(() => {
      this.checkForUpdates()
    }, this.updateFrequency)

    console.log('Real-time analytics started for channel:', channelId)
  }

  /**
   * Stop real-time updates
   */
  stop() {
    if (!this.isActive) return

    this.isActive = false
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    console.log('Real-time analytics stopped')
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(id, callback) {
    this.subscribers.set(id, callback)
    
    // Send current notifications to new subscriber
    if (this.notifications.length > 0) {
      callback({
        type: 'notifications',
        data: this.notifications
      })
    }

    return () => {
      this.subscribers.delete(id)
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(id) {
    this.subscribers.delete(id)
  }

  /**
   * Broadcast update to all subscribers
   */
  broadcast(update) {
    this.subscribers.forEach(callback => {
      try {
        callback(update)
      } catch (error) {
        console.error('Error broadcasting update:', error)
      }
    })
  }

  /**
   * Check for updates and notify subscribers
   */
  async checkForUpdates() {
    if (!this.analyticsHook || !this.isActive) return

    try {
      // Simulate checking for new data
      const now = new Date()
      const timeSinceLastUpdate = now - this.lastUpdate

      // Check for significant changes (simulated)
      const hasNewViews = Math.random() > 0.7 // 30% chance of new views
      const hasNewSubscribers = Math.random() > 0.9 // 10% chance of new subscribers
      const hasNewComments = Math.random() > 0.8 // 20% chance of new comments

      if (hasNewViews || hasNewSubscribers || hasNewComments) {
        const updates = this.generateSimulatedUpdates(hasNewViews, hasNewSubscribers, hasNewComments)
        
        // Broadcast live updates
        this.broadcast({
          type: 'liveUpdate',
          timestamp: now,
          data: updates
        })

        // Generate notifications for significant events
        this.generateNotifications(updates)
        
        this.lastUpdate = now
      }

      // Broadcast heartbeat every minute
      if (timeSinceLastUpdate > 60000) {
        this.broadcast({
          type: 'heartbeat',
          timestamp: now,
          isActive: this.isActive
        })
      }

    } catch (error) {
      console.error('Error checking for updates:', error)
    }
  }

  /**
   * Generate simulated real-time updates
   */
  generateSimulatedUpdates(hasNewViews, hasNewSubscribers, hasNewComments) {
    const updates = {}

    if (hasNewViews) {
      updates.newViews = Math.floor(Math.random() * 50) + 1
      updates.viewsGrowthRate = ((Math.random() - 0.5) * 20).toFixed(1) // -10% to +10%
    }

    if (hasNewSubscribers) {
      updates.newSubscribers = Math.floor(Math.random() * 5) + 1
      updates.subscriberGrowthRate = ((Math.random() - 0.3) * 30).toFixed(1) // -9% to +21%
    }

    if (hasNewComments) {
      updates.newComments = Math.floor(Math.random() * 10) + 1
      updates.engagementBoost = (Math.random() * 15).toFixed(1) // 0% to 15%
    }

    return updates
  }

  /**
   * Generate notifications for significant events
   */
  generateNotifications(updates) {
    const now = new Date()

    if (updates.newSubscribers && updates.newSubscribers >= 3) {
      this.addNotification({
        id: `sub_${now.getTime()}`,
        type: 'success',
        title: 'New Subscribers!',
        message: `🎉 ${updates.newSubscribers} new subscribers in the last 30 seconds`,
        timestamp: now,
        icon: '👥'
      })
    }

    if (updates.newViews && updates.newViews >= 30) {
      this.addNotification({
        id: `views_${now.getTime()}`,
        type: 'info',
        title: 'Views Spike',
        message: `📈 ${updates.newViews} new views detected`,
        timestamp: now,
        icon: '👀'
      })
    }

    if (updates.newComments && updates.newComments >= 5) {
      this.addNotification({
        id: `comments_${now.getTime()}`,
        type: 'info',
        title: 'High Engagement',
        message: `💬 ${updates.newComments} new comments - your audience is engaged!`,
        timestamp: now,
        icon: '💬'
      })
    }

    if (updates.viewsGrowthRate && parseFloat(updates.viewsGrowthRate) > 15) {
      this.addNotification({
        id: `growth_${now.getTime()}`,
        type: 'success',
        title: 'Viral Alert!',
        message: `🚀 Views growing at ${updates.viewsGrowthRate}% - potential viral content detected!`,
        timestamp: now,
        icon: '🚀'
      })
    }
  }

  /**
   * Add a notification
   */
  addNotification(notification) {
    this.notifications.unshift(notification)
    
    // Keep only the latest notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    // Broadcast new notification
    this.broadcast({
      type: 'notification',
      data: notification
    })

    // Auto-remove notification after 30 seconds
    setTimeout(() => {
      this.removeNotification(notification.id)
    }, 30000)
  }

  /**
   * Remove a notification
   */
  removeNotification(id) {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      this.notifications.splice(index, 1)
      this.broadcast({
        type: 'notificationRemoved',
        data: { id }
      })
    }
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    this.notifications = []
    this.broadcast({
      type: 'notificationsCleared',
      data: {}
    })
  }

  /**
   * Get current notifications
   */
  getNotifications() {
    return [...this.notifications]
  }

  /**
   * Set update frequency
   */
  setUpdateFrequency(frequency) {
    this.updateFrequency = Math.max(5000, frequency) // Minimum 5 seconds
    
    if (this.isActive) {
      this.stop()
      this.start(this.analyticsHook, this.channelId)
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      lastUpdate: this.lastUpdate,
      updateFrequency: this.updateFrequency,
      subscriberCount: this.subscribers.size,
      notificationCount: this.notifications.length
    }
  }

  /**
   * Simulate a viral event (for testing)
   */
  simulateViralEvent() {
    const updates = {
      newViews: Math.floor(Math.random() * 200) + 100,
      newSubscribers: Math.floor(Math.random() * 20) + 10,
      newComments: Math.floor(Math.random() * 30) + 15,
      viewsGrowthRate: (Math.random() * 50 + 25).toFixed(1), // 25% to 75%
      subscriberGrowthRate: (Math.random() * 40 + 20).toFixed(1) // 20% to 60%
    }

    this.broadcast({
      type: 'liveUpdate',
      timestamp: new Date(),
      data: updates
    })

    this.generateNotifications(updates)

    // Add special viral notification
    this.addNotification({
      id: `viral_${Date.now()}`,
      type: 'success',
      title: '🔥 VIRAL ALERT! 🔥',
      message: `Your content is going viral! ${updates.newViews} views, ${updates.newSubscribers} subscribers in the last minute!`,
      timestamp: new Date(),
      icon: '🔥'
    })
  }

  /**
   * Simulate a milestone achievement
   */
  simulateMilestone(type, value) {
    const milestones = {
      subscribers: {
        icon: '🎯',
        title: 'Subscriber Milestone!',
        message: `Congratulations! You've reached ${value.toLocaleString()} subscribers!`
      },
      views: {
        icon: '👀',
        title: 'Views Milestone!',
        message: `Amazing! Your channel has reached ${value.toLocaleString()} total views!`
      },
      watchTime: {
        icon: '⏱️',
        title: 'Watch Time Milestone!',
        message: `Incredible! You've accumulated ${value.toLocaleString()} hours of watch time!`
      }
    }

    const milestone = milestones[type]
    if (milestone) {
      this.addNotification({
        id: `milestone_${type}_${Date.now()}`,
        type: 'success',
        title: milestone.title,
        message: milestone.message,
        timestamp: new Date(),
        icon: milestone.icon
      })
    }
  }
}

// Create singleton instance
export const realtimeAnalytics = new RealtimeAnalyticsService()
