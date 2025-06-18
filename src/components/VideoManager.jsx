import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  ThumbsUp,
  MessageCircle,
  Clock,
  DollarSign,
  BarChart3,
  Grid3X3,
  List,
  RefreshCw,
  Settings,
  ExternalLink,
  Copy,
  Share2,
  Download,
  X
} from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { youtubeAuth } from '../services/youtube-api'
import { videoDataService } from '../services/video-data-service'
import toast from 'react-hot-toast'

const VideoManager = () => {
  const { activeAccount } = useAuth()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('publishedAt') // 'publishedAt', 'viewCount', 'title'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' or 'desc'
  const [selectedVideos, setSelectedVideos] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [channelStats, setChannelStats] = useState(null)
  const [editingVideo, setEditingVideo] = useState(null)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    privacy: '',
    playlist: '',
    tags: '',
    addTags: true // true = add tags, false = replace tags
  })
  const [playlists, setPlaylists] = useState([])
  const [showBulkPrivacyModal, setShowBulkPrivacyModal] = useState(false)
  const [showBulkPlaylistModal, setShowBulkPlaylistModal] = useState(false)
  const [bulkPrivacy, setBulkPrivacy] = useState('')
  const [selectedPlaylist, setSelectedPlaylist] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreVideos, setHasMoreVideos] = useState(true)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [videosPerPage, setVideosPerPage] = useState(20)
  const [totalVideos, setTotalVideos] = useState(0)
  const [paginationMode, setPaginationMode] = useState('pages') // 'pages', 'infinite', 'loadMore'
  const [dateFilter, setDateFilter] = useState('all') // 'all', 'today', 'week', 'month', 'year'
  const [performanceFilter, setPerformanceFilter] = useState('all') // 'all', 'high', 'good', 'low'
  const [showGoToTop, setShowGoToTop] = useState(false)

  useEffect(() => {
    if (activeAccount) {
      loadVideos()
      loadChannelStats()
      loadPlaylists()
    }
  }, [activeAccount])

  // Scroll detection for Go to Top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setShowGoToTop(scrollTop > 300) // Show button after scrolling 300px
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadVideos = async (loadAll = false) => {
    try {
      setLoading(true)
      setVideos([]) // Clear existing videos
      setNextPageToken(null)
      setHasMoreVideos(true)

      // Try to get the channel info for total video count, but don't fail if it doesn't work
      let actualTotalVideos = 0
      try {
        const channelInfo = await youtubeAuth.getChannelInfo(activeAccount.accessToken)
        actualTotalVideos = parseInt(channelInfo.statistics.videoCount) || 0
        setTotalVideos(actualTotalVideos)
      } catch (channelError) {
        console.warn('Could not get channel info, continuing with video loading:', channelError)
      }

      let allVideos = []
      let pageToken = null
      let totalLoaded = 0
      const maxToLoad = loadAll ? (actualTotalVideos > 0 ? Math.min(actualTotalVideos, 1000) : 1000) : 50

      do {
        // Get video data with pagination
        const params = {
          maxResults: 50, // YouTube API max per request
          part: 'snippet,statistics,status,contentDetails'
        }

        if (pageToken) {
          params.pageToken = pageToken
        }

        const data = await youtubeAuth.getVideos(activeAccount, params)
        const newVideos = data.items || []

        allVideos = [...allVideos, ...newVideos]
        totalLoaded += newVideos.length

        // Update UI with current progress
        setVideos([...allVideos])
        // Update video data service for search
        videoDataService.setVideos([...allVideos])

        pageToken = data.nextPageToken

        // Show progress for large loads
        if (loadAll && totalLoaded > 50) {
          const progressText = actualTotalVideos > 0
            ? `Loading videos... ${totalLoaded} of ${actualTotalVideos} loaded`
            : `Loading videos... ${totalLoaded} loaded`
          toast.loading(progressText, { id: 'loading-videos' })
        }

        // Break if no more videos or reached limit
        if (!pageToken || totalLoaded >= maxToLoad) {
          break
        }

        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100))

      } while (pageToken && totalLoaded < maxToLoad)

      // Update total videos if we didn't get it from channel info
      if (actualTotalVideos === 0) {
        setTotalVideos(totalLoaded + (pageToken ? 50 : 0)) // Estimate
      }

      setNextPageToken(pageToken)
      setHasMoreVideos(!!pageToken)

      toast.dismiss('loading-videos')

      const successMessage = actualTotalVideos > 0
        ? `Loaded ${totalLoaded} of ${actualTotalVideos} videos${!pageToken ? ' (all videos loaded)' : ''}`
        : `Loaded ${totalLoaded} videos${!pageToken ? ' (all videos loaded)' : ''}`

      if (totalLoaded >= maxToLoad && pageToken) {
        toast.success(`${successMessage}. Click "Load All Videos" to load more.`)
      } else {
        toast.success(successMessage)
      }

    } catch (error) {
      console.error('Failed to load videos:', error)
      toast.dismiss('loading-videos')
      toast.error('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  const loadMoreVideos = async () => {
    if (!nextPageToken || loadingMore) return

    try {
      setLoadingMore(true)

      const data = await youtubeAuth.getVideos(activeAccount, {
        maxResults: 50,
        part: 'snippet,statistics,status,contentDetails',
        pageToken: nextPageToken
      })

      const newVideos = data.items || []
      const updatedVideos = [...videos, ...newVideos]
      setVideos(updatedVideos)
      // Update video data service for search
      videoDataService.setVideos(updatedVideos)
      setNextPageToken(data.nextPageToken)
      setHasMoreVideos(!!data.nextPageToken)

      toast.success(`Loaded ${newVideos.length} more videos`)

    } catch (error) {
      console.error('Failed to load more videos:', error)
      toast.error('Failed to load more videos')
    } finally {
      setLoadingMore(false)
    }
  }

  const loadAllVideos = async () => {
    await loadVideos(true)
  }

  const loadChannelStats = async () => {
    try {
      // Get channel statistics for the dashboard
      const channelData = await youtubeAuth.getChannelInfo(activeAccount.accessToken)
      setChannelStats(channelData.statistics)
    } catch (error) {
      console.error('Failed to load channel stats:', error)
    }
  }

  const loadPlaylists = async () => {
    try {
      const playlistData = await youtubeAuth.getPlaylists(activeAccount)
      setPlaylists(playlistData.items || [])
    } catch (error) {
      console.error('Failed to load playlists:', error)
    }
  }

  // Enhanced filtering and sorting
  const filteredAndSortedVideos = videos
    .filter(video => {
      // Search filter
      const matchesSearch = video.snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.snippet.description.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = filterStatus === 'all' || video.status.privacyStatus === filterStatus

      // Date filter
      let matchesDate = true
      if (dateFilter !== 'all') {
        const videoDate = new Date(video.snippet.publishedAt)
        const now = new Date()
        const daysDiff = Math.floor((now - videoDate) / (1000 * 60 * 60 * 24))

        switch (dateFilter) {
          case 'today':
            matchesDate = daysDiff === 0
            break
          case 'week':
            matchesDate = daysDiff <= 7
            break
          case 'month':
            matchesDate = daysDiff <= 30
            break
          case 'year':
            matchesDate = daysDiff <= 365
            break
        }
      }

      // Performance filter
      let matchesPerformance = true
      if (performanceFilter !== 'all') {
        const performance = getPerformanceIndicator(video)
        switch (performanceFilter) {
          case 'high':
            matchesPerformance = performance.trend === 'up'
            break
          case 'good':
            matchesPerformance = performance.trend === 'stable'
            break
          case 'low':
            matchesPerformance = performance.trend === 'down'
            break
        }
      }

      return matchesSearch && matchesStatus && matchesDate && matchesPerformance
    })
    .sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'viewCount':
          aValue = parseInt(a.statistics?.viewCount || 0)
          bValue = parseInt(b.statistics?.viewCount || 0)
          break
        case 'likeCount':
          aValue = parseInt(a.statistics?.likeCount || 0)
          bValue = parseInt(b.statistics?.likeCount || 0)
          break
        case 'commentCount':
          aValue = parseInt(a.statistics?.commentCount || 0)
          bValue = parseInt(b.statistics?.commentCount || 0)
          break
        case 'title':
          aValue = a.snippet.title.toLowerCase()
          bValue = b.snippet.title.toLowerCase()
          break
        case 'publishedAt':
        default:
          aValue = new Date(a.snippet.publishedAt)
          bValue = new Date(b.snippet.publishedAt)
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Apply pagination based on mode
  const totalFilteredVideos = filteredAndSortedVideos.length

  let paginatedVideos = filteredAndSortedVideos
  let totalPages = 1

  if (paginationMode === 'pages') {
    totalPages = Math.ceil(totalFilteredVideos / videosPerPage)
    const startIndex = (currentPage - 1) * videosPerPage
    const endIndex = startIndex + videosPerPage
    paginatedVideos = filteredAndSortedVideos.slice(startIndex, endIndex)
  }

  // Use paginatedVideos for display
  const displayVideos = paginationMode === 'pages' ? paginatedVideos : filteredAndSortedVideos

  // Utility functions
  const formatNumber = (num) => {
    if (!num) return '0'
    const number = parseInt(num)
    if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M'
    if (number >= 1000) return (number / 1000).toFixed(1) + 'K'
    return number.toLocaleString()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDuration = (duration) => {
    // Convert ISO 8601 duration to readable format
    if (!duration) return '0:00'
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return '0:00'

    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    const seconds = parseInt(match[3]) || 0

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getPerformanceIndicator = (video) => {
    const views = parseInt(video.statistics?.viewCount || 0)
    const publishedDays = Math.floor((Date.now() - new Date(video.snippet.publishedAt)) / (1000 * 60 * 60 * 24))
    const viewsPerDay = publishedDays > 0 ? views / publishedDays : views

    if (viewsPerDay > 1000) return { trend: 'up', color: 'text-green-600', label: 'High Performance' }
    if (viewsPerDay > 100) return { trend: 'stable', color: 'text-yellow-600', label: 'Good Performance' }
    return { trend: 'down', color: 'text-gray-600', label: 'Low Performance' }
  }

  // Selection and bulk actions
  const toggleVideoSelection = (videoId) => {
    setSelectedVideos(prev => {
      const newSelection = prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  const selectAllVideos = () => {
    const allVideoIds = filteredAndSortedVideos.map(video => video.id)
    setSelectedVideos(allVideoIds)
    setShowBulkActions(true)
  }

  const clearSelection = () => {
    setSelectedVideos([])
    setShowBulkActions(false)
  }

  // Quick Edit Functions
  const openEditPanel = (video) => {
    setEditingVideo(video)
    setEditFormData({
      title: video.snippet.title,
      description: video.snippet.description,
      tags: video.snippet.tags ? video.snippet.tags.join(', ') : '',
      privacy: video.status.privacyStatus,
      categoryId: video.snippet.categoryId || '22'
    })
    setShowEditPanel(true)
  }

  const closeEditPanel = () => {
    setShowEditPanel(false)
    setEditingVideo(null)
    setEditFormData({})
  }

  const saveVideoEdit = async () => {
    if (!editingVideo) return

    try {
      setSaving(true)

      const updateData = {
        id: editingVideo.id,
        snippet: {
          title: editFormData.title,
          description: editFormData.description,
          tags: editFormData.tags ? editFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          categoryId: editFormData.categoryId
        },
        status: {
          privacyStatus: editFormData.privacy
        }
      }

      await youtubeAuth.updateVideo(activeAccount, updateData)

      // Update local video data
      setVideos(prev => prev.map(video =>
        video.id === editingVideo.id
          ? {
              ...video,
              snippet: { ...video.snippet, ...updateData.snippet },
              status: { ...video.status, ...updateData.status }
            }
          : video
      ))

      toast.success('Video updated successfully')
      closeEditPanel()
    } catch (error) {
      console.error('Failed to update video:', error)
      toast.error('Failed to update video')
    } finally {
      setSaving(false)
    }
  }

  // Bulk Edit Functions
  const openBulkEditModal = () => {
    setShowBulkEditModal(true)
  }

  const closeBulkEditModal = () => {
    setShowBulkEditModal(false)
    setBulkEditData({
      privacy: '',
      playlist: '',
      tags: '',
      addTags: true
    })
  }

  const applyBulkEdit = async () => {
    try {
      setSaving(true)
      const selectedVideoObjects = videos.filter(video => selectedVideos.includes(video.id))

      for (const video of selectedVideoObjects) {
        const updateData = {
          id: video.id,
          snippet: { ...video.snippet },
          status: { ...video.status }
        }

        // Update privacy if specified
        if (bulkEditData.privacy) {
          updateData.status.privacyStatus = bulkEditData.privacy
        }

        // Update tags if specified
        if (bulkEditData.tags) {
          const newTags = bulkEditData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          if (bulkEditData.addTags) {
            // Add to existing tags
            const existingTags = video.snippet.tags || []
            updateData.snippet.tags = [...new Set([...existingTags, ...newTags])]
          } else {
            // Replace existing tags
            updateData.snippet.tags = newTags
          }
        }

        await youtubeAuth.updateVideo(activeAccount, updateData)

        // Update local data
        setVideos(prev => prev.map(v =>
          v.id === video.id
            ? {
                ...v,
                snippet: { ...v.snippet, ...updateData.snippet },
                status: { ...v.status, ...updateData.status }
              }
            : v
        ))
      }

      toast.success(`Updated ${selectedVideoObjects.length} videos successfully`)
      closeBulkEditModal()
      clearSelection()
    } catch (error) {
      console.error('Bulk edit failed:', error)
      toast.error('Bulk edit failed')
    } finally {
      setSaving(false)
    }
  }

  // Bulk Privacy Change
  const openBulkPrivacyModal = () => {
    setShowBulkPrivacyModal(true)
  }

  const closeBulkPrivacyModal = () => {
    setShowBulkPrivacyModal(false)
    setBulkPrivacy('')
  }

  const applyBulkPrivacyChange = async () => {
    if (!bulkPrivacy) {
      toast.error('Please select a privacy setting')
      return
    }

    try {
      setSaving(true)
      const selectedVideoObjects = videos.filter(video => selectedVideos.includes(video.id))

      for (const video of selectedVideoObjects) {
        const updateData = {
          id: video.id,
          snippet: video.snippet,
          status: {
            ...video.status,
            privacyStatus: bulkPrivacy
          }
        }

        await youtubeAuth.updateVideo(activeAccount, updateData)

        // Update local data
        setVideos(prev => prev.map(v =>
          v.id === video.id
            ? { ...v, status: { ...v.status, privacyStatus: bulkPrivacy } }
            : v
        ))
      }

      toast.success(`Changed privacy to ${bulkPrivacy} for ${selectedVideoObjects.length} videos`)
      closeBulkPrivacyModal()
      clearSelection()
    } catch (error) {
      console.error('Bulk privacy change failed:', error)
      toast.error('Failed to change privacy settings')
    } finally {
      setSaving(false)
    }
  }

  // Bulk Playlist Addition
  const openBulkPlaylistModal = () => {
    setShowBulkPlaylistModal(true)
  }

  const closeBulkPlaylistModal = () => {
    setShowBulkPlaylistModal(false)
    setSelectedPlaylist('')
  }

  const applyBulkPlaylistAddition = async () => {
    if (!selectedPlaylist) {
      toast.error('Please select a playlist')
      return
    }

    try {
      setSaving(true)
      let successCount = 0
      let errorCount = 0

      for (const videoId of selectedVideos) {
        try {
          await youtubeAuth.addVideoToPlaylist(activeAccount, videoId, selectedPlaylist)
          successCount++
        } catch (error) {
          console.error(`Failed to add video ${videoId} to playlist:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} videos to playlist`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} videos to playlist`)
      }

      closeBulkPlaylistModal()
      clearSelection()
    } catch (error) {
      console.error('Bulk playlist addition failed:', error)
      toast.error('Failed to add videos to playlist')
    } finally {
      setSaving(false)
    }
  }

  // Export Data
  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(page)
  }

  const goToNextPage = () => {
    const totalPages = Math.ceil(totalVideos / videosPerPage)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const changeVideosPerPage = (newPerPage) => {
    setVideosPerPage(newPerPage)
    setCurrentPage(1) // Reset to first page
  }

  // Go to Top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const exportVideoData = () => {
    try {
      const selectedVideoObjects = videos.filter(video => selectedVideos.includes(video.id))

      const exportData = selectedVideoObjects.map(video => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        privacyStatus: video.status.privacyStatus,
        viewCount: video.statistics?.viewCount || 0,
        likeCount: video.statistics?.likeCount || 0,
        commentCount: video.statistics?.commentCount || 0,
        tags: video.snippet.tags || [],
        thumbnailUrl: video.snippet.thumbnails?.medium?.url || '',
        youtubeUrl: `https://youtube.com/watch?v=${video.id}`
      }))

      // Create and download CSV
      const csvContent = [
        // Header
        ['ID', 'Title', 'Description', 'Published Date', 'Privacy', 'Views', 'Likes', 'Comments', 'Tags', 'Thumbnail URL', 'YouTube URL'].join(','),
        // Data rows
        ...exportData.map(video => [
          video.id,
          `"${video.title.replace(/"/g, '""')}"`,
          `"${(video.description || '').replace(/"/g, '""')}"`,
          video.publishedAt,
          video.privacyStatus,
          video.viewCount,
          video.likeCount,
          video.commentCount,
          `"${video.tags.join(', ')}"`,
          video.thumbnailUrl,
          video.youtubeUrl
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `youtube_videos_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Exported ${selectedVideoObjects.length} videos to CSV`)
      clearSelection()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export video data')
    }
  }

  const handleBulkAction = async (action) => {
    switch (action) {
      case 'Edit':
        openBulkEditModal()
        break
      case 'Change Privacy':
        openBulkPrivacyModal()
        break
      case 'Add to Playlist':
        openBulkPlaylistModal()
        break
      case 'Export Data':
        exportVideoData()
        break
      case 'Delete':
        // Show confirmation
        if (!confirm(`Are you sure you want to delete ${selectedVideos.length} videos? This cannot be undone.`)) {
          return
        }

        toast.loading(`Deleting ${selectedVideos.length} videos...`)

        try {
          for (const videoId of selectedVideos) {
            await youtubeAuth.deleteVideo(activeAccount, videoId)
          }

          // Remove from local state
          setVideos(prev => prev.filter(video => !selectedVideos.includes(video.id)))
          toast.dismiss()
          toast.success(`Deleted ${selectedVideos.length} videos`)
          clearSelection()
        } catch (error) {
          toast.dismiss()
          toast.error('Failed to delete videos')
          console.error('Bulk delete failed:', error)
        }
        break
      default:
        toast.error(`Action "${action}" not implemented yet`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-youtube-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Manager</h1>
          <p className="text-gray-600 mt-1">
            Manage videos for {activeAccount?.channelName}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadVideos(false)}
            className="btn-secondary flex items-center"
            disabled={loading || loadingMore}
          >
            <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
            Refresh
          </button>
          {hasMoreVideos && (
            <button
              onClick={loadAllVideos}
              className="btn-primary flex items-center"
              disabled={loading || loadingMore}
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Download className="mr-2" size={16} />
                  Load All Videos
                </>
              )}
            </button>
          )}
          <button className="btn-secondary flex items-center">
            <BarChart3 className="mr-2" size={16} />
            Analytics
          </button>
        </div>
      </div>

      {/* Dashboard Overview */}
      {channelStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(channelStats.viewCount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(channelStats.subscriberCount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(channelStats.videoCount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Loaded Videos</p>
                <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto min-w-32"
            >
              <option value="all">All Status</option>
              <option value="public">🌍 Public</option>
              <option value="unlisted">🔗 Unlisted</option>
              <option value="private">🔒 Private</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field w-auto min-w-32"
            >
              <option value="all">📅 All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              className="input-field w-auto min-w-32"
            >
              <option value="all">📊 All Performance</option>
              <option value="high">🔥 High Performing</option>
              <option value="good">✅ Good Performance</option>
              <option value="low">⚠️ Needs Attention</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-auto min-w-32"
            >
              <option value="publishedAt">📅 Date</option>
              <option value="viewCount">👁️ Views</option>
              <option value="likeCount">👍 Likes</option>
              <option value="commentCount">💬 Comments</option>
              <option value="title">📝 Title</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="btn-secondary px-3 py-2 min-w-16"
              title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                title="Grid View"
              >
                <Grid3X3 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats and Pagination Mode */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {displayVideos.length} of {totalFilteredVideos} filtered videos
              {totalVideos > 0 && totalFilteredVideos !== videos.length && (
                <span className="text-gray-500"> • {totalVideos} total on channel</span>
              )}
              {paginationMode === 'pages' && totalPages > 1 && (
                <span className="ml-2 text-blue-600">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </span>
            <div className="flex items-center space-x-4">
              {selectedVideos.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {selectedVideos.length} selected
                </span>
              )}
              <button
                onClick={selectAllVideos}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              {selectedVideos.length > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Pagination Mode Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Display Mode:</span>
              <select
                value={paginationMode}
                onChange={(e) => setPaginationMode(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="pages">📄 Pages</option>
                <option value="infinite">♾️ Show All</option>
                <option value="loadMore">📥 Load More</option>
              </select>

              {paginationMode === 'pages' && (
                <select
                  value={videosPerPage}
                  onChange={(e) => changeVideosPerPage(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              )}
            </div>

            {/* Clear All Filters */}
            {(searchTerm || filterStatus !== 'all' || dateFilter !== 'all' || performanceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setDateFilter('all')
                  setPerformanceFilter('all')
                  setCurrentPage(1)
                }}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-900 font-medium">
                {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('Edit')}
                  className="btn-primary text-sm"
                >
                  <Edit3 className="mr-1" size={14} />
                  Bulk Edit
                </button>
                <button
                  onClick={() => handleBulkAction('Change Privacy')}
                  className="btn-secondary text-sm"
                >
                  <Settings className="mr-1" size={14} />
                  Change Privacy
                </button>
                <button
                  onClick={() => handleBulkAction('Add to Playlist')}
                  className="btn-secondary text-sm"
                >
                  <List className="mr-1" size={14} />
                  Add to Playlist
                </button>
                <button
                  onClick={() => handleBulkAction('Export Data')}
                  className="btn-secondary text-sm"
                >
                  <Download className="mr-1" size={14} />
                  Export Data
                </button>
                <button
                  onClick={() => handleBulkAction('Delete')}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium"
                >
                  <Trash2 className="mr-1" size={14} />
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Videos ({totalVideos > 0 ? totalVideos : videos.length})
              {totalFilteredVideos !== videos.length && videos.length > 0 && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({filteredAndSortedVideos.length} filtered)
                </span>
              )}
            </h2>
            {hasMoreVideos && (
              <span className="text-sm text-blue-600 font-medium">
                {videos.length} loaded{totalVideos > 0 ? ` of ${totalVideos}` : ''} • Click "Load All Videos" to load more
              </span>
            )}
          </div>
        </div>

        {displayVideos.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6' : 'divide-y divide-gray-200'}>
            {displayVideos.map((video) => {
              const performance = getPerformanceIndicator(video)
              const isSelected = selectedVideos.includes(video.id)

              if (viewMode === 'grid') {
                return (
                  <div key={video.id} className={`bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}>
                    <div className="relative">
                      <img
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleVideoSelection(video.id)}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.contentDetails?.duration)}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                        {video.snippet.title}
                      </h3>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <Eye size={14} className="mr-1" />
                          {formatNumber(video.statistics?.viewCount)}
                        </span>
                        <span className="flex items-center">
                          <ThumbsUp size={14} className="mr-1" />
                          {formatNumber(video.statistics?.likeCount)}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle size={14} className="mr-1" />
                          {formatNumber(video.statistics?.commentCount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          video.status.privacyStatus === 'public'
                            ? 'bg-green-100 text-green-800'
                            : video.status.privacyStatus === 'unlisted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {video.status.privacyStatus}
                        </span>
                        <span className={`text-xs ${performance.color}`}>
                          {performance.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(video.snippet.publishedAt)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditPanel(video)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Quick edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                            className="p-1 text-gray-400 hover:text-green-600 rounded"
                            title="View on YouTube"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              // List view
              return (
                <div key={video.id} className={`p-6 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleVideoSelection(video.id)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="relative">
                        <img
                          src={video.snippet.thumbnails.medium.url}
                          alt={video.snippet.title}
                          className="w-32 h-20 object-cover rounded-lg"
                        />
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                          {formatDuration(video.contentDetails?.duration)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-medium text-gray-900 line-clamp-2 flex-1">
                          {video.snippet.title}
                        </h3>
                        <span className={`ml-3 text-xs ${performance.color} font-medium`}>
                          {performance.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {video.snippet.description}
                      </p>

                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Eye size={14} className="mr-1" />
                          {formatNumber(video.statistics?.viewCount)} views
                        </span>
                        <span className="flex items-center">
                          <ThumbsUp size={14} className="mr-1" />
                          {formatNumber(video.statistics?.likeCount)} likes
                        </span>
                        <span className="flex items-center">
                          <MessageCircle size={14} className="mr-1" />
                          {formatNumber(video.statistics?.commentCount)} comments
                        </span>
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(video.snippet.publishedAt)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          video.status.privacyStatus === 'public'
                            ? 'bg-green-100 text-green-800'
                            : video.status.privacyStatus === 'unlisted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {video.status.privacyStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditPanel(video)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                        title="Quick edit video"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-gray-100"
                        title="View on YouTube"
                        onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                        title="Copy link"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://youtube.com/watch?v=${video.id}`)
                          toast.success('Link copied to clipboard')
                        }}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="More actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Pagination Controls */}
            {paginationMode === 'pages' && totalPages > 1 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ← Previous
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 7) {
                          pageNum = i + 1
                        } else if (currentPage <= 4) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i
                        } else {
                          pageNum = currentPage - 3 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-2 border rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>

                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • {totalFilteredVideos} total videos
                  </div>
                </div>
              </div>
            )}

            {/* Load More Button for loadMore mode */}
            {paginationMode === 'loadMore' && hasMoreVideos && !loading && displayVideos.length > 0 && (
              <div className="p-6 border-t border-gray-200 text-center">
                <button
                  onClick={loadMoreVideos}
                  disabled={loadingMore}
                  className="btn-secondary flex items-center mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Loading more videos...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2" size={16} />
                      Load More Videos
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Showing {displayVideos.length} videos
                  {hasMoreVideos ? ' • More available' : ' • All videos loaded'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first video to get started'
              }
            </p>
          </div>
        )}
      </div>

      {/* Quick Edit Panel */}
      {showEditPanel && editingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Quick Edit Video</h2>
                <button
                  onClick={closeEditPanel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Editing: {editingVideo.snippet.title}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Video title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Video description"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={editFormData.tags || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy
                </label>
                <select
                  value={editFormData.privacy || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, privacy: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="public">🌍 Public</option>
                  <option value="unlisted">🔗 Unlisted</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeEditPanel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveVideoEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Videos</h2>
                <button
                  onClick={closeBulkEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Editing {selectedVideos.length} selected videos
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Privacy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Privacy (optional)
                </label>
                <select
                  value={bulkEditData.privacy}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, privacy: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Keep current privacy</option>
                  <option value="public">🌍 Public</option>
                  <option value="unlisted">🔗 Unlisted</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (optional)
                </label>
                <input
                  type="text"
                  value={bulkEditData.tags}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
                <div className="mt-2 flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={bulkEditData.addTags}
                      onChange={() => setBulkEditData(prev => ({ ...prev, addTags: true }))}
                      className="mr-2"
                    />
                    Add to existing tags
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!bulkEditData.addTags}
                      onChange={() => setBulkEditData(prev => ({ ...prev, addTags: false }))}
                      className="mr-2"
                    />
                    Replace all tags
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeBulkEditModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={applyBulkEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Applying...
                  </>
                ) : (
                  `Apply to ${selectedVideos.length} videos`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Privacy Change Modal */}
      {showBulkPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Change Privacy</h2>
                <button
                  onClick={closeBulkPrivacyModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Change privacy for {selectedVideos.length} selected videos
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Privacy Setting
              </label>
              <select
                value={bulkPrivacy}
                onChange={(e) => setBulkPrivacy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select privacy setting</option>
                <option value="public">🌍 Public</option>
                <option value="unlisted">🔗 Unlisted</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeBulkPrivacyModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={applyBulkPrivacyChange}
                disabled={saving || !bulkPrivacy}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Applying...
                  </>
                ) : (
                  `Apply to ${selectedVideos.length} videos`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Playlist Addition Modal */}
      {showBulkPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add to Playlist</h2>
                <button
                  onClick={closeBulkPlaylistModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Add {selectedVideos.length} selected videos to a playlist
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Playlist
              </label>
              <select
                value={selectedPlaylist}
                onChange={(e) => setSelectedPlaylist(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a playlist</option>
                {playlists.map(playlist => (
                  <option key={playlist.id} value={playlist.id}>
                    📋 {playlist.snippet.title}
                  </option>
                ))}
              </select>
              {playlists.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No playlists found. Create a playlist on YouTube first.
                </p>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeBulkPlaylistModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={applyBulkPlaylistAddition}
                disabled={saving || !selectedPlaylist}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  `Add ${selectedVideos.length} videos`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Go to Top Button */}
      {showGoToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 hover:scale-110"
          title="Go to top"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export default VideoManager
