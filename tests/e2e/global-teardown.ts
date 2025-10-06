import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global teardown for Tarot Card App E2E tests...')

  // Clean up any test data or resources if needed
  // For now, just log the completion

  console.log('✅ Global teardown completed successfully')
}

export default globalTeardown