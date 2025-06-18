import React, { useState, useMemo, useEffect } from 'react'
import {
  Lightbulb,
  Edit3,
  Video,
  Upload,
  Share2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
  Search,
  Filter,
  Settings,
  Eye,
  Trash2,
  Copy,
  Calendar,
  User,
  Tag,
  Star,
  FileText,
  Camera,
  Scissors,
  Globe,
  TrendingUp,
  Users,
  MessageCircle,
  ThumbsUp,
  Download,
  ChevronDown,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import toast from 'react-hot-toast'

const ContentPipeline = ({ events, onUpdatePipeline, contentStrategy }) => {
  // Initialize with safe default structure to prevent undefined errors
  const [pipelineData, setPipelineData] = useState({
    ideation: [],
    research: [],
    scripting: [],
    production: [],
    editing: [],
    publishing: [],
    promotion: []
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [viewMode, setViewMode] = useState('kanban') // kanban, timeline, list
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showItemDetails, setShowItemDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize with enhanced sample data
  useEffect(() => {
    try {
      setIsLoading(true)

      const enhancedPipelineData = {
      ideation: [
        {
          id: 'idea-1',
          title: 'React Hooks Deep Dive',
          description: 'Comprehensive tutorial covering all React hooks with practical examples',
          priority: 'high',
          estimatedDays: 3,
          assignee: 'John Doe',
          tags: ['react', 'hooks', 'tutorial'],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          contentType: 'tutorial',
          targetAudience: 'Intermediate',
          estimatedViews: 25000,
          series: 'React Mastery',
          notes: 'Include custom hooks examples'
        },
        {
          id: 'idea-2',
          title: 'JavaScript Performance Optimization',
          description: 'Advanced techniques for optimizing JavaScript performance',
          priority: 'medium',
          estimatedDays: 5,
          assignee: 'Jane Smith',
          tags: ['javascript', 'performance', 'optimization'],
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          contentType: 'advanced',
          targetAudience: 'Advanced',
          estimatedViews: 15000,
          series: null,
          notes: 'Include benchmarks and real-world examples'
        },
        {
          id: 'idea-3',
          title: 'CSS Grid Layout Masterclass',
          description: 'Complete guide to CSS Grid with practical projects',
          priority: 'low',
          estimatedDays: 2,
          assignee: 'Mike Johnson',
          tags: ['css', 'grid', 'layout'],
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          contentType: 'masterclass',
          targetAudience: 'Intermediate',
          estimatedViews: 20000,
          series: 'CSS Mastery',
          notes: 'Include responsive design examples'
        }
      ],
      research: [
        {
          id: 'research-1',
          title: 'Node.js Best Practices 2024',
          description: 'Research latest Node.js best practices and patterns',
          priority: 'high',
          estimatedDays: 2,
          progress: 40,
          assignee: 'Sarah Wilson',
          tags: ['nodejs', 'backend', 'best-practices'],
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          contentType: 'guide',
          targetAudience: 'Intermediate to Advanced',
          estimatedViews: 18000,
          series: 'Backend Development',
          notes: 'Include security considerations'
        }
      ],
      scripting: [
        {
          id: 'script-1',
          title: 'TypeScript for Beginners',
          description: 'Complete beginner guide to TypeScript',
          priority: 'medium',
          estimatedDays: 3,
          progress: 70,
          assignee: 'Alex Brown',
          tags: ['typescript', 'javascript', 'beginner'],
          deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          contentType: 'tutorial',
          targetAudience: 'Beginner',
          estimatedViews: 30000,
          series: 'TypeScript Journey',
          notes: 'Keep it simple and practical',
          attachments: ['script-outline.md', 'code-examples.zip']
        }
      ],
      production: [
        {
          id: 'prod-1',
          title: 'React State Management',
          description: 'Comprehensive guide to React state management patterns',
          priority: 'high',
          estimatedDays: 2,
          progress: 60,
          assignee: 'John Doe',
          tags: ['react', 'state', 'management'],
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          contentType: 'tutorial',
          targetAudience: 'Intermediate',
          estimatedViews: 22000,
          series: 'React Mastery',
          notes: 'Include Redux and Context API',
          attachments: ['script.md', 'demo-app.zip']
        },
        {
          id: 'prod-2',
          title: 'Database Design Principles',
          description: 'Fundamental principles of database design and normalization',
          priority: 'medium',
          estimatedDays: 4,
          progress: 30,
          assignee: 'Jane Smith',
          tags: ['database', 'design', 'sql'],
          deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          contentType: 'educational',
          targetAudience: 'Beginner to Intermediate',
          estimatedViews: 16000,
          series: 'Database Fundamentals',
          notes: 'Include practical examples',
          attachments: ['script.md']
        }
      ],
      editing: [
        {
          id: 'edit-1',
          title: 'Web Accessibility Guide',
          description: 'Complete guide to making websites accessible',
          priority: 'high',
          estimatedDays: 1,
          progress: 80,
          assignee: 'Mike Johnson',
          tags: ['accessibility', 'a11y', 'web'],
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          contentType: 'guide',
          targetAudience: 'All levels',
          estimatedViews: 12000,
          series: null,
          notes: 'Include screen reader demo',
          attachments: ['raw-footage.mp4', 'script.md', 'accessibility-checklist.pdf']
        }
      ],
      publishing: [
        {
          id: 'pub-1',
          title: 'Web Performance Optimization',
          description: 'Techniques for optimizing web application performance',
          scheduledDate: '2024-01-15',
          status: 'scheduled',
          priority: 'medium',
          assignee: 'Sarah Wilson',
          tags: ['performance', 'optimization', 'web'],
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          contentType: 'tutorial',
          targetAudience: 'Intermediate',
          estimatedViews: 19000,
          series: 'Web Performance',
          notes: 'Include before/after metrics',
          attachments: ['final-video.mp4', 'thumbnail.png', 'description.md']
        }
      ],
      promotion: [
        {
          id: 'promo-1',
          title: 'Docker for Beginners',
          description: 'Complete beginner guide to Docker containerization',
          publishedDate: '2024-01-10',
          views: 15420,
          status: 'promoting',
          priority: 'high',
          assignee: 'Alex Brown',
          tags: ['docker', 'containers', 'devops'],
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          contentType: 'tutorial',
          targetAudience: 'Beginner',
          actualViews: 15420,
          likes: 892,
          comments: 156,
          series: 'DevOps Basics',
          notes: 'Promote on social media',
          promotionChannels: ['Twitter', 'LinkedIn', 'Reddit']
        }
      ]
    }

    setPipelineData(enhancedPipelineData)
    setIsLoading(false)

    } catch (error) {
      console.error('Error initializing pipeline data:', error)
      setIsLoading(false)
      // Keep the safe default structure if initialization fails
    }
  }, [])

  const stages = [
    {
      id: 'ideation',
      title: 'Ideation',
      icon: Lightbulb,
      color: 'yellow',
      description: 'Brainstorming and concept development',
      maxItems: null,
      avgDuration: 1
    },
    {
      id: 'research',
      title: 'Research',
      icon: Search,
      color: 'cyan',
      description: 'Content research and fact-checking',
      maxItems: 8,
      avgDuration: 2
    },
    {
      id: 'scripting',
      title: 'Scripting',
      icon: FileText,
      color: 'indigo',
      description: 'Writing scripts and outlines',
      maxItems: 6,
      avgDuration: 3
    },
    {
      id: 'production',
      title: 'Production',
      icon: Camera,
      color: 'blue',
      description: 'Recording and filming',
      maxItems: 4,
      avgDuration: 2
    },
    {
      id: 'editing',
      title: 'Editing',
      icon: Scissors,
      color: 'purple',
      description: 'Video editing and post-production',
      maxItems: 3,
      avgDuration: 4
    },
    {
      id: 'publishing',
      title: 'Publishing',
      icon: Upload,
      color: 'green',
      description: 'Upload, scheduling, and optimization',
      maxItems: 8,
      avgDuration: 1
    },
    {
      id: 'promotion',
      title: 'Promotion',
      icon: Share2,
      color: 'orange',
      description: 'Marketing, engagement, and analytics',
      maxItems: null,
      avgDuration: 7
    }
  ]

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    const sourceStage = pipelineData[source.droppableId]
    const destStage = pipelineData[destination.droppableId]
    const item = sourceStage.find(item => item.id === draggableId)

    // Remove from source
    const newSourceItems = sourceStage.filter(item => item.id !== draggableId)
    
    // Add to destination
    const newDestItems = Array.from(destStage)
    newDestItems.splice(destination.index, 0, item)

    setPipelineData(prev => ({
      ...prev,
      [source.droppableId]: newSourceItems,
      [destination.droppableId]: newDestItems
    }))

    toast(`Moved "${item.title}" to ${stages.find(s => s.id === destination.droppableId)?.title}`, {
      icon: '✅',
      duration: 3000,
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '1px solid #bbf7d0'
      }
    })
  }

  const EnhancedPipelineCard = ({ item, index, stageId }) => {
    const [showDetails, setShowDetails] = useState(false)

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200'
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'low': return 'bg-green-100 text-green-800 border-green-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const getStatusIcon = () => {
      if (item.status === 'scheduled') return <Clock size={14} className="text-blue-500" />
      if (item.status === 'promoting') return <Share2 size={14} className="text-orange-500" />
      if (item.progress === 100) return <CheckCircle size={14} className="text-green-500" />
      if (item.progress > 0) return <BarChart3 size={14} className="text-blue-500" />
      return <AlertCircle size={14} className="text-gray-400" />
    }

    const getDaysUntilDeadline = () => {
      if (!item.deadline) return null
      const days = Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      return days
    }

    const daysLeft = getDaysUntilDeadline()
    const isOverdue = daysLeft !== null && daysLeft < 0
    const isUrgent = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0

    return (
      <Draggable draggableId={item.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white rounded-xl border-2 p-4 mb-3 shadow-sm hover:shadow-lg transition-all duration-200 group ${
              snapshot.isDragging ? 'rotate-2 shadow-xl scale-105' : ''
            } ${
              isOverdue ? 'border-red-300 bg-red-50' :
              isUrgent ? 'border-yellow-300 bg-yellow-50' :
              'border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{item.title}</h4>
                {item.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-1 ml-2">
                {getStatusIcon()}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedItem(item)
                    setShowItemDetails(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"
                >
                  <Eye size={12} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Priority and Tags */}
            <div className="flex items-center justify-between mb-3">
              {item.priority && (
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
              )}

              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  {item.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {item.progress !== undefined && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.progress >= 80 ? 'bg-green-500' :
                      item.progress >= 50 ? 'bg-blue-500' :
                      item.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-1">
              {item.assignee && (
                <div className="text-xs text-gray-600 flex items-center">
                  <User size={12} className="mr-1" />
                  {item.assignee}
                </div>
              )}

              {item.estimatedDays && (
                <div className="text-xs text-gray-600 flex items-center">
                  <Clock size={12} className="mr-1" />
                  {item.estimatedDays} days estimated
                </div>
              )}

              {daysLeft !== null && (
                <div className={`text-xs flex items-center ${
                  isOverdue ? 'text-red-600' :
                  isUrgent ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  <Calendar size={12} className="mr-1" />
                  {isOverdue ? `${Math.abs(daysLeft)} days overdue` :
                   daysLeft === 0 ? 'Due today' :
                   `${daysLeft} days left`}
                </div>
              )}

              {item.scheduledDate && (
                <div className="text-xs text-blue-600 flex items-center">
                  <Upload size={12} className="mr-1" />
                  Scheduled: {new Date(item.scheduledDate).toLocaleDateString()}
                </div>
              )}

              {item.views && (
                <div className="text-xs text-green-600 flex items-center">
                  <Eye size={12} className="mr-1" />
                  {item.views.toLocaleString()} views
                </div>
              )}

              {item.estimatedViews && !item.views && (
                <div className="text-xs text-gray-500 flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  {item.estimatedViews.toLocaleString()} est. views
                </div>
              )}
            </div>

            {/* Series Badge */}
            {item.series && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  📺 {item.series}
                </span>
              </div>
            )}
          </div>
        )}
      </Draggable>
    )
  }

  const EnhancedPipelineStage = ({ stage, items = [] }) => {
    const IconComponent = stage.icon
    const safeItems = Array.isArray(items) ? items : []
    const isOverCapacity = stage.maxItems && safeItems.length > stage.maxItems

    const getStageColor = () => {
      switch (stage.color) {
        case 'yellow': return 'bg-yellow-50 border-yellow-200'
        case 'cyan': return 'bg-cyan-50 border-cyan-200'
        case 'indigo': return 'bg-indigo-50 border-indigo-200'
        case 'blue': return 'bg-blue-50 border-blue-200'
        case 'purple': return 'bg-purple-50 border-purple-200'
        case 'green': return 'bg-green-50 border-green-200'
        case 'orange': return 'bg-orange-50 border-orange-200'
        default: return 'bg-gray-50 border-gray-200'
      }
    }

    const getIconColor = () => {
      switch (stage.color) {
        case 'yellow': return 'text-yellow-600'
        case 'cyan': return 'text-cyan-600'
        case 'indigo': return 'text-indigo-600'
        case 'blue': return 'text-blue-600'
        case 'purple': return 'text-purple-600'
        case 'green': return 'text-green-600'
        case 'orange': return 'text-orange-600'
        default: return 'text-gray-600'
      }
    }

    return (
      <div className={`rounded-xl border-2 border-dashed ${getStageColor()} p-4 min-h-[500px] ${
        isOverCapacity ? 'border-red-300 bg-red-50' : ''
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <IconComponent size={20} className={getIconColor()} />
            <div>
              <h3 className="font-semibold text-gray-900">{stage.title}</h3>
              <p className="text-xs text-gray-600">{stage.description}</p>
              {stage.avgDuration && (
                <p className="text-xs text-gray-500">~{stage.avgDuration} days avg</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${
              isOverCapacity ? 'bg-red-100 text-red-800' : 'bg-white text-gray-600'
            }`}>
              {safeItems.length}{stage.maxItems ? `/${stage.maxItems}` : ''}
            </span>
            <button
              onClick={() => {
                setShowCreateModal(true)
                toast(`Adding new item to ${stage.title}`, {
                  icon: '➕',
                  duration: 3000,
                  style: {
                    background: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0'
                  }
                })
              }}
              className="p-1 hover:bg-white rounded-lg transition-colors"
              disabled={isOverCapacity}
            >
              <Plus size={14} className={isOverCapacity ? 'text-red-400' : 'text-gray-400'} />
            </button>
          </div>
        </div>

        {isOverCapacity && (
          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={14} className="text-red-600" />
              <span className="text-xs text-red-700">Over capacity! Consider moving items forward.</span>
            </div>
          </div>
        )}

        <Droppable droppableId={stage.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[350px] ${snapshot.isDraggingOver ? 'bg-white bg-opacity-50 rounded-lg border-2 border-dashed border-purple-300' : ''}`}
            >
              {safeItems.map((item, index) => (
                <EnhancedPipelineCard key={item?.id || `item-${index}`} item={item} index={index} stageId={stage.id} />
              ))}
              {provided.placeholder}

              {safeItems.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <IconComponent size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No items in {stage.title.toLowerCase()}</p>
                  <p className="text-xs mt-1">Drag items here or click + to add</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    )
  }

  // Calculate pipeline metrics with comprehensive safety checks
  const metrics = useMemo(() => {
    try {
      if (!pipelineData || typeof pipelineData !== 'object') {
        return { totalItems: 0, completedItems: 0, inProgress: 0, avgProgress: 0 }
      }

      const safeGetArray = (key) => Array.isArray(pipelineData[key]) ? pipelineData[key] : []

      const totalItems = Object.values(pipelineData)
        .filter(Array.isArray)
        .flat()
        .length

      const completedItems = safeGetArray('promotion').length
      const productionItems = safeGetArray('production')
      const editingItems = safeGetArray('editing')
      const inProgress = productionItems.length + editingItems.length

      const progressItems = [...productionItems, ...editingItems]
      const avgProgress = progressItems.length > 0
        ? progressItems.reduce((sum, item) => sum + (item?.progress || 0), 0) / progressItems.length
        : 0

      return { totalItems, completedItems, inProgress, avgProgress: Math.round(avgProgress) }
    } catch (error) {
      console.error('Error calculating pipeline metrics:', error)
      return { totalItems: 0, completedItems: 0, inProgress: 0, avgProgress: 0 }
    }
  }, [pipelineData])

  // Get unique assignees for filter with safety checks
  const assignees = useMemo(() => {
    try {
      if (!pipelineData || typeof pipelineData !== 'object') return []

      const allAssignees = Object.values(pipelineData)
        .filter(Array.isArray)
        .flat()
        .map(item => item?.assignee)
        .filter(Boolean)

      return [...new Set(allAssignees)]
    } catch (error) {
      console.warn('Error getting assignees:', error)
      return []
    }
  }, [pipelineData])

  // Filter pipeline items with safety checks
  const filteredPipelineData = useMemo(() => {
    try {
      if (!pipelineData || typeof pipelineData !== 'object') {
        return {}
      }

      const filtered = {}

      Object.keys(pipelineData).forEach(stageId => {
        const stageItems = pipelineData[stageId]

        if (!Array.isArray(stageItems)) {
          filtered[stageId] = []
          return
        }

        filtered[stageId] = stageItems.filter(item => {
          if (!item || typeof item !== 'object') return false

          // Search filter
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase()
            const titleMatch = item.title?.toLowerCase().includes(searchLower)
            const descMatch = item.description?.toLowerCase().includes(searchLower)
            const tagMatch = item.tags?.some(tag => tag?.toLowerCase().includes(searchLower))

            if (!titleMatch && !descMatch && !tagMatch) {
              return false
            }
          }

          // Priority filter
          if (filterPriority !== 'all' && item.priority !== filterPriority) {
            return false
          }

          // Assignee filter
          if (filterAssignee !== 'all' && item.assignee !== filterAssignee) {
            return false
          }

          return true
        })
      })

      return filtered
    } catch (error) {
      console.error('Error filtering pipeline data:', error)
      return {}
    }
  }, [pipelineData, searchQuery, filterPriority, filterAssignee])

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pipeline data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="text-purple-500" />
            Content Pipeline
          </h2>
          <p className="text-gray-600 mt-1">Track your content from idea to promotion with visual workflow management</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => toast('Analytics dashboard coming soon!', {
              icon: '📊',
              duration: 3000,
              style: {
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #dbeafe'
              }
            })}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus size={16} />
            <span>Add Content</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64"
              />
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Assignees</option>
              {assignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'kanban' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'timeline' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalItems}</p>
            </div>
            <Target className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.inProgress}</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.completedItems}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.avgProgress.toFixed(0)}%</p>
            </div>
            <Zap className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {stages.map(stage => (
              <EnhancedPipelineStage key={stage.id} stage={stage} items={filteredPipelineData[stage.id] || []} />
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline View</h3>
            <p className="text-gray-600 mb-4">Visual timeline of your content pipeline coming soon!</p>
            <button
              onClick={() => setViewMode('kanban')}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Back to Kanban
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="space-y-4">
            {(() => {
              try {
                const allItems = Object.values(filteredPipelineData)
                  .filter(Array.isArray)
                  .flat()
                  .filter(item => item && typeof item === 'object')

                return allItems.length > 0 ? (
                  allItems
                    .sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 }
                      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
                    })
                    .map((item, index) => (
                      <div key={item.id || `item-${index}`} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{item.title || 'Untitled'}</h3>
                              <p className="text-sm text-gray-600">{item.description || 'No description'}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Stage: {stages.find(s => s.id === item.stage)?.title || 'Unknown'}</span>
                                <span>Priority: {item.priority || 'None'}</span>
                                <span>Assignee: {item.assignee || 'Unassigned'}</span>
                                {item.progress !== undefined && <span>Progress: {item.progress}%</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedItem(item)
                                setShowItemDetails(true)
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(item)
                                setShowCreateModal(true)
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit3 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <Search size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                  </div>
                )
              } catch (error) {
                console.error('Error rendering list view:', error)
                return (
                  <div className="text-center py-12">
                    <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading pipeline data</h3>
                    <p className="text-gray-600">Please refresh the page or try again</p>
                  </div>
                )
              }
            })()}
          </div>
        </div>
      )}

      {/* Pipeline Flow Indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Content Flow</h3>
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const stageItems = Array.isArray(pipelineData[stage.id]) ? pipelineData[stage.id] : []
            const hasItems = stageItems.length > 0

            return (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    hasItems ? `bg-${stage.color}-100` : 'bg-gray-100'
                  }`}>
                    <stage.icon size={20} className={
                      hasItems ? `text-${stage.color}-600` : 'text-gray-400'
                    } />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{stage.title}</span>
                  <span className="text-xs font-medium text-gray-900">{stageItems.length}</span>
                </div>
                {index < stages.length - 1 && (
                  <ArrowRight size={20} className="text-gray-300" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ContentPipeline
