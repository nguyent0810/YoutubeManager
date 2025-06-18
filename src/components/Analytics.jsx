import React, { useState, useEffect, useMemo } from 'react'
import {
  Download,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Save
} from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import { formatDate } from '../utils/analytics-helpers'
import toast from 'react-hot-toast'

// Import our widget components
import WidgetContainer from './Analytics/WidgetContainer'
import MetricsWidget from './Analytics/MetricsWidget'
import ChartsWidget from './Analytics/ChartsWidget'
import VideoPerformanceWidget from './Analytics/VideoPerformanceWidget'
import AIInsightsWidget from './Analytics/AIInsightsWidget'
import AdvancedChartsWidget from './Analytics/AdvancedChartsWidget'
import RealtimeWidget from './Analytics/RealtimeWidget'
import PredictiveWidget from './Analytics/PredictiveWidget'
import FilteringWidget from './Analytics/FilteringWidget'
import ExportWidget from './Analytics/ExportWidget'
import ThemeWidget from './Analytics/ThemeWidget'
import CreatorToolsWidget from './Analytics/CreatorToolsWidget'
import { filteringService } from '../services/filtering-service'
import { useTheme } from '../contexts/ThemeContext'

const Analytics = () => {
  const { activeAccount } = useAuth()
  const { theme, changeTheme, themes } = useTheme()
  const [timeRange, setTimeRange] = useState('30')
  const [dashboardLayout, setDashboardLayout] = useState('default')

  // Use our analytics hook
  const {
    overview,
    videoPerformance,
    trends,
    loading,
    errors,
    refreshData,
    formatNumber: formatNum,
    formatDuration: formatDur
  } = useAnalytics(`${timeRange}daysAgo`)

  // Filtering state
  const [currentFilters, setCurrentFilters] = useState({
    dateRange: 'last30days',
    contentType: 'all',
    performanceTier: 'all',
    audienceSegment: 'all',
    customFilters: {}
  })

  // Default widget configuration
  const [widgets, setWidgets] = useState([
    {
      id: 'filters',
      title: 'Advanced Filters',
      component: 'FilteringWidget',
      visible: true,
      size: 'full',
      order: 0
    },
    {
      id: 'metrics',
      title: 'Key Metrics',
      component: 'MetricsWidget',
      visible: true,
      size: 'full',
      order: 1
    },
    {
      id: 'theme',
      title: 'Theme Settings',
      component: 'ThemeWidget',
      visible: true,
      size: 'full',
      order: 2
    },
    {
      id: 'export',
      title: 'Export & Reports',
      component: 'ExportWidget',
      visible: true,
      size: 'full',
      order: 3
    },
    {
      id: 'creator-tools',
      title: 'Creator Tools',
      component: 'CreatorToolsWidget',
      visible: true,
      size: 'full',
      order: 4
    },
    {
      id: 'realtime',
      title: 'Live Analytics',
      component: 'RealtimeWidget',
      visible: true,
      size: 'full',
      order: 5
    },
    {
      id: 'predictive',
      title: 'Predictive Analytics',
      component: 'PredictiveWidget',
      visible: true,
      size: 'full',
      order: 6
    },

    {
      id: 'ai-insights',
      title: 'AI-Powered Insights',
      component: 'AIInsightsWidget',
      visible: true,
      size: 'full',
      order: 7
    },
    {
      id: 'charts',
      title: 'Performance Charts',
      component: 'ChartsWidget',
      visible: true,
      size: 'full',
      order: 8
    },
    {
      id: 'advanced-charts',
      title: 'Advanced Analytics',
      component: 'AdvancedChartsWidget',
      visible: true,
      size: 'full',
      order: 9
    },
    {
      id: 'videos',
      title: 'Top Performing Videos',
      component: 'VideoPerformanceWidget',
      visible: true,
      size: 'full',
      order: 10
    }
  ])

  // Load saved layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem(`analytics-layout-${activeAccount?.channelId}`)
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout)
        setWidgets(parsed.widgets || widgets)
        setDashboardLayout(parsed.layout || 'default')
      } catch (error) {
        console.error('Failed to load saved layout:', error)
      }
    }
  }, [activeAccount])

  // Save layout to localStorage
  const saveLayout = () => {
    if (!activeAccount) return

    const layoutData = {
      widgets,
      layout: dashboardLayout,
      lastSaved: new Date().toISOString()
    }

    localStorage.setItem(`analytics-layout-${activeAccount.channelId}`, JSON.stringify(layoutData))
    toast.success('Dashboard layout saved!')
  }

  // Handle widget reordering
  const handleLayoutChange = (newWidgets) => {
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      order: index
    }))
    setWidgets(updatedWidgets)
  }

  // Handle widget visibility toggle
  const handleWidgetToggle = (widgetId, visible) => {
    setWidgets(prev => prev.map(widget =>
      widget.id === widgetId ? { ...widget, visible } : widget
    ))
  }

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshData()
      toast.success('Analytics data refreshed')
    } catch (error) {
      toast.error('Failed to refresh data')
    }
  }

  // Handle export
  const handleExport = () => {
    if (!overview?.dailyViews) {
      toast.error('No data to export')
      return
    }

    const csvData = overview.dailyViews.map(day => ({
      date: formatDate(day.date),
      views: day.views,
      watchTime: day.watchTime,
      likes: day.likes,
      comments: day.comments
    }))

    const csvContent = [
      'Date,Views,Watch Time (minutes),Likes,Comments',
      ...csvData.map(row => `${row.date},${row.views},${row.watchTime},${row.likes},${row.comments}`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Analytics data exported')
  }

  // Apply filters to analytics data (must be before early returns)
  const filteredData = useMemo(() => {
    if (!overview || !videoPerformance) {
      return { overview, videoPerformance, trends }
    }

    try {
      return filteringService.applyFilters(
        { overview, videoPerformance, trends },
        currentFilters
      )
    } catch (error) {
      console.error('Error applying filters:', error)
      return { overview, videoPerformance, trends }
    }
  }, [overview, videoPerformance, trends, currentFilters])

  // Dashboard layout options
  const layoutOptions = [
    { id: 'default', label: 'Default', description: 'Standard layout with all widgets' },
    { id: 'compact', label: 'Compact', description: 'Condensed view for smaller screens' },
    { id: 'focus', label: 'Focus', description: 'Minimal layout focusing on key metrics' }
  ]

  // Show loading state
  if (loading.overview && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-youtube-red"></div>
        <span className="ml-3 text-gray-600">Loading analytics data...</span>
      </div>
    )
  }

  // Show error state
  if (errors.overview && !overview) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-gray-600 mb-4">{errors.overview}</p>
          <button
            onClick={handleRefresh}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show empty state if no account
  if (!activeAccount) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="max-w-md">
          <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Account Selected</h3>
          <p className="text-gray-600">Please select a YouTube account to view analytics.</p>
        </div>
      </div>
    )
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setCurrentFilters(newFilters)
  }

  // Render widget components
  const renderWidget = (widget, isEditMode = false, viewMode = 'desktop') => {
    const commonProps = {
      overview: filteredData.overview,
      videoPerformance: filteredData.videoPerformance,
      trends: filteredData.trends,
      loading,
      formatNumber: formatNum,
      formatDuration: formatDur,
      title: widget.title,
      size: widget.size,
      isEditMode
    }

    switch (widget.component) {
      case 'FilteringWidget':
        return <FilteringWidget
          onFiltersChange={handleFiltersChange}
          initialFilters={currentFilters}
          isEditMode={isEditMode}
          title={widget.title}
          viewMode={viewMode}
        />
      case 'ThemeWidget':
        return <ThemeWidget
          isEditMode={isEditMode}
          title={widget.title}
          viewMode={viewMode}
        />
      case 'ExportWidget':
        return <ExportWidget
          analyticsData={filteredData}
          currentFilters={currentFilters}
          isEditMode={isEditMode}
          title={widget.title}
          viewMode={viewMode}
        />
      case 'MetricsWidget':
        return <MetricsWidget {...commonProps} viewMode={viewMode} />
      case 'RealtimeWidget':
        return <RealtimeWidget {...commonProps} channelId={activeAccount?.channelId} />
      case 'PredictiveWidget':
        return <PredictiveWidget {...commonProps} viewMode={viewMode} />
      case 'CreatorToolsWidget':
        return <CreatorToolsWidget {...commonProps} viewMode={viewMode} />
      case 'AIInsightsWidget':
        return <AIInsightsWidget {...commonProps} />
      case 'ChartsWidget':
        return <ChartsWidget {...commonProps} />
      case 'AdvancedChartsWidget':
        return <AdvancedChartsWidget {...commonProps} />
      case 'VideoPerformanceWidget':
        return <VideoPerformanceWidget {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <BarChart3 size={32} className="text-blue-600" />
            <span>Analytics</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Customizable performance insights for {activeAccount?.channelName}
            {overview?.lastUpdated && (
              <span className="text-sm text-gray-500 ml-2">
                • Updated {formatDate(overview.lastUpdated, 'relative')}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {themes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => changeTheme(themeOption.id)}
                className={`px-2 py-1 rounded-md text-sm transition-colors ${
                  theme === themeOption.id
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
                title={themeOption.label}
              >
                {themeOption.icon}
              </button>
            ))}
          </div>

          {/* Layout Selector */}
          <select
            value={dashboardLayout}
            onChange={(e) => setDashboardLayout(e.target.value)}
            className="input-field w-auto"
          >
            {layoutOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Time Range */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field w-auto"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          {/* Actions */}
          <button
            onClick={saveLayout}
            className="btn-secondary flex items-center space-x-2"
          >
            <Save size={16} />
            <span>Save Layout</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading.overview}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw size={16} className={loading.overview ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Requirements Message */}
      {(overview?.analyticsNotAvailable || (errors.overview && (errors.overview.includes('403') || errors.overview.includes('400')))) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-900 mb-1">
                📊 YouTube Analytics Not Available
              </h4>
              <p className="text-sm text-amber-800 mb-3">
                YouTube Analytics API requires channels to meet certain criteria.
              </p>
              <div className="text-sm text-amber-800">
                <strong>Requirements:</strong> 1,000+ subscribers • 4,000+ watch hours • Good standing
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Container */}
      <WidgetContainer
        widgets={widgets}
        onLayoutChange={handleLayoutChange}
        onWidgetToggle={handleWidgetToggle}
        renderWidget={(widget, isEditMode) => renderWidget(widget, isEditMode)}
      />
    </div>
  )
}

export default Analytics
