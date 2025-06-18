import { useState, useEffect, useCallback } from 'react'
import { analyticsService } from '../services/analytics-api'
import { useAuth } from '../services/AuthContext'
import { youtubeAuth } from '../services/youtube-api'

export function useAnalytics(timeRange = '30daysAgo', autoRefresh = true) {
  const { activeAccount } = useAuth()
  const [data, setData] = useState({
    overview: null,
    videoPerformance: null,
    realTime: null
  })
  const [loading, setLoading] = useState({
    overview: false,
    videoPerformance: false,
    realTime: false
  })
  const [errors, setErrors] = useState({
    overview: null,
    videoPerformance: null,
    realTime: null
  })

  // Set loading state for specific data type
  const setLoadingState = useCallback((type, isLoading) => {
    setLoading(prev => ({ ...prev, [type]: isLoading }))
  }, [])

  // Set error state for specific data type
  const setErrorState = useCallback((type, error) => {
    setErrors(prev => ({ ...prev, [type]: error }))
  }, [])

  // Load analytics overview
  const loadOverview = useCallback(async (showLoading = true) => {
    if (!activeAccount) return

    try {
      if (showLoading) setLoadingState('overview', true)
      setErrorState('overview', null)

      const overviewData = await analyticsService.getAnalyticsOverview(activeAccount, timeRange)
      setData(prev => ({ ...prev, overview: overviewData }))
    } catch (error) {
      console.error('Failed to load analytics overview:', error)
      setErrorState('overview', error.message)
    } finally {
      if (showLoading) setLoadingState('overview', false)
    }
  }, [activeAccount, timeRange, setLoadingState, setErrorState])

  // Load video performance data
  const loadVideoPerformance = useCallback(async (showLoading = true, limit = 50) => {
    if (!activeAccount) return

    try {
      if (showLoading) setLoadingState('videoPerformance', true)
      setErrorState('videoPerformance', null)

      const videoData = await analyticsService.getVideoPerformance(activeAccount, timeRange, limit)
      setData(prev => ({ ...prev, videoPerformance: videoData }))
    } catch (error) {
      console.error('Failed to load video performance:', error)
      setErrorState('videoPerformance', error.message)
    } finally {
      if (showLoading) setLoadingState('videoPerformance', false)
    }
  }, [activeAccount, timeRange, setLoadingState, setErrorState])

  // Load real-time analytics
  const loadRealTime = useCallback(async (showLoading = true) => {
    if (!activeAccount) return

    try {
      if (showLoading) setLoadingState('realTime', true)
      setErrorState('realTime', null)

      const realTimeData = await analyticsService.getRealTimeAnalytics(activeAccount)
      setData(prev => ({ ...prev, realTime: realTimeData }))
    } catch (error) {
      console.error('Failed to load real-time analytics:', error)
      setErrorState('realTime', error.message)
    } finally {
      if (showLoading) setLoadingState('realTime', false)
    }
  }, [activeAccount, setLoadingState, setErrorState])

  // Load all analytics data
  const loadAllData = useCallback(async () => {
    if (!activeAccount) return

    await Promise.all([
      loadOverview(),
      loadVideoPerformance(),
      loadRealTime()
    ])
  }, [activeAccount, loadOverview, loadVideoPerformance, loadRealTime])

  // Refresh data (without showing loading indicators)
  const refreshData = useCallback(async () => {
    if (!activeAccount) return

    // Clear cache for this account
    analyticsService.clearCache(activeAccount)

    // Reload data silently
    await Promise.all([
      loadOverview(false),
      loadVideoPerformance(false),
      loadRealTime(false)
    ])
  }, [activeAccount, loadOverview, loadVideoPerformance, loadRealTime])

  // Load data when account or time range changes
  useEffect(() => {
    if (activeAccount) {
      loadAllData()
    }
  }, [activeAccount, timeRange, loadAllData])

  // Auto-refresh real-time data
  useEffect(() => {
    if (!autoRefresh || !activeAccount) return

    const interval = setInterval(() => {
      loadRealTime(false) // Silent refresh for real-time data
    }, 2 * 60 * 1000) // Every 2 minutes

    return () => clearInterval(interval)
  }, [autoRefresh, activeAccount, loadRealTime])

  // Process overview data for easier consumption
  const processedOverview = data.overview ? {
    // Key metrics - handle both Analytics API and Data API fallback
    totalViews: data.overview.isDataAPIFallback
      ? data.overview.totalViews
      : (data.overview.basicMetrics?.rows?.reduce((sum, row) => sum + (parseInt(row[1]) || 0), 0) || 0),

    totalWatchTime: data.overview.isDataAPIFallback
      ? Math.floor(data.overview.totalViews * 2.5 / 60) // Estimate: 2.5 min avg watch time
      : (data.overview.basicMetrics?.rows?.reduce((sum, row) => sum + (parseInt(row[2]) || 0), 0) || 0),

    totalLikes: data.overview.isDataAPIFallback
      ? data.overview.totalLikes
      : (data.overview.basicMetrics?.rows?.reduce((sum, row) => sum + (parseInt(row[3]) || 0), 0) || 0),

    totalComments: data.overview.isDataAPIFallback
      ? data.overview.totalComments
      : (data.overview.basicMetrics?.rows?.reduce((sum, row) => sum + (parseInt(row[5]) || 0), 0) || 0),

    subscribersGained: data.overview.isDataAPIFallback
      ? Math.floor(data.overview.totalViews * 0.001) // Estimate: 0.1% conversion
      : (data.overview.subscriberData?.rows?.reduce((sum, row) => sum + (parseInt(row[1]) || 0), 0) || 0),

    subscribersLost: data.overview.isDataAPIFallback
      ? 0
      : (data.overview.subscriberData?.rows?.reduce((sum, row) => sum + (parseInt(row[2]) || 0), 0) || 0),

    // Chart data
    dailyViews: data.overview.basicMetrics?.rows?.map(row => ({
      date: row[0],
      views: parseInt(row[1]) || 0,
      watchTime: parseInt(row[2]) || 0,
      likes: parseInt(row[3]) || 0,
      comments: parseInt(row[5]) || 0
    })) || [],

    // Traffic sources
    trafficSources: data.overview.trafficSources?.rows?.map(row => ({
      source: row[0],
      views: parseInt(row[1]) || 0,
      watchTime: parseInt(row[2]) || 0
    })) || [],

    // Geographic data
    topCountries: data.overview.geoData?.rows?.map(row => ({
      country: row[0],
      views: parseInt(row[1]) || 0,
      watchTime: parseInt(row[2]) || 0
    })) || [],

    // Device data
    deviceBreakdown: data.overview.deviceData?.rows?.map(row => ({
      device: row[0],
      views: parseInt(row[1]) || 0,
      watchTime: parseInt(row[2]) || 0
    })) || [],

    lastUpdated: data.overview.lastUpdated,
    isDataAPIFallback: data.overview.isDataAPIFallback
  } : null

  // Calculate trends (compare with previous period)
  const trends = processedOverview ? {
    viewsTrend: 12.5, // TODO: Calculate actual trend
    watchTimeTrend: 8.3,
    subscribersTrend: 15.2,
    engagementTrend: 5.7
  } : null

  return {
    // Data
    overview: processedOverview,
    videoPerformance: data.videoPerformance,
    realTime: data.realTime,
    trends,

    // Loading states
    loading,
    isLoading: Object.values(loading).some(Boolean),

    // Error states
    errors,
    hasErrors: Object.values(errors).some(Boolean),

    // Actions
    loadAllData,
    loadOverview,
    loadVideoPerformance,
    loadRealTime,
    refreshData,

    // Utilities
    formatNumber: analyticsService.formatNumber,
    formatDuration: analyticsService.formatDuration,
    calculatePercentageChange: analyticsService.calculatePercentageChange
  }
}

// Hook for specific video analytics
export function useVideoAnalytics(videoId) {
  const { activeAccount } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadVideoAnalytics = useCallback(async () => {
    if (!activeAccount || !videoId) return

    try {
      setLoading(true)
      setError(null)

      const [analytics, retention] = await Promise.all([
        analyticsService.getCachedData(
          activeAccount,
          'videoAnalytics',
          { videoId },
          () => youtubeAuth.getVideoAnalytics(activeAccount, videoId)
        ),
        analyticsService.getCachedData(
          activeAccount,
          'audienceRetention',
          { videoId },
          () => youtubeAuth.getAudienceRetention(activeAccount, videoId)
        )
      ])

      setData({ analytics, retention })
    } catch (error) {
      console.error('Failed to load video analytics:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [activeAccount, videoId])

  useEffect(() => {
    loadVideoAnalytics()
  }, [loadVideoAnalytics])

  return {
    data,
    loading,
    error,
    reload: loadVideoAnalytics
  }
}
