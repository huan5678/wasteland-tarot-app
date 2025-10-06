'use client'

import React, { useState, useEffect } from 'react'
import { Star, ExternalLink, Twitter, MessageSquare } from 'lucide-react'

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null)

  // Set year only on client side to avoid potential hydration mismatch
  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  const footerLinks = [
    { href: '/about', label: '關於我們' },
    { href: '/privacy', label: '隱私政策' },
    { href: '/terms', label: '服務條款' },
    { href: '/contact', label: '聯絡支援' },
  ]

  const socialLinks = [
    { href: 'https://github.com', label: 'GitHub', icon: ExternalLink },
    { href: 'https://twitter.com', label: 'Twitter', icon: Twitter },
    { href: 'https://discord.com', label: 'Discord', icon: MessageSquare },
  ]

  return (
    <footer className="border-t-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-wasteland-dark)'}}>
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-pip-boy-green rounded-full flex items-center justify-center bg-pip-boy-green-deep glow-green">
                <Star className="w-5 h-5 text-pip-boy-green" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-pip-boy text-glow-green">廢土塔羅</h3>
                <p className="text-xs text-muted-wasteland">Pip-Boy 占卜</p>
              </div>
            </div>
            <p className="text-sm text-terminal font-mono leading-relaxed">
              透過古老的塔羅智慧，發現你在末世後廢土中的命運，
              由 Vault-Tec 驅動。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-text-primary mb-4 font-mono">快速存取</h4>
            <nav className="space-y-2">
              {footerLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => window.location.href = link.href}
                  className="block text-sm text-text-secondary hover:text-text-primary transition-colors font-mono cursor-pointer text-left link-pip-boy"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Social & Support */}
          <div>
            <h4 className="text-sm font-bold text-text-primary mb-4 font-mono">社群</h4>
            <div className="space-y-2">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-mono link-pip-boy"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </a>
              ))}
            </div>

            {/* Emergency Info */}
            <div className="mt-6 p-3 border border-border-muted bg-bg-secondary">
              <p className="text-xs text-text-muted font-mono">
                <strong>技術支援：</strong><br />
                Vault-Tec 熱線：1-800-VAULT-TEC<br />
                緊急終端機：B-117-A
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent opacity-30 my-6"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-text-disabled font-mono text-center md:text-left">
            © {currentYear || '----'} Vault-Tec Corporation。保留所有權利。<br />
            "在地下建造更美好的明天。"
          </div>

          <div className="flex items-center gap-4 text-xs text-text-disabled font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse glow-green"></div>
              <span>系統線上</span>
            </div>
            <span>|</span>
            <div>VERSION 3.1.4</div>
            <span>|</span>
            <div>BUILD 20231124</div>
          </div>
        </div>
      </div>

      {/* Terminal Border */}
      <div className="h-2 bg-gradient-to-r from-border-muted via-border-primary to-border-muted"></div>
    </footer>
  )
}