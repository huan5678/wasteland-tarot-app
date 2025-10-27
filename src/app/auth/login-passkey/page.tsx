/**
 * Passkey Login Page
 * 使用 Passkey (WebAuthn) 登入
 * Usernameless 模式：無需輸入 email，直接使用生物辨識
 */

import { Metadata } from 'next'
import { PasskeyLoginForm } from '@/components/auth/PasskeyLoginForm'
import Link from 'next/link'
import { PixelIcon } from '@/components/ui/icons'

export const metadata: Metadata = {
  title: 'Passkey 登入 - 廢土塔羅',
  description: '使用生物辨識（指紋、Face ID）或安全金鑰快速登入你的 Pip-Boy 帳戶。',
}

export default function LoginPasskeyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Vault-Tec Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl text-pip-boy-green mb-2">
            VAULT-TEC
          </h1>
          <p className="text-pip-boy-green text-lg">
            Passkey 快速登入終端機
          </p>
          <div className="w-full h-px bg-pip-boy-green mt-4 opacity-50"></div>
        </div>

        {/* Passkey Login Form Container */}
        <div className="bg-wasteland-dark border-2 border-pip-boy-green rounded-none p-6 shadow-lg shadow-pip-boy-green/20">
          {/* Info Section */}
          <div className="mb-6">
            <h2 className="text-xl text-pip-boy-green mb-2 flex items-center gap-2">
              <PixelIcon name="fingerprint" size={24} decorative />
              使用 Passkey 登入
            </h2>
            <p className="text-pip-boy-green/70 text-sm mb-3">
              點擊下方按鈕，使用你的生物辨識（指紋、Face ID）或安全金鑰登入。
            </p>
            <div className="bg-pip-boy-green/10 border border-pip-boy-green/30 p-3 rounded text-xs text-pip-boy-green/80">
              <p className="flex items-start gap-2">
                <PixelIcon name="info" size={14} className="mt-0.5 flex-shrink-0" decorative />
                <span>
                  Passkey 登入使用 Usernameless 模式，無需輸入 email，直接驗證你的身份。
                </span>
              </p>
            </div>
          </div>

          {/* Passkey Login Form (Usernameless mode) */}
          <PasskeyLoginForm
            showEmailField={false}
            enableConditionalUI={false}
          />
        </div>

        {/* Links */}
        <div className="mt-6 space-y-3">
          <Link
            href="/auth?tab=login"
            className="text-pip-boy-green text-sm hover:text-pip-boy-green/80 transition-colors flex items-center justify-center gap-2"
          >
            <PixelIcon name="arrow-left" size={16} decorative />
            返回傳統登入方式
          </Link>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link
              href="/auth?tab=register"
              className="text-pip-boy-green/70 hover:text-pip-boy-green/50 transition-colors"
            >
              沒有帳號？註冊
            </Link>
            <span className="text-pip-boy-green/30">|</span>
            <Link
              href="/auth/register-passkey"
              className="text-pip-boy-green/70 hover:text-pip-boy-green/50 transition-colors"
            >
              註冊 Passkey
            </Link>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="mt-8 text-center">
          <p className="text-pip-boy-green/50 text-xs">
            Vault-Tec：在地下建造更美好的明天
          </p>
        </div>
      </div>
    </div>
  )
}
