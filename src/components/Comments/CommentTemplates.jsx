import React, { useState, useEffect } from 'react'
import {
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Star,
  Clock,
  Tag,
  Search,
  Filter,
  Save,
  X,
  Check,
  Zap,
  Heart,
  ThumbsUp,
  HelpCircle,
  AlertTriangle,
  Gift,
  Bookmark,
  Send
} from 'lucide-react'

const CommentTemplates = ({ onTemplateSelect, onTemplateCreate, onTemplateUpdate }) => {
  const [templates, setTemplates] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'general',
    tags: [],
    isDefault: false
  })

  // Default template categories
  const categories = [
    { id: 'all', name: 'All Templates', icon: MessageSquare },
    { id: 'general', name: 'General', icon: MessageSquare },
    { id: 'thanks', name: 'Thank You', icon: Heart },
    { id: 'questions', name: 'Q&A', icon: HelpCircle },
    { id: 'promotion', name: 'Promotion', icon: Gift },
    { id: 'moderation', name: 'Moderation', icon: AlertTriangle },
    { id: 'engagement', name: 'Engagement', icon: ThumbsUp }
  ]

  // Default templates
  const defaultTemplates = [
    {
      id: 'thanks-1',
      name: 'Thank You - General',
      content: 'Thank you so much for watching and for your kind comment! 😊 It really means a lot to me.',
      category: 'thanks',
      tags: ['appreciation', 'general'],
      isDefault: true,
      usageCount: 45,
      lastUsed: '2 days ago'
    },
    {
      id: 'thanks-2',
      name: 'Thank You - Detailed',
      content: 'Thank you for taking the time to watch and comment! Your support helps me create more content like this. 🙏',
      category: 'thanks',
      tags: ['appreciation', 'detailed'],
      isDefault: true,
      usageCount: 32,
      lastUsed: '1 day ago'
    },
    {
      id: 'question-1',
      name: 'Question Response',
      content: 'Great question! Let me explain: [ANSWER]. Hope this helps! Feel free to ask if you need more clarification.',
      category: 'questions',
      tags: ['helpful', 'educational'],
      isDefault: true,
      usageCount: 28,
      lastUsed: '3 hours ago'
    },
    {
      id: 'promotion-1',
      name: 'Subscribe Reminder',
      content: 'Glad you enjoyed the video! If you found this helpful, consider subscribing for more content like this. 🔔',
      category: 'promotion',
      tags: ['subscribe', 'growth'],
      isDefault: true,
      usageCount: 67,
      lastUsed: '5 hours ago'
    },
    {
      id: 'moderation-1',
      name: 'Community Guidelines',
      content: 'Please keep comments respectful and on-topic. Comments that violate our community guidelines will be removed.',
      category: 'moderation',
      tags: ['guidelines', 'warning'],
      isDefault: true,
      usageCount: 12,
      lastUsed: '1 week ago'
    },
    {
      id: 'engagement-1',
      name: 'Discussion Starter',
      content: 'What do you think about this topic? I\'d love to hear your thoughts and experiences in the comments below! 💭',
      category: 'engagement',
      tags: ['discussion', 'community'],
      isDefault: true,
      usageCount: 23,
      lastUsed: '2 days ago'
    },
    {
      id: 'general-1',
      name: 'Welcome New Subscriber',
      content: 'Welcome to the channel! Thanks for subscribing. You\'ll find lots of helpful content here. Enjoy! 🎉',
      category: 'general',
      tags: ['welcome', 'new-subscriber'],
      isDefault: true,
      usageCount: 19,
      lastUsed: '1 day ago'
    },
    {
      id: 'general-2',
      name: 'Pin Comment',
      content: '📌 Pinned: Thanks everyone for the amazing response! Keep the discussion going in the comments.',
      category: 'general',
      tags: ['pinned', 'announcement'],
      isDefault: true,
      usageCount: 8,
      lastUsed: '3 days ago'
    }
  ]

  useEffect(() => {
    setTemplates(defaultTemplates)
  }, [])

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleCreateTemplate = () => {
    if (newTemplate.name && newTemplate.content) {
      const template = {
        ...newTemplate,
        id: Date.now().toString(),
        isDefault: false,
        usageCount: 0,
        lastUsed: 'Never'
      }
      
      setTemplates(prev => [...prev, template])
      setNewTemplate({ name: '', content: '', category: 'general', tags: [], isDefault: false })
      setIsCreating(false)
      
      if (onTemplateCreate) {
        onTemplateCreate(template)
      }
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setNewTemplate({
      name: template.name,
      content: template.content,
      category: template.category,
      tags: template.tags,
      isDefault: template.isDefault
    })
  }

  const handleUpdateTemplate = () => {
    if (editingTemplate && newTemplate.name && newTemplate.content) {
      const updatedTemplate = {
        ...editingTemplate,
        ...newTemplate
      }
      
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id ? updatedTemplate : t
      ))
      
      setEditingTemplate(null)
      setNewTemplate({ name: '', content: '', category: 'general', tags: [], isDefault: false })
      
      if (onTemplateUpdate) {
        onTemplateUpdate(updatedTemplate)
      }
    }
  }

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId))
    }
  }

  const handleUseTemplate = (template) => {
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: 'Just now' }
        : t
    ))
    
    if (onTemplateSelect) {
      onTemplateSelect(template)
    }
  }

  const TemplateCard = ({ template }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-gray-900">{template.name}</h3>
            {template.isDefault && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.content}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Used {template.usageCount} times</span>
            <span>•</span>
            <span>Last used {template.lastUsed}</span>
          </div>
          
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-1 ml-4">
          <button
            onClick={() => handleUseTemplate(template)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Use Template"
          >
            <Send size={16} />
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(template.content)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Copy to Clipboard"
          >
            <Copy size={16} />
          </button>
          {!template.isDefault && (
            <>
              <button
                onClick={() => handleEditTemplate(template)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Edit Template"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => handleDeleteTemplate(template.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Template"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comment Templates</h2>
            <p className="text-gray-600">Quick reply templates for efficient comment management</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <category.icon size={16} />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* Create/Edit Template Modal */}
      {(isCreating || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setEditingTemplate(null)
                    setNewTemplate({ name: '', content: '', category: 'general', tags: [], isDefault: false })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="Enter template name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    className="input-field"
                    rows={4}
                    placeholder="Enter template content..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use [PLACEHOLDER] for dynamic content that you'll fill in when using the template.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="input-field"
                  >
                    {categories.filter(c => c.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTemplate.tags.join(', ')}
                    onChange={(e) => setNewTemplate(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    }))}
                    className="input-field"
                    placeholder="helpful, question, engagement..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setEditingTemplate(null)
                    setNewTemplate({ name: '', content: '', category: 'general', tags: [], isDefault: false })
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentTemplates
