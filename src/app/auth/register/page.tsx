import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Vault Dweller 註冊 - 廢土塔羅',
  description: '註冊你的 Pip-Boy 帳戶，開始你的廢土占卜旅程。',
}

export default function RegisterPage() {
  return <RegisterForm />
}
