import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Starting global setup for Tarot Card App E2E tests...')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Test if the development server is accessible
    await page.goto('http://localhost:3002')
    await page.waitForLoadState('networkidle')
    console.log('✅ Development server is running and accessible')
  } catch (error) {
    console.error('❌ Failed to connect to development server:', error)
    throw new Error('Development server is not running on port 3002. Please start it with "npm run dev"')
  } finally {
    await browser.close()
  }

  console.log('🎯 Global setup completed successfully')
}

export default globalSetup