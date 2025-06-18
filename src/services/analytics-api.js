import { youtubeAuth } from './youtube-api'

class AnalyticsService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  // Cache key generator
  getCacheKey(account, method, params) {
    return `${account.channelId}_${method}_${JSON.stringify(params)}`
  }

  // Check if cached data is still valid
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout
  }

  // Get cached data or fetch new data
  async getCachedData(account, method, params, fetchFunction) {
    const cacheKey = this.getCacheKey(account, method, params)
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached)) {
      return cached.data
    }

    try {
      const data = await fetchFunction()
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })
      return data
    } catch (error) {
      console.error(`Analytics API error for ${method}:`, error)

      // Check if it's a permission/requirement error
      if (error.message.includes('403') ||
          error.message.includes('Forbidden') ||
          error.message.includes('400') ||
          error.message.includes('Bad Request') ||
          error.message.includes('insufficient') ||
          error.message.includes('scope') ||
          error.message.includes('permission') ||
          error.message.includes('không có quyền') ||
          error.message.includes('Service not available')) {
        console.log(`Analytics API not available for ${method}, returning demo data with requirements info`)
        // Return mock data structure with requirements info
        return this.getMockDataForMethod(method, true)
      }

      // Return cached data if available, even if expired
      if (cached) {
        return cached.data
      }

      throw error
    }
  }

  // Generate mock data structure when Analytics API is not available
  getMockDataForMethod(method, showRequirements = false) {
    const baseData = {
      lastUpdated: new Date().toISOString(),
      analyticsNotAvailable: true,
      requirementsNotMet: showRequirements
    }

    switch (method) {
      case 'overview':
        return {
          basicMetrics: { rows: [] },
          subscriberData: { rows: [] },
          trafficSources: { rows: [] },
          deviceData: { rows: [] },
          geoData: { rows: [] },
          ...baseData
        }
      case 'videoPerformance':
        return {
          videos: [],
          totalVideos: 0,
          ...baseData
        }
      default:
        return {
          rows: [],
          ...baseData
        }
    }
  }

  // Clear cache for specific account
  clearCache(account) {
    const keysToDelete = []
    for (const key of this.cache.keys()) {
      if (key.startsWith(account.channelId)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Get comprehensive analytics overview using YouTube Data API (fallback)
  async getAnalyticsOverview(account, timeRange = '30daysAgo') {
    const params = {
      startDate: timeRange,
      endDate: 'today'
    }

    return await this.getCachedData(
      account,
      'overview',
      params,
      async () => {
        try {
          // Try YouTube Analytics API first
          const [
            basicMetrics,
            subscriberData,
            trafficSources,
            deviceData,
            geoData
          ] = await Promise.all([
            youtubeAuth.getAnalyticsData(account, {
              metrics: 'views,estimatedMinutesWatched,likes,dislikes,comments,shares,subscribersGained,subscribersLost',
              dimensions: 'day',
              ...params
            }),
            youtubeAuth.getSubscriberAnalytics(account, params),
            youtubeAuth.getTrafficSources(account, params),
            youtubeAuth.getDeviceAnalytics(account, params),
            youtubeAuth.getGeographicData(account, params)
          ])

          return {
            basicMetrics,
            subscriberData,
            trafficSources,
            deviceData,
            geoData,
            lastUpdated: new Date().toISOString()
          }
        } catch (error) {
          console.log('YouTube Analytics API failed, falling back to Data API:', error.message)

          // Fallback to YouTube Data API
          return await this.getBasicAnalyticsFromDataAPI(account, params)
        }
      }
    )
  }

  // Fallback method using YouTube Data API v3
  async getBasicAnalyticsFromDataAPI(account, params) {
    try {
      // Get channel statistics
      const channelData = await youtubeAuth.getChannelAnalytics(account)
      const channelStats = channelData.items?.[0]?.statistics || {}

      // Get recent videos for basic metrics
      const videosData = await youtubeAuth.getVideos(account, {
        part: 'snippet,statistics',
        maxResults: 50
      })

      // Calculate basic metrics from available data
      const totalViews = parseInt(channelStats.viewCount) || 0
      const totalSubscribers = parseInt(channelStats.subscriberCount) || 0
      const totalVideos = parseInt(channelStats.videoCount) || 0

      // Aggregate video statistics
      let totalLikes = 0
      let totalComments = 0
      const recentVideos = videosData.items || []

      recentVideos.forEach(video => {
        const stats = video.statistics || {}
        totalLikes += parseInt(stats.likeCount) || 0
        totalComments += parseInt(stats.commentCount) || 0
      })

      // Create mock daily data (since we can't get historical data from Data API)
      const dailyViews = this.generateMockDailyData(totalViews, 30)

      return {
        basicMetrics: {
          rows: dailyViews.map(day => [
            day.date,
            day.views,
            day.watchTime,
            day.likes,
            0, // dislikes (not available in Data API v3)
            day.comments,
            0, // shares (not available)
            day.subscribersGained,
            0  // subscribersLost (not available)
          ])
        },
        subscriberData: { rows: [] },
        trafficSources: { rows: [] },
        deviceData: { rows: [] },
        geoData: { rows: [] },
        lastUpdated: new Date().toISOString(),
        isDataAPIFallback: true,
        totalViews,
        totalSubscribers,
        totalVideos,
        totalLikes,
        totalComments
      }
    } catch (error) {
      console.error('Data API fallback also failed:', error)
      throw error
    }
  }

  // Generate mock daily data for visualization
  generateMockDailyData(totalViews, days) {
    const data = []
    const avgViewsPerDay = Math.floor(totalViews / (days * 10)) // Rough estimate

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      // Add some randomness to make it look realistic
      const variance = 0.3
      const randomFactor = 1 + (Math.random() - 0.5) * variance
      const views = Math.floor(avgViewsPerDay * randomFactor)

      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.max(0, views),
        watchTime: Math.floor(views * 2.5), // Rough estimate: 2.5 minutes average
        likes: Math.floor(views * 0.02), // 2% like rate
        comments: Math.floor(views * 0.005), // 0.5% comment rate
        subscribersGained: Math.floor(views * 0.001) // 0.1% conversion rate
      })
    }

    return data
  }

  // Get video performance analytics
  async getVideoPerformance(account, timeRange = '30daysAgo', limit = 50) {
    const params = {
      startDate: timeRange,
      endDate: 'today',
      maxResults: limit
    }

    return await this.getCachedData(
      account,
      'videoPerformance',
      params,
      async () => {
        // Get top videos by views
        const topVideosData = await youtubeAuth.getAnalyticsData(account, {
          metrics: 'views,estimatedMinutesWatched,likes,dislikes,comments,shares,averageViewDuration',
          dimensions: 'video',
          sort: '-views',
          ...params
        })

        // Get video details for the top videos
        if (topVideosData.rows && topVideosData.rows.length > 0) {
          const videoIds = topVideosData.rows.map(row => row[0]).slice(0, 20) // Limit to top 20
          const videoDetails = await youtubeAuth.getVideos(account, {
            part: 'snippet,statistics,contentDetails',
            id: videoIds.join(',')
          })

          // Combine analytics data with video details
          const enrichedVideos = topVideosData.rows.map(row => {
            const videoId = row[0]
            const videoDetail = videoDetails.items?.find(item => item.id === videoId)
            
            return {
              videoId,
              title: videoDetail?.snippet?.title || 'Unknown Title',
              thumbnail: videoDetail?.snippet?.thumbnails?.medium?.url || '',
              publishedAt: videoDetail?.snippet?.publishedAt || '',
              views: parseInt(row[1]) || 0,
              estimatedMinutesWatched: parseInt(row[2]) || 0,
              likes: parseInt(row[3]) || 0,
              dislikes: parseInt(row[4]) || 0,
              comments: parseInt(row[5]) || 0,
              shares: parseInt(row[6]) || 0,
              averageViewDuration: parseFloat(row[7]) || 0,
              // Calculate additional metrics
              engagementRate: this.calculateEngagementRate(row),
              retentionRate: this.calculateRetentionRate(row, videoDetail)
            }
          })

          return {
            videos: enrichedVideos,
            totalVideos: topVideosData.rows.length,
            lastUpdated: new Date().toISOString()
          }
        }

        return {
          videos: [],
          totalVideos: 0,
          lastUpdated: new Date().toISOString()
        }
      }
    )
  }

  // Get real-time analytics (shorter cache time)
  async getRealTimeAnalytics(account) {
    const cacheKey = this.getCacheKey(account, 'realtime', {})
    const cached = this.cache.get(cacheKey)
    const shortCacheTimeout = 2 * 60 * 1000 // 2 minutes for real-time data

    if (cached && (Date.now() - cached.timestamp < shortCacheTimeout)) {
      return cached.data
    }

    try {
      // Get last 48 hours of data for real-time feel
      const realtimeData = await youtubeAuth.getAnalyticsData(account, {
        metrics: 'views,estimatedMinutesWatched,subscribersGained',
        dimensions: 'day',
        startDate: '2daysAgo',
        endDate: 'today'
      })

      const data = {
        recentViews: this.extractRecentMetrics(realtimeData, 'views'),
        recentWatchTime: this.extractRecentMetrics(realtimeData, 'estimatedMinutesWatched'),
        recentSubscribers: this.extractRecentMetrics(realtimeData, 'subscribersGained'),
        lastUpdated: new Date().toISOString()
      }

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      return data
    } catch (error) {
      console.error('Real-time analytics error:', error)
      if (cached) return cached.data
      throw error
    }
  }

  // Helper methods
  calculateEngagementRate(analyticsRow) {
    const views = parseInt(analyticsRow[1]) || 0
    const likes = parseInt(analyticsRow[3]) || 0
    const dislikes = parseInt(analyticsRow[4]) || 0
    const comments = parseInt(analyticsRow[5]) || 0
    const shares = parseInt(analyticsRow[6]) || 0

    if (views === 0) return 0
    return ((likes + dislikes + comments + shares) / views * 100).toFixed(2)
  }

  calculateRetentionRate(analyticsRow, videoDetail) {
    const averageViewDuration = parseFloat(analyticsRow[7]) || 0
    const videoDuration = this.parseDuration(videoDetail?.contentDetails?.duration)
    
    if (videoDuration === 0) return 0
    return ((averageViewDuration / videoDuration) * 100).toFixed(2)
  }

  parseDuration(isoDuration) {
    if (!isoDuration) return 0
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    
    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    const seconds = parseInt(match[3]) || 0
    
    return hours * 3600 + minutes * 60 + seconds
  }

  extractRecentMetrics(analyticsData, metricName) {
    if (!analyticsData.rows || analyticsData.rows.length === 0) return 0
    
    const metricIndex = analyticsData.columnHeaders?.findIndex(
      header => header.name === metricName
    )
    
    if (metricIndex === -1) return 0
    
    // Sum up the metric values
    return analyticsData.rows.reduce((sum, row) => {
      return sum + (parseInt(row[metricIndex]) || 0)
    }, 0)
  }

  // Format numbers for display
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toLocaleString() || '0'
  }

  // Format duration for display
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Calculate percentage change
  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous * 100).toFixed(1)
  }
}

export const analyticsService = new AnalyticsService()
