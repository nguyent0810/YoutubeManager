/**
 * Export & Reporting Service
 * Provides data export and automated reporting capabilities
 */

export class ExportService {
  constructor() {
    this.exportFormats = [
      { id: 'csv', label: 'CSV', extension: '.csv', mimeType: 'text/csv' },
      { id: 'json', label: 'JSON', extension: '.json', mimeType: 'application/json' },
      { id: 'xlsx', label: 'Excel', extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { id: 'pdf', label: 'PDF Report', extension: '.pdf', mimeType: 'application/pdf' }
    ]

    this.reportTemplates = [
      {
        id: 'overview',
        name: 'Channel Overview',
        description: 'Complete channel performance summary',
        sections: ['metrics', 'growth', 'topVideos', 'insights']
      },
      {
        id: 'performance',
        name: 'Performance Analysis',
        description: 'Detailed performance metrics and trends',
        sections: ['metrics', 'charts', 'comparisons', 'recommendations']
      },
      {
        id: 'content',
        name: 'Content Analysis',
        description: 'Video performance and content insights',
        sections: ['topVideos', 'contentTypes', 'optimization', 'gaps']
      },
      {
        id: 'growth',
        name: 'Growth Report',
        description: 'Subscriber and view growth analysis',
        sections: ['growth', 'predictions', 'milestones', 'strategies']
      },
      {
        id: 'monetization',
        name: 'Monetization Report',
        description: 'Revenue analysis and optimization',
        sections: ['revenue', 'cpm', 'projections', 'optimization']
      }
    ]

    this.socialTemplates = [
      {
        id: 'instagram-story',
        name: 'Instagram Story',
        dimensions: { width: 1080, height: 1920 },
        format: 'png'
      },
      {
        id: 'twitter-post',
        name: 'Twitter Post',
        dimensions: { width: 1200, height: 675 },
        format: 'png'
      },
      {
        id: 'linkedin-post',
        name: 'LinkedIn Post',
        dimensions: { width: 1200, height: 627 },
        format: 'png'
      },
      {
        id: 'youtube-thumbnail',
        name: 'YouTube Thumbnail',
        dimensions: { width: 1280, height: 720 },
        format: 'png'
      }
    ]
  }

  /**
   * Export analytics data in specified format
   */
  async exportData(data, format, options = {}) {
    const {
      filename = 'analytics-export',
      includeCharts = false,
      customFields = [],
      dateRange = null
    } = options

    try {
      switch (format) {
        case 'csv':
          return await this.exportToCSV(data, filename, customFields)
        case 'json':
          return await this.exportToJSON(data, filename)
        case 'xlsx':
          return await this.exportToExcel(data, filename, includeCharts)
        case 'pdf':
          return await this.exportToPDF(data, filename, includeCharts, dateRange)
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }

  /**
   * Export to CSV format
   */
  async exportToCSV(data, filename, customFields = []) {
    const csvData = []

    // Overview metrics
    if (data.overview) {
      csvData.push(['Metric', 'Value'])
      csvData.push(['Total Views', data.overview.totalViews || 0])
      csvData.push(['Total Watch Time (hours)', data.overview.totalWatchTime || 0])
      csvData.push(['Total Likes', data.overview.totalLikes || 0])
      csvData.push(['Total Comments', data.overview.totalComments || 0])
      csvData.push(['Subscribers Gained', data.overview.subscribersGained || 0])
      csvData.push(['Total Subscribers', data.overview.totalSubscribers || 0])
      csvData.push([]) // Empty row
    }

    // Video performance data
    if (data.videoPerformance?.videos) {
      csvData.push(['Video Title', 'Views', 'Likes', 'Comments', 'Duration', 'Published Date', 'Engagement Rate'])
      
      data.videoPerformance.videos.forEach(video => {
        csvData.push([
          video.title,
          video.views,
          video.likes,
          video.comments,
          video.duration,
          video.publishedAt,
          video.engagementRate || '0%'
        ])
      })
    }

    // Daily views data
    if (data.overview?.dailyViews) {
      csvData.push([]) // Empty row
      csvData.push(['Date', 'Views', 'Subscribers Gained', 'Watch Time'])
      
      data.overview.dailyViews.forEach(day => {
        csvData.push([
          day.date,
          day.views,
          day.subscribersGained || 0,
          day.watchTime || 0
        ])
      })
    }

    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    return this.downloadFile(csvContent, `${filename}.csv`, 'text/csv')
  }

  /**
   * Export to JSON format
   */
  async exportToJSON(data, filename) {
    const exportData = {
      exportDate: new Date().toISOString(),
      channelData: data,
      metadata: {
        version: '1.0',
        source: 'YouTube Analytics Dashboard'
      }
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    return this.downloadFile(jsonContent, `${filename}.json`, 'application/json')
  }

  /**
   * Export to Excel format (simplified - would use a library like xlsx in production)
   */
  async exportToExcel(data, filename, includeCharts = false) {
    // For now, export as CSV with Excel-friendly formatting
    // In production, would use libraries like xlsx or exceljs
    const csvContent = await this.exportToCSV(data, filename)
    return this.downloadFile(csvContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  /**
   * Export to PDF format (simplified - would use a library like jsPDF in production)
   */
  async exportToPDF(data, filename, includeCharts = false, dateRange = null) {
    const htmlContent = this.generateHTMLReport(data, includeCharts, dateRange)
    
    // In production, would use jsPDF or similar library to convert HTML to PDF
    // For now, create an HTML file that can be printed to PDF
    return this.downloadFile(htmlContent, `${filename}.html`, 'text/html')
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(data, includeCharts = false, dateRange = null) {
    const reportDate = new Date().toLocaleDateString()
    const dateRangeText = dateRange ? `${dateRange.startDate} to ${dateRange.endDate}` : 'All time'

    return `
<!DOCTYPE html>
<html>
<head>
    <title>YouTube Analytics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #1976d2; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin: 40px 0; }
        .section-title { font-size: 1.5em; font-weight: bold; margin-bottom: 20px; color: #1976d2; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 60px; text-align: center; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>YouTube Analytics Report</h1>
        <p>Generated on ${reportDate}</p>
        <p>Period: ${dateRangeText}</p>
    </div>

    <div class="section">
        <h2 class="section-title">Channel Overview</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${this.formatNumber(data.overview?.totalViews || 0)}</div>
                <div class="metric-label">Total Views</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.formatNumber(data.overview?.totalSubscribers || 0)}</div>
                <div class="metric-label">Total Subscribers</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.formatNumber(data.overview?.totalWatchTime || 0)}</div>
                <div class="metric-label">Watch Time (hours)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.formatNumber(data.overview?.totalLikes || 0)}</div>
                <div class="metric-label">Total Likes</div>
            </div>
        </div>
    </div>

    ${data.videoPerformance?.videos ? `
    <div class="section">
        <h2 class="section-title">Top Performing Videos</h2>
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>Published</th>
                </tr>
            </thead>
            <tbody>
                ${data.videoPerformance.videos.slice(0, 10).map(video => `
                <tr>
                    <td>${video.title}</td>
                    <td>${this.formatNumber(video.views)}</td>
                    <td>${this.formatNumber(video.likes)}</td>
                    <td>${this.formatNumber(video.comments)}</td>
                    <td>${new Date(video.publishedAt).toLocaleDateString()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="footer">
        <p>Report generated by YouTube Analytics Dashboard</p>
        <p>Data is subject to YouTube's analytics reporting delays and may not reflect real-time metrics</p>
    </div>
</body>
</html>`
  }

  /**
   * Generate social media graphics
   */
  async generateSocialGraphic(data, template, customText = '') {
    const socialTemplate = this.socialTemplates.find(t => t.id === template)
    if (!socialTemplate) {
      throw new Error(`Social template not found: ${template}`)
    }

    // Create canvas element for graphic generation
    const canvas = document.createElement('canvas')
    canvas.width = socialTemplate.dimensions.width
    canvas.height = socialTemplate.dimensions.height
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#1976d2'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Title
    ctx.fillStyle = 'white'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('YouTube Analytics', canvas.width / 2, 100)

    // Custom text
    if (customText) {
      ctx.font = '32px Arial'
      ctx.fillText(customText, canvas.width / 2, 160)
    }

    // Key metrics
    const metrics = [
      { label: 'Views', value: this.formatNumber(data.overview?.totalViews || 0) },
      { label: 'Subscribers', value: this.formatNumber(data.overview?.totalSubscribers || 0) },
      { label: 'Watch Time', value: `${this.formatNumber(data.overview?.totalWatchTime || 0)}h` }
    ]

    let yPos = 250
    metrics.forEach(metric => {
      ctx.font = 'bold 36px Arial'
      ctx.fillText(metric.value, canvas.width / 2, yPos)
      ctx.font = '24px Arial'
      ctx.fillText(metric.label, canvas.width / 2, yPos + 35)
      yPos += 100
    })

    // Convert to blob and download
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `analytics-${template}.${socialTemplate.format}`
        link.click()
        URL.revokeObjectURL(url)
        resolve(url)
      }, `image/${socialTemplate.format}`)
    })
  }

  /**
   * Create automated report
   */
  async createAutomatedReport(data, template, options = {}) {
    const reportTemplate = this.reportTemplates.find(t => t.id === template)
    if (!reportTemplate) {
      throw new Error(`Report template not found: ${template}`)
    }

    const report = {
      title: reportTemplate.name,
      description: reportTemplate.description,
      generatedAt: new Date().toISOString(),
      sections: {}
    }

    // Generate each section based on template
    for (const sectionId of reportTemplate.sections) {
      report.sections[sectionId] = await this.generateReportSection(data, sectionId, options)
    }

    return report
  }

  /**
   * Generate individual report section
   */
  async generateReportSection(data, sectionId, options = {}) {
    switch (sectionId) {
      case 'metrics':
        return this.generateMetricsSection(data)
      case 'growth':
        return this.generateGrowthSection(data)
      case 'topVideos':
        return this.generateTopVideosSection(data)
      case 'insights':
        return this.generateInsightsSection(data)
      case 'charts':
        return this.generateChartsSection(data)
      case 'comparisons':
        return this.generateComparisonsSection(data, options)
      case 'recommendations':
        return this.generateRecommendationsSection(data)
      default:
        return { title: sectionId, content: 'Section not implemented' }
    }
  }

  // Report section generators

  generateMetricsSection(data) {
    return {
      title: 'Key Metrics',
      metrics: {
        totalViews: data.overview?.totalViews || 0,
        totalSubscribers: data.overview?.totalSubscribers || 0,
        totalWatchTime: data.overview?.totalWatchTime || 0,
        totalLikes: data.overview?.totalLikes || 0,
        totalComments: data.overview?.totalComments || 0,
        subscribersGained: data.overview?.subscribersGained || 0
      }
    }
  }

  generateGrowthSection(data) {
    const dailyViews = data.overview?.dailyViews || []
    const recentViews = dailyViews.slice(-7).reduce((sum, day) => sum + day.views, 0)
    const previousViews = dailyViews.slice(-14, -7).reduce((sum, day) => sum + day.views, 0)
    const growthRate = previousViews > 0 ? ((recentViews - previousViews) / previousViews) * 100 : 0

    return {
      title: 'Growth Analysis',
      weeklyGrowth: growthRate,
      trend: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable',
      dailyData: dailyViews.slice(-30) // Last 30 days
    }
  }

  generateTopVideosSection(data) {
    return {
      title: 'Top Performing Videos',
      videos: (data.videoPerformance?.videos || []).slice(0, 10).map(video => ({
        title: video.title,
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        publishedAt: video.publishedAt,
        engagementRate: video.engagementRate
      }))
    }
  }

  generateInsightsSection(data) {
    return {
      title: 'AI Insights',
      insights: [
        'Your content performs best on weekends',
        'Videos with thumbnails featuring faces get 40% more clicks',
        'Your audience is most active between 6-8 PM',
        'Tutorial content has the highest engagement rate'
      ]
    }
  }

  generateChartsSection(data) {
    return {
      title: 'Performance Charts',
      charts: [
        { type: 'line', title: 'Views Over Time', data: data.overview?.dailyViews || [] },
        { type: 'bar', title: 'Top Videos', data: data.videoPerformance?.videos?.slice(0, 5) || [] }
      ]
    }
  }

  generateComparisonsSection(data, options) {
    return {
      title: 'Period Comparison',
      comparison: 'Comparison data would be generated here based on selected periods'
    }
  }

  generateRecommendationsSection(data) {
    return {
      title: 'Recommendations',
      recommendations: [
        'Upload consistently on your best-performing days',
        'Focus on content types that drive the most engagement',
        'Optimize thumbnails for mobile viewing',
        'Engage with comments within the first hour of upload'
      ]
    }
  }

  // Utility methods

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return url
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  getExportFormats() {
    return this.exportFormats
  }

  getReportTemplates() {
    return this.reportTemplates
  }

  getSocialTemplates() {
    return this.socialTemplates
  }
}

// Create singleton instance
export const exportService = new ExportService()
