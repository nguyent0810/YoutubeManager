import React, { useState } from 'react'
import { 
  Play, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Clock,
  TrendingUp,
  Filter,
  Search,
  ExternalLink,
  BarChart3
} from 'lucide-react'
import { formatDate } from '../../utils/analytics-helpers'

const VideoPerformanceWidget = ({ 
  videoPerformance, 
  loading, 
  formatNumber, 
  formatDuration, 
  isEditMode,
  title = "Top Performing Videos",
  maxVideos = 10 
}) => {
  const [sortBy, setSortBy] = useState('views')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const sortOptions = [
    { id: 'views', label: 'Views', icon: Eye },
    { id: 'engagementRate', label: 'Engagement', icon: TrendingUp },
    { id: 'likes', label: 'Likes', icon: ThumbsUp },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
    { id: 'publishedAt', label: 'Recent', icon: Clock }
  ]

  // Filter and sort videos
  const processedVideos = React.useMemo(() => {
    if (!videoPerformance?.videos) return []

    let filtered = videoPerformance.videos

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views
        case 'engagementRate':
          return parseFloat(b.engagementRate) - parseFloat(a.engagementRate)
        case 'likes':
          return b.likes - a.likes
        case 'comments':
          return b.comments - a.comments
        case 'publishedAt':
          return new Date(b.publishedAt) - new Date(a.publishedAt)
        default:
          return 0
      }
    })

    return filtered.slice(0, maxVideos)
  }, [videoPerformance?.videos, searchTerm, sortBy, maxVideos])

  if (!videoPerformance?.videos?.length) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">Your best performing content</p>
        </div>
        <div className="p-12 text-center">
          <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Video Data</h4>
          <p className="text-gray-600">
            {loading?.videoPerformance 
              ? 'Loading video performance data...' 
              : 'No video performance data available for the selected time period.'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Widget Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">
              Showing {processedVideos.length} of {videoPerformance.videos.length} videos
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            disabled={isEditMode}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Filter size={14} />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isEditMode}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by:</label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      disabled={isEditMode}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        sortBy === option.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <IconComponent size={14} />
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Videos List */}
      <div className="divide-y divide-gray-200">
        {processedVideos.map((video, index) => (
          <div 
            key={video.videoId} 
            className={`p-6 hover:bg-gray-50 transition-colors ${
              isEditMode ? 'pointer-events-none opacity-75' : ''
            }`}
          >
            <div className="flex items-start space-x-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">{index + 1}</span>
              </div>

              {/* Thumbnail */}
              <div className="flex-shrink-0 w-24 h-16 bg-gray-200 rounded-lg overflow-hidden">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <Play size={16} className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate mb-1" title={video.title}>
                      {video.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                      <span className="flex items-center">
                        <Eye size={12} className="mr-1" />
                        {formatNumber(video.views)} views
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp size={12} className="mr-1" />
                        {formatNumber(video.likes)}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle size={12} className="mr-1" />
                        {formatNumber(video.comments)}
                      </span>
                      {video.publishedAt && (
                        <span className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          {formatDate(video.publishedAt, 'relative')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* External Link */}
                  <button
                    onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}
                    disabled={isEditMode}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Open in YouTube"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>

                {/* Performance Metrics */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {formatNumber(video.views)}
                    </div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {video.engagementRate}%
                    </div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {formatDuration(video.estimatedMinutesWatched * 60)}
                    </div>
                    <div className="text-xs text-gray-500">Watch Time</div>
                  </div>
                  {video.retentionRate && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {video.retentionRate}%
                      </div>
                      <div className="text-xs text-gray-500">Retention</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Widget Footer */}
      {videoPerformance?.lastUpdated && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(videoPerformance.lastUpdated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

export default VideoPerformanceWidget
