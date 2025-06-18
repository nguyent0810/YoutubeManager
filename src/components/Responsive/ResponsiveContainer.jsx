import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useDebounce } from '../../hooks/usePerformanceOptimization'

/**
 * Responsive container component that adapts layout based on screen size
 * Provides breakpoint detection and responsive utilities
 */
const ResponsiveContainer = ({ 
  children, 
  className = '',
  breakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  onBreakpointChange,
  enableResizeObserver = true
}) => {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [currentBreakpoint, setCurrentBreakpoint] = useState('xs')
  const [orientation, setOrientation] = useState('landscape')
  
  // Debounce dimension updates for performance
  const debouncedDimensions = useDebounce(dimensions, 100)

  // Get current breakpoint based on width
  const getBreakpoint = useCallback((width) => {
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([, a], [, b]) => b - a) // Sort descending
    
    for (const [name, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        return name
      }
    }
    return 'xs'
  }, [breakpoints])

  // Update dimensions and breakpoint
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current
      const newDimensions = { width: offsetWidth, height: offsetHeight }
      
      setDimensions(newDimensions)
      
      const newBreakpoint = getBreakpoint(offsetWidth)
      if (newBreakpoint !== currentBreakpoint) {
        setCurrentBreakpoint(newBreakpoint)
        onBreakpointChange?.(newBreakpoint, newDimensions)
      }
      
      // Update orientation
      const newOrientation = offsetWidth > offsetHeight ? 'landscape' : 'portrait'
      setOrientation(newOrientation)
    }
  }, [currentBreakpoint, getBreakpoint, onBreakpointChange])

  // ResizeObserver for container size changes
  useEffect(() => {
    if (!enableResizeObserver || !containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width, height })
        
        const newBreakpoint = getBreakpoint(width)
        if (newBreakpoint !== currentBreakpoint) {
          setCurrentBreakpoint(newBreakpoint)
          onBreakpointChange?.(newBreakpoint, { width, height })
        }
        
        const newOrientation = width > height ? 'landscape' : 'portrait'
        setOrientation(newOrientation)
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [enableResizeObserver, getBreakpoint, currentBreakpoint, onBreakpointChange])

  // Window resize listener as fallback
  useEffect(() => {
    const handleResize = () => {
      updateDimensions()
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial call

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateDimensions])

  // Responsive utilities to pass to children
  const responsiveUtils = {
    breakpoint: currentBreakpoint,
    dimensions: debouncedDimensions,
    orientation,
    isMobile: currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(currentBreakpoint),
    isSmallScreen: ['xs', 'sm'].includes(currentBreakpoint),
    isLargeScreen: ['xl', '2xl'].includes(currentBreakpoint),
    
    // Utility functions
    isBreakpoint: (bp) => currentBreakpoint === bp,
    isBreakpointUp: (bp) => {
      const currentWidth = breakpoints[currentBreakpoint]
      const targetWidth = breakpoints[bp]
      return currentWidth >= targetWidth
    },
    isBreakpointDown: (bp) => {
      const currentWidth = breakpoints[currentBreakpoint]
      const targetWidth = breakpoints[bp]
      return currentWidth <= targetWidth
    },
    
    // CSS classes for responsive design
    getResponsiveClasses: () => ({
      [`breakpoint-${currentBreakpoint}`]: true,
      [`orientation-${orientation}`]: true,
      'is-mobile': ['xs', 'sm'].includes(currentBreakpoint),
      'is-tablet': currentBreakpoint === 'md',
      'is-desktop': ['lg', 'xl', '2xl'].includes(currentBreakpoint),
      'is-small-screen': ['xs', 'sm'].includes(currentBreakpoint),
      'is-large-screen': ['xl', '2xl'].includes(currentBreakpoint)
    })
  }

  // Generate responsive CSS classes
  const responsiveClasses = Object.entries(responsiveUtils.getResponsiveClasses())
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(' ')

  return (
    <div 
      ref={containerRef}
      className={`responsive-container ${responsiveClasses} ${className}`}
      data-breakpoint={currentBreakpoint}
      data-orientation={orientation}
    >
      {typeof children === 'function' ? children(responsiveUtils) : children}
    </div>
  )
}

/**
 * Hook for responsive behavior outside of ResponsiveContainer
 */
export const useResponsive = (breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  const debouncedWindowSize = useDebounce(windowSize, 100)

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial call

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const getBreakpoint = useCallback((width) => {
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([, a], [, b]) => b - a)
    
    for (const [name, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        return name
      }
    }
    return 'xs'
  }, [breakpoints])

  const currentBreakpoint = getBreakpoint(debouncedWindowSize.width)
  const orientation = debouncedWindowSize.width > debouncedWindowSize.height ? 'landscape' : 'portrait'

  return {
    windowSize: debouncedWindowSize,
    breakpoint: currentBreakpoint,
    orientation,
    isMobile: currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(currentBreakpoint),
    isSmallScreen: ['xs', 'sm'].includes(currentBreakpoint),
    isLargeScreen: ['xl', '2xl'].includes(currentBreakpoint),
    
    isBreakpoint: (bp) => currentBreakpoint === bp,
    isBreakpointUp: (bp) => {
      const currentWidth = breakpoints[currentBreakpoint]
      const targetWidth = breakpoints[bp]
      return currentWidth >= targetWidth
    },
    isBreakpointDown: (bp) => {
      const currentWidth = breakpoints[currentBreakpoint]
      const targetWidth = breakpoints[bp]
      return currentWidth <= targetWidth
    }
  }
}

/**
 * Responsive grid component
 */
export const ResponsiveGrid = ({ 
  children, 
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 4,
  className = ''
}) => {
  return (
    <ResponsiveContainer>
      {({ breakpoint }) => {
        const currentColumns = columns[breakpoint] || columns.xs || 1
        
        return (
          <div 
            className={`grid gap-${gap} ${className}`}
            style={{
              gridTemplateColumns: `repeat(${currentColumns}, 1fr)`
            }}
          >
            {children}
          </div>
        )
      }}
    </ResponsiveContainer>
  )
}

/**
 * Responsive text component that adjusts font size
 */
export const ResponsiveText = ({ 
  children, 
  sizes = { xs: 'text-sm', sm: 'text-base', md: 'text-lg', lg: 'text-xl' },
  className = '',
  ...props
}) => {
  return (
    <ResponsiveContainer>
      {({ breakpoint }) => {
        const currentSize = sizes[breakpoint] || sizes.xs || 'text-base'
        
        return (
          <span className={`${currentSize} ${className}`} {...props}>
            {children}
          </span>
        )
      }}
    </ResponsiveContainer>
  )
}

/**
 * Responsive image component with different sources for different breakpoints
 */
export const ResponsiveImage = ({ 
  sources = {},
  alt,
  className = '',
  fallback,
  ...props
}) => {
  return (
    <ResponsiveContainer>
      {({ breakpoint, isMobile, isTablet }) => {
        let src = fallback
        
        // Select appropriate source based on breakpoint
        if (sources[breakpoint]) {
          src = sources[breakpoint]
        } else if (isMobile && sources.mobile) {
          src = sources.mobile
        } else if (isTablet && sources.tablet) {
          src = sources.tablet
        } else if (sources.desktop) {
          src = sources.desktop
        }
        
        return (
          <img 
            src={src} 
            alt={alt} 
            className={`responsive-image ${className}`}
            loading="lazy"
            {...props}
          />
        )
      }}
    </ResponsiveContainer>
  )
}

export default ResponsiveContainer
