#!/usr/bin/env node

/**
 * PixelBlast 背景元件除錯腳本
 * 分析顏色顯示問題
 */

console.log('=== PixelBlast 背景顏色分析 ===\n');

// 檢查 Fallout 主題顏色配置
const falloutColors = {
  primary: '#00ff88',    // Pip-Boy 綠色
  orange: '#ff8800',     // 輻射橘色
  subdued: '#00cc66'     // 冷靜綠色
};

console.log('🎨 Fallout 主題顏色配置:');
Object.entries(falloutColors).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

console.log('\n📊 PixelBlast 配置分析:');

// 檢查 DitherBackground.tsx 中的配置
const variantConfigs = {
  homepage: {
    color: '#00ff88',
    variant: 'circle'
  },
  login: {
    color: '#ff8800',
    variant: 'diamond'
  },
  dashboard: {
    color: '#00cc66',
    variant: 'square'
  },
  default: {
    color: '#00ff88',
    variant: 'circle'
  }
};

Object.entries(variantConfigs).forEach(([variant, config]) => {
  console.log(`  ${variant}:`);
  console.log(`    顏色: ${config.color}`);
  console.log(`    形狀: ${config.variant}`);
});

console.log('\n🔍 可能問題分析:');

// 檢查可能的問題
const potentialIssues = [
  {
    issue: 'CSS 變數載入問題',
    description: 'globals.css 中的 CSS 變數可能沒有正確載入',
    solution: '檢查 @theme 定義和變數引用'
  },
  {
    issue: 'WebGL 渲染問題',
    description: 'Three.js WebGL 渲染可能有問題',
    solution: '檢查 WebGL 支援和 canvas 渲染'
  },
  {
    issue: 'Shader 顏色設定',
    description: 'Fragment shader 中的 uColor uniform 可能沒有正確設定',
    solution: '檢查 THREE.Color 設定和 uniform 更新'
  },
  {
    issue: 'Dynamic import 問題',
    description: 'PixelBlast 元件的動態載入可能失敗',
    solution: '檢查 SSR 設定和 client-side 渲染'
  },
  {
    issue: 'CSS 樣式衝突',
    description: '其他 CSS 規則可能覆蓋背景樣式',
    solution: '檢查 z-index 和 CSS 特異性'
  }
];

potentialIssues.forEach((item, index) => {
  console.log(`  ${index + 1}. ${item.issue}`);
  console.log(`     問題: ${item.description}`);
  console.log(`     解決: ${item.solution}\n`);
});

console.log('🛠️  建議檢查步驟:');
const checkSteps = [
  '在瀏覽器開發者工具中檢查 canvas 元素是否存在',
  '檢查 console 是否有 JavaScript 錯誤',
  '確認 Three.js 和 postprocessing 函式庫載入正常',
  '檢查 WebGL 是否支援（在 console 輸入 WebGL 測試）',
  '確認 CSS 變數在 computed styles 中正確顯示',
  '檢查 PixelBlast 元件是否正確 mount',
  '測試不同 variant 是否有不同顏色顯示'
];

checkSteps.forEach((step, index) => {
  console.log(`  ${index + 1}. ${step}`);
});

console.log('\n📝 除錯代碼建議:');
console.log(`
// 在瀏覽器 console 中執行以下代碼來除錯:

// 1. 檢查 PixelBlast canvas
const canvas = document.querySelector('.pixel-blast-container canvas');
console.log('Canvas found:', !!canvas);
if (canvas) {
  console.log('Canvas size:', canvas.width, 'x', canvas.height);
  console.log('Canvas style:', canvas.style);
}

// 2. 檢查 CSS 變數
const computedStyle = getComputedStyle(document.documentElement);
console.log('Pip-Boy Green:', computedStyle.getPropertyValue('--color-pip-boy-green'));
console.log('Radiation Orange:', computedStyle.getPropertyValue('--color-radiation-orange'));

// 3. 檢查背景元件
const background = document.querySelector('.pixel-blast-background');
console.log('Background element:', !!background);
if (background) {
  console.log('Background computed style:', getComputedStyle(background));
}

// 4. 檢查 Three.js
console.log('THREE available:', typeof THREE !== 'undefined');
console.log('WebGL support:', !!document.createElement('canvas').getContext('webgl2'));
`);