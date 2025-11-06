import { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Vault Dweller 登入 - 廢土塔羅',
  description: '訪問你的 Pip-Boy 帳戶，繼續你的廢土占卜旅程。',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}