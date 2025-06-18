import React, { useState, useMemo } from 'react'
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  Timer,
  Zap,
  Users,
  MessageSquare
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const ResponseTimeTracker = ({ comments = [], timeRange = '7d' }) => {
  const [selectedMetric, setSelectedMetric] = useState('average')

  // Calculate response time metrics
  const responseMetrics = useMemo(() => {
    if (!comments || comments.length === 0) {
      return {
        averageResponseTime: 0,
        medianResponseTime: 0,
        responseRate: 0,
        totalReplies: 0,
        fastResponses: 0,
        slowResponses: 0,
        timeDistribution: [],
        dailyMetrics: [],
        responseGoals: {
          target: 2, // hours
          achieved: 0,
          percentage: 0
        }
      }
    }

    // Calculate response times for comments with replies
    const repliedComments = comments.filter(comment => 
      comment.replies && comment.replies.length > 0
    )

    const responseTimes = repliedComments.map(comment => {
      const commentTime = new Date(comment.publishedAt)
      const firstReplyTime = new Date(comment.replies[0].publishedAt)
      const responseTimeHours = (firstReplyTime - commentTime) / (1000 * 60 * 60)
      return Math.max(0, responseTimeHours) // Ensure non-negative
    })

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0

    const sortedTimes = [...responseTimes].sort((a, b) => a - b)
    const medianResponseTime = sortedTimes.length > 0
      ? sortedTimes.length % 2 === 0
        ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
        : sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0

    const responseRate = comments.length > 0 
      ? (repliedComments.length / comments.length) * 100 
      : 0

    const fastResponses = responseTimes.filter(time => time <= 2).length // Within 2 hours
    const slowResponses = responseTimes.filter(time => time > 24).length // Over 24 hours

    // Time distribution buckets
    const timeDistribution = [
      { name: '< 1h', value: responseTimes.filter(t => t < 1).length, color: '#10B981' },
      { name: '1-2h', value: responseTimes.filter(t => t >= 1 && t < 2).length, color: '#3B82F6' },
      { name: '2-6h', value: responseTimes.filter(t => t >= 2 && t < 6).length, color: '#F59E0B' },
      { name: '6-24h', value: responseTimes.filter(t => t >= 6 && t < 24).length, color: '#EF4444' },
      { name: '> 24h', value: responseTimes.filter(t => t >= 24).length, color: '#6B7280' }
    ]

    // Daily metrics for the last 7 days
    const dailyMetrics = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayComments = comments.filter(comment => {
        const commentDate = new Date(comment.publishedAt).toISOString().split('T')[0]
        return commentDate === dateStr
      })

      const dayRepliedComments = dayComments.filter(c => c.replies && c.replies.length > 0)
      const dayResponseTimes = dayRepliedComments.map(comment => {
        const commentTime = new Date(comment.publishedAt)
        const firstReplyTime = new Date(comment.replies[0].publishedAt)
        return Math.max(0, (firstReplyTime - commentTime) / (1000 * 60 * 60))
      })

      const avgResponseTime = dayResponseTimes.length > 0
        ? dayResponseTimes.reduce((sum, time) => sum + time, 0) / dayResponseTimes.length
        : 0

      dailyMetrics.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        totalComments: dayComments.length,
        repliedComments: dayRepliedComments.length,
        responseRate: dayComments.length > 0 ? Math.round((dayRepliedComments.length / dayComments.length) * 100) : 0
      })
    }

    // Response goals
    const targetResponseTime = 2 // hours
    const achievedGoal = responseTimes.filter(time => time <= targetResponseTime).length
    const goalPercentage = responseTimes.length > 0 
      ? Math.round((achievedGoal / responseTimes.length) * 100) 
      : 0

    return {
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      medianResponseTime: Math.round(medianResponseTime * 10) / 10,
      responseRate: Math.round(responseRate),
      totalReplies: repliedComments.length,
      fastResponses,
      slowResponses,
      timeDistribution,
      dailyMetrics,
      responseGoals: {
        target: targetResponseTime,
        achieved: achievedGoal,
        percentage: goalPercentage
      }
    }
  }, [comments])

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
    </div>
  )

  const GoalProgress = ({ current, target, label }) => {
    const percentage = Math.min((current / target) * 100, 100)
    const isAchieved = current >= target

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          {isAchieved ? (
            <CheckCircle className="text-green-600" size={24} />
          ) : (
            <Target className="text-gray-400" size={24} />
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(percentage)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                isAchieved ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Current: {current}</span>
            <span>Target: {target}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Clock className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Response Time Analytics</h2>
          <p className="text-gray-600">Track and optimize your comment response performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Average Response Time"
          value={`${responseMetrics.averageResponseTime}h`}
          subtitle="Across all replies"
          icon={Clock}
          color="blue"
          trend={-12}
        />
        <MetricCard
          title="Response Rate"
          value={`${responseMetrics.responseRate}%`}
          subtitle="Comments replied to"
          icon={MessageSquare}
          color="green"
          trend={8}
        />
        <MetricCard
          title="Fast Responses"
          value={responseMetrics.fastResponses}
          subtitle="Within 2 hours"
          icon={Zap}
          color="yellow"
          trend={15}
        />
        <MetricCard
          title="Goal Achievement"
          value={`${responseMetrics.responseGoals.percentage}%`}
          subtitle="Under 2 hours"
          icon={Target}
          color="purple"
          trend={5}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Distribution */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={responseMetrics.timeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {responseMetrics.timeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Response Trends */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Response Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={responseMetrics.dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgResponseTime" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Avg Response Time (h)"
              />
              <Line 
                type="monotone" 
                dataKey="responseRate" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Response Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goals and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GoalProgress
          current={responseMetrics.responseGoals.achieved}
          target={Math.max(responseMetrics.totalReplies, 10)}
          label="Response Goal Progress"
        />
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Median Response Time</span>
              <span className="font-medium">{responseMetrics.medianResponseTime}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Replies</span>
              <span className="font-medium">{responseMetrics.totalReplies}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slow Responses (&gt;24h)</span>
              <span className="font-medium text-red-600">{responseMetrics.slowResponses}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Zap className="text-yellow-500 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium">Set Response Alerts</p>
                <p className="text-xs text-gray-600">Get notified of new comments</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Timer className="text-blue-500 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium">Schedule Reply Time</p>
                <p className="text-xs text-gray-600">Dedicate specific hours for replies</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Award className="text-green-500 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium">Use Quick Templates</p>
                <p className="text-xs text-gray-600">Speed up common responses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponseTimeTracker
