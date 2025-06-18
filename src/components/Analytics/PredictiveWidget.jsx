import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Lightbulb,
  DollarSign,
  Users,
  Eye,
  Clock,
  BarChart3,
  Zap,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { predictiveAnalytics } from '../../services/predictive-analytics'
import { formatDate } from '../../utils/analytics-helpers'

const PredictiveWidget = ({ 
  overview, 
  videoPerformance, 
  trends, 
  loading, 
  formatNumber, 
  isEditMode,
  title = "Predictive Analytics",
  viewMode = "desktop" 
}) => {
  const [predictions, setPredictions] = useState(null)
  const [activeTab, setActiveTab] = useState('growth')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [timeframe, setTimeframe] = useState(30)

  const tabs = [
    { id: 'growth', label: 'Growth Forecast', icon: TrendingUp },
    { id: 'revenue', label: 'Revenue Prediction', icon: DollarSign },
    { id: 'seasonal', label: 'Seasonal Patterns', icon: Calendar },
    { id: 'content', label: 'Content Gaps', icon: Lightbulb }
  ]

  // Generate predictions when data changes
  useEffect(() => {
    if (overview && !loading.overview) {
      generatePredictions()
    }
  }, [overview, videoPerformance, trends, timeframe])

  const generatePredictions = async () => {
    setIsAnalyzing(true)
    try {
      const analyticsData = { overview, videoPerformance, trends }
      const newPredictions = await predictiveAnalytics.generatePredictions(analyticsData, timeframe)
      setPredictions(newPredictions)
    } catch (error) {
      console.error('Prediction generation error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return 'High Confidence'
    if (confidence >= 60) return 'Medium Confidence'
    return 'Low Confidence'
  }

  const renderGrowthForecast = () => {
    if (!predictions?.growth) {
      return (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Not enough data for growth predictions</p>
          <p className="text-sm text-gray-400 mt-1">Need at least 7 days of data</p>
        </div>
      )
    }

    const { growth } = predictions
    const chartData = growth.views.forecast.map((point, index) => ({
      date: formatDate(point.date, 'short'),
      views: Math.round(point.y),
      subscribers: Math.round(growth.subscribers.forecast[index]?.y || 0)
    }))

    return (
      <div className="space-y-6">
        {/* Growth Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye size={20} className="text-blue-600" />
              <span className={`text-xs ${getConfidenceColor(growth.views.confidence)}`}>
                {getConfidenceLabel(growth.views.confidence)}
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {growth.views.growthRate > 0 ? '+' : ''}{growth.views.growthRate.toFixed(1)}%
            </div>
            <div className="text-sm text-blue-700">Views Growth (30d)</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className="text-green-600" />
              <span className={`text-xs ${getConfidenceColor(growth.subscribers.confidence)}`}>
                {getConfidenceLabel(growth.subscribers.confidence)}
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {growth.subscribers.growthRate > 0 ? '+' : ''}{growth.subscribers.growthRate.toFixed(1)}%
            </div>
            <div className="text-sm text-green-700">Subscriber Growth (30d)</div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  formatNumber(value),
                  name === 'views' ? 'Daily Views' : 'Daily Subscribers'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="subscribers" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Milestones */}
        {growth.milestones && growth.milestones.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-3 flex items-center">
              <Target size={16} className="mr-2" />
              Upcoming Milestones
            </h4>
            <div className="space-y-2">
              {growth.milestones.slice(0, 3).map((milestone, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-purple-700">
                    {formatNumber(milestone.target)} {milestone.type}
                  </span>
                  <span className="text-purple-600">
                    ~{milestone.estimatedDays} days
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRevenuePrediction = () => {
    if (!predictions?.revenue) {
      return (
        <div className="text-center py-8 text-gray-500">
          <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Revenue predictions require more data</p>
          <p className="text-sm text-gray-400 mt-1">Enable monetization for accurate forecasts</p>
        </div>
      )
    }

    const { revenue } = predictions
    const chartData = revenue.forecast.map(point => ({
      date: formatDate(point.date, 'short'),
      revenue: point.revenue,
      views: point.views
    }))

    return (
      <div className="space-y-6">
        {/* Revenue Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DollarSign size={20} className="text-green-600 mr-2" />
              <span className="text-sm text-green-700">Projected Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              ${revenue.totalProjected.toFixed(2)}
            </div>
            <div className="text-sm text-green-700">Next {timeframe} days</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrendingUp size={20} className="text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">Growth Rate</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {revenue.growthRate > 0 ? '+' : ''}{revenue.growthRate.toFixed(1)}%
            </div>
            <div className="text-sm text-blue-700">vs current period</div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toFixed(2)}` : formatNumber(value),
                  name === 'revenue' ? 'Daily Revenue' : 'Daily Views'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                fill="#10b981"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Insights */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-3">Revenue Insights</h4>
          <div className="space-y-2 text-sm text-yellow-800">
            <div>Estimated CPM: ${revenue.cpm.toFixed(2)}</div>
            <div>Revenue per view: ${revenue.revenuePerView.toFixed(4)}</div>
            <div>Based on current engagement and channel performance</div>
          </div>
        </div>
      </div>
    )
  }

  const renderSeasonalPatterns = () => {
    if (!predictions?.seasonal) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Analyzing seasonal patterns...</p>
          <p className="text-sm text-gray-400 mt-1">Need more historical data</p>
        </div>
      )
    }

    const { seasonal } = predictions

    return (
      <div className="space-y-6">
        {/* Best Performance Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <Calendar size={16} className="mr-2" />
              Best Days
            </h4>
            <div className="space-y-2">
              {seasonal.bestDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-green-700">{day.day}</span>
                  <span className="text-green-600">{formatNumber(day.avgViews)} avg views</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <Clock size={16} className="mr-2" />
              Best Hours
            </h4>
            <div className="space-y-2">
              {seasonal.bestHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">{hour.hour}:00</span>
                  <span className="text-blue-600">{formatNumber(hour.avgViews)} avg views</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        {seasonal.monthlyTrends && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-3">Monthly Performance</h4>
            <div className="grid grid-cols-3 gap-2">
              {seasonal.monthlyTrends.slice(0, 6).map((month, index) => (
                <div key={index} className="text-center p-2 bg-white rounded">
                  <div className="text-sm font-medium text-purple-900">{month.month}</div>
                  <div className="text-xs text-purple-700">{formatNumber(month.avgViews)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="font-medium text-orange-900 mb-3 flex items-center">
            <Lightbulb size={16} className="mr-2" />
            Timing Recommendations
          </h4>
          <div className="space-y-2">
            {seasonal.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start text-sm text-orange-800">
                <ChevronRight size={14} className="mr-1 mt-0.5 text-orange-600" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderContentGaps = () => {
    if (!predictions?.contentGaps) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Lightbulb size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Analyzing content opportunities...</p>
        </div>
      )
    }

    const { contentGaps } = predictions

    return (
      <div className="space-y-6">
        {/* Top Performing Topics */}
        {contentGaps.topPerformingTopics && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <TrendingUp size={16} className="mr-2" />
              Your Best Topics
            </h4>
            <div className="space-y-2">
              {contentGaps.topPerformingTopics.slice(0, 5).map((topic, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-green-700 capitalize">{topic.topic}</span>
                  <span className="text-green-600">{formatNumber(topic.avgViews)} avg views</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Gaps */}
        {contentGaps.contentGaps && contentGaps.contentGaps.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
              <AlertCircle size={16} className="mr-2" />
              Trending Opportunities
            </h4>
            <div className="space-y-3">
              {contentGaps.contentGaps.slice(0, 3).map((gap, index) => (
                <div key={index} className="bg-white rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-yellow-900">{gap.topic}</span>
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                      {gap.opportunity}% trending
                    </span>
                  </div>
                  <div className="text-sm text-yellow-700">{gap.reason}</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    Competition: {gap.competition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Recommendations */}
        {contentGaps.recommendations && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <Zap size={16} className="mr-2" />
              Content Strategy
            </h4>
            <div className="space-y-2">
              {contentGaps.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start text-sm text-blue-800">
                  <ChevronRight size={14} className="mr-1 mt-0.5 text-blue-600" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading.overview && !predictions) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">AI-powered growth predictions</p>
        </div>
        <div className="p-12 text-center">
          <BarChart3 size={48} className="text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Analyzing your data for predictions...</p>
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
              AI-powered predictions • {timeframe} day forecast
            </p>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-gray-700">Forecast period:</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            disabled={isEditMode}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={isEditMode}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <IconComponent size={14} />
                <span className={viewMode === 'mobile' ? 'hidden sm:inline' : ''}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'growth' && renderGrowthForecast()}
        {activeTab === 'revenue' && renderRevenuePrediction()}
        {activeTab === 'seasonal' && renderSeasonalPatterns()}
        {activeTab === 'content' && renderContentGaps()}
      </div>
    </div>
  )
}

export default PredictiveWidget
