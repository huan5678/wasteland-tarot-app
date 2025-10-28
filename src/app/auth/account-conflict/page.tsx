/**
 * Account Conflict Resolution Page
 * Route: /auth/account-conflict
 * Handles OAuth account conflict resolution (Task 7)
 */

'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AccountConflictPage } from '@/components/auth/AccountConflictPage'

function AccountConflictContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [conflictData, setConflictData] = useState<{
    email: string
    existingAuthMethods: string[]
    oauthProvider: string
    oauthId: string
    profilePicture?: string
  } | null>(null)

  useEffect(() => {
    // Try to get conflict data from URL params or sessionStorage
    const email = searchParams.get('email')
    const existingMethods = searchParams.get('existing_methods')
    const oauthProvider = searchParams.get('oauth_provider')
    const oauthId = searchParams.get('oauth_id')
    const profilePicture = searchParams.get('profile_picture')

    if (email && existingMethods && oauthProvider && oauthId) {
      setConflictData({
        email,
        existingAuthMethods: existingMethods.split(','),
        oauthProvider,
        oauthId,
        profilePicture: profilePicture || undefined,
      })
      return
    }

    // Fallback: Try to get from sessionStorage
    try {
      const storedData = sessionStorage.getItem('oauth-conflict-data')
      if (storedData) {
        const data = JSON.parse(storedData)
        setConflictData(data)
        // Clear sessionStorage after reading
        sessionStorage.removeItem('oauth-conflict-data')
        return
      }
    } catch (err) {
      console.error('Failed to parse conflict data from sessionStorage:', err)
    }

    // No conflict data found, redirect to login
    console.warn('No conflict data found, redirecting to login')
    router.push('/auth/login')
  }, [searchParams, router])

  if (!conflictData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-pip-boy-green">載入中...</div>
      </div>
    )
  }

  return <AccountConflictPage {...conflictData} />
}

export default function AccountConflictRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-pip-boy-green">載入中...</div>
        </div>
      }
    >
      <AccountConflictContent />
    </Suspense>
  )
}
