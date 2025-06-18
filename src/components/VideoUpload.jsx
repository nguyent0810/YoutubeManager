import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  Video,
  Calendar,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  X,
  Plus,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { youtubeAuth } from '../services/youtube-api'
import toast from 'react-hot-toast'

const VideoUpload = () => {
  const { activeAccount } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [skipPermissionCheck, setSkipPermissionCheck] = useState(false)
  const [uploadAbortController, setUploadAbortController] = useState(null)
  const [videoData, setVideoData] = useState(() => {
    // Set to tomorrow at 19:00 (7:00 PM)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(19, 0, 0, 0)

    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    const hours = String(tomorrow.getHours()).padStart(2, '0')
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0')

    return {
      title: '',
      description: '',
      tags: [],
      privacyStatus: 'public',
      categoryId: '22',
      scheduledPublishTime: `${year}-${month}-${day}T${hours}:${minutes}`,
      useSchedule: false, // Default to immediate publish
      thumbnail: null,
      playlistIds: []
    }
  })
  const [newTag, setNewTag] = useState('')
  const [playlists, setPlaylists] = useState([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false)



  // Load playlists when component mounts or active account changes
  useEffect(() => {
    const loadPlaylists = async () => {
      if (!activeAccount) return

      setLoadingPlaylists(true)
      try {
        const playlistData = await youtubeAuth.getPlaylists(activeAccount)
        setPlaylists(playlistData)
      } catch (error) {
        console.error('Failed to load playlists:', error)
        toast.error('Failed to load playlists')
      } finally {
        setLoadingPlaylists(false)
      }
    }

    loadPlaylists()
  }, [activeAccount])

  // Close playlist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPlaylistDropdown && !event.target.closest('.playlist-dropdown')) {
        setShowPlaylistDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPlaylistDropdown])

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      // Auto-generate title from filename
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      setVideoData(prev => ({
        ...prev,
        title: prev.title || fileName
      }))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxFiles: 1,
    maxSize: 128 * 1024 * 1024 * 1024 // 128GB
  })

  const handleInputChange = (field, value) => {
    setVideoData(prev => ({
      ...prev,
      [field]: value
    }))

    // Validate scheduled publish time only if user wants to use scheduling
    if (field === 'scheduledPublishTime' && value && videoData.useSchedule) {
      const scheduledDate = new Date(value)
      const now = new Date()
      const minFutureTime = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now

      if (scheduledDate <= minFutureTime) {
        toast.error('Scheduled time must be at least 15 minutes in the future for YouTube API requirements')
      }
    }
  }

  const addTag = () => {
    if (newTag.trim() && !videoData.tags.includes(newTag.trim())) {
      setVideoData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove) => {
    setVideoData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const togglePlaylist = (playlistId) => {
    setVideoData(prev => ({
      ...prev,
      playlistIds: prev.playlistIds.includes(playlistId)
        ? prev.playlistIds.filter(id => id !== playlistId)
        : [...prev.playlistIds, playlistId]
    }))
  }

  const handleUpload = async () => {
    if (!selectedFile || !videoData.title.trim()) {
      toast.error('Please select a file and enter a title')
      return
    }

    if (!activeAccount) {
      toast.error('No active account selected. Please connect a YouTube account first.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Create abort controller for canceling upload
    const abortController = new AbortController()
    setUploadAbortController(abortController)

    try {
      // Check upload permissions first (unless skipped)
      if (!skipPermissionCheck) {
        toast.loading('Checking upload permissions...')
        const permissionCheck = await youtubeAuth.checkUploadPermissions(activeAccount)

        if (!permissionCheck.canUpload) {
          toast.dismiss()
          // Offer option to skip permission check
          const shouldSkip = window.confirm(
            `Permission check failed: ${permissionCheck.error}\n\nWould you like to try uploading anyway? (This might work if the permission check is incorrect)`
          )

          if (shouldSkip) {
            setSkipPermissionCheck(true)
            toast.success('Skipping permission check - attempting upload...')
          } else {
            throw new Error(permissionCheck.error || 'Upload not allowed for this account')
          }
        } else {
          toast.dismiss() // Remove loading toast
          toast.success('Upload permissions verified')
        }
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 500)

      const result = await youtubeAuth.uploadVideo(activeAccount, videoData, selectedFile)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        const playlistMessage = result.addedToPlaylists > 0
          ? ` and added to ${result.addedToPlaylists} playlist${result.addedToPlaylists > 1 ? 's' : ''}`
          : ''
        toast.success(`Video "${result.title || videoData.title}" uploaded successfully${playlistMessage}!`)
        // Reset form
        setSelectedFile(null)
        setVideoData(() => {
          // Set to tomorrow at 19:00 (7:00 PM)
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(19, 0, 0, 0)

          const year = tomorrow.getFullYear()
          const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
          const day = String(tomorrow.getDate()).padStart(2, '0')
          const hours = String(tomorrow.getHours()).padStart(2, '0')
          const minutes = String(tomorrow.getMinutes()).padStart(2, '0')

          return {
            title: '',
            description: '',
            tags: [],
            privacyStatus: 'public',
            categoryId: '22',
            scheduledPublishTime: `${year}-${month}-${day}T${hours}:${minutes}`,
            useSchedule: false, // Default to immediate publish
            thumbnail: null,
            playlistIds: []
          }
        })
        setUploadProgress(0)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.dismiss() // Remove any loading toasts

      // Provide more specific error messages
      let errorMessage = 'Upload failed'
      if (error.message.includes('quota')) {
        errorMessage = 'YouTube API quota exceeded. Please try again later.'
      } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed. Please reconnect your YouTube account.'
      } else if (error.message.includes('file size') || error.message.includes('too large')) {
        errorMessage = 'File is too large. Please try a smaller video file.'
      } else if (error.message.includes('format') || error.message.includes('type')) {
        errorMessage = 'Unsupported video format. Please use MP4, MOV, AVI, MKV, or WebM.'
      } else if (error.message.includes('permissions') || error.message.includes('not allowed')) {
        errorMessage = 'Upload not allowed. Please check your YouTube channel permissions.'
      } else if (error.message.includes('invalid scheduled publishing time')) {
        errorMessage = 'Invalid scheduled time. Please set a time at least 15 minutes in the future or clear the schedule to publish immediately.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
      setUploadAbortController(null)
    }
  }

  const handleCancelUpload = () => {
    if (uploadAbortController) {
      uploadAbortController.abort()
      setIsUploading(false)
      setUploadProgress(0)
      setUploadAbortController(null)
      toast.error('Upload canceled')
    }
  }

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can search and view' },
    { value: 'unlisted', label: 'Unlisted', icon: EyeOff, description: 'Anyone with link can view' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can view' }
  ]

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Video</h1>
        <p className="text-gray-600 mt-1">
          Upload to <span className="font-medium">{activeAccount?.channelName || 'Unknown Channel'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag and Drop Area */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Video File</h2>
            
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-youtube-red bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Drop your video here' : 'Drag and drop your video'}
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse files
                </p>
                <p className="text-sm text-gray-500">
                  Supports MP4, MOV, AVI, MKV, WebM (max 128GB)
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-youtube-red bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Video size={24} className="text-youtube-red" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{selectedFile.name}</h3>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {isUploading && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <div className="flex items-center space-x-2">
                        <span>{Math.round(uploadProgress)}%</span>
                        <button
                          onClick={handleCancelUpload}
                          className="text-red-500 hover:text-red-700 text-xs underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-youtube-red h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={videoData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="input-field"
                  placeholder="Enter video title"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {videoData.title.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={videoData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input-field h-32 resize-none"
                  placeholder="Tell viewers about your video"
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {videoData.description.length}/5000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist
                </label>
                {loadingPlaylists ? (
                  <p className="text-sm text-gray-500">Loading playlists...</p>
                ) : playlists.length > 0 ? (
                  <div className="relative playlist-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                      className="w-full input-field text-left flex items-center justify-between"
                    >
                      <span className="text-gray-700">
                        {videoData.playlistIds.length > 0
                          ? `${videoData.playlistIds.length} playlist${videoData.playlistIds.length > 1 ? 's' : ''} selected`
                          : 'Select playlists'
                        }
                      </span>
                      <ChevronDown size={16} className={`transform transition-transform ${showPlaylistDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showPlaylistDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {playlists.map((playlist) => (
                          <label
                            key={playlist.id}
                            className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={videoData.playlistIds.includes(playlist.id)}
                              onChange={() => togglePlaylist(playlist.id)}
                              className="rounded border-gray-300 text-youtube-red focus:ring-youtube-red"
                            />
                            <span className="text-sm text-gray-700">{playlist.snippet.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No playlists found</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {videoData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 input-field"
                    placeholder="Add a tag"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h3>
            <div className="space-y-3">
              {privacyOptions.map((option) => {
                const Icon = option.icon
                return (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      videoData.privacyStatus === option.value
                        ? 'border-youtube-red bg-red-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={option.value}
                      checked={videoData.privacyStatus === option.value}
                      onChange={(e) => handleInputChange('privacyStatus', e.target.value)}
                      className="sr-only"
                    />
                    <Icon size={20} className="text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={videoData.useSchedule}
                  onChange={(e) => handleInputChange('useSchedule', e.target.checked)}
                  className="rounded border-gray-300 text-youtube-red focus:ring-youtube-red"
                />
                <span className="text-sm font-medium text-gray-700">
                  Schedule for later
                </span>
              </label>

              {videoData.useSchedule && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Time
                  </label>
                  <input
                    type="datetime-local"
                    value={videoData.scheduledPublishTime}
                    onChange={(e) => handleInputChange('scheduledPublishTime', e.target.value)}
                    className="input-field"
                    min={(() => {
                      const minTime = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
                      return minTime.toISOString().slice(0, 16)
                    })()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: 19:00 tomorrow. Must be at least 15 minutes in the future.
                  </p>
                </div>
              )}

              {!videoData.useSchedule && (
                <p className="text-sm text-gray-600">
                  Video will be published immediately with selected privacy setting.
                </p>
              )}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Options</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={skipPermissionCheck}
                onChange={(e) => setSkipPermissionCheck(e.target.checked)}
                className="rounded border-gray-300 text-youtube-red focus:ring-youtube-red"
              />
              <span className="text-sm text-gray-700">
                Skip permission check (use if permission check fails incorrectly)
              </span>
            </label>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !videoData.title.trim() || isUploading || !activeAccount}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' :
             !activeAccount ? 'Connect Account First' :
             !selectedFile ? 'Select Video File' :
             !videoData.title.trim() ? 'Enter Video Title' :
             'Upload Video'}
          </button>

          {!activeAccount && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Please connect a YouTube account to upload videos
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoUpload
