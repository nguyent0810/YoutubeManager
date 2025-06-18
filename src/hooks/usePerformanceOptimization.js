import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

/**
 * Custom hook for performance optimization
 * Provides debouncing, throttling, memoization, and performance monitoring
 */
export const usePerformanceOptimization = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    lastUpdate: Date.now()
  })

  // Performance monitoring
  const startTime = useRef(Date.now())
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current += 1
    const renderTime = Date.now() - startTime.current

    // Update performance metrics
    setPerformanceMetrics(prev => ({
      ...prev,
      renderTime,
      componentCount: renderCount.current,
      lastUpdate: Date.now(),
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
    }))
  })

  return { performanceMetrics }
}

/**
 * Debounce hook for delaying function execution
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Throttle hook for limiting function execution frequency
 */
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScrolling = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerRef, setContainerRef] = useState(null)

  const visibleItems = useMemo(() => {
    if (!items.length || !containerHeight || !itemHeight) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] }
    }

    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length - 1
    )

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, containerHeight, itemHeight, scrollTop])

  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop)
  }, [])

  return {
    ...visibleItems,
    containerRef: setContainerRef,
    onScroll: handleScroll
  }
}

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState(null)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options])

  return { elementRef, isIntersecting, entry }
}

/**
 * Memory usage monitoring hook
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0
  })

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (performance.memory) {
        setMemoryInfo({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  return {
    ...memoryInfo,
    usedJSHeapSizeFormatted: formatBytes(memoryInfo.usedJSHeapSize),
    totalJSHeapSizeFormatted: formatBytes(memoryInfo.totalJSHeapSize),
    jsHeapSizeLimitFormatted: formatBytes(memoryInfo.jsHeapSizeLimit),
    memoryUsagePercentage: memoryInfo.jsHeapSizeLimit 
      ? Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100)
      : 0
  }
}

/**
 * Optimized search hook with debouncing and memoization
 */
export const useOptimizedSearch = (items, searchFields, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, delay)

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items

    const lowercaseSearch = debouncedSearchTerm.toLowerCase()
    
    return items.filter(item => {
      return searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item)
        return value && String(value).toLowerCase().includes(lowercaseSearch)
      })
    })
  }, [items, debouncedSearchTerm, searchFields])

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching: searchTerm !== debouncedSearchTerm
  }
}

/**
 * Batch processing hook for handling large operations
 */
export const useBatchProcessor = (batchSize = 100, delay = 10) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const processBatch = useCallback(async (items, processor) => {
    setIsProcessing(true)
    setProgress(0)

    const batches = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }

    const results = []
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await processor(batches[i])
      results.push(...batchResults)
      
      setProgress(((i + 1) / batches.length) * 100)
      
      // Allow UI to update between batches
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    setIsProcessing(false)
    setProgress(100)
    
    return results
  }, [batchSize, delay])

  return {
    processBatch,
    isProcessing,
    progress
  }
}

/**
 * Optimized state management hook
 */
export const useOptimizedState = (initialState) => {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(state)

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Optimized setter that prevents unnecessary re-renders
  const setOptimizedState = useCallback((newState) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' ? newState(prevState) : newState
      
      // Shallow comparison to prevent unnecessary updates
      if (JSON.stringify(nextState) === JSON.stringify(prevState)) {
        return prevState
      }
      
      return nextState
    })
  }, [])

  // Get current state without causing re-render
  const getCurrentState = useCallback(() => stateRef.current, [])

  return [state, setOptimizedState, getCurrentState]
}

/**
 * Performance timing hook
 */
export const usePerformanceTiming = (name) => {
  const startTime = useRef(null)
  const measurements = useRef([])

  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const end = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current
      measurements.current.push(duration)
      
      // Keep only last 100 measurements
      if (measurements.current.length > 100) {
        measurements.current = measurements.current.slice(-100)
      }
      
      if (name) {
        performance.mark(`${name}-end`)
        performance.measure(name, `${name}-start`, `${name}-end`)
      }
      
      return duration
    }
    return 0
  }, [name])

  const getStats = useCallback(() => {
    const times = measurements.current
    if (times.length === 0) return null

    const sum = times.reduce((a, b) => a + b, 0)
    const avg = sum / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    return { avg, min, max, count: times.length }
  }, [])

  return { start, end, getStats }
}

export default {
  usePerformanceOptimization,
  useDebounce,
  useThrottle,
  useVirtualScrolling,
  useIntersectionObserver,
  useMemoryMonitor,
  useOptimizedSearch,
  useBatchProcessor,
  useOptimizedState,
  usePerformanceTiming
}
