import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  focusManager, 
  screenReader, 
  ListNavigator, 
  KEYBOARD_KEYS,
  MotionPreferences 
} from '../utils/accessibility'
import { 
  useDebounce, 
  useOptimizedSearch, 
  usePerformanceTiming,
  useMemoryMonitor 
} from '../hooks/usePerformanceOptimization'
import VirtualCommentList from './VirtualScrolling/VirtualCommentList'
import ResponsiveContainer, { useResponsive } from './Responsive/ResponsiveContainer'
import {
  Settings,
  Accessibility,
  Monitor,
  Zap,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Contrast,
  Type,
  MousePointer,
  Keyboard,
  Smartphone,
  Tablet,
  Laptop
} from 'lucide-react'

const AccessibleComments = ({ 
  comments = [], 
  onCommentAction,
  className = '' 
}) => {
  // Accessibility state
  const [accessibilityMode, setAccessibilityMode] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(MotionPreferences.prefersReducedMotion())
  const [fontSize, setFontSize] = useState('normal') // small, normal, large, xl
  const [screenReaderMode, setScreenReaderMode] = useState(false)
  const [keyboardNavigation, setKeyboardNavigation] = useState(true)
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false)

  // Performance state
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)
  const [virtualScrolling, setVirtualScrolling] = useState(true)
  const [focusedCommentIndex, setFocusedCommentIndex] = useState(0)

  // Search and filtering
  const [searchTerm, setSearchTerm] = useState('')
  const { filteredItems: filteredComments, isSearching } = useOptimizedSearch(
    comments, 
    ['text', 'author', 'tags'], 
    300
  )

  // Performance monitoring
  const { start: startRender, end: endRender } = usePerformanceTiming('comment-render')
  const memoryInfo = useMemoryMonitor()

  // Responsive design
  const responsive = useResponsive()

  // Refs
  const containerRef = useRef(null)
  const listNavigator = useRef(new ListNavigator({
    wrap: true,
    homeEndKeys: true,
    typeAhead: true
  }))

  // Initialize accessibility preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('accessibility-preferences')
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs)
        setAccessibilityMode(prefs.accessibilityMode || false)
        setHighContrast(prefs.highContrast || false)
        setFontSize(prefs.fontSize || 'normal')
        setScreenReaderMode(prefs.screenReaderMode || false)
        setKeyboardNavigation(prefs.keyboardNavigation !== false)
      } catch (error) {
        console.warn('Failed to load accessibility preferences:', error)
      }
    }

    // Check for system preferences
    setReducedMotion(MotionPreferences.prefersReducedMotion())
  }, [])

  // Save accessibility preferences
  const saveAccessibilityPreferences = useCallback(() => {
    const prefs = {
      accessibilityMode,
      highContrast,
      fontSize,
      screenReaderMode,
      keyboardNavigation
    }
    localStorage.setItem('accessibility-preferences', JSON.stringify(prefs))
  }, [accessibilityMode, highContrast, fontSize, screenReaderMode, keyboardNavigation])

  useEffect(() => {
    saveAccessibilityPreferences()
  }, [saveAccessibilityPreferences])

  // Update list navigator when comments change
  useEffect(() => {
    listNavigator.current.setItems(filteredComments)
  }, [filteredComments])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!keyboardNavigation) return

    // Handle accessibility panel shortcuts
    if (event.altKey && event.key === 'a') {
      event.preventDefault()
      setShowAccessibilityPanel(prev => !prev)
      screenReader.announce('Accessibility panel toggled')
      return
    }

    if (event.altKey && event.key === 'p') {
      event.preventDefault()
      setShowPerformancePanel(prev => !prev)
      screenReader.announce('Performance panel toggled')
      return
    }

    // Handle list navigation
    if (containerRef.current?.contains(event.target)) {
      listNavigator.current.handleKeyDown(event, (newIndex, item) => {
        setFocusedCommentIndex(newIndex)
        if (screenReaderMode && item) {
          screenReader.announce(`Comment ${newIndex + 1} of ${filteredComments.length} by ${item.author}: ${item.text.substring(0, 100)}`)
        }
      })
    }
  }, [keyboardNavigation, screenReaderMode, filteredComments.length])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle comment selection
  const handleCommentSelect = useCallback((commentId) => {
    const index = filteredComments.findIndex(c => c.id === commentId)
    if (index !== -1) {
      setFocusedCommentIndex(index)
      listNavigator.current.setCurrentIndex(index)
      
      if (screenReaderMode) {
        const comment = filteredComments[index]
        screenReader.announce(`Selected comment by ${comment.author}: ${comment.text.substring(0, 100)}`)
      }
    }
  }, [filteredComments, screenReaderMode])

  // Performance monitoring
  useEffect(() => {
    startRender()
    return () => {
      endRender()
    }
  })

  // Generate CSS classes based on accessibility settings
  const getAccessibilityClasses = () => {
    const classes = []
    
    if (accessibilityMode) classes.push('accessibility-mode')
    if (highContrast) classes.push('high-contrast')
    if (reducedMotion) classes.push('reduced-motion')
    if (screenReaderMode) classes.push('screen-reader-mode')
    
    switch (fontSize) {
      case 'small': classes.push('text-sm'); break
      case 'large': classes.push('text-lg'); break
      case 'xl': classes.push('text-xl'); break
      default: classes.push('text-base')
    }
    
    return classes.join(' ')
  }

  const AccessibilityPanel = () => (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Accessibility size={20} />
          Accessibility Settings
        </h3>
        <button
          onClick={() => setShowAccessibilityPanel(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close accessibility panel"
        >
          <EyeOff size={16} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">High Contrast</label>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-10 h-6 rounded-full transition-colors ${
              highContrast ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
              highContrast ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Screen Reader Mode</label>
          <button
            onClick={() => setScreenReaderMode(!screenReaderMode)}
            className={`w-10 h-6 rounded-full transition-colors ${
              screenReaderMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label={`${screenReaderMode ? 'Disable' : 'Enable'} screen reader mode`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
              screenReaderMode ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Font Size</label>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="xl">Extra Large</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Keyboard Navigation</label>
          <button
            onClick={() => setKeyboardNavigation(!keyboardNavigation)}
            className={`w-10 h-6 rounded-full transition-colors ${
              keyboardNavigation ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label={`${keyboardNavigation ? 'Disable' : 'Enable'} keyboard navigation`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
              keyboardNavigation ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Keyboard shortcuts: Alt+A (accessibility), Alt+P (performance), Arrow keys (navigate)
        </p>
      </div>
    </div>
  )

  const PerformancePanel = () => (
    <div className="fixed top-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Monitor size={20} />
          Performance Monitor
        </h3>
        <button
          onClick={() => setShowPerformancePanel(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close performance panel"
        >
          <EyeOff size={16} />
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Memory Usage:</span>
          <span className="font-mono">{memoryInfo.usedJSHeapSizeFormatted}</span>
        </div>
        <div className="flex justify-between">
          <span>Memory %:</span>
          <span className="font-mono">{memoryInfo.memoryUsagePercentage}%</span>
        </div>
        <div className="flex justify-between">
          <span>Comments:</span>
          <span className="font-mono">{filteredComments.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Device:</span>
          <span className="flex items-center gap-1">
            {responsive.isMobile && <Smartphone size={14} />}
            {responsive.isTablet && <Tablet size={14} />}
            {responsive.isDesktop && <Laptop size={14} />}
            {responsive.breakpoint}
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="text-sm font-medium text-gray-700">Virtual Scrolling</label>
          <button
            onClick={() => setVirtualScrolling(!virtualScrolling)}
            className={`w-10 h-6 rounded-full transition-colors ${
              virtualScrolling ? 'bg-green-600' : 'bg-gray-300'
            }`}
            aria-label={`${virtualScrolling ? 'Disable' : 'Enable'} virtual scrolling`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
              virtualScrolling ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <ResponsiveContainer className={`accessible-comments ${getAccessibilityClasses()} ${className}`}>
      {(responsiveUtils) => (
        <div 
          ref={containerRef}
          className="relative h-full"
          role="region"
          aria-label="Comments section"
          aria-live="polite"
        >
          {/* Accessibility Controls */}
          <div className="absolute top-4 right-4 z-40 flex gap-2">
            <button
              onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Open accessibility settings"
              title="Accessibility Settings (Alt+A)"
            >
              <Accessibility size={16} />
            </button>
            
            <button
              onClick={() => setShowPerformancePanel(!showPerformancePanel)}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              aria-label="Open performance monitor"
              title="Performance Monitor (Alt+P)"
            >
              <Monitor size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search comments"
            />
            {isSearching && (
              <div className="mt-2 text-sm text-gray-600" aria-live="polite">
                Searching...
              </div>
            )}
          </div>

          {/* Comments List */}
          {virtualScrolling ? (
            <VirtualCommentList
              comments={filteredComments}
              onCommentAction={onCommentAction}
              onCommentSelect={handleCommentSelect}
              searchTerm={searchTerm}
              focusedIndex={focusedCommentIndex}
              onFocusChange={setFocusedCommentIndex}
              isAccessibilityMode={accessibilityMode}
            />
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredComments.map((comment, index) => (
                <div 
                  key={comment.id}
                  className={`p-4 border rounded-lg ${
                    index === focusedCommentIndex ? 'ring-2 ring-blue-500' : ''
                  }`}
                  tabIndex={0}
                  onClick={() => handleCommentSelect(comment.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleCommentSelect(comment.id)
                    }
                  }}
                >
                  <div className="font-medium">{comment.author}</div>
                  <div className="text-gray-700 mt-1">{comment.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Panels */}
          {showAccessibilityPanel && <AccessibilityPanel />}
          {showPerformancePanel && <PerformancePanel />}

          {/* Screen reader status */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {filteredComments.length} comments loaded. 
            {screenReaderMode && focusedCommentIndex >= 0 && 
              `Currently focused on comment ${focusedCommentIndex + 1} of ${filteredComments.length}.`
            }
          </div>
        </div>
      )}
    </ResponsiveContainer>
  )
}

export default AccessibleComments
