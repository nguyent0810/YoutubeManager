/**
 * Advanced Filtering & Segmentation Service
 * Provides sophisticated data filtering and analysis capabilities
 */

export class FilteringService {
  constructor() {
    this.datePresets = [
      { id: 'today', label: 'Today', days: 1 },
      { id: 'yesterday', label: 'Yesterday', days: 1, offset: 1 },
      { id: 'last7days', label: 'Last 7 days', days: 7 },
      { id: 'last14days', label: 'Last 14 days', days: 14 },
      { id: 'last30days', label: 'Last 30 days', days: 30 },
      { id: 'last90days', label: 'Last 90 days', days: 90 },
      { id: 'thisWeek', label: 'This week', type: 'week', offset: 0 },
      { id: 'lastWeek', label: 'Last week', type: 'week', offset: 1 },
      { id: 'thisMonth', label: 'This month', type: 'month', offset: 0 },
      { id: 'lastMonth', label: 'Last month', type: 'month', offset: 1 },
      { id: 'thisYear', label: 'This year', type: 'year', offset: 0 },
      { id: 'lastYear', label: 'Last year', type: 'year', offset: 1 }
    ]

    this.contentTypes = [
      { id: 'all', label: 'All Content', filter: () => true },
      { id: 'shorts', label: 'YouTube Shorts', filter: (video) => this.isShort(video) },
      { id: 'longform', label: 'Long-form Videos', filter: (video) => !this.isShort(video) },
      { id: 'recent', label: 'Recent (30 days)', filter: (video) => this.isRecent(video, 30) },
      { id: 'popular', label: 'Popular (>avg views)', filter: (video, avgViews) => video.views > avgViews },
      { id: 'trending', label: 'Trending (high engagement)', filter: (video) => this.isTrending(video) }
    ]

    this.performanceTiers = [
      { id: 'all', label: 'All Videos', percentile: [0, 100] },
      { id: 'top10', label: 'Top 10%', percentile: [90, 100] },
      { id: 'top25', label: 'Top 25%', percentile: [75, 100] },
      { id: 'middle50', label: 'Middle 50%', percentile: [25, 75] },
      { id: 'bottom25', label: 'Bottom 25%', percentile: [0, 25] },
      { id: 'bottom10', label: 'Bottom 10%', percentile: [0, 10] }
    ]

    this.audienceSegments = [
      { id: 'all', label: 'All Viewers' },
      { id: 'new', label: 'New Viewers', description: 'First-time channel visitors' },
      { id: 'returning', label: 'Returning Viewers', description: 'Previous channel visitors' },
      { id: 'subscribers', label: 'Subscribers', description: 'Channel subscribers' },
      { id: 'engaged', label: 'Highly Engaged', description: 'Users who like/comment frequently' }
    ]
  }

  /**
   * Apply comprehensive filtering to analytics data
   */
  applyFilters(data, filters) {
    const {
      dateRange,
      contentType = 'all',
      performanceTier = 'all',
      audienceSegment = 'all',
      customFilters = {}
    } = filters

    let filteredData = { ...data }

    // Apply date filtering
    if (dateRange) {
      filteredData = this.filterByDateRange(filteredData, dateRange)
    }

    // Apply content type filtering
    if (contentType !== 'all' && filteredData.videoPerformance?.videos) {
      filteredData.videoPerformance.videos = this.filterByContentType(
        filteredData.videoPerformance.videos, 
        contentType
      )
    }

    // Apply performance tier filtering
    if (performanceTier !== 'all' && filteredData.videoPerformance?.videos) {
      filteredData.videoPerformance.videos = this.filterByPerformanceTier(
        filteredData.videoPerformance.videos, 
        performanceTier
      )
    }

    // Apply audience segment filtering
    if (audienceSegment !== 'all') {
      filteredData = this.filterByAudienceSegment(filteredData, audienceSegment)
    }

    // Apply custom filters
    if (Object.keys(customFilters).length > 0) {
      filteredData = this.applyCustomFilters(filteredData, customFilters)
    }

    return filteredData
  }

  /**
   * Filter data by date range
   */
  filterByDateRange(data, dateRange) {
    const { startDate, endDate } = this.parseDateRange(dateRange)
    
    const filteredData = { ...data }

    // Filter daily views
    if (data.overview?.dailyViews) {
      filteredData.overview = {
        ...data.overview,
        dailyViews: data.overview.dailyViews.filter(day => {
          const dayDate = new Date(day.date)
          return dayDate >= startDate && dayDate <= endDate
        })
      }
    }

    // Filter videos by publish date
    if (data.videoPerformance?.videos) {
      filteredData.videoPerformance = {
        ...data.videoPerformance,
        videos: data.videoPerformance.videos.filter(video => {
          const publishDate = new Date(video.publishedAt)
          return publishDate >= startDate && publishDate <= endDate
        })
      }
    }

    return filteredData
  }

  /**
   * Filter videos by content type
   */
  filterByContentType(videos, contentType) {
    const contentFilter = this.contentTypes.find(type => type.id === contentType)
    if (!contentFilter) return videos

    const avgViews = videos.reduce((sum, video) => sum + video.views, 0) / videos.length

    return videos.filter(video => contentFilter.filter(video, avgViews))
  }

  /**
   * Filter videos by performance tier
   */
  filterByPerformanceTier(videos, performanceTier) {
    const tier = this.performanceTiers.find(t => t.id === performanceTier)
    if (!tier) return videos

    // Sort videos by views to determine percentiles
    const sortedVideos = [...videos].sort((a, b) => b.views - a.views)
    const totalVideos = sortedVideos.length

    const startIndex = Math.floor((tier.percentile[0] / 100) * totalVideos)
    const endIndex = Math.ceil((tier.percentile[1] / 100) * totalVideos)

    return sortedVideos.slice(startIndex, endIndex)
  }

  /**
   * Filter data by audience segment
   */
  filterByAudienceSegment(data, audienceSegment) {
    // Simulate audience segmentation (would use real analytics data in production)
    const segmentMultipliers = {
      new: 0.3,
      returning: 0.5,
      subscribers: 0.8,
      engaged: 0.2
    }

    if (audienceSegment === 'all') return data

    const multiplier = segmentMultipliers[audienceSegment] || 1
    const filteredData = { ...data }

    // Adjust metrics based on segment
    if (filteredData.overview) {
      filteredData.overview = {
        ...filteredData.overview,
        totalViews: Math.round(filteredData.overview.totalViews * multiplier),
        totalWatchTime: Math.round(filteredData.overview.totalWatchTime * multiplier),
        totalLikes: Math.round(filteredData.overview.totalLikes * multiplier),
        totalComments: Math.round(filteredData.overview.totalComments * multiplier)
      }
    }

    return filteredData
  }

  /**
   * Apply custom filters
   */
  applyCustomFilters(data, customFilters) {
    let filteredData = { ...data }

    // Views range filter
    if (customFilters.viewsRange && filteredData.videoPerformance?.videos) {
      const { min, max } = customFilters.viewsRange
      filteredData.videoPerformance.videos = filteredData.videoPerformance.videos.filter(
        video => video.views >= min && video.views <= max
      )
    }

    // Duration filter
    if (customFilters.durationRange && filteredData.videoPerformance?.videos) {
      const { min, max } = customFilters.durationRange
      filteredData.videoPerformance.videos = filteredData.videoPerformance.videos.filter(
        video => {
          const duration = this.parseDuration(video.duration)
          return duration >= min && duration <= max
        }
      )
    }

    // Title keyword filter
    if (customFilters.titleKeywords && filteredData.videoPerformance?.videos) {
      const keywords = customFilters.titleKeywords.toLowerCase().split(',').map(k => k.trim())
      filteredData.videoPerformance.videos = filteredData.videoPerformance.videos.filter(
        video => keywords.some(keyword => video.title.toLowerCase().includes(keyword))
      )
    }

    return filteredData
  }

  /**
   * Parse date range from preset or custom range
   */
  parseDateRange(dateRange) {
    if (typeof dateRange === 'object' && dateRange.startDate && dateRange.endDate) {
      return {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate)
      }
    }

    const preset = this.datePresets.find(p => p.id === dateRange)
    if (!preset) {
      // Default to last 30 days
      return {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      }
    }

    const now = new Date()
    let startDate, endDate

    if (preset.days) {
      const offset = preset.offset || 0
      endDate = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000)
      startDate = new Date(endDate.getTime() - preset.days * 24 * 60 * 60 * 1000)
    } else if (preset.type === 'week') {
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
      startDate = new Date(startOfWeek.getTime() - preset.offset * 7 * 24 * 60 * 60 * 1000)
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else if (preset.type === 'month') {
      const year = now.getFullYear()
      const month = now.getMonth() - preset.offset
      startDate = new Date(year, month, 1)
      endDate = new Date(year, month + 1, 0)
    } else if (preset.type === 'year') {
      const year = now.getFullYear() - preset.offset
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31)
    }

    return { startDate, endDate }
  }

  /**
   * Get filter summary for display
   */
  getFilterSummary(filters) {
    const summary = []

    if (filters.dateRange) {
      const preset = this.datePresets.find(p => p.id === filters.dateRange)
      summary.push(preset ? preset.label : 'Custom date range')
    }

    if (filters.contentType && filters.contentType !== 'all') {
      const contentType = this.contentTypes.find(t => t.id === filters.contentType)
      summary.push(contentType?.label || filters.contentType)
    }

    if (filters.performanceTier && filters.performanceTier !== 'all') {
      const tier = this.performanceTiers.find(t => t.id === filters.performanceTier)
      summary.push(tier?.label || filters.performanceTier)
    }

    if (filters.audienceSegment && filters.audienceSegment !== 'all') {
      const segment = this.audienceSegments.find(s => s.id === filters.audienceSegment)
      summary.push(segment?.label || filters.audienceSegment)
    }

    return summary
  }

  /**
   * Get available filter options
   */
  getFilterOptions() {
    return {
      datePresets: this.datePresets,
      contentTypes: this.contentTypes,
      performanceTiers: this.performanceTiers,
      audienceSegments: this.audienceSegments
    }
  }

  // Helper methods

  isShort(video) {
    const duration = this.parseDuration(video.duration)
    return duration <= 60 // 60 seconds or less
  }

  isRecent(video, days = 30) {
    const publishDate = new Date(video.publishedAt)
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return publishDate >= cutoffDate
  }

  isTrending(video) {
    // Simple trending detection based on engagement rate
    const engagementRate = parseFloat(video.engagementRate) || 0
    return engagementRate > 5 // Above 5% engagement rate
  }

  parseDuration(duration) {
    // Parse ISO 8601 duration (PT1M30S) or simple seconds
    if (typeof duration === 'number') return duration

    if (typeof duration === 'string') {
      if (duration.startsWith('PT')) {
        // ISO 8601 format
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        if (match) {
          const hours = parseInt(match[1]) || 0
          const minutes = parseInt(match[2]) || 0
          const seconds = parseInt(match[3]) || 0
          return hours * 3600 + minutes * 60 + seconds
        }
      } else {
        // Try to parse as number
        const num = parseFloat(duration)
        if (!isNaN(num)) return num
      }
    }

    return 0
  }

  /**
   * Create comparison between two filtered datasets
   */
  createComparison(data1, data2, labels = ['Period 1', 'Period 2']) {
    const comparison = {
      labels,
      metrics: {}
    }

    // Compare overview metrics
    if (data1.overview && data2.overview) {
      const metrics = ['totalViews', 'totalWatchTime', 'totalLikes', 'totalComments', 'subscribersGained']
      
      metrics.forEach(metric => {
        const value1 = data1.overview[metric] || 0
        const value2 = data2.overview[metric] || 0
        const change = value1 > 0 ? ((value2 - value1) / value1) * 100 : 0

        comparison.metrics[metric] = {
          values: [value1, value2],
          change: change,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        }
      })
    }

    return comparison
  }
}

// Create singleton instance
export const filteringService = new FilteringService()
