import React, { useState, useEffect, useRef } from 'react'
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2,
  Upload,
  MessageCircle,
  BarChart3,
  Settings,
  Trophy,
  Download,
  AlertCircle,
  Info
} from 'lucide-react'
import { notificationService } from '../services/notification-service'

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationService.getNotifications())
    setUnreadCount(notificationService.getUnreadCount())

    // Listen for notification changes
    const unsubscribe = notificationService.addListener((event, data) => {
      setNotifications([...notificationService.getNotifications()])
      setUnreadCount(notificationService.getUnreadCount())
    })

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
  }

  const handleRemoveNotification = (notificationId) => {
    notificationService.removeNotification(notificationId)
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      notificationService.clearAllNotifications()
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'video_upload':
        return <Upload size={16} className="text-green-500" />
      case 'video_upload_error':
        return <AlertCircle size={16} className="text-red-500" />
      case 'new_comment':
        return <MessageCircle size={16} className="text-blue-500" />
      case 'milestone':
        return <Trophy size={16} className="text-yellow-500" />
      case 'system_update':
        return <Download size={16} className="text-purple-500" />
      case 'settings_changed':
        return <Settings size={16} className="text-gray-500" />
      case 'welcome':
        return <Settings size={16} className="text-blue-500" />
      case 'tip':
        return <Info size={16} className="text-green-500" />
      default:
        return <Info size={16} className="text-blue-500" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'success':
        return 'border-l-green-500 bg-green-50'
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
  }

  // Don't auto-create notifications - let them be created naturally by user actions

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({unreadCount} unread)
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-400 hover:text-gray-600"
                title="Clear all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see updates about your videos, comments, and more here.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 last:border-b-0 ${
                    !notification.read ? 'bg-blue-50' : ''
                  } ${getSeverityColor(notification.severity)} border-l-4`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        
                        {notification.action && (
                          <button
                            onClick={() => {
                              // Handle action click
                              if (notification.action.url) {
                                window.location.href = notification.action.url
                              }
                              handleMarkAsRead(notification.id)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {notification.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to notifications page if it exists
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
