import React, { useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { BarChart3, TrendingUp, Calendar, RefreshCw } from 'lucide-react'
import { formatDate } from '../../utils/analytics-helpers'

const ChartsWidget = ({ 
  overview, 
  loading, 
  formatNumber, 
  formatDuration, 
  isEditMode,
  title = "Performance Charts",
  defaultChart = "views" 
}) => {
  const [activeChart, setActiveChart] = useState(defaultChart)

  const chartTypes = [
    { id: 'views', label: 'Views Over Time', icon: TrendingUp },
    { id: 'watchTime', label: 'Watch Time', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: Calendar },
    { id: 'comparison', label: 'Metrics Comparison', icon: BarChart3 }
  ]

  // Prepare chart data
  const chartData = overview?.dailyViews?.map(day => ({
    date: day.date,
    views: day.views,
    watchTime: day.watchTime,
    likes: day.likes,
    comments: day.comments,
    engagement: day.likes + day.comments,
    formattedDate: formatDate(day.date, 'short')
  })) || []

  // Colors for different metrics
  const colors = {
    views: '#FF0000',
    watchTime: '#8884d8',
    likes: '#00C851',
    comments: '#ffbb33',
    engagement: '#ff4444'
  }

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No data available for the selected period</p>
          </div>
        </div>
      )
    }

    switch (activeChart) {
      case 'views':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.views} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.views} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tickFormatter={formatNumber} 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                labelFormatter={(date) => `Date: ${date}`}
                formatter={(value) => [formatNumber(value), 'Views']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                stroke={colors.views}
                strokeWidth={3}
                fill="url(#viewsGradient)"
                dot={{ fill: colors.views, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors.views, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'watchTime':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tickFormatter={(value) => formatDuration(value * 60)} 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                labelFormatter={(date) => `Date: ${date}`}
                formatter={(value) => [formatDuration(value * 60), 'Watch Time']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="watchTime" 
                fill={colors.watchTime}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'engagement':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                labelFormatter={(date) => `Date: ${date}`}
                formatter={(value, name) => [
                  formatNumber(value), 
                  name === 'likes' ? 'Likes' : name === 'comments' ? 'Comments' : 'Total Engagement'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="likes" 
                stroke={colors.likes}
                strokeWidth={2}
                dot={{ fill: colors.likes, strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="comments" 
                stroke={colors.comments}
                strokeWidth={2}
                dot={{ fill: colors.comments, strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke={colors.engagement}
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: colors.engagement, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'comparison':
        // Aggregate data for comparison
        const totalData = chartData.reduce((acc, day) => ({
          views: acc.views + day.views,
          watchTime: acc.watchTime + day.watchTime,
          likes: acc.likes + day.likes,
          comments: acc.comments + day.comments
        }), { views: 0, watchTime: 0, likes: 0, comments: 0 })

        const comparisonData = [
          { name: 'Views', value: totalData.views, color: colors.views },
          { name: 'Watch Time (min)', value: totalData.watchTime, color: colors.watchTime },
          { name: 'Likes', value: totalData.likes, color: colors.likes },
          { name: 'Comments', value: totalData.comments, color: colors.comments }
        ]

        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'Watch Time (min)' ? formatDuration(value * 60) : formatNumber(value),
                  name
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" fill="#8884d8">
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Interactive performance visualization</p>
          </div>
          {loading?.overview && (
            <RefreshCw size={16} className="animate-spin text-gray-400" />
          )}
        </div>

        {/* Chart Type Selector */}
        <div className="flex flex-wrap gap-2 mt-4">
          {chartTypes.map((chart) => {
            const IconComponent = chart.icon
            return (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                disabled={isEditMode}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeChart === chart.id
                    ? 'bg-blue-600 text-white'
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
    </div>
  )
}

export default ChartsWidget
