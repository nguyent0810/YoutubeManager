import React from 'react'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Eye, 
  Clock,
  Activity,
  AlertCircle
} from 'lucide-react'

const MetricsWidget = ({
  overview,
  trends,
  formatNumber,
  formatDuration,
  isEditMode,
  title = "Key Metrics",
  size = "full", // full, half, quarter
  viewMode = "desktop" // desktop, tablet, mobile
}) => {
  // Handle case where analytics data isn't available
  if (overview?.analyticsNotAvailable) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-md p-6 border border-amber-200">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle size={24} className="text-amber-600" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900">{title}</h3>
            <p className="text-sm text-amber-700">Analytics data requires channel eligibility</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-amber-800 mb-2">📊 YouTube Analytics requires:</p>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• 1,000+ subscribers</li>
            <li>• 4,000+ watch hours (12 months)</li>
            <li>• Channel in good standing</li>
          </ul>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      id: 'views',
      label: 'Total Views',
      value: formatNumber(overview?.totalViews || 0),
      icon: Eye,
      color: 'blue',
      trend: trends?.viewsTrend || 0
    },
    {
      id: 'watchTime',
      label: 'Watch Time',
      value: formatDuration(overview?.totalWatchTime * 60 || 0),
      icon: Clock,
      color: 'purple',
      trend: trends?.watchTimeTrend || 0
    },
    {
      id: 'subscribers',
      label: 'Subscribers Gained',
      value: formatNumber(overview?.subscribersGained || 0),
      icon: Users,
      color: 'red',
      trend: trends?.subscribersTrend || 0
    },
    {
      id: 'engagement',
      label: 'Total Engagement',
      value: formatNumber((overview?.totalLikes || 0) + (overview?.totalComments || 0)),
      icon: Activity,
      color: 'green',
      trend: trends?.engagementTrend || 0
    }
  ]

  // Responsive grid based on size and viewMode
  const getGridCols = () => {
    if (viewMode === 'mobile') {
      return 'grid-cols-1 sm:grid-cols-2'
    } else if (viewMode === 'tablet') {
      return size === 'full' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'
    } else {
      // Desktop
      return {
        full: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        half: 'grid-cols-1 md:grid-cols-2',
        quarter: 'grid-cols-1'
      }[size]
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Widget Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Key performance indicators</p>
      </div>

      {/* Metrics Grid */}
      <div className={`grid ${getGridCols()} gap-${viewMode === 'mobile' ? '4' : '6'} p-${viewMode === 'mobile' ? '4' : '6'}`}>
        {metrics.map((metric) => {
          const IconComponent = metric.icon
          const isPositive = metric.trend >= 0
          const TrendIcon = isPositive ? TrendingUp : TrendingDown
          
          return (
            <div
              key={metric.id}
              className={`relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                isEditMode 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:shadow-md'
              }`}
            >
              <div className={`p-${viewMode === 'mobile' ? '3' : '4'}`}>
                {/* Icon and Value */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`${
                    viewMode === 'mobile' ? 'w-10 h-10' : 'w-12 h-12'
                  } rounded-lg flex items-center justify-center bg-${metric.color}-100`}>
                    <IconComponent size={viewMode === 'mobile' ? 20 : 24} className={`text-${metric.color}-600`} />
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-gray-900 ${
                      viewMode === 'mobile' ? 'text-lg' : 'text-2xl'
                    }`}>
                      {metric.value}
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="mb-3">
                  <p className={`font-medium text-gray-600 ${
                    viewMode === 'mobile' ? 'text-xs' : 'text-sm'
                  }`}>{metric.label}</p>
                </div>

                {/* Trend */}
                <div className="flex items-center">
                  <TrendIcon
                    size={viewMode === 'mobile' ? 14 : 16}
                    className={`mr-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
                  />
                  <span className={`${
                    viewMode === 'mobile' ? 'text-xs' : 'text-sm'
                  } ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{metric.trend.toFixed(1)}%
                  </span>
                  <span className={`text-gray-500 ml-1 ${
                    viewMode === 'mobile' ? 'text-xs hidden' : 'text-xs'
                  }`}>vs last period</span>
                </div>
              </div>

              {/* Decorative gradient */}
              <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-${metric.color}-400 to-${metric.color}-600`} />
            </div>
          )
        })}
      </div>

      {/* Widget Footer */}
      {overview?.lastUpdated && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(overview.lastUpdated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

export default MetricsWidget
