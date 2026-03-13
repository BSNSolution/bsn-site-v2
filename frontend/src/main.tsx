import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Styles
import '@/styles/globals.css'

// Components
import App from './App'
// CustomCursor removed - was causing mouse lag
import { AnalyticsProvider } from '@/hooks/use-analytics'
import { Toaster } from 'sonner'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
    
    // Track error in analytics
    if (window.location.hostname !== 'localhost') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'error_boundary',
          data: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            page: window.location.pathname,
          },
        }),
      }).catch(() => {}) // Silently fail
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Algo deu errado
            </h1>
            <p className="text-muted-foreground max-w-md">
              Ocorreu um erro inesperado. Por favor, recarregue a página ou tente novamente mais tarde.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Recarregar página
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-secondary transition-colors"
              >
                Voltar ao início
              </button>
            </div>
            
            {/* Show error details in dev mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 text-xs text-red-500 whitespace-pre-wrap bg-secondary p-4 rounded-md overflow-auto max-h-60">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Performance monitoring
function performanceMonitor() {
  // Monitor Core Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { 
        startTime: number
        element?: HTMLElement 
      }
      
      console.log('LCP:', lastEntry.startTime, lastEntry.element)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: PerformanceEntry & { processingStart?: number }) => {
        const delay = entry.processingStart ? entry.processingStart - entry.startTime : 0
        console.log('FID:', delay)
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift (CLS)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      let cls = 0
      entries.forEach((entry: PerformanceEntry & { value?: number }) => {
        if (entry.value) cls += entry.value
      })
      console.log('CLS:', cls)
    }).observe({ entryTypes: ['layout-shift'] })
  }

  // Resource timing
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const loadTime = perfData.loadEventEnd - perfData.fetchStart
    
    console.log('Page load metrics:', {
      'DNS lookup': perfData.domainLookupEnd - perfData.domainLookupStart,
      'TCP connection': perfData.connectEnd - perfData.connectStart,
      'Request': perfData.responseStart - perfData.requestStart,
      'Response': perfData.responseEnd - perfData.responseStart,
      'DOM processing': perfData.domComplete - perfData.responseEnd,
      'Total load time': loadTime,
    })
  })
}

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor()
}

// Mount the app
const container = document.getElementById('root')
if (!container) {
  throw new Error('Failed to find the root element')
}

const root = createRoot(container)

root.render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AnalyticsProvider>
            <App />
            {/* CustomCursor removed - causava lag no mouse */}
            <Toaster 
              theme="dark"
              position="top-right"
              closeButton
              richColors
              toastOptions={{
                style: {
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--card-foreground))',
                },
              }}
            />
          </AnalyticsProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)

// Service Worker registration for caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Prevent zoom on mobile inputs
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.hasAttribute('contenteditable')) {
      const viewport = document.querySelector('meta[name=viewport]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1')
      }
    }
  })
  
  document.addEventListener('focusout', () => {
    const viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1')
    }
  })
}

// Debug tools in development
if (process.env.NODE_ENV === 'development') {
  // Add debug info to window
  window.__BSN_DEBUG__ = {
    queryClient,
    version: '1.0.0',
    build: 'development',
  }
}