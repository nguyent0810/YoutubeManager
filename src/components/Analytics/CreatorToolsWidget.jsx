import React, { useState, useEffect } from 'react'
import { 
  Wrench, 
  Calendar, 
  Users, 
  DollarSign,
  TrendingUp,
  Video,
  MessageCircle,
  Target,
  Clock,
  Star,
  ChevronRight,
  PlayCircle
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { creatorTools } from '../../services/creator-tools'

const CreatorToolsWidget = ({ 
  overview, 
  videoPerformance, 
  trends, 
  loading, 
  formatNumber, 
  isEditMode,
  title = "Creator Tools",
  viewMode = "desktop" 
}) => {
  const [activeTab, setActiveTab] = useState('strategy')
  const [toolsData, setToolsData] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const tabs = [
    { id: 'strategy', label: 'Content Strategy', icon: Video },
    { id: 'audience', label: 'Audience Intelligence', icon: Users },
    { id: 'monetization', label: 'Monetization', icon: DollarSign },
    { id: 'calendar', label: 'Content Calendar', icon: Calendar }
  ]

  // Generate creator tools analysis when data changes
  useEffect(() => {
    if (overview && videoPerformance && !loading.overview) {
      generateAnalysis()
    }
  }, [overview, videoPerformance, trends])

  const generateAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const analyticsData = { overview, videoPerformance, trends }
      
      const [contentStrategy, audienceIntelligence, monetization] = await Promise.all([
        creatorTools.analyzeContentStrategy(analyticsData),
        creatorTools.analyzeAudienceIntelligence(analyticsData),
        creatorTools.analyzeMonetization(analyticsData)
      ])

      setToolsData({
        contentStrategy,
        audienceIntelligence,
        monetization
      })
    } catch (error) {
      console.error('Creator tools analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const renderContentStrategy = () => {
    if (!toolsData?.contentStrategy) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Video size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Analyzing content strategy...</p>
        </div>
      )
    }

    const { seriesPerformance, collaborationImpact, uploadSchedule } = toolsData.contentStrategy

    return (
      <div className="space-y-6">
        {/* Upload Schedule Analysis */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <Clock size={16} className="mr-2" />
            Upload Schedule Analysis
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {uploadSchedule.avgUploadInterval?.toFixed(1) || 'N/A'} days
              </div>
              <div className="text-sm text-blue-700">Average Upload Interval</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {uploadSchedule.consistencyRating || 'N/A'}
              </div>
              <div className="text-sm text-blue-700">Consistency Rating</div>
            </div>
          </div>
          
          {uploadSchedule.bestDays && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Best Upload Days:</h5>
              <div className="flex space-x-2">
                {uploadSchedule.bestDays.slice(0, 3).map((day, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                    {day.day}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Series Performance */}
        {seriesPerformance.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <PlayCircle size={16} className="mr-2" />
              Series Performance
            </h4>
            <div className="space-y-3">
              {seriesPerformance.slice(0, 3).map((series, index) => (
                <div key={index} className="bg-white rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-green-900">{series.title}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      series.performance === 'excellent' ? 'bg-green-200 text-green-800' :
                      series.performance === 'good' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {series.performance}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="font-medium">{series.videoCount}</div>
                      <div className="text-gray-600">Videos</div>
                    </div>
                    <div>
                      <div className="font-medium">{formatNumber(series.avgViews)}</div>
                      <div className="text-gray-600">Avg Views</div>
                    </div>
                    <div>
                      <div className="font-medium">{series.retentionRate.toFixed(1)}%</div>
                      <div className="text-gray-600">Retention</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaboration Impact */}
        {collaborationImpact.hasCollaborations && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-3 flex items-center">
              <Users size={16} className="mr-2" />
              Collaboration Impact
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {collaborationImpact.impactPercentage > 0 ? '+' : ''}{collaborationImpact.impactPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-700">Performance Impact</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {collaborationImpact.collaborationCount}
                </div>
                <div className="text-sm text-purple-700">Collaborations</div>
              </div>
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                collaborationImpact.impact === 'highly positive' ? 'bg-green-100 text-green-800' :
                collaborationImpact.impact === 'positive' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {collaborationImpact.impact} impact
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderAudienceIntelligence = () => {
    if (!toolsData?.audienceIntelligence) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Analyzing audience behavior...</p>
        </div>
      )
    }

    const { subscriberJourney, engagementQuality, commentSentiment, audienceOverlap } = toolsData.audienceIntelligence

    return (
      <div className="space-y-6">
        {/* Subscriber Journey */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <Target size={16} className="mr-2" />
            Subscriber Conversion Journey
          </h4>
          <div className="space-y-2">
            {subscriberJourney.journey?.map((stage, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-blue-800">{stage.stage}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-blue-900">{stage.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
          
          {subscriberJourney.avgConversionRate && (
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <div className="text-lg font-bold text-blue-900">
                {subscriberJourney.avgConversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Average Conversion Rate</div>
            </div>
          )}
        </div>

        {/* Engagement Quality */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <MessageCircle size={16} className="mr-2" />
            Engagement Quality
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-900">
                {engagementQuality.avgQualityScore?.toFixed(1) || 'N/A'}/100
              </div>
              <div className="text-sm text-green-700">Quality Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900">
                {engagementQuality.qualityRating || 'N/A'}
              </div>
              <div className="text-sm text-green-700">Rating</div>
            </div>
          </div>
          
          {engagementQuality.insights && (
            <div className="mt-4 space-y-1">
              {engagementQuality.insights.slice(0, 2).map((insight, index) => (
                <div key={index} className="text-sm text-green-800">
                  • {insight}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Sentiment */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-3">Comment Sentiment</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Positive', value: commentSentiment.positive, fill: '#10b981' },
                    { name: 'Neutral', value: commentSentiment.neutral, fill: '#f59e0b' },
                    { name: 'Negative', value: commentSentiment.negative, fill: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={50}
                  dataKey="value"
                >
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="font-medium text-green-700">{commentSentiment.positive}%</div>
              <div className="text-green-600">Positive</div>
            </div>
            <div>
              <div className="font-medium text-yellow-700">{commentSentiment.neutral}%</div>
              <div className="text-yellow-600">Neutral</div>
            </div>
            <div>
              <div className="font-medium text-red-700">{commentSentiment.negative}%</div>
              <div className="text-red-600">Negative</div>
            </div>
          </div>
        </div>

        {/* Audience Overlap */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-3">Audience Behavior</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-purple-900">{audienceOverlap.crossVideoViewership}%</div>
              <div className="text-xs text-purple-700">Cross-Video Viewers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-900">{audienceOverlap.loyalViewers}%</div>
              <div className="text-xs text-purple-700">Loyal Viewers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-900">{audienceOverlap.newViewerRate}%</div>
              <div className="text-xs text-purple-700">New Viewers</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMonetization = () => {
    if (!toolsData?.monetization) {
      return (
        <div className="text-center py-8 text-gray-500">
          <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Analyzing monetization data...</p>
        </div>
      )
    }

    const { revenue, cpmAnalysis, membershipGrowth, superChatPerformance } = toolsData.monetization

    return (
      <div className="space-y-6">
        {/* Revenue Overview */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <DollarSign size={16} className="mr-2" />
            Revenue Overview
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-900">
                ${revenue.total?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-green-700">Estimated Total Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900">
                ${revenue.cpm?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-green-700">Average CPM</div>
            </div>
          </div>
          
          <div className="mt-4">
            <h5 className="text-sm font-medium text-green-900 mb-2">Revenue Breakdown:</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Ad Revenue:</span>
                <span className="font-medium">${revenue.breakdown?.adRevenue?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Memberships:</span>
                <span className="font-medium">${revenue.breakdown?.membershipRevenue?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Super Chat:</span>
                <span className="font-medium">${revenue.breakdown?.superChatRevenue?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Growth */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Channel Memberships</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-900">{membershipGrowth.currentMembers}</div>
              <div className="text-xs text-blue-700">Current Members</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-900">+{membershipGrowth.monthlyGrowth}</div>
              <div className="text-xs text-blue-700">Monthly Growth</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-900">${membershipGrowth.revenue}</div>
              <div className="text-xs text-blue-700">Monthly Revenue</div>
            </div>
          </div>
        </div>

        {/* Super Chat Performance */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-3">Super Chat Performance</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-lg font-bold text-purple-900">${superChatPerformance.totalRevenue}</div>
              <div className="text-sm text-purple-700">Total Revenue</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-900">${superChatPerformance.averageAmount}</div>
              <div className="text-sm text-purple-700">Average Amount</div>
            </div>
          </div>
        </div>

        {/* Top Performing Videos by Revenue */}
        {cpmAnalysis.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-3">Top Revenue Videos</h4>
            <div className="space-y-2">
              {cpmAnalysis.slice(0, 3).map((video, index) => (
                <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                  <span className="text-sm text-yellow-800 truncate flex-1 mr-2">
                    {video.title}
                  </span>
                  <span className="text-sm font-medium text-yellow-900">
                    ${video.estimatedRevenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContentCalendar = () => {
    if (!toolsData?.contentStrategy?.contentCalendar) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Generating content calendar...</p>
        </div>
      )
    }

    const calendar = toolsData.contentStrategy.contentCalendar

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Upcoming Content Schedule</h4>
          <div className="space-y-3">
            {calendar.slice(0, 7).map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {item.type === 'published' ? '✅' : 
                     item.type === 'scheduled' ? '📅' : '💡'} {item.title || item.reason}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.date.toLocaleDateString()} • {item.dayOfWeek}
                  </div>
                </div>
                <div className="text-right">
                  {item.views && (
                    <div className="text-sm font-medium">{formatNumber(item.views)} views</div>
                  )}
                  {item.projectedViews && (
                    <div className="text-sm text-gray-600">~{formatNumber(item.projectedViews)} projected</div>
                  )}
                  {item.performance && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.performance === 'excellent' ? 'bg-green-100 text-green-800' :
                      item.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.performance}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (loading.overview && !toolsData) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">Advanced creator analytics and tools</p>
        </div>
        <div className="p-12 text-center">
          <Wrench size={48} className="text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Analyzing your creator performance...</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Advanced creator analytics and optimization tools</p>
            </div>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center text-orange-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
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
                    ? 'bg-white text-orange-600 shadow-sm'
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
        {activeTab === 'strategy' && renderContentStrategy()}
        {activeTab === 'audience' && renderAudienceIntelligence()}
        {activeTab === 'monetization' && renderMonetization()}
        {activeTab === 'calendar' && renderContentCalendar()}
      </div>
    </div>
  )
}

export default CreatorToolsWidget
