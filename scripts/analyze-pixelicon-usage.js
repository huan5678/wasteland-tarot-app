#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 搜索所有包含 PixelIcon 的文件
const fileList = execSync('fd -e tsx -e ts . src/').toString().split('\n').filter(Boolean);

// 存储结果
const iconTextMap = new Map(); // icon名称 -> 中文文字集合
const textIconMap = new Map(); // 中文文字 -> icon名称集合
const allUsages = []; // 所有使用记录

// 正则匹配模式
const pixelIconPattern = /<PixelIcon[^>]*name=["']([^"']+)["'][^>]*>/g;
const chinesePattern = /[\u4e00-\u9fa5]+/g;

fileList.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // 查找 PixelIcon 使用
      const iconMatches = [...line.matchAll(pixelIconPattern)];

      if (iconMatches.length > 0) {
        iconMatches.forEach(match => {
          const iconName = match[1];
          const fullMatch = match[0];

          // 查找同一行或附近行的中文文字
          const lineNum = index + 1;
          const contextLines = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3));
          const context = contextLines.join(' ');

          // 提取中文文字
          const chineseMatches = [...context.matchAll(chinesePattern)];
          const chineseTexts = chineseMatches.map(m => m[0]).filter(text =>
            text.length > 1 && !text.includes('PixelIcon')
          );

          // 记录使用
          const usage = {
            file: filePath,
            line: lineNum,
            iconName,
            chineseTexts: [...new Set(chineseTexts)],
            context: line.trim().substring(0, 100)
          };

          allUsages.push(usage);

          // 更新映射
          if (!iconTextMap.has(iconName)) {
            iconTextMap.set(iconName, new Set());
          }
          chineseTexts.forEach(text => {
            iconTextMap.get(iconName).add(text);
          });

          chineseTexts.forEach(text => {
            if (!textIconMap.has(text)) {
              textIconMap.set(text, new Set());
            }
            textIconMap.get(text).add(iconName);
          });
        });
      }
    });
  } catch (error) {
    // 忽略读取错误
  }
});

// 输出分析结果
console.log('# PixelIcon 使用分析报告\n');

console.log('## 1. 相同中文文字使用不同图标的情况\n');
const conflictingTexts = Array.from(textIconMap.entries())
  .filter(([text, icons]) => icons.size > 1)
  .sort((a, b) => b[1].size - a[1].size);

if (conflictingTexts.length === 0) {
  console.log('✅ 没有发现冲突\n');
} else {
  conflictingTexts.forEach(([text, icons]) => {
    console.log(`### "${text}" 使用了 ${icons.size} 个不同图标:`);
    icons.forEach(icon => {
      const examples = allUsages
        .filter(u => u.chineseTexts.includes(text) && u.iconName === icon)
        .slice(0, 2);
      console.log(`  - \`${icon}\``);
      examples.forEach(ex => {
        console.log(`    - ${ex.file}:${ex.line}`);
      });
    });
    console.log('');
  });
}

console.log('\n## 2. 中文文字与图标对应统计\n');
const textStats = Array.from(textIconMap.entries())
  .sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'));

console.log('| 中文文字 | 图标名称 | 使用次数 |');
console.log('|---------|---------|---------|');
textStats.forEach(([text, icons]) => {
  const iconList = Array.from(icons).join(', ');
  const count = allUsages.filter(u => u.chineseTexts.includes(text)).length;
  const status = icons.size > 1 ? '⚠️' : '✅';
  console.log(`| ${status} ${text} | ${iconList} | ${count} |`);
});

console.log('\n## 3. 图标使用频率\n');
const iconFreq = new Map();
allUsages.forEach(usage => {
  iconFreq.set(usage.iconName, (iconFreq.get(usage.iconName) || 0) + 1);
});

const sortedIcons = Array.from(iconFreq.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30);

console.log('| 图标名称 | 使用次数 | 关联中文文字 |');
console.log('|---------|---------|-------------|');
sortedIcons.forEach(([icon, count]) => {
  const texts = Array.from(iconTextMap.get(icon) || []).slice(0, 5).join(', ');
  console.log(`| ${icon} | ${count} | ${texts} |`);
});

console.log('\n## 4. 需要统一的建议\n');
if (conflictingTexts.length > 0) {
  console.log('根据分析，以下中文文字需要统一图标选择：\n');
  conflictingTexts.forEach(([text, icons]) => {
    const iconUsage = Array.from(icons).map(icon => {
      const count = allUsages.filter(u => u.chineseTexts.includes(text) && u.iconName === icon).length;
      return { icon, count };
    }).sort((a, b) => b.count - a.count);

    console.log(`### "${text}"`);
    console.log(`推荐使用: \`${iconUsage[0].icon}\` (当前使用 ${iconUsage[0].count} 次)`);
    console.log(`需要替换:`);
    iconUsage.slice(1).forEach(({ icon, count }) => {
      console.log(`  - \`${icon}\` (${count} 处) → \`${iconUsage[0].icon}\``);
    });
    console.log('');
  });
}

// 保存详细报告到文件
const reportPath = path.join(__dirname, '../pixelicon-usage-report.md');
const reportContent = `# PixelIcon 使用详细报告

生成时间: ${new Date().toLocaleString('zh-CN')}

## 所有使用记录 (${allUsages.length} 处)

${allUsages.map(u => `
### ${u.file}:${u.line}
- Icon: \`${u.iconName}\`
- 中文: ${u.chineseTexts.join(', ')}
- 代码: \`${u.context}\`
`).join('\n')}
`;

fs.writeFileSync(reportPath, reportContent, 'utf-8');
console.log(`\n详细报告已保存到: ${reportPath}\n`);
