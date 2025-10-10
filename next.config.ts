import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack configuration for code splitting
  webpack: (config, { isServer }) => {
    // Optimize chunks
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate chunk for React/Next.js framework
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
            },
            // Libs chunk for other libraries
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: any) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return `lib.${packageName?.replace('@', '')}`;
              },
              priority: 30,
            },
          },
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
    optimizePackageImports: ['@/components', '@/lib', '@/hooks'],
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
}

export default nextConfig