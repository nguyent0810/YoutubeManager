/**
 * Global Search Service for YouTube Manager
 * Provides unified search across videos, comments, analytics, and settings
 */

import { videoDataService } from './video-data-service'

export class SearchService {
  constructor() {
    this.searchHistory = []
    this.maxHistoryItems = 20
    this.searchFilters = {
      videos: true,
      comments: true,
      analytics: true,
      settings: true
    }
    this.loadSearchHistory()
  }

  /**
   * Perform global search across all content types
   */
  async search(query, filters = null) {
    if (!query || query.trim().length < 2) {
      return { results: [], suggestions: this.getSearchSuggestions() }
    }

    const searchFilters = filters || this.searchFilters
    const results = []

    try {
      // Add to search history
      this.addToHistory(query)

      // Search videos
      if (searchFilters.videos) {
        const videoResults = await this.searchVideos(query)
        results.push(...videoResults)
      }

      // Search comments
      if (searchFilters.comments) {
        const commentResults = await this.searchComments(query)
        results.push(...commentResults)
      }

      // Search analytics
      if (searchFilters.analytics) {
        const analyticsResults = await this.searchAnalytics(query)
        results.push(...analyticsResults)
      }

      // Search settings
      if (searchFilters.settings) {
        const settingsResults = await this.searchSettings(query)
        results.push(...settingsResults)
      }

      // Sort results by relevance
      const sortedResults = this.sortByRelevance(results, query)

      return {
        results: sortedResults,
        query,
        totalCount: sortedResults.length,
        categories: this.categorizeResults(sortedResults)
      }
    } catch (error) {
      console.error('Search error:', error)
      return { results: [], error: error.message }
    }
  }

  /**
   * Search videos
   */
  async searchVideos(query) {
    // Use real video data from videoDataService
    return videoDataService.searchVideos(query)
  }

  /**
   * Search comments
   */
  async searchComments(query) {
    // Mock comment results
    const mockComments = [
      {
        id: 'comment1',
        type: 'comment',
        text: 'Great video! This really helped me understand YouTube analytics.',
        author: 'John Doe',
        videoTitle: 'YouTube Analytics Deep Dive',
        publishedAt: '2024-01-16',
        likes: 12
      },
      {
        id: 'comment2',
        type: 'comment',
        text: 'Could you make a video about YouTube Shorts optimization?',
        author: 'Jane Smith',
        videoTitle: 'How to Create Amazing YouTube Content',
        publishedAt: '2024-01-17',
        likes: 8
      }
    ]

    return mockComments.filter(comment => 
      comment.text.toLowerCase().includes(query.toLowerCase()) ||
      comment.author.toLowerCase().includes(query.toLowerCase())
    ).map(comment => ({
      ...comment,
      relevance: this.calculateRelevance(query, comment.text + ' ' + comment.author),
      category: 'Comments'
    }))
  }

  /**
   * Search analytics data
   */
  async searchAnalytics(query) {
    // Mock analytics results
    const mockAnalytics = [
      {
        id: 'analytics1',
        type: 'analytics',
        title: 'Video Performance Report',
        description: 'Detailed analytics for your top performing videos',
        metric: 'views',
        value: '125,430',
        period: 'Last 30 days'
      },
      {
        id: 'analytics2',
        type: 'analytics',
        title: 'Subscriber Growth',
        description: 'Track your channel subscriber growth over time',
        metric: 'subscribers',
        value: '+1,234',
        period: 'Last 30 days'
      }
    ]

    return mockAnalytics.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    ).map(item => ({
      ...item,
      relevance: this.calculateRelevance(query, item.title + ' ' + item.description),
      category: 'Analytics'
    }))
  }

  /**
   * Search settings
   */
  async searchSettings(query) {
    // Comprehensive settings search results
    const mockSettings = [
      {
        id: 'setting1',
        type: 'setting',
        title: 'Theme Settings',
        description: 'Change between light, dark, and system themes',
        category: 'App Settings',
        path: '/settings'
      },
      {
        id: 'setting2',
        type: 'setting',
        title: 'Upload Defaults',
        description: 'Set default privacy, category, and tags for uploads',
        category: 'Upload Settings',
        path: '/settings'
      },
      {
        id: 'setting3',
        type: 'setting',
        title: 'Notification Preferences',
        description: 'Configure how and when you receive notifications',
        category: 'Notification Settings',
        path: '/settings'
      },
      {
        id: 'setting4',
        type: 'setting',
        title: 'Analytics Dashboard',
        description: 'Customize your analytics dashboard layout and metrics',
        category: 'Analytics Settings',
        path: '/settings'
      },
      {
        id: 'setting5',
        type: 'setting',
        title: 'Workspace Layout',
        description: 'Customize your creator workspace and interface',
        category: 'Workspace Settings',
        path: '/settings'
      }
    ]

    return mockSettings.filter(setting =>
      setting.title.toLowerCase().includes(query.toLowerCase()) ||
      setting.description.toLowerCase().includes(query.toLowerCase()) ||
      setting.category.toLowerCase().includes(query.toLowerCase())
    ).map(setting => ({
      ...setting,
      relevance: this.calculateRelevance(query, setting.title + ' ' + setting.description + ' ' + setting.category),
      category: 'Settings'
    }))
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevance(query, text) {
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
   * Sort results by relevance
   */
  sortByRelevance(results, query) {
    return results.sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * Categorize search results
   */
  categorizeResults(results) {
    const categories = {}
    
    results.forEach(result => {
      const category = result.category
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(result)
    })
    
    return categories
  }

  /**
   * Get search suggestions
   */
  getSearchSuggestions() {
    return [
      'video analytics',
      'subscriber growth',
      'upload settings',
      'comment moderation',
      'theme settings',
      'performance metrics'
    ]
  }

  /**
   * Add query to search history
   */
  addToHistory(query) {
    const trimmedQuery = query.trim()
    if (trimmedQuery && !this.searchHistory.includes(trimmedQuery)) {
      this.searchHistory.unshift(trimmedQuery)
      if (this.searchHistory.length > this.maxHistoryItems) {
        this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems)
      }
      this.saveSearchHistory()
    }
  }

  /**
   * Get search history
   */
  getSearchHistory() {
    return this.searchHistory
  }

  /**
   * Clear search history
   */
  clearSearchHistory() {
    this.searchHistory = []
    this.saveSearchHistory()
  }

  /**
   * Save search history to localStorage
   */
  saveSearchHistory() {
    try {
      localStorage.setItem('ytm_search_history', JSON.stringify(this.searchHistory))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  /**
   * Load search history from localStorage
   */
  loadSearchHistory() {
    try {
      const stored = localStorage.getItem('ytm_search_history')
      if (stored) {
        this.searchHistory = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
      this.searchHistory = []
    }
  }
}

// Create singleton instance
export const searchService = new SearchService()
