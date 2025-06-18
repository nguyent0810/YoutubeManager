/**
 * Accessibility utilities for the YouTube Comments Management System
 * Provides functions for keyboard navigation, screen reader support, and WCAG compliance
 */

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
}

// ARIA roles and properties
export const ARIA_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  LISTBOX: 'listbox',
  OPTION: 'option',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  REGION: 'region',
  ARTICLE: 'article',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  BANNER: 'banner',
  CONTENTINFO: 'contentinfo'
}

/**
 * Focus management utilities
 */
export class FocusManager {
  constructor() {
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableElements))
      .filter(element => this.isVisible(element))
  }

  /**
   * Check if an element is visible and focusable
   */
  isVisible(element) {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0
  }

  /**
   * Trap focus within a container (useful for modals)
   */
  trapFocus(container, event) {
    const focusableElements = this.getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.key === KEYBOARD_KEYS.TAB) {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }
  }

  /**
   * Move focus to the next/previous focusable element
   */
  moveFocus(direction, container = document) {
    const focusableElements = this.getFocusableElements(container)
    const currentIndex = focusableElements.indexOf(document.activeElement)
    
    let nextIndex
    if (direction === 'next') {
      nextIndex = currentIndex + 1 >= focusableElements.length ? 0 : currentIndex + 1
    } else {
      nextIndex = currentIndex - 1 < 0 ? focusableElements.length - 1 : currentIndex - 1
    }
    
    focusableElements[nextIndex]?.focus()
  }

  /**
   * Save and restore focus (useful for modals)
   */
  saveFocus() {
    this.previouslyFocusedElement = document.activeElement
  }

  restoreFocus() {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  }
}

/**
 * Screen reader announcements
 */
export class ScreenReaderAnnouncer {
  constructor() {
    this.liveRegion = this.createLiveRegion()
  }

  createLiveRegion() {
    const existing = document.getElementById('sr-live-region')
    if (existing) return existing

    const liveRegion = document.createElement('div')
    liveRegion.id = 'sr-live-region'
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    
    document.body.appendChild(liveRegion)
    return liveRegion
  }

  /**
   * Announce a message to screen readers
   */
  announce(message, priority = 'polite') {
    if (!message) return

    this.liveRegion.setAttribute('aria-live', priority)
    this.liveRegion.textContent = message

    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      this.liveRegion.textContent = ''
    }, 1000)
  }

  /**
   * Announce urgent messages
   */
  announceUrgent(message) {
    this.announce(message, 'assertive')
  }
}

/**
 * Keyboard navigation handler for lists
 */
export class ListNavigator {
  constructor(options = {}) {
    this.options = {
      wrap: true,
      homeEndKeys: true,
      typeAhead: true,
      ...options
    }
    this.currentIndex = 0
    this.items = []
    this.typeAheadString = ''
    this.typeAheadTimeout = null
  }

  setItems(items) {
    this.items = items
    this.currentIndex = Math.min(this.currentIndex, items.length - 1)
  }

  handleKeyDown(event, onSelectionChange) {
    const { key } = event
    let newIndex = this.currentIndex

    switch (key) {
      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault()
        newIndex = this.currentIndex - 1
        if (newIndex < 0) {
          newIndex = this.options.wrap ? this.items.length - 1 : 0
        }
        break

      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault()
        newIndex = this.currentIndex + 1
        if (newIndex >= this.items.length) {
          newIndex = this.options.wrap ? 0 : this.items.length - 1
        }
        break

      case KEYBOARD_KEYS.HOME:
        if (this.options.homeEndKeys) {
          event.preventDefault()
          newIndex = 0
        }
        break

      case KEYBOARD_KEYS.END:
        if (this.options.homeEndKeys) {
          event.preventDefault()
          newIndex = this.items.length - 1
        }
        break

      case KEYBOARD_KEYS.PAGE_UP:
        event.preventDefault()
        newIndex = Math.max(0, this.currentIndex - 10)
        break

      case KEYBOARD_KEYS.PAGE_DOWN:
        event.preventDefault()
        newIndex = Math.min(this.items.length - 1, this.currentIndex + 10)
        break

      default:
        // Type-ahead functionality
        if (this.options.typeAhead && key.length === 1) {
          this.handleTypeAhead(key, onSelectionChange)
          return
        }
        return
    }

    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex
      onSelectionChange?.(newIndex, this.items[newIndex])
    }
  }

  handleTypeAhead(char, onSelectionChange) {
    clearTimeout(this.typeAheadTimeout)
    this.typeAheadString += char.toLowerCase()

    // Find matching item
    const matchingIndex = this.items.findIndex((item, index) => {
      if (index <= this.currentIndex) return false
      const text = this.getItemText(item).toLowerCase()
      return text.startsWith(this.typeAheadString)
    })

    if (matchingIndex !== -1) {
      this.currentIndex = matchingIndex
      onSelectionChange?.(matchingIndex, this.items[matchingIndex])
    }

    // Clear type-ahead string after delay
    this.typeAheadTimeout = setTimeout(() => {
      this.typeAheadString = ''
    }, 1000)
  }

  getItemText(item) {
    if (typeof item === 'string') return item
    if (item.text) return item.text
    if (item.label) return item.label
    if (item.name) return item.name
    return String(item)
  }

  getCurrentIndex() {
    return this.currentIndex
  }

  setCurrentIndex(index) {
    this.currentIndex = Math.max(0, Math.min(index, this.items.length - 1))
  }
}

/**
 * Color contrast utilities for WCAG compliance
 */
export const ColorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1, color2) {
    const l1 = this.getLuminance(...color1)
    const l2 = this.getLuminance(...color2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  },

  /**
   * Check if color combination meets WCAG standards
   */
  meetsWCAG(color1, color2, level = 'AA', size = 'normal') {
    const ratio = this.getContrastRatio(color1, color2)
    const requirements = {
      'AA': { normal: 4.5, large: 3 },
      'AAA': { normal: 7, large: 4.5 }
    }
    return ratio >= requirements[level][size]
  }
}

/**
 * Reduced motion utilities
 */
export const MotionPreferences = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  /**
   * Get appropriate animation duration based on user preference
   */
  getAnimationDuration(normalDuration = 300) {
    return this.prefersReducedMotion() ? 0 : normalDuration
  },

  /**
   * Apply motion-safe animations
   */
  safeAnimate(element, animation, options = {}) {
    if (this.prefersReducedMotion()) {
      // Skip animation, just apply final state
      if (options.onComplete) {
        options.onComplete()
      }
      return
    }
    
    // Apply animation normally
    element.animate(animation, {
      duration: 300,
      easing: 'ease-in-out',
      ...options
    })
  }
}

// Create singleton instances
export const focusManager = new FocusManager()
export const screenReader = new ScreenReaderAnnouncer()

// Export default accessibility object
export default {
  FocusManager,
  ScreenReaderAnnouncer,
  ListNavigator,
  ColorContrast,
  MotionPreferences,
  KEYBOARD_KEYS,
  ARIA_ROLES,
  focusManager,
  screenReader
}
