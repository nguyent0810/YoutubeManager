// Date and time utilities
export const formatDate = (dateString, format = 'short') => {
  const date = new Date(dateString)
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    case 'long':
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      })
    case 'relative':
      return getRelativeTime(date)
    default:
      return date.toLocaleDateString()
  }
}

export const getRelativeTime = (date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

export const getDateRange = (range) => {
  const today = new Date()
  const startDate = new Date()
  
  switch (range) {
    case '7':
      startDate.setDate(today.getDate() - 7)
      break
    case '30':
      startDate.setDate(today.getDate() - 30)
      break
    case '90':
      startDate.setDate(today.getDate() - 90)
      break
    case '365':
      startDate.setFullYear(today.getFullYear() - 1)
      break
    default:
      startDate.setDate(today.getDate() - 30)
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    youtubeFormat: `${range}daysAgo`
  }
}

// Number formatting utilities
export const formatNumber = (num, precision = 1) => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  
  const absNum = Math.abs(num)
  
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(precision) + 'B'
  }
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(precision) + 'M'
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(precision) + 'K'
  }
  
  return num.toLocaleString()
}

export const formatPercentage = (value, precision = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%'
  return `${value.toFixed(precision)}%`
}

export const formatDuration = (seconds, format = 'auto') => {
  if (!seconds || isNaN(seconds)) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  switch (format) {
    case 'full':
      if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
      if (minutes > 0) return `${minutes}m ${secs}s`
      return `${secs}s`
    case 'compact':
      if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    case 'auto':
    default:
      if (hours > 0) return `${hours}h ${minutes}m`
      if (minutes > 0) return `${minutes}m ${secs}s`
      return `${secs}s`
  }
}

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Analytics calculation utilities
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

export const calculateEngagementRate = (likes, dislikes, comments, shares, views) => {
  if (!views || views === 0) return 0
  const totalEngagements = (likes || 0) + (dislikes || 0) + (comments || 0) + (shares || 0)
  return (totalEngagements / views) * 100
}

export const calculateRetentionRate = (averageViewDuration, videoDuration) => {
  if (!videoDuration || videoDuration === 0) return 0
  return (averageViewDuration / videoDuration) * 100
}

export const calculateCTR = (clicks, impressions) => {
  if (!impressions || impressions === 0) return 0
  return (clicks / impressions) * 100
}

// Data processing utilities
export const aggregateDataByPeriod = (data, period = 'day') => {
  if (!data || !Array.isArray(data)) return []
  
  const grouped = data.reduce((acc, item) => {
    let key
    const date = new Date(item.date)
    
    switch (period) {
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        break
      case 'day':
      default:
        key = item.date
    }
    
    if (!acc[key]) {
      acc[key] = { date: key, views: 0, watchTime: 0, likes: 0, comments: 0 }
    }
    
    acc[key].views += item.views || 0
    acc[key].watchTime += item.watchTime || 0
    acc[key].likes += item.likes || 0
    acc[key].comments += item.comments || 0
    
    return acc
  }, {})
  
  return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date))
}

export const calculateMovingAverage = (data, windowSize = 7) => {
  if (!data || data.length < windowSize) return data
  
  return data.map((item, index) => {
    if (index < windowSize - 1) return item
    
    const window = data.slice(index - windowSize + 1, index + 1)
    const average = window.reduce((sum, d) => sum + (d.views || 0), 0) / windowSize
    
    return {
      ...item,
      movingAverage: Math.round(average)
    }
  })
}

export const findTrends = (data, metric = 'views') => {
  if (!data || data.length < 2) return { trend: 'stable', change: 0 }
  
  const recent = data.slice(-7) // Last 7 data points
  const previous = data.slice(-14, -7) // Previous 7 data points
  
  if (recent.length === 0 || previous.length === 0) {
    return { trend: 'stable', change: 0 }
  }
  
  const recentAvg = recent.reduce((sum, d) => sum + (d[metric] || 0), 0) / recent.length
  const previousAvg = previous.reduce((sum, d) => sum + (d[metric] || 0), 0) / previous.length
  
  const change = calculatePercentageChange(recentAvg, previousAvg)
  
  let trend = 'stable'
  if (change > 5) trend = 'up'
  else if (change < -5) trend = 'down'
  
  return { trend, change: Math.abs(change) }
}

// Color utilities for charts
export const getMetricColor = (metric) => {
  const colors = {
    views: '#FF0000', // YouTube red
    watchTime: '#8884d8',
    likes: '#00C851',
    comments: '#ffbb33',
    subscribers: '#ff4444',
    revenue: '#00C851',
    impressions: '#33b5e5',
    ctr: '#AA66CC'
  }
  return colors[metric] || '#8884d8'
}

export const getTrendColor = (trend) => {
  switch (trend) {
    case 'up': return '#00C851'
    case 'down': return '#ff4444'
    case 'stable': return '#ffbb33'
    default: return '#8884d8'
  }
}

// Performance benchmarks
export const getPerformanceBenchmark = (metric, value, channelSize = 'medium') => {
  const benchmarks = {
    small: { // < 10K subscribers
      engagementRate: { excellent: 10, good: 5, average: 2 },
      retentionRate: { excellent: 60, good: 40, average: 25 },
      ctr: { excellent: 8, good: 5, average: 3 }
    },
    medium: { // 10K - 100K subscribers
      engagementRate: { excellent: 8, good: 4, average: 2 },
      retentionRate: { excellent: 55, good: 35, average: 20 },
      ctr: { excellent: 6, good: 4, average: 2.5 }
    },
    large: { // > 100K subscribers
      engagementRate: { excellent: 6, good: 3, average: 1.5 },
      retentionRate: { excellent: 50, good: 30, average: 18 },
      ctr: { excellent: 5, good: 3, average: 2 }
    }
  }
  
  const benchmark = benchmarks[channelSize]?.[metric]
  if (!benchmark) return 'unknown'
  
  if (value >= benchmark.excellent) return 'excellent'
  if (value >= benchmark.good) return 'good'
  if (value >= benchmark.average) return 'average'
  return 'below-average'
}

// Export utilities
export const prepareDataForExport = (data, format = 'csv') => {
  if (!data || !Array.isArray(data)) return ''
  
  switch (format) {
    case 'csv':
      const headers = Object.keys(data[0] || {}).join(',')
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
      return [headers, ...rows].join('\n')
    
    case 'json':
      return JSON.stringify(data, null, 2)
    
    default:
      return JSON.stringify(data)
  }
}
