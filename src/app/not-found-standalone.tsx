/**
 * Standalone Not Found Page (404) - No Layout Dependencies
 * Fallout Pip-Boy styled error page with minimal dependencies
 *
 * This file bypasses layout.tsx to avoid loading 3000+ modules
 * Performance: <100 modules, <2s compile time
 */

import Link from 'next/link'

export default function NotFoundStandalone() {
  return (
    <html lang="zh-TW" className="dark">
      <head>
        <title>404 - 頁面不存在 | 廢土塔羅</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Load RemixIcon CSS for icons */}
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.7.0/fonts/remixicon.css" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{__html: `
          /* Inline minimal styles to avoid globals.css */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Cubic 11', monospace, sans-serif;
            background-color: #0a0a0a;
            color: #00ff88;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }

          .container {
            max-width: 64rem;
            width: 100%;
          }

          .terminal {
            border: 4px solid #00ff88;
            background-color: rgba(10, 10, 10, 0.95);
            box-shadow: 0 25px 50px -12px rgba(0, 255, 136, 0.2);
          }

          .header {
            background-color: rgba(0, 255, 136, 0.2);
            border-bottom: 2px solid #00ff88;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .title {
            font-weight: bold;
            font-size: 1.125rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .status-lights {
            display: flex;
            gap: 0.5rem;
          }

          .status-light {
            width: 0.75rem;
            height: 0.75rem;
            border-radius: 50%;
          }

          .light-orange {
            background-color: #ff8800;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          .light-yellow {
            background-color: #ffdd00;
          }

          .light-green {
            background-color: #00ff88;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .content {
            padding: 3rem 2rem;
            text-align: center;
            space-y: 2rem;
          }

          .ascii-art {
            font-family: monospace;
            font-size: 0.75rem;
            line-height: 1.2;
            color: #00ff88;
            text-shadow: 0 0 8px currentColor;
            white-space: pre;
            overflow-x: auto;
            margin-bottom: 2rem;
          }

          .error-title {
            font-size: 1.875rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          .error-description {
            font-size: 1.25rem;
            color: rgba(0, 255, 136, 0.8);
            margin-bottom: 2rem;
          }

          .terminal-messages {
            background-color: rgba(0, 0, 0, 0.6);
            border: 2px solid rgba(0, 255, 136, 0.4);
            padding: 1.5rem;
            margin: 2rem 0;
            text-align: left;
            font-family: monospace;
            font-size: 0.875rem;
          }

          .terminal-message {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .terminal-message:last-child {
            margin-bottom: 0;
          }

          .msg-error {
            color: #ff8800;
          }

          .msg-warn {
            color: #ffdd00;
          }

          .msg-info {
            color: #00ff88;
          }

          .buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
          }

          @media (min-width: 640px) {
            .buttons {
              flex-direction: row;
            }
          }

          .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 0.75rem 1.5rem;
            border: 2px solid #00ff88;
            background-color: rgba(0, 255, 136, 0.1);
            color: #00ff88;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
          }

          .btn:hover {
            background-color: #00ff88;
            color: #0a0a0a;
          }

          .btn-secondary {
            background-color: transparent;
          }

          .btn-secondary:hover {
            background-color: rgba(0, 255, 136, 0.2);
            color: #00ff88;
          }

          .footer {
            background-color: rgba(0, 255, 136, 0.1);
            border-top: 2px solid #00ff88;
            padding: 0.5rem 1.5rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            font-family: monospace;
            font-size: 0.75rem;
            color: rgba(0, 255, 136, 0.7);
          }
        `}} />
      </head>
      <body>
        <div className="container">
          <div className="terminal">
            {/* Terminal Header */}
            <div className="header">
              <div className="title">
                <i className="ri-error-warning-line" style={{marginRight: '0.5rem'}}></i>
                VAULT-TEC TERMINAL ERROR
              </div>
              <div className="status-lights">
                <div className="status-light light-orange"></div>
                <div className="status-light light-yellow"></div>
                <div className="status-light light-green"></div>
              </div>
            </div>

            {/* Error Content */}
            <div className="content">
              {/* ASCII Art 404 */}
              <div className="ascii-art" aria-label="404 Error">{`
  ███████╗██████╗ ██████╗  ██████╗ ██████╗
  ██╔════╝██╔══██╗██╔══██╗██╔═████╗██╔══██╗
  █████╗  ██████╔╝██████╔╝██║██╔██║██████╔╝
  ██╔══╝  ██╔══██╗██╔══██╗████╔╝██║██╔══██╗
  ███████╗██║  ██║██║  ██║╚██████╔╝██║  ██║
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝

  ░░██╗░░██╗░░░░██████╗░░██╗░░██╗░░░░░░░░░
  ░██╔╝░██╔╝░░░░██╔══██╗░██║░██╔╝░░░░░░░░░
  ██╔╝░██╔╝░░░░░██║░░██║░████╔╝░░░░░░░░░░░
  ███████║░░░░░░██║░░██║░╚██╔╝░░░░░░░░░░░░
  ╚════██║░░░░░░██████╔╝░░██║░░░░░░░░░░░░░
  ░░░░░╚═╝░░░░░░╚═════╝░░░╚═╝░░░░░░░░░░░░░
`}</div>

              {/* Error Messages */}
              <div>
                <h1 className="error-title">PAGE NOT FOUND</h1>
                <p className="error-description">We all get lost in the wasteland sometimes.</p>
              </div>

              {/* Terminal-style Messages */}
              <div className="terminal-messages">
                <div className="terminal-message">
                  <span className="msg-error">&gt; [ERROR]</span>
                  <span>這個頁面已經被掠奪者洗劫一空了</span>
                </div>
                <div className="terminal-message">
                  <span className="msg-warn">&gt; [WARN]</span>
                  <span>檢測到 404 拉德輻射，建議立即撤離</span>
                </div>
                <div className="terminal-message">
                  <span className="msg-info">&gt; [INFO]</span>
                  <span>Vault-Tec 提醒您：迷路不是您的錯，是廢土太危險</span>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="buttons">
                <Link href="/" className="btn">
                  <i className="ri-home-line"></i>
                  <span>返回避難所</span>
                </Link>

                <Link href="/dashboard" className="btn btn-secondary">
                  <i className="ri-dashboard-line"></i>
                  <span>前往儀表板</span>
                </Link>
              </div>
            </div>

            {/* Terminal Footer */}
            <div className="footer">
              <span>STATUS: ERROR</span>
              <span>CODE: 404</span>
              <span>TERMINAL: VAULT-404</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
