import React, { useState, useEffect } from 'react'
import { 
  Filter, 
  Calendar, 
  Video, 
  TrendingUp, 
  Users, 
  X,
  ChevronDown,
  Search,
  RotateCcw,
  Check
} from 'lucide-react'
import { filteringService } from '../../services/filtering-service'

const FilteringWidget = ({ 
  onFiltersChange,
  initialFilters = {},
  isEditMode,
  title = "Advanced Filters",
  viewMode = "desktop" 
}) => {
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    contentType: 'all',
    performanceTier: 'all',
    audienceSegment: 'all',
    customFilters: {},
    ...initialFilters
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const filterOptions = filteringService.getFilterOptions()

  // Apply filters when they change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }, [filters, onFiltersChange])

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateCustomFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      customFilters: {
        ...prev.customFilters,
        [key]: value
      }
    }))
  }

  const resetFilters = () => {
    setFilters({
      dateRange: 'last30days',
      contentType: 'all',
      performanceTier: 'all',
      audienceSegment: 'all',
      customFilters: {}
    })
    setCustomDateRange({ startDate: '', endDate: '' })
    setShowAdvanced(false)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.dateRange !== 'last30days') count++
    if (filters.contentType !== 'all') count++
    if (filters.performanceTier !== 'all') count++
    if (filters.audienceSegment !== 'all') count++
    if (Object.keys(filters.customFilters).length > 0) count++
    return count
  }

  const getFilterSummary = () => {
    return filteringService.getFilterSummary(filters)
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Widget Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Filter size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">
                {getActiveFiltersCount()} active filters
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={isEditMode}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
            <button
              onClick={resetFilters}
              disabled={isEditMode}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {getFilterSummary().map((summary, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {summary}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Basic Filters */}
      <div className="p-6 space-y-6">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={16} className="inline mr-2" />
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value)}
              disabled={isEditMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filterOptions.datePresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom Range</option>
            </select>
            
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  disabled={isEditMode}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  disabled={isEditMode}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="End Date"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Video size={16} className="inline mr-2" />
            Content Type
          </label>
          <select
            value={filters.contentType}
            onChange={(e) => updateFilter('contentType', e.target.value)}
            disabled={isEditMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {filterOptions.contentTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Performance Tier Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <TrendingUp size={16} className="inline mr-2" />
            Performance Tier
          </label>
          <select
            value={filters.performanceTier}
            onChange={(e) => updateFilter('performanceTier', e.target.value)}
            disabled={isEditMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {filterOptions.performanceTiers.map(tier => (
              <option key={tier.id} value={tier.id}>
                {tier.label}
              </option>
            ))}
          </select>
        </div>

        {/* Audience Segment Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users size={16} className="inline mr-2" />
            Audience Segment
          </label>
          <select
            value={filters.audienceSegment}
            onChange={(e) => updateFilter('audienceSegment', e.target.value)}
            disabled={isEditMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {filterOptions.audienceSegments.map(segment => (
              <option key={segment.id} value={segment.id}>
                {segment.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <div className="pt-6 space-y-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Advanced Filters</h4>
            
            {/* Views Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Views Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min views"
                  value={filters.customFilters.viewsRange?.min || ''}
                  onChange={(e) => updateCustomFilter('viewsRange', {
                    ...filters.customFilters.viewsRange,
                    min: parseInt(e.target.value) || 0
                  })}
                  disabled={isEditMode}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  placeholder="Max views"
                  value={filters.customFilters.viewsRange?.max || ''}
                  onChange={(e) => updateCustomFilter('viewsRange', {
                    ...filters.customFilters.viewsRange,
                    max: parseInt(e.target.value) || Infinity
                  })}
                  disabled={isEditMode}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Duration Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration Range (seconds)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min duration"
                  value={filters.customFilters.durationRange?.min || ''}
                  onChange={(e) => updateCustomFilter('durationRange', {
                    ...filters.customFilters.durationRange,
                    min: parseInt(e.target.value) || 0
                  })}
                  disabled={isEditMode}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  placeholder="Max duration"
                  value={filters.customFilters.durationRange?.max || ''}
                  onChange={(e) => updateCustomFilter('durationRange', {
                    ...filters.customFilters.durationRange,
                    max: parseInt(e.target.value) || Infinity
                  })}
                  disabled={isEditMode}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Title Keywords Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title Keywords (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g., tutorial, review, tips"
                value={filters.customFilters.titleKeywords || ''}
                onChange={(e) => updateCustomFilter('titleKeywords', e.target.value)}
                disabled={isEditMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Quick Filter Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    updateFilter('contentType', 'shorts')
                    updateFilter('performanceTier', 'top25')
                  }}
                  disabled={isEditMode}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors"
                >
                  Top Shorts
                </button>
                <button
                  onClick={() => {
                    updateFilter('contentType', 'longform')
                    updateFilter('performanceTier', 'top10')
                  }}
                  disabled={isEditMode}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                >
                  Best Long-form
                </button>
                <button
                  onClick={() => {
                    updateFilter('dateRange', 'last7days')
                    updateFilter('contentType', 'recent')
                  }}
                  disabled={isEditMode}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                >
                  Recent Hits
                </button>
                <button
                  onClick={() => {
                    updateFilter('performanceTier', 'bottom25')
                    updateFilter('audienceSegment', 'all')
                  }}
                  disabled={isEditMode}
                  className="px-3 py-2 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200 transition-colors"
                >
                  Needs Improvement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Actions */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Filters applied to all analytics widgets
          </div>
          <div className="flex items-center space-x-2">
            {getActiveFiltersCount() > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Check size={12} className="mr-1" />
                {getActiveFiltersCount()} active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilteringWidget
