/**
 * 透明度對色彩對比度影響分析工具
 * 計算 RGBA 透明色與背景混合後的實際對比度
 */

// 將 hex 色彩轉換為 RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// 將 RGBA 字符串解析為對象
function parseRgba(rgba) {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;

  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1
  };
}

// 計算透明色與背景混合後的顏色
function blendColors(foregroundRgba, backgroundHex) {
  const fg = parseRgba(foregroundRgba);
  const bg = hexToRgb(backgroundHex);

  if (!fg || !bg) return null;

  // 使用 alpha 混合公式
  const alpha = fg.a;
  const invAlpha = 1 - alpha;

  return {
    r: Math.round(fg.r * alpha + bg.r * invAlpha),
    g: Math.round(fg.g * alpha + bg.g * invAlpha),
    b: Math.round(fg.b * alpha + bg.b * invAlpha)
  };
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
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// 將 RGB 轉換為 hex
function rgbToHex(rgb) {
  return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}

// 分析透明度對比度的具體案例
function analyzeTransparencyContrast() {
  console.log('='.repeat(80));
  console.log('透明度變數對色彩對比度的具體影響分析');
  console.log('='.repeat(80));

  const transparentColors = {
    'pip-boy-green-5': 'rgba(0, 255, 136, 0.05)',
    'pip-boy-green-10': 'rgba(0, 255, 136, 0.10)',
    'pip-boy-green-15': 'rgba(0, 255, 136, 0.15)',
    'pip-boy-green-20': 'rgba(0, 255, 136, 0.20)',
    'pip-boy-green-25': 'rgba(0, 255, 136, 0.25)',
    'pip-boy-green-30': 'rgba(0, 255, 136, 0.30)',
  };

  const backgrounds = {
    'wasteland-dark': '#1a1a1a',
    'wasteland-medium': '#2d2d2d',
    'wasteland-light': '#3d3d3d',
    'bg-interactive': '#2a2a2a',
    'bg-interactive-hover': '#333333'
  };

  const textColors = {
    'pip-boy-green': '#00ff88',
    'pip-boy-green-dark': '#00cc66',
    'enhanced-secondary': '#00ff99',
    'enhanced-muted': '#66cc99'
  };

  console.log('\n1. 透明背景與文字對比度分析');
  console.log('-'.repeat(50));

  Object.entries(transparentColors).forEach(([transparentName, transparentRgba]) => {
    console.log(`\n${transparentName} (${transparentRgba}):`);

    Object.entries(backgrounds).forEach(([bgName, bgHex]) => {
      const blendedBg = blendColors(transparentRgba, bgHex);
      if (!blendedBg) return;

      const blendedBgHex = rgbToHex(blendedBg);
      console.log(`  在 ${bgName} 背景上的混合結果: ${blendedBgHex}`);

      // 測試各種文字顏色在此混合背景上的對比度
      Object.entries(textColors).forEach(([textName, textHex]) => {
        const textRgb = hexToRgb(textHex);
        if (!textRgb) return;

        const contrast = getContrastRatio(textRgb, blendedBg);
        const passesAA = contrast >= 4.5;
        const status = passesAA ? '✅' : '❌';

        console.log(`    ${textName}: ${contrast.toFixed(2)}:1 ${status}`);
      });
    });
  });

  console.log('\n\n2. 問題透明度組合識別');
  console.log('-'.repeat(50));

  const problematicCombinations = [];

  Object.entries(transparentColors).forEach(([transparentName, transparentRgba]) => {
    Object.entries(backgrounds).forEach(([bgName, bgHex]) => {
      const blendedBg = blendColors(transparentRgba, bgHex);
      if (!blendedBg) return;

      let hasProblematicText = false;
      const problemTexts = [];

      Object.entries(textColors).forEach(([textName, textHex]) => {
        const textRgb = hexToRgb(textHex);
        if (!textRgb) return;

        const contrast = getContrastRatio(textRgb, blendedBg);
        if (contrast < 4.5) {
          hasProblematicText = true;
          problemTexts.push({
            textName,
            contrast: contrast.toFixed(2)
          });
        }
      });

      if (hasProblematicText) {
        problematicCombinations.push({
          transparentName,
          transparentRgba,
          bgName,
          bgHex,
          blendedBg: rgbToHex(blendedBg),
          problemTexts
        });
      }
    });
  });

  if (problematicCombinations.length > 0) {
    console.log('\n❌ 發現以下問題組合：');
    problematicCombinations.forEach((combo, index) => {
      console.log(`\n${index + 1}. ${combo.transparentName} + ${combo.bgName}`);
      console.log(`   透明色: ${combo.transparentRgba}`);
      console.log(`   原始背景: ${combo.bgHex}`);
      console.log(`   混合結果: ${combo.blendedBg}`);
      console.log(`   問題文字:`);
      combo.problemTexts.forEach(text => {
        console.log(`     - ${text.textName}: ${text.contrast}:1 (需要 4.5:1)`);
      });
    });
  } else {
    console.log('✅ 所有透明度組合都符合 WCAG AA 標準！');
  }

  console.log('\n\n3. 透明度使用建議');
  console.log('-'.repeat(50));

  console.log('\n建議的安全透明度範圍：');
  Object.entries(transparentColors).forEach(([transparentName, transparentRgba]) => {
    let safeCount = 0;
    let totalCount = 0;

    Object.entries(backgrounds).forEach(([bgName, bgHex]) => {
      Object.entries(textColors).forEach(([textName, textHex]) => {
        const blendedBg = blendColors(transparentRgba, bgHex);
        const textRgb = hexToRgb(textHex);
        if (!blendedBg || !textRgb) return;

        totalCount++;
        const contrast = getContrastRatio(textRgb, blendedBg);
        if (contrast >= 4.5) safeCount++;
      });
    });

    const safePercentage = ((safeCount / totalCount) * 100).toFixed(1);
    const status = safePercentage >= 80 ? '✅ 安全' : safePercentage >= 60 ? '⚠️ 謹慎使用' : '❌ 避免使用';

    console.log(`  ${transparentName}: ${safePercentage}% 安全 ${status}`);
  });

  return problematicCombinations;
}

// 生成透明度改善建議
function generateTransparencyImprovements(problematicCombinations) {
  console.log('\n\n4. 透明度改善建議');
  console.log('-'.repeat(50));

  if (problematicCombinations.length === 0) {
    console.log('✅ 當前透明度設定良好，無需特別調整。');
    return;
  }

  console.log('\n建議的透明度調整：');

  // 分析哪些透明度級別最容易出問題
  const transparencyIssues = {};
  problematicCombinations.forEach(combo => {
    if (!transparencyIssues[combo.transparentName]) {
      transparencyIssues[combo.transparentName] = 0;
    }
    transparencyIssues[combo.transparentName]++;
  });

  Object.entries(transparencyIssues).forEach(([transparentName, issueCount]) => {
    console.log(`\n${transparentName} (${issueCount} 個問題組合):`);

    if (transparentName.includes('-5') || transparentName.includes('-10')) {
      console.log('  - 透明度過低，建議提高到 15% 以上');
      console.log('  - 或者使用純色背景替代透明背景');
    } else if (transparentName.includes('-30')) {
      console.log('  - 透明度適中，但需要確保文字顏色足夠亮');
      console.log('  - 建議搭配高對比度文字顏色');
    }
  });

  console.log('\n具體建議：');
  console.log('1. 避免在低透明度背景 (5%, 10%) 上使用深色文字');
  console.log('2. 為透明背景元素提供 hover 狀態下的不透明背景');
  console.log('3. 考慮為重要內容使用不透明背景');
  console.log('4. 添加邊框或陰影來增強元素邊界');

  console.log('\n建議的 CSS 改進：');
  console.log('```css');
  console.log('/* 安全的透明度背景 */');
  console.log('.bg-safe-transparent {');
  console.log('  background-color: var(--color-pip-boy-green-20);');
  console.log('  border: 1px solid var(--color-border-secondary);');
  console.log('}');
  console.log('');
  console.log('/* Hover 狀態提供更好的對比度 */');
  console.log('.interactive-transparent:hover {');
  console.log('  background-color: var(--color-bg-interactive);');
  console.log('  border-color: var(--color-border-primary);');
  console.log('}');
  console.log('');
  console.log('/* 關鍵內容使用不透明背景 */');
  console.log('.content-important {');
  console.log('  background-color: var(--color-bg-secondary);');
  console.log('  border: 1px solid var(--color-border-primary);');
  console.log('}');
  console.log('```');
}

// 執行透明度分析
function runTransparencyAnalysis() {
  const problematicCombinations = analyzeTransparencyContrast();
  generateTransparencyImprovements(problematicCombinations);

  console.log('\n' + '='.repeat(80));
  console.log('透明度分析總結');
  console.log('='.repeat(80));
  console.log(`發現 ${problematicCombinations.length} 個問題透明度組合`);

  if (problematicCombinations.length > 0) {
    console.log('建議優先處理低透明度 (5%, 10%) 的對比度問題');
  } else {
    console.log('✅ 透明度設定良好！');
  }

  return problematicCombinations;
}

// 匯出功能
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    analyzeTransparencyContrast,
    generateTransparencyImprovements,
    runTransparencyAnalysis,
    blendColors,
    getContrastRatio,
    hexToRgb,
    parseRgba,
    rgbToHex
  };
}

// 如果直接執行
if (typeof require !== 'undefined' && require.main === module) {
  runTransparencyAnalysis();
}