import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'bounce'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
}

// Spinner animations
const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

const dotsVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const pulseVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const bounceVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export default function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className,
  text,
}: LoadingSpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              variants={dotsVariants}
              animate="animate"
              className={cn(
                'rounded-full bg-primary',
                size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        {text && (
          <p className={cn('text-muted-foreground', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className={cn(
            'rounded-full border-2 border-primary',
            sizeClasses[size]
          )}
        />
        {text && (
          <p className={cn('text-muted-foreground', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              variants={bounceVariants}
              animate="animate"
              className={cn(
                'rounded-full bg-primary',
                size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        {text && (
          <p className={cn('text-muted-foreground', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  // Default spinner
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <motion.div
        variants={spinnerVariants}
        animate="animate"
        className={cn(
          'border-2 border-transparent border-t-primary rounded-full',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className={cn('text-muted-foreground text-center max-w-xs', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  )
}

// Loading skeleton component for content placeholders
export function LoadingSkeleton({ 
  className, 
  variant = 'rectangle' 
}: { 
  className?: string
  variant?: 'rectangle' | 'circle' | 'text' 
}) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={cn(
        'bg-muted',
        variant === 'circle' && 'rounded-full',
        variant === 'rectangle' && 'rounded-md',
        variant === 'text' && 'rounded h-4',
        className
      )}
    />
  )
}

// Page loading component for full-page loads
export function PageLoading({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Logo or brand */}
        <img
          src="/logo-sm.png"
          alt="BSN Solution"
          className="h-10 w-auto"
        />
        
        {/* Loading animation */}
        <LoadingSpinner size="lg" variant="dots" />
        
        {/* Message */}
        <p className="text-muted-foreground text-center max-w-sm">
          {message}
        </p>
        
        {/* Progress bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>
      </div>
    </div>
  )
}

// Component loading with glassmorphism effect
export function GlassLoading({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" variant="default" />
        {message && (
          <p className="text-foreground text-center">{message}</p>
        )}
      </div>
    </div>
  )
}

// Button loading state
export function ButtonLoading({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <LoadingSpinner 
      size={size}
      variant="default"
      className="text-current"
    />
  )
}

// Content loading with stagger effect
export function ContentLoading({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: i * 0.1,
            duration: 0.5,
            ease: 'easeOut'
          }}
          className="space-y-3"
        >
          <LoadingSkeleton className="h-4 w-3/4" variant="text" />
          <LoadingSkeleton className="h-4 w-1/2" variant="text" />
        </motion.div>
      ))}
    </div>
  )
}