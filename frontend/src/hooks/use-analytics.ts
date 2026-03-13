import { useEffect, useCallback } from 'react'
import { analyticsApi } from '@/lib/api'
import { debounce } from '@/lib/utils'

/**
 * Analytics hook for tracking user interactions
 * AWWWARDS-level analytics tracking
 */
export function useAnalytics() {
  // Track page view
  const trackPageView = useCallback((page?: string) => {
    analyticsApi.track('page_view', {
      page: page || window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    })
  }, [])

  // Track custom event
  const trackEvent = useCallback((event: string, data?: any) => {
    analyticsApi.track(event, {
      ...data,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    })
  }, [])

  // Track scroll depth - AWWWARDS technique
  const trackScrollDepth = useCallback(
    debounce(() => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      )

      if (scrollDepth > 0 && scrollDepth % 25 === 0) {
        trackEvent('scroll_depth', { depth: scrollDepth })
      }
    }, 500),
    [trackEvent]
  )

  // Track time spent on page
  const trackTimeSpent = useCallback(() => {
    let startTime = Date.now()
    let lastActivityTime = Date.now()

    const updateActivity = () => {
      lastActivityTime = Date.now()
    }

    // Listen for user activity
    const events = ['click', 'scroll', 'keypress', 'mousemove']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Track when user leaves
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((lastActivityTime - startTime) / 1000)
      if (timeSpent > 5) { // Only track if spent more than 5 seconds
        trackEvent('time_spent', {
          duration: timeSpent,
          page: window.location.pathname,
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [trackEvent])

  // Track form interactions
  const trackFormEvent = useCallback((formName: string, event: 'start' | 'submit' | 'error', data?: any) => {
    trackEvent('form_interaction', {
      form: formName,
      action: event,
      ...data,
    })
  }, [trackEvent])

  // Track button clicks
  const trackButtonClick = useCallback((buttonName: string, location?: string) => {
    trackEvent('button_click', {
      button: buttonName,
      location: location || 'unknown',
    })
  }, [trackEvent])

  // Track service/solution interest
  const trackServiceInterest = useCallback((serviceId: string, serviceName: string) => {
    trackEvent('service_interest', {
      serviceId,
      serviceName,
    })
  }, [trackEvent])

  // Track download events
  const trackDownload = useCallback((fileName: string, fileType: string) => {
    trackEvent('file_download', {
      fileName,
      fileType,
    })
  }, [trackEvent])

  // Track search events
  const trackSearch = useCallback((query: string, results?: number) => {
    trackEvent('search', {
      query,
      results,
    })
  }, [trackEvent])

  // Track video events
  const trackVideoEvent = useCallback((videoId: string, action: 'play' | 'pause' | 'end', progress?: number) => {
    trackEvent('video_interaction', {
      videoId,
      action,
      progress,
    })
  }, [trackEvent])

  // Track portfolio/case study views
  const trackPortfolioView = useCallback((projectId: string, projectName: string) => {
    trackEvent('portfolio_view', {
      projectId,
      projectName,
    })
  }, [trackEvent])

  // Track contact attempts
  const trackContactAttempt = useCallback((method: 'form' | 'email' | 'phone' | 'whatsapp') => {
    trackEvent('contact_attempt', {
      method,
    })
  }, [trackEvent])

  // Track testimonial interactions
  const trackTestimonialInteraction = useCallback((testimonialId: string, action: 'view' | 'share') => {
    trackEvent('testimonial_interaction', {
      testimonialId,
      action,
    })
  }, [trackEvent])

  // Track blog interactions
  const trackBlogEvent = useCallback((postSlug: string, action: 'view' | 'share' | 'like', data?: any) => {
    trackEvent('blog_interaction', {
      postSlug,
      action,
      ...data,
    })
  }, [trackEvent])

  // Track performance metrics
  const trackPerformance = useCallback(() => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      trackEvent('performance', {
        loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        firstPaint: Math.round(navigation.fetchStart),
        connectionType: (navigator as any).connection?.effectiveType,
      })
    }
  }, [trackEvent])

  // Auto-track page views and setup scroll tracking
  useEffect(() => {
    // Track initial page view
    trackPageView()

    // Setup scroll tracking
    window.addEventListener('scroll', trackScrollDepth, { passive: true })

    // Setup time tracking
    const cleanup = trackTimeSpent()

    // Track performance after page loads
    if (document.readyState === 'loading') {
      window.addEventListener('load', trackPerformance)
    } else {
      trackPerformance()
    }

    return () => {
      window.removeEventListener('scroll', trackScrollDepth)
      window.removeEventListener('load', trackPerformance)
      cleanup?.()
    }
  }, [trackPageView, trackScrollDepth, trackTimeSpent, trackPerformance])

  return {
    trackPageView,
    trackEvent,
    trackScrollDepth,
    trackFormEvent,
    trackButtonClick,
    trackServiceInterest,
    trackDownload,
    trackSearch,
    trackVideoEvent,
    trackPortfolioView,
    trackContactAttempt,
    trackTestimonialInteraction,
    trackBlogEvent,
    trackPerformance,
  }
}

/**
 * Simple analytics component to auto-track page views
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics()
  return <>{children}</>
}