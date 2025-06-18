import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import {
  MessageSquare,
  Heart,
  Reply,
  Flag,
  Star,
  Pin,
  MoreHorizontal,
  Clock,
  User,
  ThumbsUp,
  ThumbsDown,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const VirtualCommentList = ({ 
  comments = [], 
  onCommentAction,
  selectedComments = new Set(),
  onCommentSelect,
  searchTerm = '',
  focusedIndex = 0,
  onFocusChange,
  isAccessibilityMode = false
}) => {
  const listRef = useRef(null)
  const [expandedComments, setExpandedComments] = useState(new Set())
  const [hoveredComment, setHoveredComment] = useState(null)

  // Memoized filtered comments for performance
  const filteredComments = useMemo(() => {
    if (!searchTerm) return comments
    
    return comments.filter(comment => 
      comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [comments, searchTerm])

  // Scroll to focused item when focus changes
  useEffect(() => {
    if (listRef.current && focusedIndex >= 0 && focusedIndex < filteredComments.length) {
      listRef.current.scrollToItem(focusedIndex, 'smart')
    }
  }, [focusedIndex, filteredComments.length])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event, commentIndex) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (onFocusChange && commentIndex > 0) {
          onFocusChange(commentIndex - 1)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (onFocusChange && commentIndex < filteredComments.length - 1) {
          onFocusChange(commentIndex + 1)
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (onCommentSelect) {
          onCommentSelect(filteredComments[commentIndex].id)
        }
        break
      case 'r':
      case 'R':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          onCommentAction?.('reply', filteredComments[commentIndex])
        }
        break
      case 'f':
      case 'F':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          onCommentAction?.('flag', filteredComments[commentIndex])
        }
        break
      case 's':
      case 'S':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          onCommentAction?.('star', filteredComments[commentIndex])
        }
        break
    }
  }, [filteredComments, onFocusChange, onCommentSelect, onCommentAction])

  // Format time ago with better performance
  const formatTimeAgo = useCallback((timestamp) => {
    const now = Date.now()
    const commentTime = new Date(timestamp).getTime()
    const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }, [])

  // Get sentiment styling
  const getSentimentStyling = useCallback((sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'border-l-green-400 bg-green-50'
      case 'negative':
        return 'border-l-red-400 bg-red-50'
      case 'spam':
        return 'border-l-orange-400 bg-orange-50'
      case 'question':
        return 'border-l-blue-400 bg-blue-50'
      default:
        return 'border-l-gray-300 bg-white'
    }
  }, [])

  // Comment item component with optimized rendering
  const CommentItem = React.memo(({ index, style }) => {
    const comment = filteredComments[index]
    if (!comment) return null

    const isSelected = selectedComments.has(comment.id)
    const isFocused = index === focusedIndex
    const isExpanded = expandedComments.has(comment.id)
    const hasReplies = comment.replies && comment.replies.length > 0

    return (
      <div 
        style={style}
        className={`px-4 py-2 ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
        onMouseEnter={() => setHoveredComment(comment.id)}
        onMouseLeave={() => setHoveredComment(null)}
      >
        <div 
          className={`
            border-l-4 rounded-lg p-4 transition-all duration-200
            ${getSentimentStyling(comment.sentiment)}
            ${isSelected ? 'ring-2 ring-blue-400' : ''}
            ${isFocused ? 'shadow-lg' : 'shadow-sm'}
            ${hoveredComment === comment.id ? 'shadow-md' : ''}
          `}
          tabIndex={0}
          role="article"
          aria-label={`Comment by ${comment.author}: ${comment.text.substring(0, 100)}...`}
          aria-selected={isSelected}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onClick={() => onCommentSelect?.(comment.id)}
        >
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <img
                src={comment.authorImage || '/api/placeholder/32/32'}
                alt={`${comment.author}'s profile`}
                className="w-8 h-8 rounded-full"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {comment.author}
                  </h4>
                  {comment.isChannelOwner && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Creator
                    </span>
                  )}
                  {comment.isPinned && (
                    <Pin size={14} className="text-blue-600" aria-label="Pinned comment" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={12} />
                  <time dateTime={comment.publishedAt}>
                    {formatTimeAgo(comment.publishedAt)}
                  </time>
                  {comment.videoTitle && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-32">{comment.videoTitle}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2 ml-4">
              {!comment.isRead && (
                <div 
                  className="w-2 h-2 bg-blue-500 rounded-full" 
                  aria-label="Unread comment"
                />
              )}
              {comment.isFlagged && (
                <Flag size={14} className="text-orange-500" aria-label="Flagged comment" />
              )}
              {comment.isStarred && (
                <Star size={14} className="text-yellow-500" aria-label="Starred comment" />
              )}
              
              {/* Priority Indicator */}
              {comment.priority === 'high' && (
                <div className="w-2 h-2 bg-red-500 rounded-full" aria-label="High priority" />
              )}
            </div>
          </div>

          {/* Comment Content */}
          <div className="mb-3">
            <p className="text-gray-800 whitespace-pre-wrap break-words">
              {comment.text}
            </p>
            
            {/* Tags */}
            {comment.tags && comment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {comment.tags.slice(0, 3).map((tag, tagIndex) => (
                  <span 
                    key={tagIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    #{tag}
                  </span>
                ))}
                {comment.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{comment.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onCommentAction?.('like', comment)
                }}
                aria-label={`Like comment (${comment.likes} likes)`}
              >
                <ThumbsUp size={14} />
                <span className="text-sm">{comment.likes || 0}</span>
              </button>
              
              <button
                className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onCommentAction?.('reply', comment)
                }}
                aria-label="Reply to comment"
              >
                <Reply size={14} />
                <span className="text-sm">Reply</span>
              </button>

              {hasReplies && (
                <button
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedComments(prev => {
                      const newSet = new Set(prev)
                      if (newSet.has(comment.id)) {
                        newSet.delete(comment.id)
                      } else {
                        newSet.add(comment.id)
                      }
                      return newSet
                    })
                  }}
                  aria-label={`${isExpanded ? 'Hide' : 'Show'} ${comment.replies.length} replies`}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span className="text-sm">{comment.replies.length} replies</span>
                </button>
              )}
            </div>

            {/* More Actions */}
            <div className="flex items-center gap-2">
              <button
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  // Show more actions menu
                }}
                aria-label="More actions"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Replies */}
          {isExpanded && hasReplies && (
            <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
              {comment.replies.map((reply, replyIndex) => (
                <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <img
                      src={reply.authorImage || '/api/placeholder/24/24'}
                      alt={`${reply.author}'s profile`}
                      className="w-6 h-6 rounded-full"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {reply.author}
                        </span>
                        {reply.isChannelOwner && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                            Creator
                          </span>
                        )}
                        <time className="text-xs text-gray-500" dateTime={reply.publishedAt}>
                          {formatTimeAgo(reply.publishedAt)}
                        </time>
                      </div>
                      <p className="text-sm text-gray-700">{reply.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  })

  CommentItem.displayName = 'CommentItem'

  // Calculate item height based on content
  const getItemSize = useCallback((index) => {
    const comment = filteredComments[index]
    if (!comment) return 120

    let baseHeight = 120 // Base height for comment
    
    // Add height for long text
    const textLines = Math.ceil(comment.text.length / 80)
    baseHeight += Math.max(0, (textLines - 2) * 20)
    
    // Add height for tags
    if (comment.tags && comment.tags.length > 0) {
      baseHeight += 30
    }
    
    // Add height for expanded replies
    if (expandedComments.has(comment.id) && comment.replies) {
      baseHeight += comment.replies.length * 80
    }
    
    return Math.min(baseHeight, 400) // Cap at 400px
  }, [filteredComments, expandedComments])

  if (filteredComments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No comments found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full" role="region" aria-label="Comments list">
      <List
        ref={listRef}
        height={600} // This should be dynamic based on container
        itemCount={filteredComments.length}
        itemSize={getItemSize}
        overscanCount={5} // Render 5 extra items for smooth scrolling
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {CommentItem}
      </List>
      
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {filteredComments.length} comments loaded. 
        {focusedIndex >= 0 && `Currently focused on comment ${focusedIndex + 1} of ${filteredComments.length}.`}
      </div>
    </div>
  )
}

export default VirtualCommentList
