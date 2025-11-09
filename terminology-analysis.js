const fs = require('fs');
const path = require('path');

// 關鍵術語字典
const terminologyDict = {
  // 廢土/Fallout 主題術語
  '廢土': ['廢土', 'wasteland'],
  '避難所': ['避難所', 'vault'],
  '嗶嗶小子': ['嗶嗶小子', 'Pip-Boy', 'pipboy'],
  '居民': ['居民', 'dweller'],
  '終端機': ['終端機', 'terminal'],
  '避難所科技': ['避難所科技', 'Vault-Tec'],

  // 塔羅相關術語
  '塔羅': ['塔羅', 'tarot'],
  '占卜': ['占卜', 'divination', 'reading'],
  '卡牌': ['卡牌', '牌片', 'card'],
  '花色': ['花色', 'suit'],

  // 用戶介面術語
  '登入': ['登入', 'login'],
  '註冊': ['註冊', 'register'],
  '密碼': ['密碼', '存取密碼', 'password'],
  '電子信箱': ['電子信箱', '通訊頻率', 'email'],
  '用戶名': ['用戶名', '居民ID', 'username'],
  '搜尋': ['搜尋', 'search'],
  '篩選': ['篩選', 'filter'],
  '收藏': ['收藏', 'collection'],
  '圖書館': ['圖書館', 'library'],

  // 動作術語
  '瀏覽': ['瀏覽', 'browse'],
  '開始': ['開始', 'start'],
  '查看': ['查看', 'view'],
  '管理': ['管理', 'manage'],
  '存取': ['存取', 'access'],
  '輸入': ['輸入', 'enter', 'input'],
  '初始化': ['初始化', 'initialize'],

  // 頁面標題術語
  '歡迎': ['歡迎', 'welcome'],
  '快速': ['快速', 'quick'],
  '最近': ['最近', 'recent'],
  '個人檔案': ['個人檔案', 'profile'],
  '設定': ['設定', 'settings'],
  '隱私政策': ['隱私政策', 'privacy policy'],
  '服務條款': ['服務條款', 'terms of service'],
  '關於我們': ['關於我們', 'about us'],
  '聯絡支援': ['聯絡支援', 'contact support']
};

// 從檔案中提取文字內容
function extractTextFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 根據檔案類型提取文字
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      // 提取字符串字面量
      const stringMatches = content.match(/['"`][^'"`]*['"`]/g) || [];
      return stringMatches.map(s => s.slice(1, -1)).join(' ');
    }

    return content;
  } catch (error) {
    console.error(`無法讀取檔案 ${filePath}:`, error.message);
    return '';
  }
}

// 遞歸搜索目錄中的檔案
function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js', '.json']) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  function searchDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // 跳過不需要的目錄
        if (!item.startsWith('.') && !['node_modules', 'dist', 'build', 'coverage'].includes(item)) {
          searchDir(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  searchDir(dir);
  return files;
}

// 分析術語使用情況
function analyzeTerminology() {
  const projectRoot = '/Users/sean/Documents/React/tarot-card-nextjs-app';
  const srcFiles = findFiles(path.join(projectRoot, 'src'));
  const appFiles = findFiles(path.join(projectRoot, 'app'));
  const allFiles = [...srcFiles, ...appFiles];

  console.log(`找到 ${allFiles.length} 個檔案進行分析`);

  const terminologyUsage = {};
  const fileAnalysis = {};

  // 初始化術語使用計數
  for (const [primary, variants] of Object.entries(terminologyDict)) {
    terminologyUsage[primary] = {
      variants: variants,
      usage: {},
      totalCount: 0,
      files: []
    };

    for (const variant of variants) {
      terminologyUsage[primary].usage[variant] = 0;
    }
  }

  // 分析每個檔案
  for (const filePath of allFiles) {
    const content = extractTextFromFile(filePath);
    const relativePath = path.relative(projectRoot, filePath);

    fileAnalysis[relativePath] = {
      path: filePath,
      terminologyFound: []
    };

    // 檢查每個術語
    for (const [primary, termData] of Object.entries(terminologyUsage)) {
      for (const variant of termData.variants) {
        const regex = new RegExp(variant, 'gi');
        const matches = content.match(regex);

        if (matches) {
          const count = matches.length;
          termData.usage[variant] += count;
          termData.totalCount += count;

          if (!termData.files.includes(relativePath)) {
            termData.files.push(relativePath);
          }

          fileAnalysis[relativePath].terminologyFound.push({
            primary: primary,
            variant: variant,
            count: count
          });
        }
      }
    }
  }

  return { terminologyUsage, fileAnalysis };
}

// 生成一致性報告
function generateConsistencyReport(terminologyUsage, fileAnalysis) {
  console.log('\n=== 術語一致性分析報告 ===\n');

  const issues = [];
  const summary = [];

  for (const [primary, data] of Object.entries(terminologyUsage)) {
    const variantCounts = Object.entries(data.usage).filter(([variant, count]) => count > 0);

    if (variantCounts.length === 0) {
      console.log(`⚠️  ${primary}: 未在程式碼中找到使用`);
      continue;
    }

    const dominantVariant = variantCounts.reduce((a, b) => a[1] > b[1] ? a : b);
    const hasInconsistency = variantCounts.length > 1;

    console.log(`${hasInconsistency ? '⚠️' : '✅'} ${primary}:`);
    console.log(`  主要使用: ${dominantVariant[0]} (${dominantVariant[1]} 次)`);

    if (hasInconsistency) {
      console.log(`  其他變體:`);
      for (const [variant, count] of variantCounts) {
        if (variant !== dominantVariant[0]) {
          console.log(`    - ${variant}: ${count} 次`);
        }
      }

      issues.push({
        term: primary,
        dominant: dominantVariant,
        variants: variantCounts,
        files: data.files
      });
    }

    summary.push({
      term: primary,
      totalUsage: data.totalCount,
      variantCount: variantCounts.length,
      isConsistent: !hasInconsistency,
      files: data.files.length
    });
  }

  console.log('\n=== 總結 ===');
  const consistentTerms = summary.filter(s => s.isConsistent).length;
  const totalTerms = summary.length;

  console.log(`術語一致性: ${consistentTerms}/${totalTerms} (${((consistentTerms/totalTerms)*100).toFixed(1)}%)`);
  console.log(`發現問題: ${issues.length} 個術語需要統一`);

  if (issues.length > 0) {
    console.log('\n=== 需要修正的術語 ===');
    for (const issue of issues) {
      console.log(`\n${issue.term}:`);
      console.log(`  建議統一使用: ${issue.dominant[0]}`);
      console.log(`  影響檔案: ${issue.files.join(', ')}`);
    }
  }

  return {
    summary: summary,
    issues: issues,
    consistency: (consistentTerms / totalTerms) * 100
  };
}

// 檢查 Fallout 主題一致性
function checkFalloutThemeConsistency(terminologyUsage) {
  console.log('\n=== 廢土主題一致性檢查 ===');

  const falloutTerms = ['廢土', '避難所', '嗶嗶小子', '居民', '終端機', '避難所科技'];
  const themeConsistency = [];

  for (const term of falloutTerms) {
    const data = terminologyUsage[term];
    if (data && data.totalCount > 0) {
      console.log(`✅ ${term}: 使用 ${data.totalCount} 次`);
      themeConsistency.push({ term, count: data.totalCount, consistent: true });
    } else {
      console.log(`❌ ${term}: 未使用或使用不足`);
      themeConsistency.push({ term, count: 0, consistent: false });
    }
  }

  const consistentThemeTerms = themeConsistency.filter(t => t.consistent).length;
  console.log(`\n廢土主題完整性: ${consistentThemeTerms}/${falloutTerms.length} (${((consistentThemeTerms/falloutTerms.length)*100).toFixed(1)}%)`);

  return themeConsistency;
}

// 主執行函數
async function main() {
  console.log('開始術語一致性分析...\n');

  const { terminologyUsage, fileAnalysis } = analyzeTerminology();
  const consistencyReport = generateConsistencyReport(terminologyUsage, fileAnalysis);
  const themeConsistency = checkFalloutThemeConsistency(terminologyUsage);

  // 儲存詳細結果
  const results = {
    timestamp: new Date().toISOString(),
    terminologyUsage: terminologyUsage,
    fileAnalysis: fileAnalysis,
    consistencyReport: consistencyReport,
    themeConsistency: themeConsistency
  };

  fs.writeFileSync('/tmp/claude/terminology-analysis-results.json', JSON.stringify(results, null, 2));

  console.log('\n分析完成！詳細結果已儲存至 /tmp/claude/terminology-analysis-results.json');

  return results;
}

main().catch(console.error);