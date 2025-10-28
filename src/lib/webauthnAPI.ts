/**
 * WebAuthn API 模組 - 與後端 WebAuthn 端點通訊
 *
 * 此模組負責：
 * - 與後端 /api/webauthn/* 端點通訊
 * - 提供 Passkey 註冊和登入的 API 介面
 * - 處理 WebAuthn options 的取得和驗證
 */

import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

/**
 * 取得 Passkey 註冊選項
 *
 * @returns WebAuthn 註冊選項（包含 challenge, user, rp 等）
 * @throws 如果後端返回錯誤
 */
export async function getRegistrationOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const response = await fetch(`${API_BASE_URL}/api/webauthn/register/options`, {
    method: 'GET',
    credentials: 'include', // 包含 httpOnly cookies (JWT token)
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '取得註冊選項失敗' }))
    throw new Error(error.message || '取得註冊選項失敗')
  }

  return response.json()
}

/**
 * 驗證 Passkey 註冊回應
 *
 * @param credential - 瀏覽器產生的 WebAuthn 憑證回應
 * @param credentialName - 使用者自訂的憑證名稱（可選）
 * @returns 驗證結果（包含 success 和 credential_id）
 * @throws 如果後端驗證失敗
 */
export async function verifyRegistration(
  credential: RegistrationResponseJSON,
  credentialName?: string
): Promise<{ success: boolean; credential_id?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/webauthn/register/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      credential,
      credential_name: credentialName || 'My Passkey',
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '註冊驗證失敗' }))
    throw new Error(error.message || '註冊驗證失敗')
  }

  return response.json()
}

/**
 * 完整的 Passkey 註冊流程（簡化版 API）
 *
 * 此函式整合了取得 options、觸發瀏覽器 WebAuthn、驗證回應三個步驟
 * 主要用於測試和簡單的註冊場景
 *
 * @param credentialName - 使用者自訂的憑證名稱
 * @returns 註冊結果
 * @throws 如果任何步驟失敗
 */
export async function registerPasskey(
  credentialName?: string
): Promise<{ success: boolean; credential_id?: string }> {
  // Step 1: 取得註冊選項
  const options = await getRegistrationOptions()

  // Step 2: 觸發瀏覽器 WebAuthn（需在實際的 Hook 中呼叫）
  // 此處僅作為型別範例
  // const credential = await startRegistration(options)

  // Step 3: 驗證註冊回應
  // return verifyRegistration(credential, credentialName)

  // 實際實作應在 Hook 中分步執行
  throw new Error('此函式僅供參考，請在 Hook 中分步呼叫')
}
