/**
 * Video Data Service
 * Centralized service for managing video data across the application
 */

export class VideoDataService {
  constructor() {
    this.videos = []
    this.listeners = new Set()
  }

  /**
   * Set video data (called by VideoManager when videos are loaded)
   */
  setVideos(videos) {
    this.videos = videos
    this.notifyListeners('videos-updated', videos)
  }

  /**
   * Get all videos
   */
  getVideos() {
    return this.videos
  }

  /**
   * Search videos by query
   */
  searchVideos(query) {
    if (!query || query.trim().length < 2) {
      return []
    }

    const searchTerm = query.toLowerCase()
    
    return this.videos.filter(video => {
      const title = video.snippet?.title?.toLowerCase() || ''
      const description = video.snippet?.description?.toLowerCase() || ''
      const tags = video.snippet?.tags?.join(' ').toLowerCase() || ''
      
      return title.includes(searchTerm) || 
             description.includes(searchTerm) || 
             tags.includes(searchTerm)
    }).map(video => ({
      id: video.id,
      type: 'video',
      title: video.snippet?.title || 'Untitled',
      description: video.snippet?.description || '',
      thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
      views: parseInt(video.statistics?.viewCount || 0),
      publishedAt: video.snippet?.publishedAt,
      status: video.status?.privacyStatus || 'unknown',
      category: 'Videos',
      relevance: this.calculateRelevance(query, video.snippet?.title + ' ' + video.snippet?.description)
    }))
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevance(query, text) {
    if (!text) return 0
    
    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()
    
    let score = 0
    
    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      score += 100
    }
    
    // Word matches
    const queryWords = queryLower.split(' ')
    const textWords = textLower.split(' ')
    
    queryWords.forEach(queryWord => {
      textWords.forEach(textWord => {
        if (textWord.includes(queryWord)) {
          score += 10
        }
      })
    })
    
    return score
  }

  /**
   * Add listener for video data changes
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
        console.error('Video data listener error:', error)
      }
    })
  }

  /**
   * Get video by ID
   */
  getVideoById(videoId) {
    return this.videos.find(video => video.id === videoId)
  }

  /**
   * Get videos by status
   */
  getVideosByStatus(status) {
    return this.videos.filter(video => video.status?.privacyStatus === status)
  }

  /**
   * Get recent videos (last 30 days)
   */
  getRecentVideos(days = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return this.videos.filter(video => {
      const publishedDate = new Date(video.snippet?.publishedAt)
      return publishedDate >= cutoffDate
    })
  }

  /**
   * Get video statistics summary
   */
  getVideoStats() {
    const stats = {
      total: this.videos.length,
      published: 0,
      private: 0,
      unlisted: 0,
      scheduled: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0
    }

    this.videos.forEach(video => {
      const status = video.status?.privacyStatus
      if (status === 'public') stats.published++
      else if (status === 'private') stats.private++
      else if (status === 'unlisted') stats.unlisted++
      else if (status === 'scheduled') stats.scheduled++

      stats.totalViews += parseInt(video.statistics?.viewCount || 0)
      stats.totalLikes += parseInt(video.statistics?.likeCount || 0)
      stats.totalComments += parseInt(video.statistics?.commentCount || 0)
    })

    return stats
  }
}

// Create singleton instance
export const videoDataService = new VideoDataService()
