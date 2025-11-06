'use client'

/**
 * Ascii404 - SVG Component for 404 Error Page
 *
 * Wraps the ascii404.svg file as a React component
 * Includes CRT monitor effects and background
 */

import React from 'react'

interface Ascii404Props {
  className?: string
  style?: React.CSSProperties
}

export function Ascii404({ className, style }: Ascii404Props) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#00ff88',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* CRT Scanlines Effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0, 255, 136, 0.03) 2px, rgba(0, 255, 136, 0.03) 4px)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {/* CRT Flicker Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 255, 136, 0.02)',
          animation: 'crt-flicker 0.15s infinite alternate',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* SVG Content */}
      <object
        data="/assets/ascii404.svg"
        type="image/svg+xml"
        aria-label="404 Error - Radical"
        style={{
          width: '100%',
          height: 'auto',
          pointerEvents: 'none',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Fallback for browsers that don't support object tag */}
        <img
          src="/assets/ascii404.svg"
          alt="404 Error"
          style={{
            width: '100%',
            height: 'auto'
          }}
        />
      </object>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes crt-flicker {
          0% {
            opacity: 0.95;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
