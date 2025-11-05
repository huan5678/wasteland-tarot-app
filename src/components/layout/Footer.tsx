'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

export function Footer() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  // Set year only on client side to avoid potential hydration mismatch
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const footerLinks = [
  { href: '/about', label: '關於我們' },
  { href: '/faq', label: '常見問題' },
  { href: '/privacy', label: '隱私政策' },
  { href: '/terms', label: '服務條款' },
  { href: '/contact', label: '聯絡支援' }];


  const socialLinks = [
  { href: 'https://github.com', label: 'GitHub', icon: 'github', ariaLabel: 'GitHub' },
  { href: 'https://twitter.com', label: 'Twitter', icon: 'external-link', ariaLabel: 'Twitter' },
  { href: 'https://discord.com', label: 'Discord', icon: 'message', ariaLabel: 'Discord' }];


  return (
    <footer
      className="border-t-2 border-pip-boy-green"
      style={{ backgroundColor: 'var(--color-wasteland-dark)' }}>

      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.svg"
                alt="廢土塔羅 Logo"
                className="w-10 h-10"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(85%) sepia(55%) saturate(1000%) hue-rotate(60deg) brightness(100%) contrast(105%) drop-shadow(0 0 4px rgba(0, 255, 65, 0.6))'
                }} />

              <div>
                <h3 className="text-lg font-bold text-pip-boy-green text-glow-green">廢土塔羅</h3>
                <p className="text-xs text-pip-boy-green/60">Pip-Boy 占卜</p>
              </div>
            </div>
            <p className="text-sm text-pip-boy-green/70 leading-relaxed">
              透過古老的塔羅智慧，發現你在末世後廢土中的命運，
              由 Vault-Tec 驅動。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-pip-boy-green mb-4">快速存取</h4>
            <nav className="space-y-2">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(link.href);
                  }}
                  className="flex items-center gap-2 text-sm text-pip-boy-green/70 hover:text-pip-boy-green hover:translate-x-1 transition-all duration-200 cursor-pointer"
                >
                  <PixelIcon
                    name="chevron-right"
                    size={16}
                    className="w-4 h-4"
                    decorative
                  />
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* Social & Support */}
          <div>
            <h4 className="text-sm font-bold text-pip-boy-green mb-4">社群</h4>
            <div className="space-y-2">
              {socialLinks.map((link) =>
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-pip-boy-green/70 hover:text-pip-boy-green hover:translate-x-1 transition-all duration-200">

                  <PixelIcon
                  name={link.icon}
                  size={16}
                  className="w-4 h-4"
                  aria-label={link.ariaLabel} />

                  <span>{link.label}</span>
                </a>
              )}
            </div>

            {/* Emergency Info */}
            <div className="mt-6 p-3 border border-pip-boy-green/30 bg-pip-boy-green/5">
              <p className="text-xs text-pip-boy-green/60">
                <strong className="text-pip-boy-green/80">技術支援：</strong><br />
                Vault-Tec 熱線：1-800-VAULT-TEC<br />
                緊急終端機：B-117-A
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-pip-boy-green to-transparent opacity-30 my-6"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-pip-boy-green/50 text-center md:text-left">
            © {currentYear || '----'} Vault-Tec Corporation。保留所有權利。<br />
            "在地下建造更美好的明天。"
          </div>

          <div className="flex items-center gap-4 text-xs text-pip-boy-green/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pip-boy-green rounded-full animate-pulse"></div>
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
      <div className="h-2 bg-gradient-to-r from-pip-boy-green/20 via-pip-boy-green to-pip-boy-green/20"></div>
    </footer>);

}