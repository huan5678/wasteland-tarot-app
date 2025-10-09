#!/usr/bin/env node

/**
 * 廢土塔羅網站完整功能測試執行器
 *
 * 此腳本將執行所有 E2E 測試並生成詳細報告
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 測試配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3002',
  outputDir: 'test-results',
  screenshotDir: 'test-results/screenshots',
  reportFile: 'test-results/test-report.html'
}

// 測試套件定義
const TEST_SUITES = [
  {
    name: '中文化驗證測試',
    file: '01-localization.spec.ts',
    description: '檢查所有文字是否正確中文化，確認無遺漏的英文內容'
  },
  {
    name: '導航功能測試',
    file: '02-navigation-functionality.spec.ts',
    description: '測試 Header 導航、按鈕點擊、URL 路由等導航功能'
  },
  {
    name: '認證功能測試',
    file: '03-auth-functionality.spec.ts',
    description: '測試登入、註冊功能和認證狀態管理'
  },
  {
    name: '互動元素測試',
    file: '04-interactive-elements.spec.ts',
    description: '測試按鈕響應、表單互動、鍵盤導航等用戶互動'
  },
  {
    name: '響應式設計測試',
    file: '05-responsive-design.spec.ts',
    description: '測試各種螢幕尺寸下的顯示效果和適應性'
  },
  {
    name: '性能和載入測試',
    file: '06-performance-loading.spec.ts',
    description: '測試頁面載入速度、資源載入、Console 錯誤等性能指標'
  },
  {
    name: '用戶體驗測試',
    file: '07-user-experience.spec.ts',
    description: '測試視覺效果、互動流暢度、可用性等用戶體驗要素'
  }
]

// 確保輸出目錄存在
function ensureDirectories() {
  const dirs = [TEST_CONFIG.outputDir, TEST_CONFIG.screenshotDir]
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 創建目錄: ${dir}`)
    }
  })
}

// 檢查開發服務器是否運行
async function checkServer() {
  try {
    const { exec } = require('child_process')
    const util = require('util')
    const execAsync = util.promisify(exec)

    console.log(`🔍 檢查開發服務器 ${TEST_CONFIG.baseUrl}...`)

    // 使用 curl 檢查服務器
    await execAsync(`curl -f ${TEST_CONFIG.baseUrl} > /dev/null 2>&1`)
    console.log('✅ 開發服務器正常運行')
    return true
  } catch (error) {
    console.error('❌ 開發服務器未運行')
    console.error('請先執行 "npm run dev" 啟動開發服務器')
    return false
  }
}

// 執行單個測試套件
function runTestSuite(suite) {
  try {
    console.log(`\n🧪 執行測試: ${suite.name}`)
    console.log(`📋 描述: ${suite.description}`)

    const command = `npx playwright test tests/e2e/${suite.file} --reporter=list,html`
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })

    console.log('✅ 測試完成')
    return {
      name: suite.name,
      file: suite.file,
      description: suite.description,
      status: 'passed',
      output: output
    }
  } catch (error) {
    console.error(`❌ 測試失敗: ${suite.name}`)
    console.error(error.stdout || error.message)

    return {
      name: suite.name,
      file: suite.file,
      description: suite.description,
      status: 'failed',
      error: error.stdout || error.message
    }
  }
}

// 生成測試報告
function generateReport(results) {
  const passedTests = results.filter(r => r.status === 'passed').length
  const failedTests = results.filter(r => r.status === 'failed').length
  const totalTests = results.length

  const reportHtml = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>廢土塔羅網站 E2E 測試報告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #1a1a1a;
            color: #00ff00;
        }
        .header {
            background: linear-gradient(135deg, #2d5016 0%, #1a2f0a 100%);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            border: 2px solid #00ff00;
        }
        .title {
            font-size: 2.5em;
            margin: 0 0 10px 0;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
        }
        .subtitle {
            font-size: 1.2em;
            color: #88ff88;
            margin: 0;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #00ff00;
        }
        .summary-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .passed { color: #00ff00; }
        .failed { color: #ff4444; }
        .test-suite {
            background: #2a2a2a;
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #444;
        }
        .test-header {
            background: #333;
            padding: 15px 20px;
            border-bottom: 1px solid #444;
        }
        .test-name {
            font-size: 1.3em;
            font-weight: bold;
            margin: 0 0 5px 0;
        }
        .test-description {
            color: #aaa;
            margin: 0;
        }
        .test-content {
            padding: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .status-passed {
            background: #00ff00;
            color: #000;
        }
        .status-failed {
            background: #ff4444;
            color: #fff;
        }
        .error-output {
            background: #1a1a1a;
            border: 1px solid #ff4444;
            border-radius: 4px;
            padding: 15px;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            color: #ff6666;
        }
        .timestamp {
            color: #888;
            font-size: 0.9em;
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #444;
        }
        .pip-boy-frame {
            border: 3px solid #00ff00;
            background: rgba(0, 255, 0, 0.1);
            padding: 2px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">廢土塔羅網站 E2E 測試報告</h1>
        <p class="subtitle">Vault-Tec Pip-Boy 測試終端機</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <div class="summary-number">${totalTests}</div>
            <div>總測試套件</div>
        </div>
        <div class="summary-card">
            <div class="summary-number passed">${passedTests}</div>
            <div>通過測試</div>
        </div>
        <div class="summary-card">
            <div class="summary-number failed">${failedTests}</div>
            <div>失敗測試</div>
        </div>
        <div class="summary-card">
            <div class="summary-number">${((passedTests / totalTests) * 100).toFixed(1)}%</div>
            <div>成功率</div>
        </div>
    </div>

    <div class="pip-boy-frame">
        <h2>測試套件詳細結果</h2>

        ${results.map(result => `
        <div class="test-suite">
            <div class="test-header">
                <div class="test-name">
                    ${result.name}
                    <span class="status-badge status-${result.status}">${result.status === 'passed' ? '通過' : '失敗'}</span>
                </div>
                <p class="test-description">${result.description}</p>
            </div>
            <div class="test-content">
                <p><strong>測試文件:</strong> ${result.file}</p>
                ${result.status === 'failed' && result.error ? `
                <div class="error-output">${result.error}</div>
                ` : ''}
            </div>
        </div>
        `).join('')}
    </div>

    <div class="timestamp">
        報告生成時間: ${new Date().toLocaleString('zh-TW')}
    </div>
</body>
</html>
  `

  fs.writeFileSync(TEST_CONFIG.reportFile, reportHtml)
  console.log(`📊 測試報告已生成: ${TEST_CONFIG.reportFile}`)
}

// 主執行函數
async function main() {
  console.log('🚀 開始執行廢土塔羅網站完整功能測試\n')

  // 確保目錄存在
  ensureDirectories()

  // 檢查服務器
  const serverRunning = await checkServer()
  if (!serverRunning) {
    process.exit(1)
  }

  console.log('\n📋 測試套件清單:')
  TEST_SUITES.forEach((suite, index) => {
    console.log(`  ${index + 1}. ${suite.name}`)
    console.log(`     ${suite.description}`)
  })

  console.log('\n⏱️  開始執行測試...')

  // 執行所有測試套件
  const results = []
  for (const suite of TEST_SUITES) {
    const result = runTestSuite(suite)
    results.push(result)
  }

  // 生成報告
  console.log('\n📊 生成測試報告...')
  generateReport(results)

  // 顯示摘要
  const passedTests = results.filter(r => r.status === 'passed').length
  const failedTests = results.filter(r => r.status === 'failed').length

  console.log('\n🎯 測試完成摘要:')
  console.log(`✅ 通過: ${passedTests}/${results.length}`)
  console.log(`❌ 失敗: ${failedTests}/${results.length}`)
  console.log(`📈 成功率: ${((passedTests / results.length) * 100).toFixed(1)}%`)

  if (failedTests > 0) {
    console.log('\n⚠️  發現問題:')
    results.filter(r => r.status === 'failed').forEach(result => {
      console.log(`   - ${result.name}`)
    })
  }

  console.log(`\n📄 詳細報告: ${TEST_CONFIG.reportFile}`)
  console.log(`📸 截圖目錄: ${TEST_CONFIG.screenshotDir}`)

  // 如果有失敗的測試，返回錯誤碼
  if (failedTests > 0) {
    process.exit(1)
  }
}

// 執行主函數
if (require.main === module) {
  main().catch(error => {
    console.error('測試執行失敗:', error)
    process.exit(1)
  })
}

module.exports = { main, TEST_SUITES, TEST_CONFIG }