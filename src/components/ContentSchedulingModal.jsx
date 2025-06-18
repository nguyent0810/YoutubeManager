import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, Video, Upload, Zap, Target, Copy, Plus, Trash2, AlertCircle, CheckCircle, Save, FileText, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { youtubeAuth } from '../services/youtube-api'
import { useAuth } from '../services/AuthContext'

const ContentSchedulingModal = ({ isOpen, onClose, selectedDate, contentStrategy, onScheduleComplete }) => {
  const { activeAccount } = useAuth()
  const [schedulingMode, setSchedulingMode] = useState('single') // single, bulk, series
  const [contentData, setContentData] = useState({
    title: '',
    description: '',
    tags: [],
    category: 'Entertainment',
    privacy: 'public',
    scheduledTime: '',
    thumbnail: null,
    videoFile: null,
    customThumbnail: null
  })
  const [bulkSchedule, setBulkSchedule] = useState([])
  const [seriesConfig, setSeriesConfig] = useState({
    name: '',
    frequency: 'weekly',
    duration: 4,
    startDate: '',
    timeSlot: '19:00',
    description: '',
    tags: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  useEffect(() => {
    if (selectedDate && isOpen) {
      try {
        const defaultTime = new Date(selectedDate)
        defaultTime.setHours(19, 0, 0, 0) // Default to 7 PM
        setContentData(prev => ({
          ...prev,
          scheduledTime: defaultTime.toISOString().slice(0, 16)
        }))
      } catch (error) {
        console.warn('Error setting default time:', error)
        // Fallback to current time
        const now = new Date()
        now.setHours(19, 0, 0, 0)
        setContentData(prev => ({
          ...prev,
          scheduledTime: now.toISOString().slice(0, 16)
        }))
      }
    }
  }, [selectedDate, isOpen])

  // Form validation
  const validateForm = () => {
    const errors = {}

    if (schedulingMode === 'single') {
      if (!contentData.title.trim()) {
        errors.title = 'Video title is required'
      }
      if (!contentData.scheduledTime) {
        errors.scheduledTime = 'Scheduled time is required'
      }
      if (contentData.description.length > 5000) {
        errors.description = 'Description must be less than 5000 characters'
      }
    } else if (schedulingMode === 'series') {
      if (!seriesConfig.name.trim()) {
        errors.seriesName = 'Series name is required'
      }
      if (!seriesConfig.startDate) {
        errors.startDate = 'Start date is required'
      }
      if (seriesConfig.duration < 1 || seriesConfig.duration > 52) {
        errors.duration = 'Duration must be between 1 and 52 episodes'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSingleSchedule = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call for scheduling
      await new Promise(resolve => setTimeout(resolve, 2000))

      const scheduledVideo = {
        id: `scheduled-${Date.now()}`,
        title: contentData.title,
        description: contentData.description,
        scheduledTime: new Date(contentData.scheduledTime),
        privacy: contentData.privacy,
        category: contentData.category,
        tags: contentData.tags,
        type: 'scheduled',
        status: 'scheduled'
      }

      // Here you would integrate with the YouTube API
      // await youtubeAuth.scheduleVideo(activeAccount, scheduledVideo)

      toast.success(`✅ Scheduled "${contentData.title}" for ${new Date(contentData.scheduledTime).toLocaleDateString()}`)

      if (onScheduleComplete) {
        onScheduleComplete(scheduledVideo)
      }

      onClose()
    } catch (error) {
      console.error('Failed to schedule video:', error)
      toast.error('Failed to schedule video. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkSchedule = async () => {
    if (bulkSchedule.length === 0) {
      toast.error('Please add at least one video to the bulk schedule')
      return
    }

    setIsSubmitting(true)
    try {
      const scheduledVideos = []

      for (let i = 0; i < bulkSchedule.length; i++) {
        const video = bulkSchedule[i]
        setUploadProgress(((i + 1) / bulkSchedule.length) * 100)

        // Simulate API call for each video
        await new Promise(resolve => setTimeout(resolve, 1000))

        const scheduledVideo = {
          ...video,
          id: `bulk-scheduled-${Date.now()}-${i}`,
          type: 'scheduled',
          status: 'scheduled'
        }

        scheduledVideos.push(scheduledVideo)

        // Here you would integrate with the YouTube API
        // await youtubeAuth.scheduleVideo(activeAccount, scheduledVideo)
      }

      toast.success(`✅ Successfully scheduled ${bulkSchedule.length} videos`)

      if (onScheduleComplete) {
        onScheduleComplete(scheduledVideos)
      }

      setBulkSchedule([])
      onClose()
    } catch (error) {
      console.error('Failed to schedule videos:', error)
      toast.error('Failed to schedule some videos. Please try again.')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const addToBulkSchedule = () => {
    if (!contentData.title.trim()) {
      toast.error('Please enter a video title')
      return
    }

    setBulkSchedule(prev => [...prev, {
      id: Date.now(),
      ...contentData,
      scheduledTime: new Date(contentData.scheduledTime)
    }])

    // Reset form for next video
    setContentData(prev => ({
      ...prev,
      title: '',
      description: '',
      scheduledTime: new Date(new Date(prev.scheduledTime).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // Add 1 week
    }))
  }

  const removeBulkItem = (id) => {
    setBulkSchedule(prev => prev.filter(item => item.id !== id))
  }

  const generateSeriesSchedule = () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    const schedule = []
    const startDate = new Date(seriesConfig.startDate)
    const [hours, minutes] = seriesConfig.timeSlot.split(':')

    // Check for optimal days if available
    const optimalDays = contentStrategy?.uploadSchedule?.bestDays || []

    for (let i = 0; i < seriesConfig.duration; i++) {
      const scheduleDate = new Date(startDate)

      if (seriesConfig.frequency === 'weekly') {
        scheduleDate.setDate(startDate.getDate() + (i * 7))
      } else if (seriesConfig.frequency === 'biweekly') {
        scheduleDate.setDate(startDate.getDate() + (i * 14))
      } else if (seriesConfig.frequency === 'monthly') {
        scheduleDate.setMonth(startDate.getMonth() + i)
      }

      scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // Check if this is an optimal day
      const dayName = scheduleDate.toLocaleDateString('en-US', { weekday: 'long' })
      const isOptimal = optimalDays.includes(dayName)

      schedule.push({
        id: Date.now() + i,
        title: `${seriesConfig.name} - Episode ${i + 1}`,
        description: seriesConfig.description ?
          `${seriesConfig.description}\n\nPart ${i + 1} of the ${seriesConfig.name} series` :
          `Part ${i + 1} of the ${seriesConfig.name} series`,
        scheduledTime: scheduleDate,
        privacy: 'public',
        category: 'Entertainment',
        tags: seriesConfig.tags,
        seriesId: `series-${Date.now()}`,
        seriesName: seriesConfig.name,
        seriesFrequency: seriesConfig.frequency,
        episodeNumber: i + 1,
        isOptimalDay: isOptimal
      })
    }

    setBulkSchedule(schedule)
    setSchedulingMode('bulk')

    const optimalCount = schedule.filter(ep => ep.isOptimalDay).length
    const message = optimalCount > 0 ?
      `Generated ${schedule.length} episodes for "${seriesConfig.name}" (${optimalCount} on optimal days!)` :
      `Generated ${schedule.length} episodes for "${seriesConfig.name}"`

    toast.success(message)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Content</h2>
            <p className="text-gray-600 mt-1">
              {selectedDate ? `For ${selectedDate.toLocaleDateString()}` : 'Plan your content strategy'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'single', label: 'Single Video', icon: Video },
              { id: 'bulk', label: 'Bulk Schedule', icon: Copy },
              { id: 'series', label: 'Content Series', icon: Target }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setSchedulingMode(mode.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
                  schedulingMode === mode.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <mode.icon size={16} />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {schedulingMode === 'single' && (
            <SingleVideoForm 
              contentData={contentData}
              setContentData={setContentData}
              onSchedule={handleSingleSchedule}
              contentStrategy={contentStrategy}
            />
          )}

          {schedulingMode === 'bulk' && (
            <BulkScheduleForm
              contentData={contentData}
              setContentData={setContentData}
              bulkSchedule={bulkSchedule}
              onAddToBulk={addToBulkSchedule}
              onRemoveBulkItem={removeBulkItem}
              onScheduleAll={handleBulkSchedule}
            />
          )}

          {schedulingMode === 'series' && (
            <SeriesScheduleForm
              seriesConfig={seriesConfig}
              setSeriesConfig={setSeriesConfig}
              onGenerateSeries={generateSeriesSchedule}
              contentStrategy={contentStrategy}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Single Video Form Component
const SingleVideoForm = ({
  contentData = {},
  setContentData = () => {},
  onSchedule = () => {},
  contentStrategy = {},
  validationErrors = {},
  isSubmitting = false,
  showAdvancedOptions = false,
  setShowAdvancedOptions = () => {}
}) => {
  const isOptimalTime = () => {
    if (!contentData?.scheduledTime || !contentStrategy?.uploadSchedule?.bestDays) return false

    try {
      const scheduleDate = new Date(contentData.scheduledTime)
      const dayName = scheduleDate.toLocaleDateString('en-US', { weekday: 'long' })

      return contentStrategy.uploadSchedule.bestDays.includes(dayName)
    } catch (error) {
      console.warn('Error checking optimal time:', error)
      return false
    }
  }

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0]
    if (file) {
      if (type === 'video') {
        // Validate video file
        const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
        if (!validTypes.includes(file.type)) {
          toast.error('Please select a valid video file (MP4, AVI, MOV, WMV)')
          return
        }
        if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
          toast.error('Video file must be less than 2GB')
          return
        }
        setContentData(prev => ({ ...prev, videoFile: file }))
        toast.success('Video file selected')
      } else if (type === 'thumbnail') {
        // Validate thumbnail file
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
        if (!validTypes.includes(file.type)) {
          toast.error('Please select a valid image file (JPEG, PNG)')
          return
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast.error('Thumbnail must be less than 2MB')
          return
        }
        setContentData(prev => ({ ...prev, customThumbnail: file }))
        toast.success('Custom thumbnail selected')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Optimal timing indicator */}
      {isOptimalTime() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Zap className="text-green-600" size={20} />
            <div>
              <h4 className="font-medium text-green-900">Optimal Upload Time!</h4>
              <p className="text-sm text-green-700">This is one of your best performing days based on analytics</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
            <input
              type="text"
              value={contentData.title}
              onChange={(e) => setContentData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your video title..."
              maxLength={100}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {validationErrors.title}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">{contentData.title.length}/100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={contentData.description}
              onChange={(e) => setContentData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your video..."
              maxLength={5000}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {validationErrors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">{contentData.description.length}/5000 characters</p>
          </div>

          {/* Video File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, 'video')}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <Video size={32} className="mx-auto text-gray-400 mb-2" />
                {contentData.videoFile ? (
                  <div>
                    <p className="text-sm font-medium text-green-600">{contentData.videoFile.name}</p>
                    <p className="text-xs text-gray-500">{(contentData.videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">Click to upload video file</p>
                    <p className="text-xs text-gray-500">MP4, AVI, MOV, WMV (max 2GB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={contentData.category}
              onChange={(e) => setContentData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Entertainment">Entertainment</option>
              <option value="Education">Education</option>
              <option value="Gaming">Gaming</option>
              <option value="Technology">Technology</option>
              <option value="Music">Music</option>
              <option value="Sports">Sports</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time *</label>
            <input
              type="datetime-local"
              value={contentData.scheduledTime}
              onChange={(e) => setContentData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.scheduledTime ? 'border-red-500' : 'border-gray-300'
              }`}
              min={new Date().toISOString().slice(0, 16)}
            />
            {validationErrors.scheduledTime && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {validationErrors.scheduledTime}
              </p>
            )}
          </div>

          {/* Custom Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Thumbnail</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'thumbnail')}
                className="hidden"
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                {contentData.customThumbnail ? (
                  <div>
                    <p className="text-sm font-medium text-green-600">{contentData.customThumbnail.name}</p>
                    <p className="text-xs text-gray-500">{(contentData.customThumbnail.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">Click to upload thumbnail</p>
                    <p className="text-xs text-gray-500">JPEG, PNG (max 2MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
            <select
              value={contentData.privacy}
              onChange={(e) => setContentData(prev => ({ ...prev, privacy: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Advanced Options Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Settings size={14} />
              <span>{showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options</span>
            </button>
          </div>

          {showAdvancedOptions && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  placeholder="gaming, tutorial, review (comma separated)"
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Separate tags with commas (max 500 characters)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="youtube">Standard YouTube License</option>
                    <option value="creativeCommon">Creative Commons</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Allow comments</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Allow ratings</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Notify subscribers</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {isSubmitting && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Scheduling video...</span>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setContentData({
              title: '',
              description: '',
              tags: [],
              category: 'Entertainment',
              privacy: 'public',
              scheduledTime: '',
              thumbnail: null,
              videoFile: null,
              customThumbnail: null
            })}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Reset
          </button>

          <button
            onClick={onSchedule}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <Calendar size={16} />
                <span>Schedule Video</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Bulk Schedule Form Component
const BulkScheduleForm = ({ contentData, setContentData, bulkSchedule, onAddToBulk, onRemoveBulkItem, onScheduleAll }) => {
  return (
    <div className="space-y-6">
      {/* Add Video Form */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Add Video to Bulk Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={contentData.title}
            onChange={(e) => setContentData(prev => ({ ...prev, title: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Video title..."
          />
          <input
            type="datetime-local"
            value={contentData.scheduledTime}
            onChange={(e) => setContentData(prev => ({ ...prev, scheduledTime: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={new Date().toISOString().slice(0, 16)}
          />
          <button
            onClick={onAddToBulk}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Bulk Schedule List */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Scheduled Videos ({bulkSchedule.length})</h3>
        {bulkSchedule.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {bulkSchedule.map((video, index) => (
              <div key={video.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{video.title}</h4>
                  <p className="text-sm text-gray-600">
                    {video.scheduledTime.toLocaleDateString()} at {video.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveBulkItem(video.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Copy size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No videos scheduled yet. Add videos above to get started.</p>
          </div>
        )}
      </div>

      {bulkSchedule.length > 0 && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onScheduleAll}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>Schedule All ({bulkSchedule.length})</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Series Schedule Form Component
const SeriesScheduleForm = ({ seriesConfig, setSeriesConfig, onGenerateSeries, contentStrategy }) => {
  const getOptimalDayRecommendation = () => {
    if (!contentStrategy?.uploadSchedule?.bestDays?.length) return null
    return contentStrategy.uploadSchedule.bestDays[0]
  }

  return (
    <div className="space-y-6">
      {/* Optimal day recommendation */}
      {getOptimalDayRecommendation() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Target className="text-blue-600" size={20} />
            <div>
              <h4 className="font-medium text-blue-900">Recommendation</h4>
              <p className="text-sm text-blue-700">
                Consider scheduling your series on {getOptimalDayRecommendation()}s - your best performing day
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Series Name</label>
            <input
              type="text"
              value={seriesConfig.name}
              onChange={(e) => setSeriesConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 'React Tutorial Series'"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <select
              value={seriesConfig.frequency}
              onChange={(e) => setSeriesConfig(prev => ({ ...prev, frequency: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Episodes</label>
            <input
              type="number"
              value={seriesConfig.duration}
              onChange={(e) => setSeriesConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="52"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={seriesConfig.startDate}
              onChange={(e) => setSeriesConfig(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Time</label>
            <input
              type="time"
              value={seriesConfig.timeSlot}
              onChange={(e) => setSeriesConfig(prev => ({ ...prev, timeSlot: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Series Preview</h4>
            <div className="text-sm text-gray-600">
              <p>📅 {seriesConfig.frequency} uploads</p>
              <p>🎬 {seriesConfig.duration} episodes total</p>
              <p>⏰ Every {seriesConfig.frequency === 'weekly' ? 'week' : seriesConfig.frequency === 'biweekly' ? '2 weeks' : 'month'} at {seriesConfig.timeSlot}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onGenerateSeries}
          disabled={!seriesConfig.name || !seriesConfig.startDate}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Target size={16} />
          <span>Generate Series</span>
        </button>
      </div>
    </div>
  )
}

export default ContentSchedulingModal
