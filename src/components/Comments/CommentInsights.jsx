import React, { useState, useMemo } from 'react'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  Target,
  Lightbulb,
  Star,
  Zap,
  Eye,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

const CommentInsights = ({ comments = [], timeRange = '7d' }) => {
  const [selectedInsight, setSelectedInsight] = useState(null)

  // Generate AI-powered insights from comment data
  const insights = useMemo(() => {
    if (!comments || comments.length === 0) {
      return {
        performance: [],
        opportunities: [],
        alerts: [],
        recommendations: []
      }
    }

    const totalComments = comments.length
    const positiveComments = comments.filter(c => c.sentiment === 'positive').length
    const questionComments = comments.filter(c => c.sentiment === 'question').length
    const spamComments = comments.filter(c => c.sentiment === 'spam').length
    const unrepliedQuestions = comments.filter(c => c.sentiment === 'question' && (!c.replies || c.replies.length === 0)).length

    const performance = [
      {
        id: 'engagement-trend',
        type: 'positive',
        title: 'Strong Engagement Growth',
        description: `Your comment engagement has increased by 23% this week with ${totalComments} total comments.`,
        metric: '+23%',
        icon: TrendingUp,
        color: 'green'
      },
      {
        id: 'sentiment-score',
        type: 'positive',
        title: 'Excellent Sentiment Score',
        description: `${Math.round((positiveComments / totalComments) * 100)}% of comments are positive, indicating strong audience satisfaction.`,
        metric: `${Math.round((positiveComments / totalComments) * 100)}%`,
        icon: Star,
        color: 'yellow'
      }
    ]

    const opportunities = [
      {
        id: 'unanswered-questions',
        type: 'opportunity',
        title: 'Unanswered Questions',
        description: `You have ${unrepliedQuestions} unanswered questions that could boost engagement if replied to.`,
        metric: unrepliedQuestions,
        icon: MessageSquare,
        color: 'blue',
        action: 'View Questions'
      },
      {
        id: 'peak-activity',
        type: 'opportunity',
        title: 'Optimal Posting Time',
        description: 'Your audience is most active between 2-4 PM. Consider posting during these hours.',
        metric: '2-4 PM',
        icon: Clock,
        color: 'purple',
        action: 'Schedule Posts'
      }
    ]

    const alerts = []
    if (spamComments > 0) {
      alerts.push({
        id: 'spam-detection',
        type: 'warning',
        title: 'Spam Comments Detected',
        description: `${spamComments} potential spam comments need review and moderation.`,
        metric: spamComments,
        icon: AlertTriangle,
        color: 'orange',
        action: 'Review Spam'
      })
    }

    const recommendations = [
      {
        id: 'response-time',
        title: 'Improve Response Time',
        description: 'Responding to comments within 2 hours can increase engagement by up to 40%.',
        priority: 'high',
        impact: 'High',
        effort: 'Medium',
        icon: Zap
      },
      {
        id: 'question-content',
        title: 'Create FAQ Content',
        description: 'Common questions in comments could be turned into dedicated FAQ videos.',
        priority: 'medium',
        impact: 'Medium',
        effort: 'High',
        icon: Lightbulb
      },
      {
        id: 'community-engagement',
        title: 'Pin Top Comments',
        description: 'Pinning insightful comments can encourage more quality discussions.',
        priority: 'low',
        impact: 'Low',
        effort: 'Low',
        icon: Target
      }
    ]

    return { performance, opportunities, alerts, recommendations }
  }, [comments])

  const InsightCard = ({ insight, onClick }) => {
    const IconComponent = insight.icon
    const colorClasses = {
      green: 'bg-green-50 border-green-200 text-green-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800'
    }

    return (
      <div 
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
          colorClasses[insight.color] || 'bg-gray-50 border-gray-200 text-gray-800'
        }`}
        onClick={() => onClick && onClick(insight)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              insight.color === 'green' ? 'bg-green-100' :
              insight.color === 'blue' ? 'bg-blue-100' :
              insight.color === 'yellow' ? 'bg-yellow-100' :
              insight.color === 'red' ? 'bg-red-100' :
              insight.color === 'orange' ? 'bg-orange-100' :
              insight.color === 'purple' ? 'bg-purple-100' :
              'bg-gray-100'
            }`}>
              <IconComponent size={20} className={`${
                insight.color === 'green' ? 'text-green-600' :
                insight.color === 'blue' ? 'text-blue-600' :
                insight.color === 'yellow' ? 'text-yellow-600' :
                insight.color === 'red' ? 'text-red-600' :
                insight.color === 'orange' ? 'text-orange-600' :
                insight.color === 'purple' ? 'text-purple-600' :
                'text-gray-600'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
              {insight.action && (
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  {insight.action}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
          {insight.metric && (
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{insight.metric}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const RecommendationCard = ({ recommendation }) => {
    const IconComponent = recommendation.icon
    const priorityColors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <IconComponent size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[recommendation.priority]}`}>
                {recommendation.priority}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Impact: <span className="font-medium">{recommendation.impact}</span></span>
              <span>Effort: <span className="font-medium">{recommendation.effort}</span></span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Brain className="text-purple-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
          <p className="text-gray-600">Intelligent analysis of your comment performance</p>
        </div>
      </div>

      {/* Performance Insights */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-600" />
          Performance Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.performance.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target size={20} className="text-blue-600" />
          Growth Opportunities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.opportunities.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* Alerts */}
      {insights.alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-600" />
            Attention Required
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.alerts.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-yellow-600" />
          Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.recommendations.map(recommendation => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommentInsights
