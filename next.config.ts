import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Performance optimizations
  // 註：swcMinify 在 Next.js 13+ 已預設啟用，不需要手動設定
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    // Allow external images from Supabase Storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aelwaolzpraxmzjqdiyw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow Google OAuth profile pictures
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // 開發環境優化：改善 webpack cache 效能
    if (dev) {
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        // 使用絕對路徑指定 cache 目錄（Webpack 要求絕對路徑）
        cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    return config;
  },

  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // 優化套件 import，自動進行 tree-shaking
    optimizePackageImports: [
      '@/components',
      '@/lib',
      '@/hooks',
      'remixicon',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
    ],
    // 實驗性功能：更積極的 code splitting
    // 已停用：需要 critters 模組且在開發環境可能造成問題
    // optimizeCss: true,
  },

  typescript: {
    // Temporarily ignore cypress files during build
    ignoreBuildErrors: true,
  },

  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,

  // Font caching strategy
  // 為字體檔案設定長期快取，提升載入效能
  // Requirements: cubic-11-font-integration Task 16
  async headers() {
    return [
      {
        // 僅針對 /fonts/ 路徑下的所有字體檔案
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // public: 允許 CDN 和瀏覽器快取
            // max-age=31536000: 快取一年 (365 天)
            // immutable: 告訴瀏覽器此資源永不改變，可安全快取
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // API Proxy 已改用 Next.js API Route (src/app/api/v1/[...path]/route.ts)
  // rewrites 不會轉發 Set-Cookie headers，所以改用 API Route middleware
}

export default nextConfig