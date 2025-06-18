import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import { youtubeAuth } from '../services/youtube-api'
import toast from 'react-hot-toast'
import {
  Upload,
  FolderOpen,
  FileSpreadsheet,
  Download,
  Eye,
  Play,
  AlertCircle,
  CheckCircle,
  X,
  Edit3,
  Save,
  Calendar,
  Image,
  Tag,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

const BulkUpload = () => {
  const { activeAccount } = useAuth()
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [videoFiles, setVideoFiles] = useState([])
  const [metadataFile, setMetadataFile] = useState(null)
  const [parsedMetadata, setParsedMetadata] = useState([])
  const [previewData, setPreviewData] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isUploading, setBulkUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [inputMethod, setInputMethod] = useState('table') // 'table' or 'file'
  const [playlists, setPlaylists] = useState([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [autoFillValues, setAutoFillValues] = useState({
    privacy: '',
    playlist: '',
    tags: '',
    scheduleTime: ''
  })
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [scheduleIncrement, setScheduleIncrement] = useState({
    enabled: false,
    type: 'hours', // 'minutes', 'hours', 'days'
    value: 1
  })
  const [skipScheduleWarnings, setSkipScheduleWarnings] = useState(true) // Default to true for better UX
  const [uploadCancelled, setUploadCancelled] = useState(false)

  // Load user's playlists
  const loadPlaylists = async () => {
    if (!activeAccount) return

    try {
      setLoadingPlaylists(true)
      console.log('Loading playlists for account:', activeAccount.channelName)
      const playlistsData = await youtubeAuth.getPlaylists(activeAccount)
      console.log('Playlists loaded:', playlistsData)
      setPlaylists(playlistsData.items || [])
      toast.success(`Loaded ${playlistsData.items?.length || 0} playlists`)
    } catch (error) {
      console.error('Failed to load playlists:', error)
      toast.error('Failed to load playlists')
    } finally {
      setLoadingPlaylists(false)
    }
  }

  // Load playlists when component mounts or active account changes
  useEffect(() => {
    if (activeAccount) {
      loadPlaylists()
    }
  }, [activeAccount])

  // Initialize auto-fill schedule time with correct local timezone
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(19, 0, 0, 0) // 7:00 PM local time

    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    const hours = String(tomorrow.getHours()).padStart(2, '0')
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0')

    const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`
    console.log('Initializing default schedule time:', defaultTime, '(7:00 PM local time)')

    setAutoFillValues(prev => ({ ...prev, scheduleTime: defaultTime }))
  }, [])

  // Step 1: Select video folder
  const handleFolderSelect = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectFolder) {
        const result = await window.electronAPI.selectFolder()
        if (result.success && result.files) {
          const videos = result.files.filter(file => 
            /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(file.name)
          )
          
          setSelectedFolder(result.folderPath)
          setVideoFiles(videos)

          // Initialize table data with default values
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(19, 0, 0, 0) // 7:00 PM
          const defaultScheduleTime = tomorrow.toISOString().slice(0, 16) // Format for datetime-local

          const initialData = videos.map((video, index) => ({
            id: index,
            filename: video.name,
            title: video.name.replace(/\.[^/.]+$/, ''), // Remove file extension
            description: '',
            tags: '',
            privacy: 'public',
            playlist: '',
            scheduleTime: defaultScheduleTime,
            thumbnail: '',
            status: 'ready'
          }))

          setPreviewData(initialData)
          setCurrentStep(2)

          toast.success(`Found ${videos.length} video files`)
        }
      } else {
        toast.error('Folder selection not available in browser mode')
      }
    } catch (error) {
      console.error('Folder selection error:', error)
      toast.error('Failed to select folder')
    }
  }

  // Step 2: Upload metadata file
  const handleMetadataUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file')
      return
    }

    setMetadataFile(file)
    parseMetadataFile(file)
  }

  // Parse Excel/CSV file
  const parseMetadataFile = async (file) => {
    try {
      // We'll implement Excel/CSV parsing here
      // For now, show a placeholder
      toast.loading('Parsing metadata file...')
      
      // Simulate parsing delay
      setTimeout(() => {
        toast.dismiss()
        toast.success('Metadata file parsed successfully')
        setCurrentStep(3)
        
        // Mock data for now - we'll replace with real parsing
        const mockData = videoFiles.map((video, index) => ({
          filename: video.name,
          title: `Video ${index + 1}`,
          description: `Description for ${video.name}`,
          tags: 'tag1,tag2,tag3',
          privacy: 'public',
          playlist: '',
          scheduleTime: '',
          thumbnail: '',
          status: 'ready'
        }))
        
        setParsedMetadata(mockData)
        setPreviewData(mockData)
      }, 1500)
      
    } catch (error) {
      console.error('Metadata parsing error:', error)
      toast.error('Failed to parse metadata file')
    }
  }

  // Handle table cell editing
  const updateTableData = (rowIndex, field, value) => {
    setPreviewData(prev => prev.map((row, index) =>
      index === rowIndex ? { ...row, [field]: value } : row
    ))
  }

  // Remove video from list
  const removeVideo = (indexToRemove) => {
    setPreviewData(prev => prev.filter((_, index) => index !== indexToRemove))
    setVideoFiles(prev => prev.filter((_, index) => index !== indexToRemove))
    toast.success('Video removed from upload list')
  }

  // Move video up in the list
  const moveVideoUp = (index) => {
    if (index === 0) return
    setPreviewData(prev => {
      const newData = [...prev]
      const temp = newData[index]
      newData[index] = newData[index - 1]
      newData[index - 1] = temp
      return newData
    })
    setVideoFiles(prev => {
      const newFiles = [...prev]
      const temp = newFiles[index]
      newFiles[index] = newFiles[index - 1]
      newFiles[index - 1] = temp
      return newFiles
    })
  }

  // Move video down in the list
  const moveVideoDown = (index) => {
    if (index === previewData.length - 1) return
    setPreviewData(prev => {
      const newData = [...prev]
      const temp = newData[index]
      newData[index] = newData[index + 1]
      newData[index + 1] = temp
      return newData
    })
    setVideoFiles(prev => {
      const newFiles = [...prev]
      const temp = newFiles[index]
      newFiles[index] = newFiles[index + 1]
      newFiles[index + 1] = temp
      return newFiles
    })
  }

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return
    }

    // Reorder both previewData and videoFiles
    setPreviewData(prev => {
      const newData = [...prev]
      const draggedItem = newData[draggedIndex]
      newData.splice(draggedIndex, 1)
      newData.splice(dropIndex, 0, draggedItem)
      return newData
    })

    setVideoFiles(prev => {
      const newFiles = [...prev]
      const draggedFile = newFiles[draggedIndex]
      newFiles.splice(draggedIndex, 1)
      newFiles.splice(dropIndex, 0, draggedFile)
      return newFiles
    })

    setDraggedIndex(null)
    setDragOverIndex(null)
    toast.success('Video order updated')
  }

  // Handle thumbnail file selection
  const handleThumbnailSelect = async (rowIndex) => {
    try {
      if (window.electronAPI && window.electronAPI.showFileDialog) {
        const result = await window.electronAPI.showFileDialog({
          properties: ['openFile'],
          filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }
          ]
        })

        if (!result.canceled && result.filePaths.length > 0) {
          updateTableData(rowIndex, 'thumbnail', result.filePaths[0])
          toast.success('Thumbnail selected')
        }
      }
    } catch (error) {
      console.error('Thumbnail selection error:', error)
      toast.error('Failed to select thumbnail')
    }
  }

  // Remove thumbnail
  const removeThumbnail = (rowIndex) => {
    updateTableData(rowIndex, 'thumbnail', '')
    toast.success('Thumbnail removed')
  }

  // Auto-fill all rows with same data
  const autoFillColumn = (field, value) => {
    setPreviewData(prev => prev.map(row => ({ ...row, [field]: value })))
    setAutoFillValues(prev => ({ ...prev, [field]: value }))
    toast.success(`Auto-filled ${field} for all videos`)
  }

  // Clear auto-fill for a specific field
  const clearAutoFill = (field) => {
    setAutoFillValues(prev => ({ ...prev, [field]: '' }))
    toast.success(`Cleared auto-fill for ${field}`)
  }

  // Set default schedule time (7:00 PM next day) - Fixed timezone handling
  const setDefaultScheduleTime = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(19, 0, 0, 0) // 7:00 PM local time

    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    // This preserves local timezone without conversion
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    const hours = String(tomorrow.getHours()).padStart(2, '0')
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0')

    const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`
    console.log('Setting default schedule time:', defaultTime, '(7:00 PM local time)')

    autoFillColumn('scheduleTime', defaultTime)
    autoFillColumn('privacy', 'schedule') // Auto-set privacy to schedule
  }

  // Apply incremental scheduling to all videos
  const applyIncrementalScheduling = () => {
    if (!autoFillValues.scheduleTime) {
      toast.error('Please set a base schedule time first')
      return
    }

    setPreviewData(prev => prev.map((row, index) => {
      if (index === 0) {
        // First video keeps the base time
        return { ...row, scheduleTime: autoFillValues.scheduleTime, privacy: 'schedule' }
      }

      // Calculate incremental time for subsequent videos
      const baseDate = new Date(autoFillValues.scheduleTime)
      let incrementMs = 0

      switch (scheduleIncrement.type) {
        case 'minutes':
          incrementMs = scheduleIncrement.value * 60 * 1000
          break
        case 'hours':
          incrementMs = scheduleIncrement.value * 60 * 60 * 1000
          break
        case 'days':
          incrementMs = scheduleIncrement.value * 24 * 60 * 60 * 1000
          break
      }

      const newDate = new Date(baseDate.getTime() + (incrementMs * index))

      // Format back to datetime-local format
      const year = newDate.getFullYear()
      const month = String(newDate.getMonth() + 1).padStart(2, '0')
      const day = String(newDate.getDate()).padStart(2, '0')
      const hours = String(newDate.getHours()).padStart(2, '0')
      const minutes = String(newDate.getMinutes()).padStart(2, '0')

      const incrementedTime = `${year}-${month}-${day}T${hours}:${minutes}`

      return {
        ...row,
        scheduleTime: incrementedTime,
        privacy: 'schedule'
      }
    }))

    const incrementText = `${scheduleIncrement.value} ${scheduleIncrement.type}`
    toast.success(`Applied incremental scheduling: +${incrementText} between videos`)
  }

  // Download template
  const downloadTemplate = () => {
    const headers = [
      'filename',
      'title', 
      'description',
      'tags',
      'privacy',
      'playlist',
      'scheduleTime',
      'thumbnail'
    ]
    
    const sampleData = videoFiles.length > 0 ? videoFiles.map(video => [
      video.name,
      `Title for ${video.name}`,
      'Enter description here...',
      'tag1,tag2,tag3',
      'public',
      'My Playlist',
      '2024-01-15 19:00',
      video.name.replace(/\.[^/.]+$/, '_thumb.jpg')
    ]) : [
      ['video1.mp4', 'My First Video', 'Description here...', 'tag1,tag2', 'public', 'My Playlist', '2024-01-15 19:00', 'video1_thumb.jpg'],
      ['video2.mp4', 'My Second Video', 'Another description...', 'tag3,tag4', 'private', '', 'immediate', 'video2_thumb.jpg']
    ]

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk_upload_template.csv'
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Template downloaded!')
  }

  // Cancel bulk upload
  const cancelBulkUpload = () => {
    setUploadCancelled(true)
    setBulkUploading(false)
    toast.error('Bulk upload cancelled by user')
  }

  // Start bulk upload
  const startBulkUpload = async () => {
    if (!activeAccount) {
      toast.error('Please select an active account first')
      return
    }

    if (previewData.length === 0) {
      toast.error('No videos to upload')
      return
    }

    // Validate all videos have required data
    const invalidVideos = previewData.filter(video => !video.title?.trim())
    if (invalidVideos.length > 0) {
      toast.error(`${invalidVideos.length} videos are missing titles. Please add titles for all videos.`)
      return
    }

    setBulkUploading(true)
    setUploadCancelled(false) // Reset cancellation state

    // Initialize upload progress for each video
    const initialProgress = {}
    previewData.forEach((_, index) => {
      initialProgress[index] = { status: 'pending', progress: 0, error: null }
    })
    setUploadProgress(initialProgress)

    toast.success(`Starting bulk upload of ${previewData.length} videos...`)

    let successCount = 0
    let errorCount = 0

    try {
      // Process videos sequentially to avoid overwhelming the API
      for (let i = 0; i < previewData.length; i++) {
        // Check if upload was cancelled
        if (uploadCancelled) {
          console.log('Upload cancelled by user')
          break
        }
        const videoData = previewData[i]
        const videoFile = videoFiles.find(file => file.name === videoData.filename)

        if (!videoFile) {
          console.error(`Video file not found for ${videoData.filename}`)
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'error', progress: 0, error: 'Video file not found' }
          }))
          errorCount++
          continue
        }

        try {
          // Update status to uploading
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'uploading', progress: 0, error: null }
          }))

          console.log(`Starting upload for video ${i + 1}/${previewData.length}: ${videoData.title}`)

          // Prepare video data for upload
          const uploadData = {
            title: videoData.title.trim(),
            description: videoData.description || '',
            tags: videoData.tags ? videoData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            privacyStatus: videoData.privacy === 'schedule' ? 'private' : videoData.privacy,
            useSchedule: videoData.privacy === 'schedule',
            scheduledPublishTime: videoData.privacy === 'schedule' && videoData.scheduleTime
              ? videoData.scheduleTime  // Pass datetime-local string directly, don't convert to ISO
              : null,
            playlistIds: videoData.playlist && playlists.length > 0
              ? [playlists.find(p => p.snippet.title === videoData.playlist)?.id].filter(Boolean)
              : [],
            skipScheduleWarnings: skipScheduleWarnings  // Pass the skip warnings flag
          }

          console.log(`Upload data for ${videoData.title}:`, uploadData)

          // Debug timezone handling for scheduled videos
          if (videoData.privacy === 'schedule' && videoData.scheduleTime) {
            console.log('🕐 Schedule Debug Info:')
            console.log('  - Original scheduleTime (datetime-local):', videoData.scheduleTime)
            console.log('  - Parsed as local time:', new Date(videoData.scheduleTime).toLocaleString())
            console.log('  - User timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone)
            console.log('  - Passing to API as:', uploadData.scheduledPublishTime)
          }

          // Simulate progress updates during upload
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const current = prev[i]?.progress || 0
              if (current < 90) {
                return {
                  ...prev,
                  [i]: { ...prev[i], progress: Math.min(current + Math.random() * 15, 90) }
                }
              }
              return prev
            })
          }, 1000)

          // Perform the actual upload
          const result = await youtubeAuth.uploadVideo(activeAccount, uploadData, videoFile)

          // Check for schedule warnings in console and show non-blocking toast
          if (skipScheduleWarnings && videoData.privacy === 'schedule') {
            // Look for warning in console (this is a simple approach)
            // In a real implementation, you might want the API to return warnings
            const timeDiff = new Date(videoData.scheduleTime).getTime() - new Date().getTime()
            const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24))
            if (daysDiff > 7) {
              toast(`⚠️ ${videoData.title}: Scheduled ${daysDiff} days ahead. May fail for some accounts.`, {
                duration: 4000,
                style: {
                  background: '#fbbf24',
                  color: '#92400e',
                  fontSize: '14px'
                }
              })
            }
          }

          clearInterval(progressInterval)

          if (result.success) {
            setUploadProgress(prev => ({
              ...prev,
              [i]: {
                status: 'completed',
                progress: 100,
                error: null,
                videoId: result.videoId,
                title: result.title
              }
            }))
            successCount++
            console.log(`Successfully uploaded: ${videoData.title} (ID: ${result.videoId})`)
          } else {
            throw new Error(result.error || 'Upload failed')
          }

        } catch (error) {
          console.error(`Failed to upload ${videoData.title}:`, error)
          setUploadProgress(prev => ({
            ...prev,
            [i]: {
              status: 'error',
              progress: 0,
              error: error.message || 'Upload failed'
            }
          }))
          errorCount++
        }

        // Small delay between uploads to be respectful to the API
        if (i < previewData.length - 1 && !uploadCancelled) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // Show final results
      if (uploadCancelled) {
        toast.error(`❌ Upload cancelled. ${successCount} of ${previewData.length} videos were uploaded successfully.`)
      } else if (successCount === previewData.length) {
        toast.success(`🎉 All ${successCount} videos uploaded successfully!`)
      } else if (successCount > 0) {
        toast.success(`✅ ${successCount} videos uploaded successfully`)
        if (errorCount > 0) {
          toast.error(`❌ ${errorCount} videos failed to upload`)
        }
      } else {
        toast.error(`❌ All ${errorCount} videos failed to upload`)
      }

    } catch (error) {
      console.error('Bulk upload error:', error)
      toast.error('Bulk upload failed: ' + error.message)
    } finally {
      setBulkUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Drag and Drop Styles */}
      <style jsx>{`
        .drag-preview {
          transform: rotate(5deg);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .drag-over {
          border-color: #3b82f6 !important;
          background-color: #eff6ff !important;
        }

        tr[draggable="true"]:hover {
          background-color: #f8fafc;
        }
      `}</style>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Upload</h1>
        <p className="text-gray-600 mt-1">
          Upload multiple videos at once using folder selection and metadata spreadsheet
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step 
                ? 'bg-youtube-red text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= step ? 'text-youtube-red font-medium' : 'text-gray-500'
            }`}>
              {step === 1 && 'Select Videos'}
              {step === 2 && 'Upload Metadata'}
              {step === 3 && 'Preview & Upload'}
            </span>
            {step < 3 && (
              <div className={`w-12 h-0.5 ml-4 ${
                currentStep > step ? 'bg-youtube-red' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Video Folder */}
      {currentStep >= 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FolderOpen className="mr-2" size={24} />
              Step 1: Select Video Folder
            </h2>
            {selectedFolder && (
              <CheckCircle className="text-green-500" size={24} />
            )}
          </div>
          
          {!selectedFolder ? (
            <div className="text-center py-8">
              <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Select a folder containing your video files
              </p>
              <button
                onClick={handleFolderSelect}
                className="btn-primary"
              >
                <FolderOpen className="mr-2" size={16} />
                Browse Folder
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Selected folder: <span className="font-medium">{selectedFolder}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Found {videoFiles.length} video files
              </p>
              
              {videoFiles.length > 0 && (
                <div className="border rounded-lg bg-gray-50">
                  <div className="p-3 border-b bg-gray-100 rounded-t-lg">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <Play size={16} className="mr-2 text-gray-500" />
                      Selected Videos ({videoFiles.length})
                      <span className="ml-2 text-xs text-gray-500">• Drag to reorder • Click × to remove</span>
                    </h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {videoFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`flex items-center justify-between text-sm text-gray-700 p-3 border-b border-gray-200 last:border-b-0 cursor-move hover:bg-gray-100 transition-colors ${
                          draggedIndex === index ? 'opacity-50' : ''
                        } ${
                          dragOverIndex === index && draggedIndex !== index ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <GripVertical size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500 mr-2 flex-shrink-0 w-6">#{index + 1}</span>
                          <Play size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate" title={file.name}>{file.name}</span>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => moveVideoUp(index)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveVideoDown(index)}
                            disabled={index === videoFiles.length - 1}
                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => removeVideo(index)}
                            className="p-1 text-gray-400 hover:text-red-600 ml-1"
                            title="Remove video"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={handleFolderSelect}
                className="btn-secondary mt-4"
              >
                Change Folder
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Input Metadata */}
      {currentStep >= 2 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Edit3 className="mr-2" size={24} />
              Step 2: Input Video Metadata
            </h2>
            <CheckCircle className="text-green-500" size={24} />
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="text-sm font-medium text-amber-800 mb-2">💡 Video Management Tips</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>Reorder:</strong> Drag and drop rows or use ↑↓ buttons to change upload order</li>
              <li>• <strong>Remove:</strong> Click the 🗑️ button to remove videos you don't want to upload</li>
              <li>• <strong>Auto-fill:</strong> Use the controls below to apply settings to all videos at once</li>
              <li>• <strong>Smart Scheduling:</strong> Set a base time, then auto-increment (+1 hour, +3 hours, +1 day, etc.) for each video</li>
            </ul>
          </div>

          {/* Input Method Selection */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-sm font-medium text-gray-700">Choose input method:</span>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputMethod"
                  value="table"
                  checked={inputMethod === 'table'}
                  onChange={(e) => setInputMethod(e.target.value)}
                  className="mr-2"
                />
                <Edit3 size={16} className="mr-1" />
                Direct Table Input
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputMethod"
                  value="file"
                  checked={inputMethod === 'file'}
                  onChange={(e) => setInputMethod(e.target.value)}
                  className="mr-2"
                />
                <FileSpreadsheet size={16} className="mr-1" />
                Upload File
              </label>
            </div>
          </div>

          {/* Direct Table Input */}
          {inputMethod === 'table' && (
            <div>
              {/* Auto-fill Controls */}
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <Edit3 className="text-white" size={16} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Quick Auto-fill</h3>
                  <span className="ml-2 text-sm text-gray-500">(applies to all videos)</span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Privacy & Playlist Row */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Privacy & Playlist
                    </h4>
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Setting</label>
                        <div className="flex space-x-2">
                          <select
                            value={autoFillValues.privacy}
                            onChange={(e) => {
                              if (e.target.value) {
                                autoFillColumn('privacy', e.target.value)
                              }
                            }}
                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Choose privacy setting...</option>
                            <option value="public">🌍 Public</option>
                            <option value="unlisted">🔗 Unlisted</option>
                            <option value="private">🔒 Private</option>
                            <option value="schedule">⏰ Schedule</option>
                          </select>
                          {autoFillValues.privacy && (
                            <button
                              onClick={() => clearAutoFill('privacy')}
                              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                              title="Clear privacy auto-fill"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {autoFillValues.privacy && (
                          <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                            ✓ Applied to all videos: <span className="font-medium capitalize">{autoFillValues.privacy}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Playlist {loadingPlaylists && <span className="text-gray-400">(Loading...)</span>}
                        </label>
                        <div className="flex space-x-2">
                          <select
                            value={autoFillValues.playlist}
                            onChange={(e) => {
                              if (e.target.value) {
                                autoFillColumn('playlist', e.target.value)
                              }
                            }}
                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                            disabled={loadingPlaylists}
                            title={autoFillValues.playlist ? `Selected: ${autoFillValues.playlist}` : 'Choose playlist...'}
                          >
                            <option value="">Choose playlist...</option>
                            {playlists.map(playlist => (
                              <option key={playlist.id} value={playlist.snippet.title} title={playlist.snippet.title}>
                                📋 {playlist.snippet.title.length > 25 ? playlist.snippet.title.substring(0, 25) + '...' : playlist.snippet.title}
                              </option>
                            ))}
                          </select>
                          {autoFillValues.playlist && (
                            <button
                              onClick={() => clearAutoFill('playlist')}
                              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                              title="Clear playlist auto-fill"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {autoFillValues.playlist && (
                          <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                            ✓ Applied to all videos: <span className="font-medium truncate block" title={autoFillValues.playlist}>
                              {autoFillValues.playlist.length > 30 ? autoFillValues.playlist.substring(0, 30) + '...' : autoFillValues.playlist}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Tags & Schedule Row */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Tags & Scheduling
                    </h4>
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={autoFillValues.tags}
                              onChange={(e) => setAutoFillValues(prev => ({ ...prev, tags: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value) {
                                  autoFillColumn('tags', e.target.value)
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value && e.target.value !== autoFillValues.tags) {
                                  autoFillColumn('tags', e.target.value)
                                }
                              }}
                              placeholder="gaming, tutorial, review..."
                              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Tag className="absolute right-3 top-2.5 text-gray-400" size={14} />
                          </div>
                          {autoFillValues.tags && (
                            <button
                              onClick={() => clearAutoFill('tags')}
                              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                              title="Clear tags auto-fill"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Press Enter or click away to apply</div>
                        {autoFillValues.tags && (
                          <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                            ✓ Applied to all videos: <span className="font-medium">{autoFillValues.tags}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Time</label>
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <input
                              type="datetime-local"
                              value={autoFillValues.scheduleTime}
                              onChange={(e) => {
                                if (e.target.value) {
                                  autoFillColumn('scheduleTime', e.target.value)
                                  autoFillColumn('privacy', 'schedule') // Auto-set privacy to schedule
                                }
                              }}
                              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min={new Date().toISOString().slice(0, 16)}
                            />
                            <Calendar className="absolute right-3 top-2.5 text-gray-400" size={14} />
                          </div>
                          <button
                            onClick={setDefaultScheduleTime}
                            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium"
                            title="Set to 7:00 PM tomorrow"
                          >
                            7PM
                          </button>
                          {autoFillValues.scheduleTime && (
                            <button
                              onClick={() => clearAutoFill('scheduleTime')}
                              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                              title="Clear schedule auto-fill"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* Incremental Scheduling Controls */}
                        {autoFillValues.scheduleTime && (
                          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id="enableIncrement"
                                checked={scheduleIncrement.enabled}
                                onChange={(e) => setScheduleIncrement(prev => ({ ...prev, enabled: e.target.checked }))}
                                className="mr-2"
                              />
                              <label htmlFor="enableIncrement" className="text-sm font-medium text-purple-800">
                                📅 Auto-increment schedule time for each video
                              </label>
                            </div>

                            {scheduleIncrement.enabled && (
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs text-purple-700">Add</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="999"
                                  value={scheduleIncrement.value}
                                  onChange={(e) => setScheduleIncrement(prev => ({ ...prev, value: parseInt(e.target.value) || 1 }))}
                                  className="w-16 text-sm border border-purple-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                <select
                                  value={scheduleIncrement.type}
                                  onChange={(e) => setScheduleIncrement(prev => ({ ...prev, type: e.target.value }))}
                                  className="text-sm border border-purple-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                  <option value="minutes">minutes</option>
                                  <option value="hours">hours</option>
                                  <option value="days">days</option>
                                </select>
                                <span className="text-xs text-purple-700">between videos</span>
                                <button
                                  onClick={applyIncrementalScheduling}
                                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors font-medium"
                                >
                                  Apply
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-1 text-xs text-gray-500">
                          <button
                            onClick={setDefaultScheduleTime}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Set to 7:00 PM tomorrow
                          </button>
                        </div>
                        {autoFillValues.scheduleTime && (
                          <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                            ✓ Base time: <span className="font-medium">{new Date(autoFillValues.scheduleTime).toLocaleString()}</span>
                            {scheduleIncrement.enabled && (
                              <div className="text-xs text-purple-600 mt-1">
                                Each video will be +{scheduleIncrement.value} {scheduleIncrement.type} from the previous
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Video File</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Privacy</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Playlist</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thumbnail</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr
                        key={`${row.filename}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`hover:bg-gray-50 cursor-move ${
                          draggedIndex === index ? 'opacity-50' : ''
                        } ${
                          dragOverIndex === index && draggedIndex !== index ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-sm text-gray-500 font-medium">
                          <div className="flex items-center">
                            <GripVertical size={14} className="mr-1 text-gray-400" />
                            #{index + 1}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 font-medium">
                          <div className="flex items-center">
                            <Play size={14} className="mr-2 text-gray-400" />
                            <span className="truncate" title={row.filename}>{row.filename}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => updateTableData(index, 'title', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            placeholder="Enter title..."
                          />
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            value={row.description}
                            onChange={(e) => updateTableData(index, 'description', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 h-16 resize-none"
                            placeholder="Enter description..."
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.tags}
                            onChange={(e) => updateTableData(index, 'tags', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            placeholder="tag1,tag2,tag3"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={row.privacy}
                            onChange={(e) => updateTableData(index, 'privacy', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="public">Public</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="private">Private</option>
                            <option value="schedule">Schedule</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={row.playlist}
                            onChange={(e) => updateTableData(index, 'playlist', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            disabled={loadingPlaylists}
                          >
                            <option value="">No playlist</option>
                            {playlists.map(playlist => (
                              <option key={playlist.id} value={playlist.snippet.title}>
                                {playlist.snippet.title}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          {row.privacy === 'schedule' ? (
                            <div className="space-y-1">
                              <input
                                type="datetime-local"
                                value={row.scheduleTime}
                                onChange={(e) => updateTableData(index, 'scheduleTime', e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                min={new Date().toISOString().slice(0, 16)}
                              />
                              {row.scheduleTime && (
                                <div className="text-xs text-gray-500">
                                  {new Date(row.scheduleTime).toLocaleString()}
                                  {index > 0 && scheduleIncrement.enabled && (
                                    <div className="text-purple-600 font-medium">
                                      +{scheduleIncrement.value * index} {scheduleIncrement.type}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Immediate</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <button
                              onClick={() => handleThumbnailSelect(index)}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded flex items-center w-full justify-center"
                            >
                              <Image size={12} className="mr-1" />
                              {row.thumbnail ? 'Change' : 'Select'}
                            </button>
                            {row.thumbnail && (
                              <>
                                <div className="text-xs text-gray-500 truncate" title={row.thumbnail}>
                                  {row.thumbnail.split('/').pop()}
                                </div>
                                <button
                                  onClick={() => removeThumbnail(index)}
                                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded flex items-center w-full justify-center"
                                >
                                  <X size={12} className="mr-1" />
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => moveVideoUp(index)}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => moveVideoDown(index)}
                              disabled={index === previewData.length - 1}
                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              onClick={() => removeVideo(index)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Remove video"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Video Count Summary */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Play className="mr-2 text-blue-600" size={20} />
                    <span className="text-sm font-medium text-blue-900">
                      Ready to upload: {previewData.length} video{previewData.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {previewData.length > 0 && (
                    <div className="text-xs text-blue-700">
                      Videos will be uploaded in the order shown above
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={previewData.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Preview ({previewData.length} videos)
                </button>
              </div>
            </div>
          )}

          {/* File Upload Method */}
          {inputMethod === 'file' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Download Template */}
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <Download size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Download the template with your video files
                </p>
                <button
                  onClick={downloadTemplate}
                  className="btn-secondary"
                >
                  <Download className="mr-2" size={16} />
                  Download Template
                </button>
              </div>

              {/* Upload Metadata */}
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <FileSpreadsheet size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Upload your completed metadata file
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleMetadataUpload}
                  className="hidden"
                  id="metadata-upload"
                />
                <label htmlFor="metadata-upload" className="btn-primary cursor-pointer">
                  <Upload className="mr-2" size={16} />
                  Upload Metadata
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Preview & Upload */}
      {currentStep >= 3 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Eye className="mr-2" size={24} />
              Step 3: Preview & Upload
            </h2>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Review your videos and metadata before uploading
            </p>
          </div>

          {/* Upload Settings */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">⚙️ Upload Settings</h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="skipWarnings"
                checked={skipScheduleWarnings}
                onChange={(e) => setSkipScheduleWarnings(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="skipWarnings" className="text-sm text-gray-700">
                <span className="font-medium">Skip schedule warnings</span>
                <span className="text-gray-500 ml-1">
                  (Don't show blocking popups for videos scheduled more than 7 days ahead)
                </span>
              </label>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              ℹ️ When enabled, warnings will appear as non-blocking notifications that won't interrupt the upload process
            </div>
          </div>
          
          {/* Upload Progress Table */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Video</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Privacy</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Playlist</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Upload Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.map((item, index) => {
                  const progress = uploadProgress[index]
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-500 font-medium">#{index + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                        <div className="flex items-center">
                          <Play size={14} className="mr-2 text-gray-400" />
                          <span className="truncate" title={item.filename}>{item.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 capitalize">{item.privacy}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.playlist || 'None'}</td>
                      <td className="px-4 py-2">
                        {!progress || progress.status === 'pending' ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Ready
                          </span>
                        ) : progress.status === 'uploading' ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-xs font-medium text-blue-600">
                                Uploading {Math.round(progress.progress)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : progress.status === 'completed' ? (
                          <div className="space-y-1">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              ✅ Completed
                            </span>
                            {progress.videoId && (
                              <div className="text-xs text-gray-500">
                                ID: {progress.videoId}
                              </div>
                            )}
                          </div>
                        ) : progress.status === 'error' ? (
                          <div className="space-y-1">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              ❌ Failed
                            </span>
                            {progress.error && (
                              <div className="text-xs text-red-600 max-w-xs truncate" title={progress.error}>
                                {progress.error}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Upload Summary */}
          {isUploading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Bulk Upload in Progress</h3>
                    <p className="text-sm text-blue-700">
                      {Object.values(uploadProgress).filter(p => p.status === 'completed').length} of {previewData.length} videos completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-900">
                    {Math.round((Object.values(uploadProgress).filter(p => p.status === 'completed').length / previewData.length) * 100)}% Complete
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Results Summary */}
          {!isUploading && Object.keys(uploadProgress).length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Upload Results</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(uploadProgress).filter(p => p.status === 'completed').length}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(uploadProgress).filter(p => p.status === 'error').length}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-600">
                    {previewData.length}
                  </div>
                  <div className="text-sm text-gray-700">Total</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Upload Button */}
          <div className="flex justify-center space-x-4">
            {!isUploading ? (
              <button
                onClick={startBulkUpload}
                disabled={previewData.length === 0}
                className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="mr-2" size={20} />
                Start Bulk Upload ({previewData.length} videos)
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  disabled
                  className="btn-primary px-8 py-3 text-lg opacity-50 cursor-not-allowed"
                >
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading {Object.values(uploadProgress).filter(p => p.status === 'completed').length} / {previewData.length}
                </button>
                <button
                  onClick={cancelBulkUpload}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-lg rounded-lg transition-colors font-medium flex items-center"
                  title="Cancel upload"
                >
                  <X className="mr-2" size={20} />
                  Cancel
                </button>
                <div className="text-sm text-gray-600">
                  <div>Current: {Object.values(uploadProgress).find(p => p.status === 'uploading') ?
                    previewData[Object.keys(uploadProgress).find(key => uploadProgress[key].status === 'uploading')]?.title || 'Processing...'
                    : 'Processing...'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BulkUpload
