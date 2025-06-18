import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Video, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  Clock,
  Eye,
  ThumbsUp,
  ExternalLink
} from 'lucide-react'

const SearchResults = ({ results, query, onClose }) => {
  const navigate = useNavigate()

  if (!results || results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4 z-50">
        <p className="text-gray-500 text-center">
          {query ? `No results found for "${query}"` : 'Start typing to search...'}
        </p>
      </div>
    )
  }

  const handleResultClick = (result) => {
    if (result.type === 'video') {
      navigate('/videos')
    } else if (result.type === 'comment') {
      navigate('/comments')
    } else if (result.type === 'analytics') {
      navigate('/analytics')
    } else if (result.type === 'setting') {
      navigate(result.path || '/settings')
    }
    onClose()
  }

  const getResultIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={16} className="text-red-500" />
      case 'comment':
        return <MessageCircle size={16} className="text-blue-500" />
      case 'analytics':
        return <BarChart3 size={16} className="text-green-500" />
      case 'setting':
        return <Settings size={16} className="text-gray-500" />
      default:
        return <ExternalLink size={16} className="text-gray-400" />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Group results by category
  const groupedResults = results.reduce((groups, result) => {
    const category = result.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(result)
    return groups
  }, {})

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto z-50">
      {Object.entries(groupedResults).map(([category, categoryResults]) => (
        <div key={category} className="border-b border-gray-100 last:border-b-0">
          <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
            {category} ({categoryResults.length})
          </div>
          
          {categoryResults.map((result) => (
            <div
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getResultIcon(result.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </h4>
                    {result.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {result.description || result.text || result.message}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {result.publishedAt && (
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{formatDate(result.publishedAt)}</span>
                      </div>
                    )}
                    
                    {result.views && (
                      <div className="flex items-center space-x-1">
                        <Eye size={12} />
                        <span>{formatNumber(result.views)} views</span>
                      </div>
                    )}
                    
                    {result.likes && (
                      <div className="flex items-center space-x-1">
                        <ThumbsUp size={12} />
                        <span>{formatNumber(result.likes)}</span>
                      </div>
                    )}
                    
                    {result.author && (
                      <span>by {result.author}</span>
                    )}
                    
                    {result.videoTitle && (
                      <span>on "{result.videoTitle}"</span>
                    )}
                    
                    {result.metric && result.value && (
                      <span>{result.metric}: {result.value}</span>
                    )}
                  </div>
                </div>
                
                {result.thumbnail && (
                  <div className="flex-shrink-0">
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
      
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center">
        Showing {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </div>
    </div>
  )
}

export default SearchResults
