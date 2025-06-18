import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ChevronRight,
  Lightbulb,
  Target,
  Clock,
  Zap,
  Filter,
  RefreshCw
} from 'lucide-react'
import { AIInsightsEngine } from '../../services/ai-insights'

const AIInsightsWidget = ({ 
  overview, 
  videoPerformance, 
  trends, 
  loading, 
  isEditMode,
  title = "AI-Powered Insights",
  maxInsights = 10 
}) => {
  const [insights, setInsights] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [expandedInsight, setExpandedInsight] = useState(null)

  const aiEngine = new AIInsightsEngine()

  const categories = [
    { id: 'all', label: 'All Insights', icon: Brain },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'engagement', label: 'Engagement', icon: Target },
    { id: 'retention', label: 'Retention', icon: Clock },
    { id: 'optimization', label: 'Optimization', icon: Zap },
    { id: 'consistency', label: 'Consistency', icon: RefreshCw }
  ]

  const types = [
    { id: 'all', label: 'All Types' },
    { id: 'warning', label: 'Warnings', color: 'text-red-600' },
    { id: 'info', label: 'Opportunities', color: 'text-blue-600' },
    { id: 'success', label: 'Wins', color: 'text-green-600' }
  ]

  // Analyze data when it changes
  useEffect(() => {
    if (overview && !loading.overview) {
      analyzeData()
    }
  }, [overview, videoPerformance, trends, loading.overview])

  const analyzeData = async () => {
    setIsAnalyzing(true)
    try {
      const analyticsData = { overview, videoPerformance, trends }
      const newInsights = await aiEngine.analyzeChannelPerformance(analyticsData)
      setInsights(newInsights)
    } catch (error) {
      console.error('AI analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Filter insights based on selected category and type
  const filteredInsights = insights.filter(insight => {
    const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory
    const typeMatch = selectedType === 'all' || insight.type === selectedType
    return categoryMatch && typeMatch
  }).slice(0, maxInsights)

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={20} className="text-red-500" />
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />
      case 'info':
      default:
        return <Info size={20} className="text-blue-500" />
    }
  }

  const getInsightBorderColor = (type) => {
    switch (type) {
      case 'warning':
        return 'border-l-red-500'
      case 'success':
        return 'border-l-green-500'
      case 'info':
      default:
        return 'border-l-blue-500'
    }
  }

  const getImpactBadge = (impact) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[impact] || colors.low}`}>
        {impact} impact
      </span>
    )
  }

  const getEffortBadge = (effort) => {
    const colors = {
      high: 'bg-purple-100 text-purple-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[effort] || colors.low}`}>
        {effort} effort
      </span>
    )
  }

  if (loading.overview && !insights.length) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">AI-powered performance analysis</p>
        </div>
        <div className="p-12 text-center">
          <Brain size={48} className="text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Analyzing your channel performance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Widget Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">
                {insights.length} insights • Last analyzed {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {isAnalyzing && (
            <RefreshCw size={16} className="animate-spin text-gray-400" />
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category:</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    disabled={isEditMode}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <IconComponent size={14} />
                    <span>{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type:</label>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  disabled={isEditMode}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedType === type.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="divide-y divide-gray-200">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((insight) => (
            <div 
              key={insight.id} 
              className={`p-6 border-l-4 ${getInsightBorderColor(insight.type)} hover:bg-gray-50 transition-colors ${
                isEditMode ? 'pointer-events-none opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                      <div className="flex items-center space-x-2">
                        {getImpactBadge(insight.impact)}
                        {getEffortBadge(insight.effort)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    
                    {/* Recommendations */}
                    {insight.recommendations && insight.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setExpandedInsight(
                            expandedInsight === insight.id ? null : insight.id
                          )}
                          disabled={isEditMode}
                          className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          <Lightbulb size={14} />
                          <span>
                            {expandedInsight === insight.id ? 'Hide' : 'Show'} Recommendations
                          </span>
                          <ChevronRight 
                            size={14} 
                            className={`transform transition-transform ${
                              expandedInsight === insight.id ? 'rotate-90' : ''
                            }`} 
                          />
                        </button>
                        
                        {expandedInsight === insight.id && (
                          <div className="mt-3 p-4 bg-purple-50 rounded-lg">
                            <h5 className="text-sm font-medium text-purple-900 mb-2">
                              💡 Recommended Actions:
                            </h5>
                            <ul className="space-y-2">
                              {insight.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start space-x-2 text-sm text-purple-800">
                                  <span className="text-purple-500 mt-1">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <Brain size={48} className="text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h4>
            <p className="text-gray-600">
              {isAnalyzing 
                ? 'Analyzing your performance data...' 
                : 'Not enough data to generate insights. Upload more content and try again.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Insights powered by AI analysis • Updated automatically
          </p>
          <button
            onClick={analyzeData}
            disabled={isAnalyzing || isEditMode}
            className="text-xs text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIInsightsWidget
