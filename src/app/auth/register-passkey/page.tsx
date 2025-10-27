/**
 * Passkey Registration Page
 * 使用 Passkey (WebAuthn) 註冊新使用者
 */

import { Metadata } from 'next'
import { PasskeyRegistrationForm } from '@/components/auth/PasskeyRegistrationForm'
import Link from 'next/link'
import { PixelIcon } from '@/components/ui/icons'

export const metadata: Metadata = {
  title: 'Passkey 註冊 - 廢土塔羅',
  description: '使用生物辨識（指紋、Face ID）或安全金鑰快速註冊你的 Pip-Boy 帳戶。',
}

export default function RegisterPasskeyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Vault-Tec Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl text-pip-boy-green mb-2">
            VAULT-TEC
          </h1>
          <p className="text-pip-boy-green text-lg">
            Passkey 快速註冊終端機
          </p>
          <div className="w-full h-px bg-pip-boy-green mt-4 opacity-50"></div>
        </div>

        {/* Passkey Registration Form Container */}
        <div className="bg-wasteland-dark border-2 border-pip-boy-green rounded-none p-6 shadow-lg shadow-pip-boy-green/20">
          {/* Info Section */}
          <div className="mb-6">
            <h2 className="text-xl text-pip-boy-green mb-2 flex items-center gap-2">
              <PixelIcon name="fingerprint" size={24} decorative />
              使用 Passkey 註冊
            </h2>
            <p className="text-pip-boy-green/70 text-sm mb-3">
              使用生物辨識（指紋、Face ID）或安全金鑰註冊，更快速、更安全。
            </p>
            <ul className="text-pip-boy-green/60 text-xs space-y-1 list-disc list-inside">
              <li>無需記憶密碼</li>
              <li>更安全的生物辨識驗證</li>
              <li>支援多裝置同步</li>
            </ul>
          </div>

          {/* Passkey Registration Form */}
          <PasskeyRegistrationForm />
        </div>

        {/* Links */}
        <div className="mt-6 space-y-3">
          <Link
            href="/auth?tab=register"
            className="text-pip-boy-green text-sm hover:text-pip-boy-green/80 transition-colors flex items-center justify-center gap-2"
          >
            <PixelIcon name="arrow-left" size={16} decorative />
            返回傳統註冊方式
          </Link>
          <Link
            href="/auth?tab=login"
            className="text-pip-boy-green/70 text-sm hover:text-pip-boy-green/50 transition-colors block text-center"
          >
            已經有帳號？返回登入
          </Link>
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
