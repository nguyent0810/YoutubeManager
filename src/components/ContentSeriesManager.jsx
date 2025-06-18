import React, { useState, useEffect, useMemo } from 'react'
import {
  Play,
  Pause,
  Edit3,
  Trash2,
  Plus,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  Target,
  BarChart3,
  Settings,
  Star,
  Award,
  Zap,
  FileText,
  Upload,
  Download,
  Share2,
  Copy,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const ContentSeriesManager = ({ events, onUpdateSeries, contentStrategy }) => {
  const [series, setSeries] = useState([])
  const [selectedSeries, setSelectedSeries] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSeries, setEditingSeries] = useState(null)
  const [showSeriesDetails, setShowSeriesDetails] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all') // all, active, paused, completed
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, episodes, consistency, performance
  const [viewMode, setViewMode] = useState('grid') // grid, list

  // Extract and analyze series from events
  useEffect(() => {
    const seriesMap = new Map()

    // Process existing series from events
    events.forEach(event => {
      if (event.seriesId) {
        if (!seriesMap.has(event.seriesId)) {
          seriesMap.set(event.seriesId, {
            id: event.seriesId,
            name: event.seriesName || 'Untitled Series',
            episodes: [],
            totalViews: 0,
            avgViews: 0,
            status: 'active',
            frequency: event.seriesFrequency || 'weekly',
            nextEpisode: null,
            consistency: 100,
            category: event.category || 'Entertainment',
            tags: event.tags || [],
            description: event.description || '',
            createdAt: new Date(),
            lastUpdated: new Date(),
            thumbnail: event.thumbnail || '',
            totalLikes: 0,
            totalComments: 0,
            engagementRate: 0,
            growthRate: 0,
            bestPerformingEpisode: null,
            worstPerformingEpisode: null
          })
        }

        const seriesData = seriesMap.get(event.seriesId)
        seriesData.episodes.push(event)
        seriesData.totalViews += event.views || 0
        seriesData.totalLikes += event.likes || 0
        seriesData.totalComments += event.comments || 0
      }
    })

    // Create series from video titles if no explicit series exist
    if (seriesMap.size === 0 && events.length > 0) {
      // Group videos by similar titles to detect potential series
      const titleGroups = new Map()

      events.forEach(event => {
        if (!event.title) return

        // Extract potential series name from title
        const title = event.title.toLowerCase()
        let seriesName = null

        // Common series patterns
        const patterns = [
          /(.+?)\s*(?:part|episode|ep|#)\s*\d+/i,
          /(.+?)\s*-\s*(?:part|episode|ep|#)\s*\d+/i,
          /(.+?)\s*\|\s*(?:part|episode|ep|#)\s*\d+/i,
          /(.+?)\s*(?:tutorial|guide|course)\s*(?:part|episode|ep|#)?\s*\d+/i
        ]

        for (const pattern of patterns) {
          const match = event.title.match(pattern)
          if (match) {
            seriesName = match[1].trim()
            break
          }
        }

        // If no pattern found, check for common series keywords
        if (!seriesName) {
          const seriesKeywords = ['tutorial', 'guide', 'course', 'series', 'basics', 'advanced', 'complete']
          for (const keyword of seriesKeywords) {
            if (title.includes(keyword)) {
              // Use the part before the keyword as series name
              const parts = title.split(keyword)
              if (parts[0].trim()) {
                seriesName = parts[0].trim()
                break
              }
            }
          }
        }

        if (seriesName) {
          if (!titleGroups.has(seriesName)) {
            titleGroups.set(seriesName, [])
          }
          titleGroups.get(seriesName).push(event)
        }
      })

      // Create series for groups with multiple videos
      titleGroups.forEach((videos, seriesName) => {
        if (videos.length >= 2) { // Only create series for 2+ videos
          const seriesId = `auto-series-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0)
          const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0)
          const totalComments = videos.reduce((sum, v) => sum + (v.comments || 0), 0)

          // Determine series status
          const now = new Date()
          const hasScheduled = videos.some(v => new Date(v.start) > now)
          const hasRecent = videos.some(v => new Date(v.start) > new Date(now - 30 * 24 * 60 * 60 * 1000))

          let status = 'completed'
          if (hasScheduled) status = 'active'
          else if (hasRecent) status = 'active'

          // Calculate consistency
          const sortedVideos = videos.sort((a, b) => new Date(a.start) - new Date(b.start))
          let consistency = 100
          if (sortedVideos.length > 1) {
            const intervals = []
            for (let i = 1; i < sortedVideos.length; i++) {
              const diff = new Date(sortedVideos[i].start) - new Date(sortedVideos[i-1].start)
              intervals.push(diff / (1000 * 60 * 60 * 24)) // days
            }

            const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length
            const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length
            consistency = Math.max(0, 100 - (variance / avgInterval) * 10)
          }

          const series = {
            id: seriesId,
            name: seriesName.charAt(0).toUpperCase() + seriesName.slice(1),
            episodes: videos,
            totalViews,
            avgViews: videos.length > 0 ? totalViews / videos.length : 0,
            status,
            frequency: 'weekly', // Default frequency
            category: videos[0]?.category || 'Entertainment',
            tags: [...new Set(videos.flatMap(v => v.tags || []))],
            description: `Auto-detected series: ${seriesName}`,
            createdAt: new Date(Math.min(...videos.map(v => new Date(v.start)))),
            lastUpdated: new Date(Math.max(...videos.map(v => new Date(v.start)))),
            thumbnail: videos[0]?.thumbnail || '',
            totalLikes,
            totalComments,
            engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0,
            growthRate: 0, // Would need historical data
            consistency,
            bestPerformingEpisode: videos.reduce((best, ep) =>
              (ep.views || 0) > (best?.views || 0) ? ep : best, null),
            worstPerformingEpisode: videos.reduce((worst, ep) =>
              (ep.views || Infinity) < (worst?.views || Infinity) ? ep : worst, null)
          }

          // Update events to include series information
          videos.forEach(video => {
            video.seriesId = seriesId
            video.seriesName = series.name
          })

          seriesMap.set(seriesId, series)
        }
      })
    }

    // If still no series found, create a sample series to demonstrate functionality
    if (seriesMap.size === 0) {
      const demoSeries = {
        id: 'demo-series-1',
        name: 'Getting Started with Content Series',
        episodes: [],
        totalViews: 0,
        avgViews: 0,
        status: 'active',
        frequency: 'weekly',
        category: 'Education',
        tags: ['tutorial', 'getting-started'],
        description: 'This is a demo series to show how series management works. Create your first series to get started!',
        createdAt: new Date(),
        lastUpdated: new Date(),
        thumbnail: '',
        totalLikes: 0,
        totalComments: 0,
        engagementRate: 0,
        growthRate: 0,
        consistency: 100,
        bestPerformingEpisode: null,
        worstPerformingEpisode: null
      }

      seriesMap.set(demoSeries.id, demoSeries)
    }

    // Calculate analytics for each series
    const seriesArray = Array.from(seriesMap.values()).map(s => {
      if (s.episodes.length > 0) {
        s.avgViews = s.totalViews / s.episodes.length
        s.episodes.sort((a, b) => new Date(a.start) - new Date(b.start))

        // Find next episode
        const now = new Date()
        s.nextEpisode = s.episodes.find(ep => new Date(ep.start) > now)

        // Calculate consistency score
        if (s.episodes.length > 1) {
          const intervals = []
          for (let i = 1; i < s.episodes.length; i++) {
            const diff = new Date(s.episodes[i].start) - new Date(s.episodes[i-1].start)
            intervals.push(diff / (1000 * 60 * 60 * 24)) // days
          }

          const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length
          const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length
          s.consistency = Math.max(0, 100 - (variance / avgInterval) * 10)
        }

        // Find best and worst performing episodes
        s.bestPerformingEpisode = s.episodes.reduce((best, ep) =>
          (ep.views || 0) > (best?.views || 0) ? ep : best, null)
        s.worstPerformingEpisode = s.episodes.reduce((worst, ep) =>
          (ep.views || Infinity) < (worst?.views || Infinity) ? ep : worst, null)
      }

      // Calculate engagement rate
      if (s.totalViews > 0) {
        s.engagementRate = ((s.totalLikes + s.totalComments) / s.totalViews) * 100
      }

      return s
    })

    setSeries(seriesArray)
  }, [events])

  // Filter and sort series
  const filteredAndSortedSeries = useMemo(() => {
    let filtered = series.filter(s => {
      // Filter by status
      if (filterStatus !== 'all' && s.status !== filterStatus) return false

      // Filter by search query
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      return true
    })

    // Sort series
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'episodes':
          return b.episodes.length - a.episodes.length
        case 'consistency':
          return b.consistency - a.consistency
        case 'performance':
          return b.avgViews - a.avgViews
        case 'engagement':
          return b.engagementRate - a.engagementRate
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt)
        default:
          return 0
      }
    })

    return filtered
  }, [series, filterStatus, searchQuery, sortBy])

  // Series management functions
  const createNewSeries = () => {
    setShowCreateModal(true)
  }

  const editSeries = (series) => {
    setEditingSeries(series)
    setShowCreateModal(true)
  }

  const deleteSeries = (seriesId) => {
    if (confirm('Are you sure you want to delete this series? This will not delete the videos.')) {
      setSeries(prev => prev.filter(s => s.id !== seriesId))
      toast('Series deleted successfully', {
        icon: '🗑️',
        duration: 3000,
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        }
      })
    }
  }

  const toggleSeriesStatus = (seriesId) => {
    setSeries(prev => prev.map(s => {
      if (s.id === seriesId) {
        const newStatus = s.status === 'active' ? 'paused' : 'active'
        toast(`Series ${newStatus === 'active' ? 'resumed' : 'paused'}`, {
          icon: newStatus === 'active' ? '▶️' : '⏸️',
          duration: 3000,
          style: {
            background: newStatus === 'active' ? '#f0fdf4' : '#fef3c7',
            color: newStatus === 'active' ? '#166534' : '#92400e',
            border: `1px solid ${newStatus === 'active' ? '#bbf7d0' : '#fde68a'}`
          }
        })
        return { ...s, status: newStatus, lastUpdated: new Date() }
      }
      return s
    }))
  }

  const duplicateSeries = (series) => {
    const newSeries = {
      ...series,
      id: `series-${Date.now()}`,
      name: `${series.name} (Copy)`,
      episodes: [],
      totalViews: 0,
      avgViews: 0,
      totalLikes: 0,
      totalComments: 0,
      createdAt: new Date(),
      lastUpdated: new Date()
    }
    setSeries(prev => [...prev, newSeries])
    toast('Series duplicated successfully', {
      icon: '📋',
      duration: 3000,
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '1px solid #bbf7d0'
      }
    })
  }

  const EnhancedSeriesCard = ({ series, viewMode }) => {
    const [expanded, setExpanded] = useState(false)

    const getStatusColor = () => {
      switch (series.status) {
        case 'active': return 'bg-green-100 text-green-800 border-green-200'
        case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const getConsistencyColor = () => {
      if (series.consistency >= 90) return 'text-green-600'
      if (series.consistency >= 80) return 'text-blue-600'
      if (series.consistency >= 60) return 'text-yellow-600'
      return 'text-red-600'
    }

    const getPerformanceRating = () => {
      if (series.avgViews > 50000) return { rating: 'Excellent', icon: Star, color: 'text-yellow-500' }
      if (series.avgViews > 20000) return { rating: 'Great', icon: Award, color: 'text-blue-500' }
      if (series.avgViews > 5000) return { rating: 'Good', icon: TrendingUp, color: 'text-green-500' }
      return { rating: 'Growing', icon: Zap, color: 'text-purple-500' }
    }

    const performance = getPerformanceRating()

    if (viewMode === 'list') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                {series.name.charAt(0)}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{series.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{series.episodes.length} episodes</span>
                  <span>{(series.totalViews / 1000).toFixed(0)}K views</span>
                  <span className={`font-medium ${getConsistencyColor()}`}>
                    {series.consistency.toFixed(0)}% consistency
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                {series.status}
              </span>
              <SeriesActionMenu series={series} />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {series.name.charAt(0)}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{series.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{series.description}</p>

              <div className="flex items-center space-x-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                  {series.status}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{series.frequency}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{series.category}</span>
              </div>
            </div>
          </div>

          <SeriesActionMenu series={series} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{series.episodes.length}</div>
            <div className="text-xs text-blue-700">Episodes</div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {series.totalViews > 1000000
                ? `${(series.totalViews / 1000000).toFixed(1)}M`
                : `${(series.totalViews / 1000).toFixed(0)}K`
              }
            </div>
            <div className="text-xs text-green-700">Total Views</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${getConsistencyColor()}`}>
              {series.consistency.toFixed(0)}%
            </div>
            <div className="text-xs text-purple-700">Consistency</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {series.engagementRate.toFixed(1)}%
            </div>
            <div className="text-xs text-orange-700">Engagement</div>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <performance.icon size={16} className={performance.color} />
            <span className="text-sm font-medium text-gray-700">Performance:</span>
            <span className={`text-sm font-semibold ${performance.color}`}>{performance.rating}</span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>{expanded ? 'Less' : 'More'} Details</span>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Views per Episode:</span>
                    <span className="font-medium">{series.avgViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Likes:</span>
                    <span className="font-medium">{series.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Comments:</span>
                    <span className="font-medium">{series.totalComments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Growth Rate:</span>
                    <span className="font-medium text-green-600">+{series.growthRate}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Series Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{series.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{series.lastUpdated.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium capitalize">{series.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{series.category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {series.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {series.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Best/Worst Episodes */}
            {series.bestPerformingEpisode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="font-medium text-green-900 mb-1">Best Episode</h4>
                  <p className="text-sm text-green-800">{series.bestPerformingEpisode.title}</p>
                  <p className="text-xs text-green-600">{series.bestPerformingEpisode.views?.toLocaleString()} views</p>
                </div>

                {series.worstPerformingEpisode && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-medium text-red-900 mb-1">Needs Improvement</h4>
                    <p className="text-sm text-red-800">{series.worstPerformingEpisode.title}</p>
                    <p className="text-xs text-red-600">{series.worstPerformingEpisode.views?.toLocaleString()} views</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    )
  }

  // Series Action Menu Component
  const SeriesActionMenu = ({ series }) => {
    const [showMenu, setShowMenu] = useState(false)

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings size={16} />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              <button
                onClick={() => {
                  setSelectedSeries(series)
                  setShowSeriesDetails(true)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Eye size={14} />
                <span>View Details</span>
              </button>

              <button
                onClick={() => {
                  editSeries(series)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Edit3 size={14} />
                <span>Edit Series</span>
              </button>

              <button
                onClick={() => {
                  duplicateSeries(series)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Copy size={14} />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => {
                  toggleSeriesStatus(series.id)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                {series.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                <span>{series.status === 'active' ? 'Pause' : 'Resume'} Series</span>
              </button>

              <div className="border-t border-gray-200 my-2" />

              <button
                onClick={() => {
                  toast('Opening episode scheduler...', {
                    icon: '📅',
                    duration: 3000,
                    style: {
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0'
                    }
                  })
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center space-x-2"
              >
                <Plus size={14} />
                <span>Add Episode</span>
              </button>

              <button
                onClick={() => {
                  toast('Export feature coming soon!', {
                    icon: '📤',
                    duration: 3000,
                    style: {
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #dbeafe'
                    }
                  })
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center space-x-2"
              >
                <Download size={14} />
                <span>Export Data</span>
              </button>

              <div className="border-t border-gray-200 my-2" />

              <button
                onClick={() => {
                  deleteSeries(series.id)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 size={14} />
                <span>Delete Series</span>
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="text-blue-500" />
            Content Series Manager
          </h2>
          <p className="text-gray-600 mt-1">Create, manage, and optimize your video series for maximum impact</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => toast('Bulk import feature coming soon!', {
              icon: '📥',
              duration: 3000,
              style: {
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #dbeafe'
              }
            })}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={createNewSeries}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            <span>Create Series</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="episodes">Sort by Episodes</option>
              <option value="consistency">Sort by Consistency</option>
              <option value="performance">Sort by Performance</option>
              <option value="engagement">Sort by Engagement</option>
              <option value="created">Sort by Created Date</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Series</p>
              <p className="text-3xl font-bold">
                {filteredAndSortedSeries.filter(s => s.status === 'active').length}
              </p>
              <p className="text-blue-200 text-xs mt-1">
                {series.filter(s => s.status === 'paused').length} paused
              </p>
            </div>
            <Target className="text-blue-200" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Episodes</p>
              <p className="text-3xl font-bold">
                {series.reduce((sum, s) => sum + s.episodes.length, 0)}
              </p>
              <p className="text-green-200 text-xs mt-1">
                Across {series.length} series
              </p>
            </div>
            <Play className="text-green-200" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Consistency</p>
              <p className="text-3xl font-bold">
                {series.length > 0 ? (series.reduce((sum, s) => sum + s.consistency, 0) / series.length).toFixed(0) : 0}%
              </p>
              <p className="text-purple-200 text-xs mt-1">
                Upload regularity
              </p>
            </div>
            <CheckCircle className="text-purple-200" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Views</p>
              <p className="text-3xl font-bold">
                {(series.reduce((sum, s) => sum + s.totalViews, 0) / 1000000).toFixed(1)}M
              </p>
              <p className="text-orange-200 text-xs mt-1">
                {series.reduce((sum, s) => sum + s.totalLikes, 0).toLocaleString()} likes
              </p>
            </div>
            <Eye className="text-orange-200" size={32} />
          </div>
        </div>
      </div>

      {/* Series Grid/List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {filteredAndSortedSeries.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredAndSortedSeries.map(s => (
              <EnhancedSeriesCard key={s.id} series={s} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {searchQuery || filterStatus !== 'all' ? (
              <>
                <Search size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No series found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <Target size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No series yet</h3>
                <p className="text-gray-600 mb-4">Create your first video series to organize and track your content</p>
                <button
                  onClick={createNewSeries}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Create Your First Series
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Series Modal */}
      {showCreateModal && (
        <CreateSeriesModal
          series={editingSeries}
          onClose={() => {
            setShowCreateModal(false)
            setEditingSeries(null)
          }}
          onSave={(seriesData) => {
            if (editingSeries) {
              // Update existing series
              setSeries(prev => prev.map(s =>
                s.id === editingSeries.id
                  ? { ...s, ...seriesData, lastUpdated: new Date() }
                  : s
              ))
              toast('Series updated successfully', {
                icon: '✅',
                duration: 3000,
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0'
                }
              })
            } else {
              // Create new series
              const newSeries = {
                id: `series-${Date.now()}`,
                ...seriesData,
                episodes: [],
                totalViews: 0,
                avgViews: 0,
                totalLikes: 0,
                totalComments: 0,
                consistency: 100,
                createdAt: new Date(),
                lastUpdated: new Date()
              }
              setSeries(prev => [...prev, newSeries])
              toast('Series created successfully', {
                icon: '🎉',
                duration: 3000,
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0'
                }
              })
            }
            setShowCreateModal(false)
            setEditingSeries(null)
          }}
        />
      )}
    </div>
  )
}

// Create Series Modal Component
const CreateSeriesModal = ({ series, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: series?.name || '',
    description: series?.description || '',
    category: series?.category || 'Education',
    frequency: series?.frequency || 'weekly',
    tags: series?.tags?.join(', ') || '',
    status: series?.status || 'active'
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast('Series name is required', {
        icon: '❌',
        duration: 3000
      })
      return
    }

    const seriesData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    onSave(seriesData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {series ? 'Edit Series' : 'Create New Series'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Series Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter series name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Describe your series"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Technology">Technology</option>
                <option value="Gaming">Gaming</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="irregular">Irregular</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tutorial, beginner, react"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {series ? 'Update Series' : 'Create Series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContentSeriesManager
