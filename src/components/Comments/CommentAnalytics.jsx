import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Heart,
  Clock,
  Users,
  AlertTriangle,
  Star,
  Calendar,
  Activity,
  Target,
  Zap,
  Eye,
  ThumbsUp,
  Reply,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

const CommentAnalytics = ({ comments = [], timeRange = '7d', selectedVideo = null }) => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Calculate analytics data from comments
  const analyticsData = useMemo(() => {
    if (!comments || comments.length === 0) {
      return {
        overview: {
          totalComments: 0,
          avgResponseTime: 0,
          engagementRate: 0,
          sentimentScore: 0
        },
        sentiment: {
          positive: 0,
          negative: 0,
          neutral: 0,
          spam: 0,
          questions: 0
        },
        engagement: {
          totalLikes: 0,
          avgLikesPerComment: 0,
          totalReplies: 0,
          replyRate: 0
        },
        timeData: [],
        topCommenters: [],
        videoPerformance: []
      }
    }

    // Overview metrics
    const totalComments = comments.length
    const totalLikes = comments.reduce((sum, comment) => sum + (comment.likes || 0), 0)
    const totalReplies = comments.reduce((sum, comment) => sum + (comment.replies?.length || 0), 0)
    const repliedComments = comments.filter(comment => comment.replies?.length > 0).length

    // Sentiment analysis
    const sentimentCounts = comments.reduce((acc, comment) => {
      acc[comment.sentiment] = (acc[comment.sentiment] || 0) + 1
      return acc
    }, {})

    // Time-based data (last 7 days)
    const timeData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayComments = comments.filter(comment => {
        const commentDate = new Date(comment.publishedAt).toISOString().split('T')[0]
        return commentDate === dateStr
      })

      timeData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        comments: dayComments.length,
        likes: dayComments.reduce((sum, c) => sum + (c.likes || 0), 0),
        replies: dayComments.reduce((sum, c) => sum + (c.replies?.length || 0), 0)
      })
    }

    // Top commenters
    const commenterStats = comments.reduce((acc, comment) => {
      if (!acc[comment.author]) {
        acc[comment.author] = {
          name: comment.author,
          comments: 0,
          likes: 0,
          avgSentiment: []
        }
      }
      acc[comment.author].comments++
      acc[comment.author].likes += comment.likes || 0
      acc[comment.author].avgSentiment.push(comment.sentiment)
      return acc
    }, {})

    const topCommenters = Object.values(commenterStats)
      .sort((a, b) => b.comments - a.comments)
      .slice(0, 10)
      .map(commenter => ({
        ...commenter,
        avgLikes: Math.round(commenter.likes / commenter.comments),
        dominantSentiment: commenter.avgSentiment.reduce((a, b, i, arr) => 
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        )
      }))

    return {
      overview: {
        totalComments,
        avgResponseTime: 2.5, // hours - would be calculated from real data
        engagementRate: totalComments > 0 ? Math.round((totalLikes / totalComments) * 100) / 100 : 0,
        sentimentScore: sentimentCounts.positive ? Math.round((sentimentCounts.positive / totalComments) * 100) : 0
      },
      sentiment: {
        positive: sentimentCounts.positive || 0,
        negative: sentimentCounts.negative || 0,
        neutral: sentimentCounts.neutral || 0,
        spam: sentimentCounts.spam || 0,
        questions: sentimentCounts.question || 0
      },
      engagement: {
        totalLikes,
        avgLikesPerComment: totalComments > 0 ? Math.round((totalLikes / totalComments) * 10) / 10 : 0,
        totalReplies,
        replyRate: totalComments > 0 ? Math.round((repliedComments / totalComments) * 100) : 0
      },
      timeData,
      topCommenters,
      videoPerformance: [] // Would be populated with multi-video data
    }
  }, [comments])

  const sentimentColors = {
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280',
    spam: '#F59E0B',
    questions: '#3B82F6'
  }

  const sentimentData = Object.entries(analyticsData.sentiment).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: sentimentColors[key]
  }))

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comment Analytics</h2>
          <p className="text-gray-600 mt-1">
            Insights and performance metrics for your comment engagement
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select className="input-field w-auto">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <Download size={16} />
            Export
          </button>
          
          <button 
            onClick={() => setLoading(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'sentiment', name: 'Sentiment', icon: Heart },
            { id: 'engagement', name: 'Engagement', icon: TrendingUp },
            { id: 'commenters', name: 'Top Commenters', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-youtube-red text-youtube-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Comments"
              value={analyticsData.overview.totalComments.toLocaleString()}
              change={12}
              icon={MessageSquare}
              color="blue"
            />
            <MetricCard
              title="Avg Response Time"
              value={`${analyticsData.overview.avgResponseTime}h`}
              change={-8}
              icon={Clock}
              color="green"
            />
            <MetricCard
              title="Engagement Rate"
              value={`${analyticsData.overview.engagementRate}`}
              change={15}
              icon={Heart}
              color="red"
            />
            <MetricCard
              title="Sentiment Score"
              value={`${analyticsData.overview.sentimentScore}%`}
              change={5}
              icon={Star}
              color="yellow"
            />
          </div>

          {/* Time-based Chart */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comment Activity Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="comments" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="likes" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="replies" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sentiment Tab */}
      {activeTab === 'sentiment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Distribution Pie Chart */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Sentiment Breakdown */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Breakdown</h3>
              <div className="space-y-4">
                {sentimentData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{item.value}</div>
                      <div className="text-sm text-gray-500">
                        {analyticsData.overview.totalComments > 0
                          ? Math.round((item.value / analyticsData.overview.totalComments) * 100)
                          : 0
                        }%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sentiment Trends */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="comments" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Likes"
              value={analyticsData.engagement.totalLikes.toLocaleString()}
              change={18}
              icon={ThumbsUp}
              color="green"
            />
            <MetricCard
              title="Avg Likes/Comment"
              value={analyticsData.engagement.avgLikesPerComment}
              change={-3}
              icon={Heart}
              color="red"
            />
            <MetricCard
              title="Reply Rate"
              value={`${analyticsData.engagement.replyRate}%`}
              change={7}
              icon={Reply}
              color="blue"
            />
          </div>

          {/* Engagement Chart */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="likes" fill="#10B981" />
                <Bar dataKey="replies" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Commenters Tab */}
      {activeTab === 'commenters' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Commenters</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commenter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Likes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Likes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.topCommenters.map((commenter, index) => (
                    <tr key={commenter.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-600">
                              {commenter.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{commenter.name}</div>
                            <div className="text-sm text-gray-500">#{index + 1}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commenter.comments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commenter.likes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commenter.avgLikes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          commenter.dominantSentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          commenter.dominantSentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          commenter.dominantSentiment === 'spam' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {commenter.dominantSentiment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentAnalytics
