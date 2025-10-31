/**
 * Global Not Found Page (404)
 * Fallout Pip-Boy styled error page with ASCII art and glitch effects
 *
 * Performance: Uses PixelIconLite (Server Component) - ~50 modules vs 3127 modules
 */

import Link from 'next/link'
import { PixelIconLite as PixelIcon } from '@/components/ui/icons/PixelIconLite'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-wasteland-darker relative overflow-hidden flex items-center justify-center p-4">
      {/* CRT 掃描線效果 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pip-boy-green/5 to-transparent animate-scanline" />
        <div className="absolute inset-0 bg-pip-boy-green/5 animate-crt-flicker" />
      </div>

      {/* 主要內容區 */}
      <div className="relative z-10 max-w-4xl w-full">
        {/* Vault-Tec 終端機邊框 */}
        <div className="border-4 border-pip-boy-green bg-wasteland-dark/95 shadow-2xl shadow-pip-boy-green/20">
          {/* 終端機標題列 */}
          <div className="bg-pip-boy-green/20 border-b-2 border-pip-boy-green px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <PixelIcon
                name="error-warning"
                variant="warning"
                sizePreset="sm"
                animation="wiggle"
                aria-label="錯誤"
              />
              <span className="text-pip-boy-green font-bold text-sm md:text-lg tracking-wider uppercase">
                VAULT-TEC TERMINAL ERROR
              </span>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-radiation-orange animate-pulse" />
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-warning-yellow" />
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-pip-boy-green" />
            </div>
          </div>

          {/* 錯誤內容區 */}
          <div className="p-4 md:p-8 lg:p-12 space-y-6 md:space-y-8">
            {/* ASCII Art 404 - 使用 Unicode block elements */}
            <div className="relative overflow-hidden">
              {/* 主要 ASCII Art */}
              <pre
                className="text-pip-boy-green font-mono text-xs sm:text-sm md:text-base lg:text-lg leading-tight select-none whitespace-pre overflow-x-auto"
                style={{
                  textShadow: `
                    -1px 0 #ff0040,
                    1px 0 #00ffff,
                    0 0 8px currentColor,
                    0 0 12px currentColor
                  `,
                }}
                aria-label="404 Error"
              >
{`
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
`}
              </pre>

              {/* Glitch 複製層 */}
              <pre
                className="absolute top-0 left-0 text-pip-boy-green/30 font-mono text-xs sm:text-sm md:text-base lg:text-lg leading-tight select-none whitespace-pre pointer-events-none animate-glitch-1"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
                }}
                aria-hidden="true"
              >
{`
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
`}
              </pre>
            </div>

            {/* 錯誤訊息 */}
            <div className="text-center space-y-3">
              <h1 className="text-xl md:text-3xl font-bold text-pip-boy-green uppercase tracking-wider animate-pulse">
                PAGE NOT FOUND
              </h1>
              <p className="text-base md:text-xl text-pip-boy-green/80">
                We all get lost in the wasteland sometimes.
              </p>
            </div>

            {/* 終端機風格錯誤訊息 */}
            <div className="bg-black/60 border-2 border-pip-boy-green/40 p-4 md:p-6 space-y-2 md:space-y-3 font-mono text-xs md:text-sm">
              <div className="flex items-start gap-2 md:gap-3">
                <span className="text-radiation-orange shrink-0">&gt; [ERROR]</span>
                <span className="text-pip-boy-green/90">
                  這個頁面已經被掠奪者洗劫一空了
                </span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <span className="text-warning-yellow shrink-0">&gt; [WARN]</span>
                <span className="text-pip-boy-green/90">
                  檢測到 404 拉德輻射，建議立即撤離
                </span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <span className="text-pip-boy-green shrink-0">&gt; [INFO]</span>
                <span className="text-pip-boy-green/90">
                  Vault-Tec 提醒您：迷路不是您的錯，是廢土太危險
                </span>
              </div>
            </div>

            {/* S.P.E.C.I.A.L. 統計 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-center text-xs md:text-sm">
              <div className="bg-black/40 border border-pip-boy-green/30 p-2 md:p-3">
                <div className="text-[10px] md:text-xs text-pip-boy-green/60 uppercase mb-1">Luck</div>
                <div className="text-xl md:text-2xl font-bold text-radiation-orange">0</div>
              </div>
              <div className="bg-black/40 border border-pip-boy-green/30 p-2 md:p-3">
                <div className="text-[10px] md:text-xs text-pip-boy-green/60 uppercase mb-1">Karma</div>
                <div className="text-xl md:text-2xl font-bold text-warning-yellow">-404</div>
              </div>
              <div className="bg-black/40 border border-pip-boy-green/30 p-2 md:p-3">
                <div className="text-[10px] md:text-xs text-pip-boy-green/60 uppercase mb-1">Rads</div>
                <div className="text-xl md:text-2xl font-bold text-radiation-orange animate-pulse">404</div>
              </div>
              <div className="bg-black/40 border border-pip-boy-green/30 p-2 md:p-3">
                <div className="text-[10px] md:text-xs text-pip-boy-green/60 uppercase mb-1">HP</div>
                <div className="text-xl md:text-2xl font-bold text-pip-boy-green">100%</div>
              </div>
            </div>

            {/* 導航按鈕區 */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4">
              <Link
                href="/"
                className="group flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 border-2 border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green hover:bg-pip-boy-green hover:text-wasteland-dark transition-all duration-200 font-bold uppercase tracking-wider text-sm md:text-base"
              >
                <PixelIcon
                  name="home"
                  sizePreset="sm"
                  className="group-hover:scale-110 transition-transform"
                  aria-label="首頁"
                />
                <span>返回避難所</span>
              </Link>

              <Link
                href="/dashboard"
                className="group flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 border-2 border-pip-boy-green bg-transparent text-pip-boy-green hover:bg-pip-boy-green/20 transition-all duration-200 font-bold uppercase tracking-wider text-sm md:text-base"
              >
                <PixelIcon
                  name="dashboard"
                  sizePreset="sm"
                  className="group-hover:scale-110 transition-transform"
                  aria-label="儀表板"
                />
                <span>前往儀表板</span>
              </Link>
            </div>

            {/* 底部提示 */}
            <div className="text-center text-[10px] md:text-xs text-pip-boy-green/50 pt-4 border-t border-pip-boy-green/20">
              <p className="flex items-center justify-center gap-1 md:gap-2">
                <PixelIcon
                  name="information"
                  sizePreset="xs"
                  decorative
                />
                <span>Vault-Tec 公司提醒您：在廢土中保持警惕，隨時準備好 Rad-X</span>
              </p>
            </div>
          </div>

          {/* 終端機底部狀態列 */}
          <div className="bg-pip-boy-green/10 border-t-2 border-pip-boy-green px-4 md:px-6 py-2 flex flex-wrap items-center justify-between text-[10px] md:text-xs text-pip-boy-green/70 font-mono gap-2">
            <span>STATUS: ERROR</span>
            <span>CODE: 404</span>
            <span className="hidden sm:inline">TERMINAL: VAULT-404</span>
          </div>
        </div>

        {/* 視覺裝飾 - 警告燈效 */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-radiation-orange rounded-full blur-xl animate-pulse opacity-50" />
        <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-pip-boy-green rounded-full blur-xl animate-pulse opacity-50" />
      </div>
    </div>
  )
}
