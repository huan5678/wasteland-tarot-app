'use client'

import { useEffect, useRef } from 'react'

/**
 * Pixel class for individual pixel animation
 * Based on PixelCard.tsx implementation
 */
class Pixel {
  width: number
  height: number
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  color: string
  speed: number
  size: number
  sizeStep: number
  minSize: number
  maxSizeInteger: number
  maxSize: number
  delay: number
  counter: number
  counterStep: number
  isIdle: boolean
  isReverse: boolean
  isShimmer: boolean

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number
  ) {
    this.width = canvas.width
    this.height = canvas.height
    this.ctx = context
    this.x = x
    this.y = y
    this.color = color
    this.speed = this.getRandomValue(0.1, 0.9) * speed
    this.size = 0
    this.sizeStep = Math.random() * 0.4
    this.minSize = 0.5
    this.maxSizeInteger = 2
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger)
    this.delay = delay
    this.counter = 0
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01
    this.isIdle = false
    this.isReverse = false
    this.isShimmer = false
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5
    this.ctx.fillStyle = this.color
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size)
  }

  appear() {
    this.isIdle = false
    if (this.counter <= this.delay) {
      this.counter += this.counterStep
      return
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true
    }
    if (this.isShimmer) {
      this.shimmer()
    } else {
      this.size += this.sizeStep
    }
    this.draw()
  }

  disappear() {
    this.isShimmer = false
    this.counter = 0
    if (this.size <= 0) {
      this.isIdle = true
      return
    } else {
      this.size -= 0.1
    }
    this.draw()
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true
    } else if (this.size <= this.minSize) {
      this.isReverse = false
    }
    if (this.isReverse) {
      this.size -= this.speed
    } else {
      this.size += this.speed
    }
  }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
  const min = 0
  const max = 100
  const throttle = 0.001

  if (value <= min || reducedMotion) {
    return min
  } else if (value >= max) {
    return max * throttle
  } else {
    return value * throttle
  }
}

interface CardBackPixelEffectProps {
  /**
   * Whether the hover effect is active
   */
  isHovered: boolean
  /**
   * Pip-Boy green colors for the pixel effect
   * Format: comma-separated hex colors
   */
  colors?: string
  /**
   * Gap between pixels (smaller = more dense)
   */
  gap?: number
  /**
   * Animation speed (0-100)
   */
  speed?: number
  /**
   * Additional CSS classes for the canvas container
   */
  className?: string
}

/**
 * CardBackPixelEffect - Pixel hover effect for card backs
 * Based on PixelCard.tsx, adapted for Wasteland Tarot aesthetic
 */
export function CardBackPixelEffect({
  isHovered,
  colors = '#00ff88,#00cc70,#00aa5c,#008848', // Pip-Boy green variants
  gap = 8,
  speed = 40,
  className = ''
}: CardBackPixelEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pixelsRef = useRef<Pixel[]>([])
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)
  const timePreviousRef = useRef(performance.now())
  const reducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const width = Math.floor(rect.width)
    const height = Math.floor(rect.height)
    const ctx = canvasRef.current.getContext('2d')

    if (!ctx) return

    canvasRef.current.width = width
    canvasRef.current.height = height
    canvasRef.current.style.width = `${width}px`
    canvasRef.current.style.height = `${height}px`

    const colorsArray = colors.split(',')
    const pxs = []

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)]
        const dx = x - width / 2
        const dy = y - height / 2
        const distance = Math.sqrt(dx * dx + dy * dy)
        const delay = reducedMotion ? 0 : distance

        pxs.push(
          new Pixel(
            canvasRef.current,
            ctx,
            x,
            y,
            color,
            getEffectiveSpeed(speed, reducedMotion),
            delay
          )
        )
      }
    }
    pixelsRef.current = pxs
  }

  const doAnimate = (fnName: keyof Pixel) => {
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName))
    const timeNow = performance.now()
    const timePassed = timeNow - timePreviousRef.current
    const timeInterval = 1000 / 60

    if (timePassed < timeInterval) return
    timePreviousRef.current = timeNow - (timePassed % timeInterval)

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !canvasRef.current) return

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    let allIdle = true
    for (let i = 0; i < pixelsRef.current.length; i++) {
      const pixel = pixelsRef.current[i]
      // @ts-ignore
      pixel[fnName]()
      if (!pixel.isIdle) {
        allIdle = false
      }
    }
    if (allIdle && animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const handleAnimation = (name: keyof Pixel) => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(() => doAnimate(name))
  }

  // Trigger animation based on hover state
  useEffect(() => {
    if (isHovered) {
      handleAnimation('appear')
    } else {
      handleAnimation('disappear')
    }
  }, [isHovered])

  // Initialize pixels on mount and resize
  useEffect(() => {
    initPixels()

    const observer = new ResizeObserver(() => {
      initPixels()
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gap, speed, colors])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none rounded-lg ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-70 rounded-lg"
        aria-hidden="true"
      />
    </div>
  )
}
