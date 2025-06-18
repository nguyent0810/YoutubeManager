import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import toast from 'react-hot-toast'
import {
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  BarChart3,
  Target,
  TrendingUp,
  Eye,
  Clock,
  Video,
  Lightbulb,
  PlayCircle
} from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { youtubeAuth } from '../services/youtube-api'
import { creatorTools } from '../services/creator-tools'
import ContentSchedulingModal from './ContentSchedulingModal'
import ContentSeriesManager from './ContentSeriesManager'
import ContentPipeline from './ContentPipeline'
import ErrorBoundary from './ErrorBoundary'

// Import calendar styles
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

const localizer = momentLocalizer(moment)
const DragAndDropCalendar = withDragAndDrop(Calendar)

const ContentCalendar = () => {
  const { activeAccount } = useAuth()
  const [view, setView] = useState('month')
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mainView, setMainView] = useState('calendar')
  const [showSchedulingModal, setShowSchedulingModal] = useState(false)
  const [selectedDateForScheduling, setSelectedDateForScheduling] = useState(null)
  const [contentStrategy, setContentStrategy] = useState(null)

  // Load calendar data
  useEffect(() => {
    if (activeAccount) {
      loadCalendarData()
    }
  }, [activeAccount])

  const loadCalendarData = async () => {
    if (!activeAccount) return

    try {
      setLoading(true)
      console.log('🔄 Loading real YouTube data for:', activeAccount.channelName)

      // Load real videos and analytics data
      let videosData = { items: [] }
      let analyticsData = null
      let channelData = null

      try {
        // Get real video data from YouTube API
        console.log('📹 Fetching videos from YouTube API...')
        videosData = await youtubeAuth.getVideos(activeAccount, {
          maxResults: 50,
          part: 'snippet,statistics,status,contentDetails'
        })
        console.log('✅ Loaded', videosData.items?.length || 0, 'videos from YouTube API')

        // Get channel analytics for content strategy
        console.log('📊 Fetching channel analytics...')
        channelData = await youtubeAuth.getChannelAnalytics(activeAccount)
        console.log('✅ Loaded channel analytics')

        // Get recent analytics data for insights
        try {
          analyticsData = await youtubeAuth.getAnalyticsData(activeAccount, {
            metrics: 'views,estimatedMinutesWatched,subscribersGained,likes,comments',
            dimensions: 'day',
            startDate: '30daysAgo',
            endDate: 'today'
          })
          console.log('✅ Loaded analytics data')
        } catch (analyticsError) {
          console.warn('⚠️ Analytics data not available:', analyticsError.message)
          // Continue without analytics - not critical for basic functionality
        }

      } catch (error) {
        console.error('❌ Failed to load real YouTube data:', error)

        // Show user-friendly error message
        toast(`Failed to load YouTube data: ${error.message}`, {
          icon: '❌',
          duration: 5000,
          style: {
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca'
          }
        })

        // Use fallback demo data so the app doesn't break
        videosData = {
          items: [
            {
              id: 'demo-1',
              snippet: {
                title: 'Demo Video - Connect your YouTube account for real data',
                publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'This is demo data. Connect your YouTube account to see real videos.',
                thumbnails: { medium: { url: '' } },
                tags: ['demo', 'placeholder']
              },
              status: { privacyStatus: 'public' },
              statistics: { viewCount: '0', likeCount: '0', commentCount: '0' }
            }
          ]
        }
      }

      // Process real videos into calendar events
      const calendarEvents = []

      if (videosData && videosData.items && Array.isArray(videosData.items)) {
        videosData.items.forEach((video, index) => {
          try {
            if (!video || !video.snippet || !video.snippet.title) {
              console.warn(`Skipping invalid video at index ${index}:`, video)
              return
            }

            const publishDate = new Date(video.snippet.publishedAt || new Date())
            const isScheduled = video.status?.privacyStatus === 'private' && video.status?.publishAt
            const isUnlisted = video.status?.privacyStatus === 'unlisted'
            const isPrivate = video.status?.privacyStatus === 'private' && !video.status?.publishAt

            let eventType = 'published'
            let eventDate = publishDate

            if (isScheduled) {
              eventType = 'scheduled'
              eventDate = new Date(video.status.publishAt)
            } else if (isPrivate) {
              eventType = 'draft'
              eventDate = publishDate
            } else if (isUnlisted) {
              eventType = 'unlisted'
              eventDate = publishDate
            }

            // Determine if this is an optimal day based on analytics
            const dayOfWeek = eventDate.getDay()
            const isOptimalDay = analyticsData ?
              analyzeOptimalUploadDays(analyticsData).includes(
                ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
              ) :
              [1, 3, 5].includes(dayOfWeek) // Mon, Wed, Fri as default optimal days

            calendarEvents.push({
              id: video.id || `video-${index}`,
              title: video.snippet.title || 'Untitled Video',
              start: eventDate,
              end: eventDate,
              type: eventType,
              status: video.status?.privacyStatus || 'public',
              views: parseInt(video.statistics?.viewCount || 0),
              likes: parseInt(video.statistics?.likeCount || 0),
              comments: parseInt(video.statistics?.commentCount || 0),
              thumbnail: video.snippet.thumbnails?.medium?.url || '',
              description: video.snippet.description || '',
              tags: video.snippet.tags || [],
              duration: video.contentDetails?.duration || '',
              categoryId: video.snippet.categoryId || '',
              isOptimalDay,
              videoData: video
            })
          } catch (videoError) {
            console.warn(`Error processing video at index ${index}:`, videoError, video)
          }
        })
      }

      // Add AI-powered optimal upload suggestions based on real analytics
      if (analyticsData && analyticsData.rows) {
        const today = new Date()
        const optimalDays = analyzeOptimalUploadDays(analyticsData)

        for (let i = 1; i <= 14; i++) { // Next 2 weeks
          const suggestionDate = new Date(today)
          suggestionDate.setDate(today.getDate() + i)

          const dayOfWeek = suggestionDate.getDay()
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]

          if (optimalDays.includes(dayName)) {
            calendarEvents.push({
              id: `suggestion-${i}`,
              title: `Optimal Upload Day - ${dayName}`,
              start: suggestionDate,
              end: suggestionDate,
              type: 'suggestion',
              dayOfWeek: dayName,
              isOptimal: true,
              confidence: 'high', // Based on real analytics
              reason: 'High engagement on this day historically'
            })
          }
        }
      } else {
        // Fallback suggestions when no analytics available
        const today = new Date()
        for (let i = 1; i <= 7; i++) {
          const suggestionDate = new Date(today)
          suggestionDate.setDate(today.getDate() + i)

          if (suggestionDate.getDay() === 2 || suggestionDate.getDay() === 5) { // Tuesday and Friday
            calendarEvents.push({
              id: `suggestion-${i}`,
              title: 'Suggested Upload Day',
              start: suggestionDate,
              end: suggestionDate,
              type: 'suggestion',
              dayOfWeek: suggestionDate.toLocaleDateString('en-US', { weekday: 'long' }),
              isOptimal: true,
              confidence: 'medium',
              reason: 'General best practice recommendation'
            })
          }
        }
      }

      setEvents(calendarEvents)
      console.log('✅ Processed', calendarEvents.length, 'calendar events')

      // Generate content strategy based on real data
      try {
        const strategy = await creatorTools.generateContentStrategy(activeAccount, {
          videosData,
          analyticsData,
          channelData
        })
        setContentStrategy(strategy)
        console.log('✅ Generated content strategy')
      } catch (strategyError) {
        console.warn('⚠️ Failed to generate content strategy:', strategyError)
        // Continue without strategy - not critical
      }

    } catch (error) {
      console.error('❌ Failed to load calendar data:', error)
      toast('Error loading calendar data', {
        icon: '❌',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  // Analyze optimal upload days from real analytics data
  const analyzeOptimalUploadDays = (analyticsData) => {
    try {
      if (!analyticsData.rows || analyticsData.rows.length === 0) {
        return ['Tuesday', 'Thursday', 'Saturday'] // Default fallback
      }

      // Group data by day of week and calculate average performance
      const dayPerformance = {}

      analyticsData.rows.forEach(row => {
        const date = new Date(row[0]) // First column is date
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
        const views = parseInt(row[1]) || 0 // Second column is views

        if (!dayPerformance[dayName]) {
          dayPerformance[dayName] = { totalViews: 0, count: 0 }
        }

        dayPerformance[dayName].totalViews += views
        dayPerformance[dayName].count += 1
      })

      // Calculate average views per day and sort
      const dayAverages = Object.entries(dayPerformance)
        .map(([day, data]) => ({
          day,
          avgViews: data.totalViews / data.count
        }))
        .sort((a, b) => b.avgViews - a.avgViews)

      // Return top 3 performing days
      return dayAverages.slice(0, 3).map(item => item.day)
    } catch (error) {
      console.warn('Error analyzing optimal days:', error)
      return ['Tuesday', 'Thursday', 'Saturday'] // Fallback
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await loadCalendarData()
      setRefreshing(false)
      toast('Calendar refreshed!', {
        icon: '🔄',
        duration: 2000,
        style: {
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0'
        }
      })
    } catch (error) {
      console.error('Error refreshing calendar:', error)
      setRefreshing(false)
      toast('Error refreshing calendar', {
        icon: '❌',
        duration: 3000
      })
    }
  }

  // Drag and drop handlers
  const onEventDrop = useCallback(async ({ event, start, end, isAllDay }) => {
    try {
      if (event.type === 'suggestion') {
        toast('💡 Cannot reschedule AI suggestions - they represent optimal days', {
          icon: '💡',
          duration: 3000
        })
        return
      }

      if (event.type === 'published') {
        toast('❌ Cannot reschedule published videos', {
          icon: '❌',
          duration: 3000
        })
        return
      }

      if (event.type === 'scheduled') {
        try {
          // Show loading state
          const loadingToast = toast.loading(`Rescheduling "${event.title}"...`)

          // Update the event in the local state immediately for better UX
          const updatedEvents = events.map(e =>
            e.id === event.id
              ? { ...e, start, end: isAllDay ? start : end }
              : e
          )
          setEvents(updatedEvents)

          // Simulate API call to update scheduled time
          await new Promise(resolve => setTimeout(resolve, 1500))

          // Here you would integrate with YouTube API
          // await youtubeAuth.updateVideoSchedule(activeAccount, event.id, start)

          toast.dismiss(loadingToast)
          toast(`✅ Rescheduled "${event.title}" to ${start.toLocaleDateString()} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, {
            icon: '✅',
            duration: 4000,
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0'
            }
          })

        } catch (error) {
          console.error('Failed to reschedule event:', error)
          toast('❌ Failed to reschedule video. Please try again.', {
            icon: '❌',
            duration: 3000
          })
          // Revert the change
          loadCalendarData()
        }
      }
    } catch (error) {
      console.error('Error in onEventDrop:', error)
      toast('Error processing drag and drop', {
        icon: '❌',
        duration: 2000
      })
    }
  }, [events, activeAccount, loadCalendarData])

  const onEventResize = useCallback(async ({ event, start, end }) => {
    try {
      if (event.type !== 'scheduled') {
        toast('ℹ️ Only scheduled videos can be resized', {
          icon: 'ℹ️',
          duration: 3000
        })
        return
      }

      try {
        const loadingToast = toast.loading(`Updating duration for "${event.title}"...`)

        const updatedEvents = events.map(e =>
          e.id === event.id
            ? { ...e, start, end }
            : e
        )
        setEvents(updatedEvents)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast.dismiss(loadingToast)
        toast(`✅ Updated duration for "${event.title}"`, {
          icon: '✅',
          duration: 3000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0'
          }
        })

      } catch (error) {
        console.error('Failed to resize event:', error)
        toast('❌ Failed to update event duration', {
          icon: '❌',
          duration: 3000
        })
        loadCalendarData()
      }
    } catch (error) {
      console.error('Error in onEventResize:', error)
      toast('Error processing resize', {
        icon: '❌',
        duration: 2000
      })
    }
  }, [events, loadCalendarData])

  // Enhanced event selection with detailed modal
  const handleSelectEvent = useCallback((event) => {
    try {
      if (!event || !event.title) {
        console.warn('Invalid event selected:', event)
        return
      }

      if (event.type === 'suggestion') {
        toast(`💡 ${event.title} - Click "Schedule Content" to create a video for this optimal day`, {
          icon: '💡',
          duration: 4000
        })
        return
      }

      // Show detailed event information with performance metrics
      const viewsText = event.views ? `👀 ${event.views.toLocaleString()} views` : ''
      const likesText = event.likes ? `👍 ${event.likes.toLocaleString()} likes` : ''
      const commentsText = event.comments ? `💬 ${event.comments.toLocaleString()} comments` : ''

      const metrics = [viewsText, likesText, commentsText].filter(Boolean).join(' • ')
      const message = `📹 ${event.title}\n📅 ${new Date(event.start).toLocaleDateString()}\n${metrics}`

      toast(message, {
        icon: '📹',
        duration: 4000,
        style: {
          background: '#f3f4f6',
          color: '#374151',
          border: '1px solid #d1d5db'
        }
      })
    } catch (error) {
      console.error('Error handling event selection:', error)
      toast('Error displaying event details', {
        icon: '❌',
        duration: 2000
      })
    }
  }, [])

  // Smart slot selection for scheduling
  const handleSelectSlot = useCallback((slotInfo) => {
    try {
      const selectedDate = slotInfo.start
      const today = new Date()

      if (selectedDate < today) {
        toast('❌ Cannot schedule content in the past', {
          icon: '❌',
          duration: 3000
        })
        return
      }

      // Check if this is an optimal day
      const dayOfWeek = selectedDate.getDay()
      const isOptimalDay = contentStrategy?.uploadSchedule?.bestDays?.includes(
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
      )

      if (isOptimalDay) {
        toast(`✨ Great choice! ${selectedDate.toLocaleDateString()} is one of your optimal upload days`, {
          icon: '✨',
          duration: 4000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0'
          }
        })
      } else {
        toast(`📅 Selected ${selectedDate.toLocaleDateString()} - Consider your optimal days for better performance`, {
          icon: '📅',
          duration: 3000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a'
          }
        })
      }

      setSelectedDateForScheduling(selectedDate)
      setShowSchedulingModal(true)
    } catch (error) {
      console.error('Error handling slot selection:', error)
      toast('Error selecting date', {
        icon: '❌',
        duration: 2000
      })
    }
  }, [contentStrategy])

  // Enhanced event component with drag indicators and performance metrics
  const EventComponent = ({ event }) => {
    // Safety check for event object
    if (!event || !event.title) {
      console.warn('EventComponent received invalid event:', event)
      return (
        <div className="p-1 rounded text-xs bg-gray-200 text-gray-600">
          Invalid Event
        </div>
      )
    }

    const getEventStyle = () => {
      const baseStyle = 'relative overflow-hidden transition-all duration-200'
      switch (event.type) {
        case 'published':
          return `${baseStyle} bg-gradient-to-r from-green-500 to-green-600 text-white border-green-700 shadow-sm`
        case 'scheduled':
          return `${baseStyle} bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-700 shadow-sm cursor-move`
        case 'suggestion':
          return `${baseStyle} bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 border-yellow-600 shadow-sm`
        default:
          return `${baseStyle} bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-700 shadow-sm`
      }
    }

    const getEventIcon = () => {
      const iconProps = { size: 12, className: 'flex-shrink-0' }
      switch (event.type) {
        case 'published':
          return <PlayCircle {...iconProps} />
        case 'scheduled':
          return <Clock {...iconProps} />
        case 'suggestion':
          return <Lightbulb {...iconProps} />
        default:
          return <Video {...iconProps} />
      }
    }

    const getPerformanceIndicator = () => {
      if (event.type === 'published' && event.views) {
        if (event.views > 1000000) return '🔥'
        if (event.views > 100000) return '⭐'
        if (event.views > 10000) return '👍'
        if (event.views > 1000) return '📈'
        return '👀'
      }
      return null
    }

    const getDragIndicator = () => {
      if (event.type === 'scheduled') {
        return (
          <div className="absolute top-1 right-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
              <div className="w-1 h-1 bg-white bg-opacity-60 rounded-full"></div>
              <div className="w-1 h-1 bg-white bg-opacity-60 rounded-full"></div>
              <div className="w-1 h-1 bg-white bg-opacity-60 rounded-full"></div>
              <div className="w-1 h-1 bg-white bg-opacity-60 rounded-full"></div>
            </div>
          </div>
        )
      }
      return null
    }

    return (
      <div className={`p-2 rounded-lg text-xs font-medium border-2 ${getEventStyle()} hover:scale-105 hover:shadow-md group`}>
        {/* Performance indicator */}
        {getPerformanceIndicator() && (
          <div className="absolute top-0 left-0 text-xs">
            {getPerformanceIndicator()}
          </div>
        )}

        {/* Drag indicator for scheduled events */}
        {getDragIndicator()}

        <div className="flex items-center gap-1 mb-1">
          {getEventIcon()}
          <span className="truncate font-semibold">{event.title || 'Untitled Event'}</span>
        </div>

        {/* Event details */}
        <div className="space-y-1">
          {event.views && typeof event.views === 'number' && (
            <div className="text-xs opacity-90 flex items-center gap-1">
              <Eye size={10} />
              {event.views.toLocaleString()}
            </div>
          )}

          {event.type === 'scheduled' && event.start && (
            <div className="text-xs opacity-90 flex items-center gap-1">
              <Clock size={10} />
              {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {event.type === 'suggestion' && (
            <div className="text-xs opacity-90 font-medium">
              Optimal Day
            </div>
          )}

          {event.isOptimalDay && event.type === 'scheduled' && (
            <div className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
              ✨ Optimal
            </div>
          )}
        </div>

        {/* Hover tooltip for drag instructions */}
        {event.type === 'scheduled' && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            Drag to reschedule
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your content calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="text-blue-500" />
            Content Calendar
          </h1>
          <p className="text-gray-600 mt-1">
            Plan, schedule, and optimize your content strategy for {activeAccount?.channelName}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 lg:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="text-sm font-medium hidden sm:inline">Refresh</span>
          </button>
          
          <button
            onClick={() => {
              setSelectedDateForScheduling(new Date())
              setShowSchedulingModal(true)
            }}
            className="flex items-center space-x-2 px-3 lg:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-medium hidden sm:inline">Schedule Content</span>
          </button>
        </div>
      </div>

      {/* Main View Navigation */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'series', label: 'Series', icon: Target },
            { id: 'pipeline', label: 'Pipeline', icon: BarChart3 }
          ].map(viewOption => (
            <button
              key={viewOption.id}
              onClick={() => setMainView(viewOption.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors flex-1 justify-center ${
                mainView === viewOption.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <viewOption.icon size={16} />
              <span>{viewOption.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      {mainView === 'calendar' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          {/* Calendar Instructions */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Lightbulb size={16} />
              <span className="font-medium">Pro Tips:</span>
            </div>
            <ul className="mt-2 text-xs text-blue-700 space-y-1">
              <li>• Drag scheduled videos to reschedule them</li>
              <li>• Click on events to see detailed performance metrics</li>
              <li>• Select empty dates to schedule new content</li>
              <li>• ✨ indicates optimal upload days based on your analytics</li>
            </ul>
          </div>

          <div style={{ height: '600px' }}>
            <DragAndDropCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              components={{
                event: EventComponent
              }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onEventDrop={onEventDrop}
              onEventResize={onEventResize}
              resizable
              selectable
              popup
              dragFromOutsideItem={() => ({
                id: 'new-event',
                title: 'New Content',
                type: 'scheduled'
              })}
              onDropFromOutside={({ start, end, allDay }) => {
                const newEvent = {
                  id: `new-${Date.now()}`,
                  title: 'New Scheduled Content',
                  start,
                  end: allDay ? start : end,
                  type: 'scheduled',
                  status: 'private'
                }
                setEvents(prev => [...prev, newEvent])
                toast.success('📅 New content scheduled! Click to edit details.')
              }}
              style={{
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
              eventPropGetter={(event) => ({
                className: event.type === 'scheduled' ? 'draggable-event' : '',
                style: {
                  cursor: event.type === 'scheduled' ? 'move' : 'pointer'
                }
              })}
            />
          </div>
        </div>
      )}

      {/* Series View */}
      {mainView === 'series' && (
        <ContentSeriesManager
          events={events}
          onUpdateSeries={(seriesData) => {
            try {
              // Handle series updates and add to calendar
              if (Array.isArray(seriesData)) {
                setEvents(prev => [...prev, ...seriesData])
              } else {
                setEvents(prev => [...prev, seriesData])
              }
              toast('Series updated successfully!', {
                icon: '✅',
                duration: 3000,
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0'
                }
              })
            } catch (error) {
              console.error('Error updating series:', error)
              toast('Error updating series', {
                icon: '❌',
                duration: 3000
              })
            }
          }}
          contentStrategy={contentStrategy}
        />
      )}

      {/* Pipeline View */}
      {mainView === 'pipeline' && (
        <ContentPipeline
          events={events}
          onUpdatePipeline={(pipelineData) => {
            try {
              // Handle pipeline updates and add to calendar
              if (Array.isArray(pipelineData)) {
                setEvents(prev => [...prev, ...pipelineData])
              } else {
                setEvents(prev => [...prev, pipelineData])
              }
              toast('Pipeline updated successfully!', {
                icon: '✅',
                duration: 3000,
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0'
                }
              })
            } catch (error) {
              console.error('Error updating pipeline:', error)
              toast('Error updating pipeline', {
                icon: '❌',
                duration: 3000
              })
            }
          }}
          contentStrategy={contentStrategy}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
            <Video className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.type === 'published').length}
              </p>
            </div>
            <PlayCircle className="text-green-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.type === 'scheduled').length}
              </p>
            </div>
            <Clock className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {(events.reduce((sum, e) => sum + (e.views || 0), 0) / 1000000).toFixed(1)}M
              </p>
            </div>
            <Eye className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      {/* Content Scheduling Modal */}
      <ContentSchedulingModal
        isOpen={showSchedulingModal}
        onClose={() => {
          setShowSchedulingModal(false)
          setSelectedDateForScheduling(null)
        }}
        selectedDate={selectedDateForScheduling}
        contentStrategy={contentStrategy}
        onScheduleComplete={(scheduledContent) => {
          try {
            // Add the scheduled content to events
            if (Array.isArray(scheduledContent)) {
              setEvents(prev => [...prev, ...scheduledContent])
            } else {
              setEvents(prev => [...prev, scheduledContent])
            }
            toast('Content added to calendar!', {
              icon: '✅',
              duration: 3000,
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0'
              }
            })
          } catch (error) {
            console.error('Error adding content to calendar:', error)
            toast('Error adding content to calendar', {
              icon: '❌',
              duration: 3000
            })
          }
        }}
      />
      </div>
    </ErrorBoundary>
  )
}

export default ContentCalendar
