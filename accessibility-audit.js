/**
 * 廢土塔羅網站 - 色彩無障礙性審核工具
 * 符合 WCAG AA 標準的色彩對比度分析
 */

// 色彩值定義（從 globals.css 提取）
const COLORS = {
  // Pip-Boy 綠色系列
  'pip-boy-green': '#00ff88',
  'pip-boy-green-bright': '#00ff41',
  'pip-boy-green-dark': '#00cc66',
  'pip-boy-green-medium': '#008855',
  'pip-boy-green-deep': '#004433',
  'pip-boy-green-faded': '#003322',

  // 終端綠色
  'terminal-green': '#00cc66',
  'terminal-green-bright': '#00ff88',
  'terminal-green-dim': '#009944',

  // Vault 藍色系列
  'vault-blue': '#003d66',
  'vault-blue-light': '#0055aa',
  'vault-blue-dark': '#002244',
  'vault-blue-deep': '#001122',

  // 廢土背景色
  'wasteland-dark': '#1a1a1a',
  'wasteland-darker': '#0c0c0c',
  'wasteland-medium': '#2d2d2d',
  'wasteland-light': '#3d3d3d',
  'wasteland-lighter': '#4d4d4d',

  // 金屬灰色
  'metal-gray': '#2d2d2d',
  'metal-gray-light': '#3d3d3d',
  'metal-gray-dark': '#1d1d1d',

  // 狀態顏色
  'error': '#ff4444',
  'warning': '#ffdd00',
  'success': '#00ff88',
  'info': '#0088ff',

  // 輻射色彩
  'radiation-orange': '#ff8800',
  'radiation-orange-bright': '#ffaa33',

  // 透明度變數 (5%, 10%, 20%, 30%)
  'pip-boy-green-5': 'rgba(0, 255, 136, 0.05)',
  'pip-boy-green-10': 'rgba(0, 255, 136, 0.10)',
  'pip-boy-green-20': 'rgba(0, 255, 136, 0.20)',
  'pip-boy-green-30': 'rgba(0, 255, 136, 0.30)',
}

// 將 hex 色彩轉換為 RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// 計算相對亮度
function getLuminance(rgb) {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// 計算對比度比例
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(hexToRgb(color1));
  const lum2 = getLuminance(hexToRgb(color2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// WCAG AA 合規性檢查
function checkWCAGCompliance(ratio, textSize = 'normal') {
  const AAThreshold = textSize === 'large' ? 3.0 : 4.5;
  const AAAThreshold = textSize === 'large' ? 4.5 : 7.0;

  return {
    ratio: ratio.toFixed(2),
    passesAA: ratio >= AAThreshold,
    passesAAA: ratio >= AAAThreshold,
    level: ratio >= AAAThreshold ? 'AAA' : ratio >= AAThreshold ? 'AA' : 'FAIL',
    threshold: AAThreshold
  };
}

// 主要色彩組合分析
const COLOR_COMBINATIONS = [
  // 主要文字與背景組合
  {
    name: '主要文字 - Pip-Boy 綠色 on 廢土深色背景',
    foreground: COLORS['pip-boy-green'],
    background: COLORS['wasteland-dark'],
    usage: '主要內容文字',
    textSize: 'normal'
  },
  {
    name: '次要文字 - Pip-Boy 深綠色 on 廢土深色背景',
    foreground: COLORS['pip-boy-green-dark'],
    background: COLORS['wasteland-dark'],
    usage: '次要內容文字',
    textSize: 'normal'
  },
  {
    name: '靜音文字 - Pip-Boy 中綠色 on 廢土深色背景',
    foreground: COLORS['pip-boy-green-medium'],
    background: COLORS['wasteland-dark'],
    usage: '說明文字、placeholder',
    textSize: 'normal'
  },
  {
    name: '禁用文字 - Pip-Boy 深度綠色 on 廢土深色背景',
    foreground: COLORS['pip-boy-green-deep'],
    background: COLORS['wasteland-dark'],
    usage: '禁用狀態文字',
    textSize: 'normal'
  },

  // 按鈕組合
  {
    name: '主要按鈕 - 廢土深色 on Pip-Boy 綠色',
    foreground: COLORS['wasteland-dark'],
    background: COLORS['pip-boy-green'],
    usage: '主要按鈕文字',
    textSize: 'normal'
  },
  {
    name: '次要按鈕 - Pip-Boy 綠色 on 廢土中色',
    foreground: COLORS['pip-boy-green'],
    background: COLORS['wasteland-medium'],
    usage: '次要按鈕文字',
    textSize: 'normal'
  },

  // 狀態顏色組合
  {
    name: '錯誤文字 - 紅色 on 廢土深色背景',
    foreground: COLORS['error'],
    background: COLORS['wasteland-dark'],
    usage: '錯誤訊息',
    textSize: 'normal'
  },
  {
    name: '警告文字 - 警告黃色 on 廢土深色背景',
    foreground: COLORS['warning'],
    background: COLORS['wasteland-dark'],
    usage: '警告訊息',
    textSize: 'normal'
  },
  {
    name: '資訊文字 - 資訊藍色 on 廢土深色背景',
    foreground: COLORS['info'],
    background: COLORS['wasteland-dark'],
    usage: '資訊提示',
    textSize: 'normal'
  },

  // 介面元素組合
  {
    name: 'Header 介面條 - 廢土深色 on Pip-Boy 綠色',
    foreground: COLORS['wasteland-dark'],
    background: COLORS['pip-boy-green'],
    usage: 'Header 終端機條文字',
    textSize: 'small'
  },
  {
    name: '導航按鈕 active - Pip-Boy 綠色 on 廢土中色',
    foreground: COLORS['pip-boy-green'],
    background: COLORS['wasteland-medium'],
    usage: '導航按鈕 active 狀態',
    textSize: 'normal'
  },
  {
    name: '導航按鈕 inactive - Pip-Boy 深綠色 on 廢土深色',
    foreground: COLORS['pip-boy-green-dark'],
    background: COLORS['wasteland-dark'],
    usage: '導航按鈕 inactive 狀態',
    textSize: 'normal'
  },

  // 輸入框組合
  {
    name: '輸入框文字 - Pip-Boy 綠色 on 廢土中色',
    foreground: COLORS['pip-boy-green'],
    background: COLORS['wasteland-medium'],
    usage: '表單輸入框',
    textSize: 'normal'
  },
  {
    name: '輸入框 placeholder - Pip-Boy 中綠色 on 廢土中色',
    foreground: COLORS['pip-boy-green-medium'],
    background: COLORS['wasteland-medium'],
    usage: '表單 placeholder',
    textSize: 'normal'
  },

  // 卡片組合
  {
    name: '卡片文字 - Pip-Boy 綠色 on 廢土中色',
    foreground: COLORS['pip-boy-green'],
    background: COLORS['wasteland-medium'],
    usage: '卡片內容',
    textSize: 'normal'
  },
  {
    name: '卡片標題 - Pip-Boy 綠色 on 廢土中色',
    foreground: COLORS['pip-boy-green'],
    background: COLORS['wasteland-medium'],
    usage: '卡片標題',
    textSize: 'large'
  }
];

// 執行色彩對比度分析
function performColorContrastAnalysis() {
  console.log('='.repeat(80));
  console.log('廢土塔羅網站 - 色彩無障礙性審核報告');
  console.log('WCAG AA 標準對比度分析');
  console.log('='.repeat(80));

  const results = {
    passing: [],
    failing: [],
    warnings: []
  };

  COLOR_COMBINATIONS.forEach((combo, index) => {
    const ratio = getContrastRatio(combo.foreground, combo.background);
    const compliance = checkWCAGCompliance(ratio, combo.textSize);

    console.log(`\n${index + 1}. ${combo.name}`);
    console.log(`   前景色: ${combo.foreground}`);
    console.log(`   背景色: ${combo.background}`);
    console.log(`   使用場景: ${combo.usage}`);
    console.log(`   文字大小: ${combo.textSize}`);
    console.log(`   對比度: ${compliance.ratio}:1`);
    console.log(`   WCAG AA 合規: ${compliance.passesAA ? '✅ 通過' : '❌ 不合規'}`);
    console.log(`   WCAG AAA 合規: ${compliance.passesAAA ? '✅ 通過' : '❌ 不合規'}`);
    console.log(`   等級: ${compliance.level}`);

    const result = {
      ...combo,
      ...compliance,
      index: index + 1
    };

    if (compliance.passesAA) {
      results.passing.push(result);
    } else {
      results.failing.push(result);
    }

    // 接近但未達標的情況
    if (ratio >= compliance.threshold * 0.9 && ratio < compliance.threshold) {
      results.warnings.push(result);
    }
  });

  return results;
}

// 分析透明度對對比度的影響
function analyzeOpacityImpact() {
  console.log('\n' + '='.repeat(80));
  console.log('透明度變數對對比度的影響分析');
  console.log('='.repeat(80));

  const transparentColors = [
    'pip-boy-green-5',
    'pip-boy-green-10',
    'pip-boy-green-20',
    'pip-boy-green-30'
  ];

  transparentColors.forEach(colorKey => {
    const rgba = COLORS[colorKey];
    console.log(`\n${colorKey}: ${rgba}`);
    console.log('注意：RGBA 透明色與背景混合後的實際對比度需要根據具體背景計算');
    console.log('建議：避免在透明背景上使用對比度較低的文字');
  });
}

// 色盲友善性分析
function analyzeColorBlindFriendliness() {
  console.log('\n' + '='.repeat(80));
  console.log('色盲友善性分析');
  console.log('='.repeat(80));

  console.log('\n主要色彩問題：');
  console.log('1. 紅綠色盲 (Protanopia/Deuteranopia):');
  console.log('   - Pip-Boy 綠色系列可能難以與紅色錯誤訊息區分');
  console.log('   - 建議：為錯誤狀態添加圖標或其他視覺提示');

  console.log('\n2. 藍黃色盲 (Tritanopia):');
  console.log('   - Vault 藍色系列可能受影響');
  console.log('   - 資訊藍色 (#0088ff) 可能難以識別');

  console.log('\n3. 建議改善措施：');
  console.log('   - 為狀態訊息添加圖標 (✓, ⚠️, ❌)');
  console.log('   - 使用紋理或圖案區分重要元素');
  console.log('   - 確保不僅依賴顏色傳達信息');
  console.log('   - 提供高對比度模式選項');
}

// 生成改善建議
function generateImprovementSuggestions(results) {
  console.log('\n' + '='.repeat(80));
  console.log('色彩改善建議');
  console.log('='.repeat(80));

  if (results.failing.length > 0) {
    console.log('\n🔴 需要修正的色彩組合：');
    results.failing.forEach(item => {
      console.log(`\n${item.index}. ${item.name}`);
      console.log(`   當前對比度: ${item.ratio}:1 (需要: ${item.threshold}:1)`);
      console.log('   建議改善方案：');

      // 根據具體情況提供建議
      if (item.name.includes('禁用文字')) {
        console.log('   - 考慮使用更深的背景色或更亮的前景色');
        console.log('   - 或者添加刪除線、斜體等視覺提示');
      } else if (item.name.includes('placeholder')) {
        console.log('   - 提高 placeholder 文字的對比度');
        console.log('   - 考慮使用 #00aa55 (更深的綠色)');
      } else {
        console.log('   - 調整前景色為更亮的綠色 (如 #00ff99)');
        console.log('   - 或者使用更深的背景色');
      }
    });
  }

  console.log('\n🟡 接近但未達標的組合 (建議優化)：');
  results.warnings.forEach(item => {
    console.log(`\n${item.index}. ${item.name}`);
    console.log(`   當前對比度: ${item.ratio}:1 (需要: ${item.threshold}:1)`);
    console.log('   建議：微調色彩以確保穩定達標');
  });

  console.log('\n✅ 通過 WCAG AA 標準的組合：');
  console.log(`   共 ${results.passing.length} 個組合通過標準`);

  // 具體的色彩變數建議
  console.log('\n📋 建議的色彩變數調整：');
  console.log('```css');
  console.log(':root {');
  console.log('  /* 改善對比度的建議色彩 */');
  console.log('  --color-pip-boy-green-improved: #00ff99;        /* 提高主要綠色亮度 */');
  console.log('  --color-pip-boy-green-medium-improved: #00aa66;  /* 提高中等綠色對比度 */');
  console.log('  --color-pip-boy-green-deep-improved: #006644;    /* 改善深綠色可見性 */');
  console.log('  ');
  console.log('  /* 替代背景色選項 */');
  console.log('  --color-wasteland-dark-alt: #111111;            /* 更深的背景提高對比 */');
  console.log('  --color-wasteland-medium-alt: #333333;          /* 調整中等背景 */');
  console.log('}');
  console.log('```');
}

// 執行完整審核
function runFullAccessibilityAudit() {
  const results = performColorContrastAnalysis();
  analyzeOpacityImpact();
  analyzeColorBlindFriendliness();
  generateImprovementSuggestions(results);

  // 總結報告
  console.log('\n' + '='.repeat(80));
  console.log('審核總結');
  console.log('='.repeat(80));
  console.log(`✅ 通過 WCAG AA 標準: ${results.passing.length} 個色彩組合`);
  console.log(`❌ 未達 WCAG AA 標準: ${results.failing.length} 個色彩組合`);
  console.log(`⚠️  接近但未達標: ${results.warnings.length} 個色彩組合`);

  const passRate = (results.passing.length / COLOR_COMBINATIONS.length * 100).toFixed(1);
  console.log(`\n整體合規率: ${passRate}%`);

  if (results.failing.length === 0) {
    console.log('\n🎉 恭喜！所有色彩組合都符合 WCAG AA 標準！');
  } else {
    console.log(`\n⚠️  需要修正 ${results.failing.length} 個色彩組合以達到完全合規`);
  }

  console.log('\n建議優先處理：');
  console.log('1. 主要內容文字的對比度問題');
  console.log('2. 互動元素的可見性');
  console.log('3. 狀態訊息的色盲友善性');

  return results;
}

// 如果在 Node.js 環境中運行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runFullAccessibilityAudit,
    performColorContrastAnalysis,
    analyzeOpacityImpact,
    analyzeColorBlindFriendliness,
    generateImprovementSuggestions,
    getContrastRatio,
    checkWCAGCompliance,
    COLORS,
    COLOR_COMBINATIONS
  };
}

// 如果在瀏覽器中運行
if (typeof window !== 'undefined') {
  window.AccessibilityAudit = {
    runFullAccessibilityAudit,
    performColorContrastAnalysis,
    analyzeOpacityImpact,
    analyzeColorBlindFriendliness,
    generateImprovementSuggestions,
    getContrastRatio,
    checkWCAGCompliance,
    COLORS,
    COLOR_COMBINATIONS
  };
}

// 自動執行審核（如果直接運行此檔案）
if (typeof require !== 'undefined' && require.main === module) {
  runFullAccessibilityAudit();
}