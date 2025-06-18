import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  TrendingUp,
  Users,
  Eye,
  Clock,
  Video,
  MessageSquare,
  ThumbsUp,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { youtubeAuth } from '../services/youtube-api'

const Dashboard = () => {
  const { activeAccount, accounts } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentVideos, setRecentVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalComments, setTotalComments] = useState(0)
  const [videoStatusFilter, setVideoStatusFilter] = useState('all')
  const [videoCounts, setVideoCounts] = useState(null)
  const [percentageChanges, setPercentageChanges] = useState(null)
  const [videosToShow, setVideosToShow] = useState(5)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Cache management functions - Use channelId instead of email to avoid conflicts
  const getCacheKey = () => `dashboard_${activeAccount?.channelId || 'default'}`

  const getCachedData = () => {
    if (!activeAccount) return null
    try {
      const cached = localStorage.getItem(getCacheKey())
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Error reading cached data:', error)
      return null
    }
  }

  const setCachedData = (data) => {
    if (!activeAccount) return
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(data))
    } catch (error) {
      console.error('Error caching data:', error)
    }
  }

  const isDataCached = () => {
    return getCachedData() !== null
  }

  // Load dashboard data only if not cached (first time opening app for this account)
  useEffect(() => {
    if (activeAccount) {
      setError(null)
      const cachedData = getCachedData()

      if (!cachedData) {
        console.log('Loading dashboard data for first time...')
        loadDashboardData()
      } else {
        console.log('Using cached dashboard data')
        // Restore cached data
        setStats(cachedData.stats || null)
        setRecentVideos(cachedData.recentVideos || [])
        setVideoCounts(cachedData.videoCounts || null)
        setPercentageChanges(cachedData.percentageChanges || null)
        setLoading(false)
      }
    }
  }, [activeAccount])

  // Load recent videos when filter or videosToShow changes
  useEffect(() => {
    if (activeAccount) {
      loadRecentVideos()
    }
  }, [videoStatusFilter, videosToShow])

  // Reset videos to show when filter changes
  useEffect(() => {
    if (activeAccount) {
      setVideosToShow(5)
    }
  }, [videoStatusFilter])

  // Cache data when all states are loaded and not loading
  useEffect(() => {
    if (activeAccount && !loading && !refreshing && stats && recentVideos.length > 0) {
      const dataToCache = {
        stats,
        recentVideos,
        videoCounts,
        percentageChanges,
        timestamp: Date.now()
      }
      setCachedData(dataToCache)
      console.log('Dashboard data cached for', activeAccount.channelName, '(', activeAccount.channelId, ')')
    }
  }, [activeAccount, loading, refreshing, stats, recentVideos, videoCounts, percentageChanges])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    const newCount = videosToShow + 5
    setVideosToShow(newCount)
    // loadRecentVideos will be called automatically by useEffect when videosToShow changes
    setLoadingMore(false)
  }

  const handleRetry = () => {
    setError(null)
    loadDashboardData()
  }

  // Manual refresh function
  const handleRefresh = async () => {
    if (!activeAccount || refreshing) return

    setRefreshing(true)
    setError(null)

    try {
      console.log('Manually refreshing dashboard data...')
      await loadDashboardData()
      toast.success('Dashboard data refreshed!')
    } catch (error) {
      console.error('Failed to refresh:', error)
      toast.error('Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  // Load main dashboard data (stats, counts, percentage changes)
  const loadDashboardData = async () => {
    if (!activeAccount) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Load real channel statistics
      const channelData = await youtubeAuth.getChannelAnalytics(activeAccount)
      console.log('Channel data received:', channelData) // Debug log

      if (channelData.items && channelData.items.length > 0) {
        const channel = channelData.items[0]
        const statistics = channel.statistics
        console.log('Channel statistics:', statistics) // Debug log

        setStats({
          subscribers: parseInt(statistics.subscriberCount || 0),
          totalViews: parseInt(statistics.viewCount || 0),
          totalVideos: parseInt(statistics.videoCount || 0),
          totalComments: 0 // Will be calculated from videos
        })
      } else {
        console.log('No channel data found') // Debug log
        setStats({
          subscribers: 0,
          totalViews: 0,
          totalVideos: 0,
          totalComments: 0
        })
      }

      // Load video counts by status
      const videoCountsData = await youtubeAuth.getVideoCountsByStatus(activeAccount)
      console.log('Video counts by status:', videoCountsData) // Debug log
      setVideoCounts(videoCountsData)

      // Percentage changes removed as requested

      // Load initial videos
      await loadRecentVideos()

      // Cache will be done in a separate useEffect after state updates

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError(error.message)

      setStats({
        subscribers: 0,
        totalViews: 0,
        totalVideos: 0,
        totalComments: 0
      })
      setRecentVideos([])

      toast.error('Failed to load channel data. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load recent videos only (for filtering)
  const loadRecentVideos = async () => {
    if (!activeAccount) return

    try {
      setLoadingVideos(true)
      const videoParams = { maxResults: Math.max(videosToShow, 20) }
      if (videoStatusFilter !== 'all') {
        videoParams.status = videoStatusFilter
      }
      const videosData = await youtubeAuth.getVideos(activeAccount, videoParams)
      console.log('Videos data received for filter:', videoStatusFilter, videosData)
      setRecentVideos(videosData.items || [])

      // Calculate total comments from recent videos
      if (videosData.items && videosData.items.length > 0) {
        const commentsSum = videosData.items.reduce((total, video) => {
          return total + parseInt(video.statistics?.commentCount || 0)
        }, 0)

        setStats(prevStats => ({
          ...prevStats,
          totalComments: commentsSum
        }))
      }

    } catch (error) {
      console.error('Failed to load recent videos:', error)
      setRecentVideos([])
    } finally {
      setLoadingVideos(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toLocaleString() || '0'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Helper function to get actual video status (including scheduled)
  const getActualVideoStatus = (video) => {
    const privacyStatus = video.status.privacyStatus
    const publishAt = video.status.publishAt

    // Check if video is scheduled (has publishAt and is currently private)
    if (privacyStatus === 'private' && publishAt) {
      const publishTime = new Date(publishAt)
      const now = new Date()

      if (publishTime > now) {
        return 'scheduled'
      }
    }

    return privacyStatus
  }

  // Helper function to get status display info
  const getStatusDisplay = (video) => {
    const actualStatus = getActualVideoStatus(video)

    switch (actualStatus) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          className: 'bg-blue-100 text-blue-800',
          publishInfo: video.status.publishAt ? `Scheduled for ${formatDate(video.status.publishAt)}` : 'Scheduled'
        }
      case 'public':
        return {
          label: 'Public',
          className: 'bg-green-100 text-green-800',
          publishInfo: `Published ${formatDate(video.snippet.publishedAt)}`
        }
      case 'private':
        return {
          label: 'Private',
          className: 'bg-gray-100 text-gray-800',
          publishInfo: `Created ${formatDate(video.snippet.publishedAt)}`
        }
      case 'unlisted':
        return {
          label: 'Unlisted',
          className: 'bg-yellow-100 text-yellow-800',
          publishInfo: `Published ${formatDate(video.snippet.publishedAt)}`
        }
      default:
        return {
          label: actualStatus,
          className: 'bg-gray-100 text-gray-800',
          publishInfo: `Created ${formatDate(video.snippet.publishedAt)}`
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-youtube-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with {activeAccount?.channelName}
          </p>
          {isDataCached() && !refreshing && (
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Using cached data - Click refresh for latest updates
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh dashboard data"
          >
            <RefreshCw size={16} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>

          <span className="text-sm text-gray-500">Connected Accounts:</span>
          <span className="bg-youtube-red text-white px-3 py-1 rounded-full text-sm font-medium">
            {accounts.length}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-red-600 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Failed to load channel data</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Subscribers</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(stats?.subscribers)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp size={16} className="text-gray-400 mr-1" />
            <span className="text-sm text-gray-500">Real-time data</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(stats?.totalViews)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Eye size={16} className="text-gray-400 mr-1" />
            <span className="text-sm text-gray-500">All-time views</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(stats?.totalVideos)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Video size={16} className="text-gray-400 mr-1" />
            <span className="text-sm text-gray-500">All videos</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Comments</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(stats?.totalComments)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare size={24} className="text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <MessageSquare size={16} className="text-gray-400 mr-1" />
            <span className="text-sm text-gray-500">From recent videos</span>
          </div>
        </div>
      </div>

      {/* Recent Videos */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Videos</h2>
              <p className="text-gray-600 mt-1">Your latest uploads and their performance</p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={videoStatusFilter}
                onChange={(e) => setVideoStatusFilter(e.target.value)}
                disabled={loadingVideos}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-youtube-red focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Videos</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loadingVideos ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-youtube-red"></div>
              <span className="ml-3 text-gray-600">Loading videos...</span>
            </div>
          ) : recentVideos.length > 0 ? (
            <div className="space-y-4">
              {recentVideos.slice(0, videosToShow).map((video) => (
                <div key={video.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {video.snippet.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getStatusDisplay(video).publishInfo}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Eye size={14} className="mr-1" />
                        {formatNumber(video.statistics?.viewCount)} views
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp size={14} className="mr-1" />
                        {formatNumber(video.statistics?.likeCount)} likes
                      </span>
                      <span className="flex items-center">
                        <MessageSquare size={14} className="mr-1" />
                        {formatNumber(video.statistics?.commentCount)} comments
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusDisplay(video).className}`}>
                      {getStatusDisplay(video).label}
                    </span>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {recentVideos.length > videosToShow && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-youtube-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMore ? 'Loading...' : `Load More (${recentVideos.length - videosToShow} remaining)`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Video size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
              <p className="text-gray-600 mb-4">Upload your first video to get started</p>
              <button
                onClick={() => navigate('/upload')}
                className="btn-primary"
              >
                Upload Video
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Upload</h3>
          <p className="text-gray-600 mb-4">Upload a new video to your channel</p>
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary w-full"
          >
            Upload Video
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
          <p className="text-gray-600 mb-4">View detailed performance metrics</p>
          <button
            onClick={() => navigate('/analytics')}
            className="btn-secondary w-full"
          >
            View Analytics
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
          <p className="text-gray-600 mb-4">Manage and respond to comments</p>
          <button
            onClick={() => navigate('/comments')}
            className="btn-secondary w-full"
          >
            Manage Comments
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
