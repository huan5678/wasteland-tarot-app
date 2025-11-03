'use client'

/**
 * Global Not Found Page (404)
 * Fallout Pip-Boy styled error page
 */

import Link from 'next/link'
import { PixelIcon } from '@/components/ui/icons'
import { Ascii404 } from '@/components/ui/Ascii404'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'monospace'
    }}>
      <div style={{
        maxWidth: '64rem',
        width: '100%'
      }}>
        {/* Vault-Tec Terminal Border */}
        <div style={{
          border: '4px solid #00ff88',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          boxShadow: '0 25px 50px -12px rgba(0, 255, 136, 0.2)'
        }}>
          {/* Terminal Header */}
          <div style={{
            backgroundColor: 'rgba(0, 255, 136, 0.2)',
            borderBottom: '2px solid #00ff88',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <span style={{
              color: '#00ff88',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              ⚠ VAULT-TEC TERMINAL ERROR
            </span>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: '#ff8800'
              }} />
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: '#ffdd00'
              }} />
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: '#00ff88'
              }} />
            </div>
          </div>

          {/* Error Content */}
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            {/* ASCII Art - SVG Component */}
            <Ascii404 style={{ marginBottom: '2rem' }} />

            {/* Error Title */}
            <h1 style={{
              fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
              fontWeight: 'bold',
              color: '#00ff88',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              PAGE NOT FOUND
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              color: 'rgba(0, 255, 136, 0.8)',
              marginBottom: '2rem'
            }}>
              We all get lost in the wasteland sometimes.
            </p>

            {/* Terminal Messages */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid rgba(0, 255, 136, 0.4)',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{ color: '#ff8800', flexShrink: 0 }}>&gt; [ERROR]</span>
                <span style={{ color: 'rgba(0, 255, 136, 0.9)' }}>這個頁面已經被掠奪者洗劫一空了</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{ color: '#ffdd00', flexShrink: 0 }}>&gt; [WARN]</span>
                <span style={{ color: 'rgba(0, 255, 136, 0.9)' }}>檢測到 404 拉德輻射，建議立即撤離</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <span style={{ color: '#00ff88', flexShrink: 0 }}>&gt; [INFO]</span>
                <span style={{ color: 'rgba(0, 255, 136, 0.9)' }}>Vault-Tec 提醒您：迷路不是您的錯，是廢土太危險</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  border: '2px solid #00ff88',
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                  color: '#00ff88',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
              >
                <PixelIcon name="home" sizePreset="sm" />
                <span>返回避難所</span>
              </Link>

              <Link
                href="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  border: '2px solid #00ff88',
                  backgroundColor: 'transparent',
                  color: '#00ff88',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
              >
                <PixelIcon name="dashboard" sizePreset="sm" />
                <span>前往儀表板</span>
              </Link>
            </div>
          </div>

          {/* Terminal Footer */}
          <div style={{
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            borderTop: '2px solid #00ff88',
            padding: '0.5rem 1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
            color: 'rgba(0, 255, 136, 0.7)'
          }}>
            <span>STATUS: ERROR</span>
            <span>CODE: 404</span>
            <span className="hidden sm:inline">TERMINAL: VAULT-404</span>
          </div>
        </div>
      </div>
    </div>
  )
}
