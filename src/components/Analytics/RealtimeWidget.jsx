import React, { useState, useEffect } from 'react'
import { 
  Zap, 
  Bell, 
  X, 
  Play, 
  Pause,
  Settings,
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  Wifi,
  WifiOff
} from 'lucide-react'
import { realtimeAnalytics } from '../../services/realtime-analytics'

const RealtimeWidget = ({ 
  overview, 
  isEditMode,
  title = "Live Analytics",
  channelId 
}) => {
  const [isActive, setIsActive] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [liveData, setLiveData] = useState({})
  const [lastUpdate, setLastUpdate] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [updateFrequency, setUpdateFrequency] = useState(30000)

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realtimeAnalytics.subscribe('realtime-widget', (update) => {
      switch (update.type) {
        case 'liveUpdate':
          setLiveData(prev => ({ ...prev, ...update.data }))
          setLastUpdate(update.timestamp)
          break
        case 'notification':
          setNotifications(prev => [update.data, ...prev.slice(0, 9)])
          break
        case 'notificationRemoved':
          setNotifications(prev => prev.filter(n => n.id !== update.data.id))
          break
        case 'notificationsCleared':
          setNotifications([])
          break
        case 'notifications':
          setNotifications(update.data)
          break
        case 'heartbeat':
          setLastUpdate(update.timestamp)
          break
      }
    })

    return unsubscribe
  }, [])

  // Start/stop real-time updates
  const toggleRealtime = () => {
    if (isActive) {
      realtimeAnalytics.stop()
      setIsActive(false)
    } else {
      realtimeAnalytics.start(null, channelId)
      setIsActive(true)
    }
  }

  // Update frequency
  const handleFrequencyChange = (frequency) => {
    setUpdateFrequency(frequency)
    realtimeAnalytics.setUpdateFrequency(frequency)
  }

  // Clear notifications
  const clearNotifications = () => {
    realtimeAnalytics.clearNotifications()
  }

  // Remove specific notification
  const removeNotification = (id) => {
    realtimeAnalytics.removeNotification(id)
  }

  // Simulate events (for testing)
  const simulateViralEvent = () => {
    realtimeAnalytics.simulateViralEvent()
  }

  const simulateMilestone = () => {
    const milestones = [
      { type: 'subscribers', value: 1000 },
      { type: 'views', value: 100000 },
      { type: 'watchTime', value: 4000 }
    ]
    const milestone = milestones[Math.floor(Math.random() * milestones.length)]
    realtimeAnalytics.simulateMilestone(milestone.type, milestone.value)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '🎉'
      case 'warning':
        return '⚠️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never'
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Widget Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isActive ? 'bg-gradient-to-br from-green-500 to-blue-600' : 'bg-gray-400'
            }`}>
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {isActive ? (
                  <>
                    <Wifi size={14} className="text-green-500" />
                    <span>Live • Updated {formatTimeAgo(lastUpdate)}</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-gray-400" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              disabled={isEditMode}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={toggleRealtime}
              disabled={isEditMode}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isActive ? <Pause size={14} /> : <Play size={14} />}
              <span className="text-sm">{isActive ? 'Stop' : 'Start'}</span>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Real-time Settings</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Update Frequency:</label>
                <select
                  value={updateFrequency}
                  onChange={(e) => handleFrequencyChange(parseInt(e.target.value))}
                  disabled={isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value={5000}>5 seconds</option>
                  <option value={15000}>15 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={300000}>5 minutes</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={simulateViralEvent}
                  disabled={isEditMode}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors"
                >
                  🚀 Simulate Viral
                </button>
                <button
                  onClick={simulateMilestone}
                  disabled={isEditMode}
                  className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 transition-colors"
                >
                  🎯 Simulate Milestone
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Data */}
      {isActive && Object.keys(liveData).length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Live Updates</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {liveData.newViews && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Eye size={20} className="text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-900">+{liveData.newViews}</div>
                <div className="text-xs text-blue-600">New Views</div>
              </div>
            )}
            {liveData.newSubscribers && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Users size={20} className="text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-900">+{liveData.newSubscribers}</div>
                <div className="text-xs text-green-600">New Subscribers</div>
              </div>
            )}
            {liveData.newComments && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <MessageCircle size={20} className="text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-900">+{liveData.newComments}</div>
                <div className="text-xs text-purple-600">New Comments</div>
              </div>
            )}
            {liveData.viewsGrowthRate && (
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <TrendingUp size={20} className="text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-900">{liveData.viewsGrowthRate}%</div>
                <div className="text-xs text-orange-600">Growth Rate</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">
            Live Notifications ({notifications.length})
          </h4>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              disabled={isEditMode}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 ${
                  notification.type === 'success' ? 'bg-green-50 border-green-500' :
                  notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{notification.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    disabled={isEditMode}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No live notifications</p>
              <p className="text-xs text-gray-400 mt-1">
                {isActive ? 'Monitoring for updates...' : 'Start live monitoring to see notifications'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RealtimeWidget
