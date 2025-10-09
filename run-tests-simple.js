#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🚀 執行廢土塔羅網站功能測試')

// 確保目錄存在
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results', { recursive: true })
}
if (!fs.existsSync('test-results/screenshots')) {
  fs.mkdirSync('test-results/screenshots', { recursive: true })
}

const tests = [
  { name: '中文化驗證', command: 'npx playwright test tests/e2e/01-localization.spec.ts --project=chromium' },
  { name: '導航功能', command: 'npx playwright test tests/e2e/02-navigation-functionality.spec.ts --project=chromium' },
  { name: '互動元素', command: 'npx playwright test tests/e2e/04-interactive-elements.spec.ts --project=chromium' },
  { name: '響應式設計', command: 'npx playwright test tests/e2e/05-responsive-design.spec.ts --project=chromium' }
]

const results = []

for (const test of tests) {
  try {
    console.log(`\n🧪 執行 ${test.name} 測試...`)
    const output = execSync(test.command, { encoding: 'utf8', stdio: 'pipe' })
    console.log(`✅ ${test.name} 測試完成`)
    results.push({ name: test.name, status: 'passed', output })
  } catch (error) {
    console.log(`❌ ${test.name} 測試失敗`)
    console.log(error.stdout || error.message)
    results.push({ name: test.name, status: 'failed', error: error.stdout || error.message })
  }
}

// 生成簡單報告
const passed = results.filter(r => r.status === 'passed').length
const total = results.length

console.log('\n📊 測試摘要:')
console.log(`✅ 通過: ${passed}/${total}`)
console.log(`❌ 失敗: ${total - passed}/${total}`)

results.forEach(result => {
  console.log(`${result.status === 'passed' ? '✅' : '❌'} ${result.name}`)
})

console.log('\n📸 截圖已保存到 test-results/screenshots/')