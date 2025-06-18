import React, { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Flag,
  Trash2,
  MessageSquare,
  Bot,
  Settings,
  Zap,
  Filter,
  Target,
  Clock,
  Users,
  TrendingUp,
  Brain,
  Lock,
  Unlock,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  Upload
} from 'lucide-react'

const ModerationTools = ({ comments = [], onModerationAction, onRuleUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [moderationRules, setModerationRules] = useState([])
  const [autoModerationEnabled, setAutoModerationEnabled] = useState(true)
  const [selectedComments, setSelectedComments] = useState(new Set())
  const [moderationQueue, setModerationQueue] = useState([])

  // AI-powered spam detection patterns
  const spamPatterns = [
    {
      id: 'excessive-caps',
      name: 'Excessive Capitals',
      pattern: /[A-Z]{5,}/g,
      severity: 'medium',
      description: 'Comments with excessive capital letters'
    },
    {
      id: 'repeated-chars',
      name: 'Repeated Characters',
      pattern: /(.)\1{4,}/g,
      severity: 'low',
      description: 'Comments with repeated characters'
    },
    {
      id: 'multiple-exclamation',
      name: 'Multiple Exclamation',
      pattern: /!{3,}/g,
      severity: 'medium',
      description: 'Comments with excessive exclamation marks'
    },
    {
      id: 'promotional-keywords',
      name: 'Promotional Content',
      pattern: /(subscribe|check out|my channel|link in bio|follow me)/gi,
      severity: 'high',
      description: 'Comments containing promotional keywords'
    },
    {
      id: 'external-links',
      name: 'External Links',
      pattern: /(https?:\/\/|www\.|\.com|\.net|\.org)/gi,
      severity: 'high',
      description: 'Comments containing external links'
    },
    {
      id: 'emoji-spam',
      name: 'Emoji Spam',
      pattern: /(🔥|💰|💎|🚀|⭐){3,}/g,
      severity: 'medium',
      description: 'Comments with excessive emojis'
    }
  ]

  // Default moderation rules
  const defaultRules = [
    {
      id: 'auto-flag-spam',
      name: 'Auto-flag Spam',
      description: 'Automatically flag comments detected as spam',
      enabled: true,
      action: 'flag',
      conditions: ['promotional-keywords', 'external-links'],
      severity: 'high'
    },
    {
      id: 'auto-hide-offensive',
      name: 'Auto-hide Offensive',
      description: 'Automatically hide comments with offensive language',
      enabled: true,
      action: 'hide',
      conditions: ['offensive-language'],
      severity: 'high'
    },
    {
      id: 'review-suspicious',
      name: 'Review Suspicious',
      description: 'Queue suspicious comments for manual review',
      enabled: true,
      action: 'queue',
      conditions: ['excessive-caps', 'repeated-chars', 'emoji-spam'],
      severity: 'medium'
    }
  ]

  useEffect(() => {
    setModerationRules(defaultRules)
  }, [])

  // AI spam detection function
  const detectSpam = (comment) => {
    const detectedPatterns = []
    let spamScore = 0

    spamPatterns.forEach(pattern => {
      const matches = comment.text.match(pattern.pattern)
      if (matches) {
        detectedPatterns.push({
          ...pattern,
          matches: matches.length
        })
        
        // Calculate spam score
        const severityWeight = {
          low: 1,
          medium: 2,
          high: 3
        }
        spamScore += matches.length * severityWeight[pattern.severity]
      }
    })

    return {
      isSpam: spamScore >= 5,
      spamScore,
      detectedPatterns,
      confidence: Math.min(spamScore / 10, 1)
    }
  }

  // Analyze all comments for moderation
  const moderationAnalysis = useMemo(() => {
    const analysis = comments.map(comment => ({
      ...comment,
      moderation: detectSpam(comment)
    }))

    const stats = {
      total: comments.length,
      spam: analysis.filter(c => c.moderation.isSpam).length,
      flagged: analysis.filter(c => c.isFlagged).length,
      hidden: analysis.filter(c => c.isHidden).length,
      pending: analysis.filter(c => c.moderation.spamScore >= 3 && c.moderation.spamScore < 5).length
    }

    return { analysis, stats }
  }, [comments])

  const ModerationCard = ({ title, value, subtitle, icon: Icon, color = 'blue', onClick }) => (
    <div 
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow ${
        onClick ? 'hover:border-gray-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
    </div>
  )

  const SpamDetectionResult = ({ comment }) => {
    const { moderation } = comment
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-900">{comment.author}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                moderation.isSpam 
                  ? 'bg-red-100 text-red-800' 
                  : moderation.spamScore >= 3 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}>
                {moderation.isSpam ? 'Spam' : moderation.spamScore >= 3 ? 'Suspicious' : 'Clean'}
              </span>
              <span className="text-xs text-gray-500">
                Score: {moderation.spamScore} | Confidence: {Math.round(moderation.confidence * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
            
            {moderation.detectedPatterns.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {moderation.detectedPatterns.map(pattern => (
                  <span 
                    key={pattern.id}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800"
                  >
                    {pattern.name} ({pattern.matches})
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 ml-4">
            <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <CheckCircle size={16} />
            </button>
            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <XCircle size={16} />
            </button>
            <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
              <Flag size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ModerationRule = ({ rule, onToggle, onEdit }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => onToggle(rule.id)}
              className={`w-10 h-6 rounded-full transition-colors ${
                rule.enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                rule.enabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
            <h3 className="font-medium text-gray-900">{rule.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              rule.severity === 'high' ? 'bg-red-100 text-red-800' :
              rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {rule.severity}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Action: <span className="font-medium">{rule.action}</span></span>
            <span>•</span>
            <span>Conditions: {rule.conditions.length}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(rule)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Shield className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Moderation Tools</h2>
            <p className="text-gray-600">AI-powered comment moderation and management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Auto-moderation</span>
            <button
              onClick={() => setAutoModerationEnabled(!autoModerationEnabled)}
              className={`w-10 h-6 rounded-full transition-colors ${
                autoModerationEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                autoModerationEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={16} />
            Export Rules
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Shield },
            { id: 'detection', name: 'Spam Detection', icon: Bot },
            { id: 'rules', name: 'Auto Rules', icon: Settings },
            { id: 'queue', name: 'Review Queue', icon: Clock }
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModerationCard
              title="Total Comments"
              value={moderationAnalysis.stats.total}
              subtitle="All comments"
              icon={MessageSquare}
              color="blue"
            />
            <ModerationCard
              title="Spam Detected"
              value={moderationAnalysis.stats.spam}
              subtitle="Auto-flagged"
              icon={AlertTriangle}
              color="red"
            />
            <ModerationCard
              title="Pending Review"
              value={moderationAnalysis.stats.pending}
              subtitle="Needs attention"
              icon={Clock}
              color="yellow"
            />
            <ModerationCard
              title="Hidden Comments"
              value={moderationAnalysis.stats.hidden}
              subtitle="Moderated"
              icon={EyeOff}
              color="gray"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Bot className="text-blue-600" size={20} />
                <div className="text-left">
                  <div className="font-medium">Run Spam Detection</div>
                  <div className="text-sm text-gray-600">Scan all comments</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Trash2 className="text-red-600" size={20} />
                <div className="text-left">
                  <div className="font-medium">Bulk Delete Spam</div>
                  <div className="text-sm text-gray-600">Remove flagged comments</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <CheckCircle className="text-green-600" size={20} />
                <div className="text-left">
                  <div className="font-medium">Approve Pending</div>
                  <div className="text-sm text-gray-600">Approve queued comments</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spam Detection Tab */}
      {activeTab === 'detection' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Spam Detection Results</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Brain size={16} />
                Re-analyze All
              </button>
            </div>

            <div className="space-y-4">
              {moderationAnalysis.analysis
                .filter(comment => comment.moderation.spamScore > 0)
                .sort((a, b) => b.moderation.spamScore - a.moderation.spamScore)
                .slice(0, 10)
                .map(comment => (
                  <SpamDetectionResult key={comment.id} comment={comment} />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Auto Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Moderation Rules</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Settings size={16} />
              Add New Rule
            </button>
          </div>

          <div className="space-y-4">
            {moderationRules.map(rule => (
              <ModerationRule
                key={rule.id}
                rule={rule}
                onToggle={(ruleId) => {
                  setModerationRules(prev => prev.map(r =>
                    r.id === ruleId ? { ...r, enabled: !r.enabled } : r
                  ))
                }}
                onEdit={(rule) => {
                  console.log('Edit rule:', rule)
                }}
              />
            ))}
          </div>

          {/* Rule Templates */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Rule Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Strict Spam Filter</h5>
                <p className="text-sm text-gray-600 mb-3">Aggressive spam detection with auto-deletion</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">Apply Template</button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Family-Friendly Mode</h5>
                <p className="text-sm text-gray-600 mb-3">Hide inappropriate content automatically</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">Apply Template</button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Business Channel</h5>
                <p className="text-sm text-gray-600 mb-3">Professional moderation for business content</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">Apply Template</button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Gaming Community</h5>
                <p className="text-sm text-gray-600 mb-3">Optimized for gaming channel discussions</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">Apply Template</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Review Queue</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <CheckCircle size={16} />
                Approve All
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <XCircle size={16} />
                Reject All
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="space-y-4">
              {moderationAnalysis.analysis
                .filter(comment => comment.moderation.spamScore >= 3 && comment.moderation.spamScore < 5)
                .map(comment => (
                  <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">{comment.timestamp}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Needs Review
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                        <div className="text-xs text-gray-500">
                          Spam Score: {comment.moderation.spamScore} |
                          Patterns: {comment.moderation.detectedPatterns.map(p => p.name).join(', ')}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                          Approve
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                          Reject
                        </button>
                        <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors">
                          Flag
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {moderationAnalysis.analysis.filter(c => c.moderation.spamScore >= 3 && c.moderation.spamScore < 5).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h4>
                  <p className="text-gray-600">No comments pending review at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModerationTools
