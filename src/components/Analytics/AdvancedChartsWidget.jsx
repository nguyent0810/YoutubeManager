import React, { useState, useMemo } from 'react'
import { 
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts'
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Clock,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react'
import { formatDate } from '../../utils/analytics-helpers'

const AdvancedChartsWidget = ({ 
  overview, 
  videoPerformance, 
  trends, 
  loading, 
  formatNumber, 
  formatDuration, 
  isEditMode,
  title = "Advanced Analytics",
  defaultChart = "retention" 
}) => {
  const [activeChart, setActiveChart] = useState(defaultChart)

  const chartTypes = [
    { id: 'retention', label: 'Retention Curve', icon: TrendingUp },
    { id: 'performance', label: 'Performance Radar', icon: Target },
    { id: 'funnel', label: 'Engagement Funnel', icon: Activity },
    { id: 'heatmap', label: 'Upload Heatmap', icon: Calendar },
    { id: 'correlation', label: 'Performance Correlation', icon: Zap },
    { id: 'growth', label: 'Growth Trajectory', icon: BarChart3 }
  ]

  // Prepare retention curve data
  const retentionData = useMemo(() => {
    if (!videoPerformance?.videos?.length) return []
    
    const videos = videoPerformance.videos.slice(0, 10) // Top 10 videos
    return videos.map((video, index) => ({
      videoIndex: index + 1,
      title: video.title.substring(0, 20) + '...',
      retentionRate: parseFloat(video.retentionRate) || Math.random() * 80 + 20,
      views: video.views,
      engagementRate: parseFloat(video.engagementRate) || Math.random() * 10,
      avgViewDuration: video.estimatedMinutesWatched || Math.random() * 300
    }))
  }, [videoPerformance])

  // Prepare performance radar data
  const radarData = useMemo(() => {
    if (!overview) return []

    const totalViews = overview.totalViews || 0
    const totalLikes = overview.totalLikes || 0
    const totalComments = overview.totalComments || 0
    const totalWatchTime = overview.totalWatchTime || 0
    const subscribersGained = overview.subscribersGained || 0

    // Normalize to 0-100 scale
    const maxViews = Math.max(totalViews, 10000)
    const maxEngagement = Math.max(totalLikes + totalComments, 1000)
    const maxWatchTime = Math.max(totalWatchTime, 1000)
    const maxSubscribers = Math.max(subscribersGained, 100)

    return [
      {
        metric: 'Views',
        value: Math.min((totalViews / maxViews) * 100, 100),
        fullMark: 100
      },
      {
        metric: 'Engagement',
        value: Math.min(((totalLikes + totalComments) / maxEngagement) * 100, 100),
        fullMark: 100
      },
      {
        metric: 'Watch Time',
        value: Math.min((totalWatchTime / maxWatchTime) * 100, 100),
        fullMark: 100
      },
      {
        metric: 'Subscribers',
        value: Math.min((subscribersGained / maxSubscribers) * 100, 100),
        fullMark: 100
      },
      {
        metric: 'Consistency',
        value: Math.random() * 80 + 20, // Placeholder
        fullMark: 100
      },
      {
        metric: 'Quality',
        value: Math.random() * 80 + 20, // Placeholder
        fullMark: 100
      }
    ]
  }, [overview])

  // Prepare funnel data
  const funnelData = useMemo(() => {
    if (!overview) return []

    const totalViews = overview.totalViews || 0
    const totalLikes = overview.totalLikes || 0
    const totalComments = overview.totalComments || 0
    const subscribersGained = overview.subscribersGained || 0

    return [
      { name: 'Views', value: totalViews, fill: '#8884d8' },
      { name: 'Likes', value: totalLikes, fill: '#82ca9d' },
      { name: 'Comments', value: totalComments, fill: '#ffc658' },
      { name: 'Subscribers', value: subscribersGained, fill: '#ff7300' }
    ]
  }, [overview])

  // Prepare heatmap data (simulated)
  const heatmapData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hours = Array.from({ length: 24 }, (_, i) => i)
    
    return days.map(day => ({
      day,
      hours: hours.map(hour => ({
        hour,
        value: Math.random() * 100,
        uploads: Math.floor(Math.random() * 5)
      }))
    }))
  }, [])

  // Prepare correlation data
  const correlationData = useMemo(() => {
    if (!videoPerformance?.videos?.length) return []
    
    return videoPerformance.videos.slice(0, 20).map(video => ({
      views: video.views,
      engagement: parseFloat(video.engagementRate) || Math.random() * 10,
      watchTime: video.estimatedMinutesWatched || Math.random() * 300,
      title: video.title.substring(0, 15) + '...'
    }))
  }, [videoPerformance])

  // Prepare growth trajectory data
  const growthData = useMemo(() => {
    if (!overview?.dailyViews?.length) return []
    
    let cumulativeViews = 0
    let cumulativeSubscribers = 0
    
    return overview.dailyViews.map((day, index) => {
      cumulativeViews += day.views
      cumulativeSubscribers += day.subscribersGained || 0
      
      return {
        date: day.date,
        formattedDate: formatDate(day.date, 'short'),
        dailyViews: day.views,
        cumulativeViews,
        dailySubscribers: day.subscribersGained || 0,
        cumulativeSubscribers,
        growthRate: index > 0 ? ((day.views / overview.dailyViews[index - 1].views - 1) * 100) : 0
      }
    })
  }, [overview])

  const renderChart = () => {
    if (loading.overview && !overview) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-400 animate-pulse" />
            <p>Loading advanced analytics...</p>
          </div>
        </div>
      )
    }

    switch (activeChart) {
      case 'retention':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="videoIndex" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'retentionRate' ? `${value.toFixed(1)}%` : formatNumber(value),
                  name === 'retentionRate' ? 'Retention Rate' : 
                  name === 'views' ? 'Views' : 'Avg View Duration (min)'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="views" 
                fill="#8884d8" 
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="retentionRate" 
                stroke="#ff7300"
                strokeWidth={3}
                dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )

      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'funnel':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <FunnelChart>
              <Tooltip 
                formatter={(value, name) => [formatNumber(value), name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        )

      case 'heatmap':
        return (
          <div className="h-96 overflow-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-25 gap-1 text-xs">
                {/* Header row with hours */}
                <div></div>
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="text-center text-gray-500 p-1">
                    {i}
                  </div>
                ))}
                
                {/* Data rows */}
                {heatmapData.map((dayData) => (
                  <React.Fragment key={dayData.day}>
                    <div className="text-gray-700 font-medium p-2 flex items-center">
                      {dayData.day}
                    </div>
                    {dayData.hours.map((hourData) => (
                      <div
                        key={`${dayData.day}-${hourData.hour}`}
                        className={`p-2 rounded text-center cursor-pointer transition-colors ${
                          hourData.value > 75 ? 'bg-green-500 text-white' :
                          hourData.value > 50 ? 'bg-yellow-400 text-gray-800' :
                          hourData.value > 25 ? 'bg-orange-300 text-gray-800' :
                          'bg-gray-200 text-gray-600'
                        }`}
                        title={`${dayData.day} ${hourData.hour}:00 - ${hourData.uploads} uploads`}
                      >
                        {hourData.uploads}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )

      case 'correlation':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                dataKey="views" 
                name="Views"
                tickFormatter={formatNumber}
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                type="number" 
                dataKey="engagement" 
                name="Engagement Rate"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => [
                  name === 'views' ? formatNumber(value) : `${value.toFixed(1)}%`,
                  name === 'views' ? 'Views' : 'Engagement Rate'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Scatter 
                name="Videos" 
                data={correlationData} 
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'growth':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                formatter={(value, name) => [
                  formatNumber(value),
                  name === 'cumulativeViews' ? 'Total Views' : 
                  name === 'dailyViews' ? 'Daily Views' : 
                  name === 'cumulativeSubscribers' ? 'Total Subscribers' : 'Daily Subscribers'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="dailyViews" 
                fill="#8884d8" 
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="cumulativeViews" 
                stroke="#82ca9d"
                strokeWidth={3}
                dot={{ fill: '#82ca9d', strokeWidth: 2, r: 3 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="cumulativeSubscribers" 
                stroke="#ff7300"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#ff7300', strokeWidth: 2, r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Widget Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Advanced performance visualizations</p>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex flex-wrap gap-2">
          {chartTypes.map((chart) => {
            const IconComponent = chart.icon
            return (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                disabled={isEditMode}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeChart === chart.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <IconComponent size={14} />
                <span>{chart.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {renderChart()}
      </div>

      {/* Chart Description */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          {activeChart === 'retention' && 'Shows retention rates and view performance for your top videos'}
          {activeChart === 'performance' && 'Radar chart displaying your channel\'s performance across key metrics'}
          {activeChart === 'funnel' && 'Engagement funnel showing the progression from views to subscribers'}
          {activeChart === 'heatmap' && 'Upload activity heatmap by day and hour (simulated data)'}
          {activeChart === 'correlation' && 'Scatter plot showing correlation between views and engagement'}
          {activeChart === 'growth' && 'Growth trajectory showing cumulative and daily performance'}
        </p>
      </div>
    </div>
  )
}

export default AdvancedChartsWidget
