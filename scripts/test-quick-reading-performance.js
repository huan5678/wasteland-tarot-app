#!/usr/bin/env node
/**
 * 快速占卜頁面效能測試腳本
 * 任務 17.1 - 頁面載入效能測試
 *
 * 測試目標：
 * - LCP < 2.5s
 * - FCP < 1.5s
 * - TTI < 3.5s
 * - CLS < 0.1
 */

const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs').promises
const path = require('path')

const QUICK_READING_URL = 'http://localhost:3000/readings/quick'
const REPORT_DIR = path.join(__dirname, '../lighthouse-reports')

// 效能標準（符合任務 17.1 要求）
const PERFORMANCE_STANDARDS = {
  LCP: 2500, // ms
  FCP: 1500, // ms
  TTI: 3500, // ms
  CLS: 0.1,  // score
}

async function runLighthouse() {
  console.log('🚀 啟動 Chrome Launcher...')

  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      '--headless',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ]
  })

  const options = {
    logLevel: 'info',
    output: 'html',
    port: chrome.port,
    onlyCategories: ['performance'],
  }

  console.log(`📊 執行 Lighthouse 測試: ${QUICK_READING_URL}`)

  const runnerResult = await lighthouse(QUICK_READING_URL, options)

  await chrome.kill()

  return runnerResult
}

function extractMetrics(result) {
  const audits = result.lhr.audits

  return {
    LCP: audits['largest-contentful-paint'].numericValue,
    FCP: audits['first-contentful-paint'].numericValue,
    TTI: audits['interactive'].numericValue,
    CLS: audits['cumulative-layout-shift'].numericValue,
    TBT: audits['total-blocking-time'].numericValue,
    SI: audits['speed-index'].numericValue,
    performanceScore: result.lhr.categories.performance.score * 100,
  }
}

function validateMetrics(metrics) {
  const results = {
    passed: [],
    failed: [],
  }

  // 檢查 LCP
  if (metrics.LCP <= PERFORMANCE_STANDARDS.LCP) {
    results.passed.push(`✅ LCP: ${(metrics.LCP / 1000).toFixed(2)}s (目標: ${PERFORMANCE_STANDARDS.LCP / 1000}s)`)
  } else {
    results.failed.push(`❌ LCP: ${(metrics.LCP / 1000).toFixed(2)}s (目標: ${PERFORMANCE_STANDARDS.LCP / 1000}s)`)
  }

  // 檢查 FCP
  if (metrics.FCP <= PERFORMANCE_STANDARDS.FCP) {
    results.passed.push(`✅ FCP: ${(metrics.FCP / 1000).toFixed(2)}s (目標: ${PERFORMANCE_STANDARDS.FCP / 1000}s)`)
  } else {
    results.failed.push(`❌ FCP: ${(metrics.FCP / 1000).toFixed(2)}s (目標: ${PERFORMANCE_STANDARDS.FCP / 1000}s)`)
  }

  // 檢查 TTI
  if (metrics.TTI <= PERFORMANCE_STANDARDS.TTI) {
    results.passed.push(`✅ TTI: ${(metrics.TTI / 1000).toFixed(2)}s (目標: ${PERFORMANCE_STANDARDS.TTI / 1000}s)`)
  } else {
    results.failed.push(`❌ TTI: ${(metrics.TTI / 1000).toFixed(2)}s (目標: ${PERFORMANCE_STANDARDS.TTI / 1000}s)`)
  }

  // 檢查 CLS
  if (metrics.CLS <= PERFORMANCE_STANDARDS.CLS) {
    results.passed.push(`✅ CLS: ${metrics.CLS.toFixed(3)} (目標: ${PERFORMANCE_STANDARDS.CLS})`)
  } else {
    results.failed.push(`❌ CLS: ${metrics.CLS.toFixed(3)} (目標: ${PERFORMANCE_STANDARDS.CLS})`)
  }

  return results
}

async function saveReport(result) {
  await fs.mkdir(REPORT_DIR, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(REPORT_DIR, `quick-reading-${timestamp}.html`)

  await fs.writeFile(reportPath, result.report)

  console.log(`\n📄 報告已儲存: ${reportPath}`)
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  快速占卜頁面效能測試 - Lighthouse CI')
  console.log('  任務 17.1: 頁面載入效能測試')
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    const result = await runLighthouse()
    const metrics = extractMetrics(result)
    const validation = validateMetrics(metrics)

    console.log('\n📈 效能指標:')
    console.log('─────────────────────────────────────────────────────')
    console.log(`Performance Score: ${metrics.performanceScore.toFixed(1)}/100`)
    console.log(`LCP (Largest Contentful Paint): ${(metrics.LCP / 1000).toFixed(2)}s`)
    console.log(`FCP (First Contentful Paint): ${(metrics.FCP / 1000).toFixed(2)}s`)
    console.log(`TTI (Time to Interactive): ${(metrics.TTI / 1000).toFixed(2)}s`)
    console.log(`CLS (Cumulative Layout Shift): ${metrics.CLS.toFixed(3)}`)
    console.log(`TBT (Total Blocking Time): ${metrics.TBT.toFixed(0)}ms`)
    console.log(`SI (Speed Index): ${(metrics.SI / 1000).toFixed(2)}s`)

    console.log('\n✓ 驗證結果:')
    console.log('─────────────────────────────────────────────────────')

    if (validation.passed.length > 0) {
      console.log('\n通過的指標:')
      validation.passed.forEach(msg => console.log(`  ${msg}`))
    }

    if (validation.failed.length > 0) {
      console.log('\n未通過的指標:')
      validation.failed.forEach(msg => console.log(`  ${msg}`))
    }

    await saveReport(result)

    console.log('\n═══════════════════════════════════════════════════════')

    if (validation.failed.length === 0) {
      console.log('✅ 所有效能指標都符合標準！')
      console.log('═══════════════════════════════════════════════════════\n')
      process.exit(0)
    } else {
      console.log(`⚠️  有 ${validation.failed.length} 個指標未達標準`)
      console.log('═══════════════════════════════════════════════════════\n')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ 測試執行失敗:', error.message)
    process.exit(1)
  }
}

main()
