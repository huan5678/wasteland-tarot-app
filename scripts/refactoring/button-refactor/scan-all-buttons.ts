#!/usr/bin/env bun
/**
 * Scan All Buttons Script
 *
 * Purpose: Execute full scan of all native buttons and generate mapping preview
 * Task: 1.6 - Execute complete scan and mapping preview
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ButtonScanner } from './scanner';
import { StyleAnalyzer } from './analyzer';
import { VariantMapper } from './mapper';
import type { ButtonInfo } from './types';

const BATCH_CONFIGS = [
  {
    id: 1,
    name: 'Mobile Components',
    patterns: ['src/components/mobile/**/*.tsx'],
    excludePatterns: ['**/*.test.tsx', '**/*.spec.tsx'],
  },
  {
    id: 2,
    name: 'Admin Pages',
    patterns: ['src/app/admin/**/*.tsx'],
    excludePatterns: ['**/*.test.tsx', '**/*.spec.tsx'],
  },
  {
    id: 3,
    name: 'Readings Components',
    patterns: [
      'src/components/readings/**/*.tsx',
      'src/app/readings/**/*.tsx',
      'src/app/mobile-reading/**/*.tsx',
    ],
    excludePatterns: ['**/*.test.tsx', '**/*.spec.tsx'],
  },
  {
    id: 4,
    name: 'Auth & Settings',
    patterns: [
      'src/app/login/**/*.tsx',
      'src/app/register/**/*.tsx',
      'src/app/profile/**/*.tsx',
      'src/components/auth/**/*.tsx',
    ],
    excludePatterns: ['**/*.test.tsx', '**/*.spec.tsx'],
  },
  {
    id: 5,
    name: 'Remaining Files',
    patterns: ['src/app/**/*.tsx', 'src/components/**/*.tsx'],
    excludePatterns: [
      '**/*.test.tsx',
      '**/*.spec.tsx',
      'src/components/ui/**/*.tsx',
      'src/components/mobile/**/*.tsx',
      'src/components/readings/**/*.tsx',
      'src/components/auth/**/*.tsx',
      'src/app/admin/**/*.tsx',
      'src/app/login/**/*.tsx',
      'src/app/register/**/*.tsx',
      'src/app/profile/**/*.tsx',
      'src/app/readings/**/*.tsx',
      'src/app/mobile-reading/**/*.tsx',
    ],
  },
];

interface MappingPreview {
  filePath: string;
  line: number;
  column: number;
  currentClassName: string;
  suggestedVariant: string;
  suggestedSize: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  warnings: string[];
}

interface ScanReport {
  totalButtons: number;
  totalFiles: number;
  batches: Array<{
    id: number;
    name: string;
    buttonCount: number;
    fileCount: number;
  }>;
  mappingPreviews: MappingPreview[];
  variantDistribution: Record<string, number>;
  sizeDistribution: Record<string, number>;
  lowConfidenceCases: MappingPreview[];
  statistics: {
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    coverageRate: number;
  };
}

async function main() {
  console.log('🔍 Starting full button scan...\n');

  const scanner = new ButtonScanner();
  const analyzer = new StyleAnalyzer();
  const mapper = new VariantMapper();

  const allButtons: Array<ButtonInfo & { batchId: number; batchName: string }> = [];
  const allFiles = new Set<string>();
  const batchStats: ScanReport['batches'] = [];

  // Scan each batch
  for (const config of BATCH_CONFIGS) {
    console.log(`📦 Scanning ${config.name}...`);

    const result = await scanner.scanBatch(config);

    console.log(`   Found ${result.totalButtons} buttons in ${result.totalFiles} files`);

    batchStats.push({
      id: config.id,
      name: config.name,
      buttonCount: result.totalButtons,
      fileCount: result.totalFiles,
    });

    result.buttons.forEach((button) => {
      allButtons.push({ ...button, batchId: config.id, batchName: config.name });
      allFiles.add(button.filePath);
    });
  }

  console.log(`\n✅ Scan complete!`);
  console.log(`   Total buttons: ${allButtons.length}`);
  console.log(`   Total files: ${allFiles.size}\n`);

  // Generate mapping previews
  console.log('🗺️  Generating mapping previews...\n');

  const mappingPreviews: MappingPreview[] = [];
  const variantDistribution: Record<string, number> = {};
  const sizeDistribution: Record<string, number> = {};
  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;

  for (const button of allButtons) {
    const analysis = analyzer.analyze(button);
    const mapping = mapper.map(analysis);

    // Count distributions
    variantDistribution[mapping.variant] = (variantDistribution[mapping.variant] || 0) + 1;
    sizeDistribution[mapping.size] = (sizeDistribution[mapping.size] || 0) + 1;

    // Count confidence levels
    if (analysis.confidence === 'high') highConfidence++;
    else if (analysis.confidence === 'medium') mediumConfidence++;
    else lowConfidence++;

    mappingPreviews.push({
      filePath: button.filePath,
      line: button.line,
      column: button.column,
      currentClassName: button.attributes.className || '',
      suggestedVariant: mapping.variant,
      suggestedSize: mapping.size,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      warnings: mapping.warnings,
    });
  }

  const lowConfidenceCases = mappingPreviews.filter((p) => p.confidence === 'low');

  console.log('📊 Mapping Statistics:');
  console.log(`   High confidence: ${highConfidence} (${((highConfidence / allButtons.length) * 100).toFixed(1)}%)`);
  console.log(`   Medium confidence: ${mediumConfidence} (${((mediumConfidence / allButtons.length) * 100).toFixed(1)}%)`);
  console.log(`   Low confidence: ${lowConfidence} (${((lowConfidence / allButtons.length) * 100).toFixed(1)}%)`);
  console.log(`   Coverage rate: ${(((highConfidence + mediumConfidence) / allButtons.length) * 100).toFixed(1)}%\n`);

  // Generate report
  const report: ScanReport = {
    totalButtons: allButtons.length,
    totalFiles: allFiles.size,
    batches: batchStats,
    mappingPreviews,
    variantDistribution,
    sizeDistribution,
    lowConfidenceCases,
    statistics: {
      highConfidence,
      mediumConfidence,
      lowConfidence,
      coverageRate: ((highConfidence + mediumConfidence) / allButtons.length) * 100,
    },
  };

  // Save JSON report
  const reportDir = join(process.cwd(), '.kiro', 'specs', 'button-component-refactoring');
  mkdirSync(reportDir, { recursive: true });

  const jsonPath = join(reportDir, 'button-scan-report.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`💾 JSON report saved: ${jsonPath}`);

  // Generate markdown report
  const markdown = generateMarkdownReport(report);
  const mdPath = join(reportDir, 'button-scan-report.md');
  writeFileSync(mdPath, markdown, 'utf-8');
  console.log(`💾 Markdown report saved: ${mdPath}`);

  // Display summary
  console.log('\n📈 Variant Distribution:');
  Object.entries(variantDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([variant, count]) => {
      console.log(`   ${variant.padEnd(15)} ${count.toString().padStart(4)} (${((count / allButtons.length) * 100).toFixed(1)}%)`);
    });

  console.log('\n📏 Size Distribution:');
  Object.entries(sizeDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([size, count]) => {
      console.log(`   ${size.padEnd(15)} ${count.toString().padStart(4)} (${((count / allButtons.length) * 100).toFixed(1)}%)`);
    });

  if (lowConfidenceCases.length > 0) {
    console.log(`\n⚠️  Low Confidence Cases (${lowConfidenceCases.length}):`);
    lowConfidenceCases.slice(0, 10).forEach((c) => {
      console.log(`   ${c.filePath}:${c.line}`);
      console.log(`      Current: ${c.currentClassName || '(no className)'}`);
      console.log(`      Suggested: variant="${c.suggestedVariant}" size="${c.suggestedSize}"`);
      console.log(`      Reason: ${c.reasoning}\n`);
    });

    if (lowConfidenceCases.length > 10) {
      console.log(`   ... and ${lowConfidenceCases.length - 10} more (see report for full list)\n`);
    }
  }

  console.log('✅ Scan complete! Review the reports for detailed analysis.\n');
}

function generateMarkdownReport(report: ScanReport): string {
  let md = '# Button Scan Report\n\n';
  md += `**Generated**: ${new Date().toLocaleString()}\n\n`;

  md += '## Summary\n\n';
  md += `- **Total Buttons**: ${report.totalButtons}\n`;
  md += `- **Total Files**: ${report.totalFiles}\n`;
  md += `- **Coverage Rate**: ${report.statistics.coverageRate.toFixed(1)}%\n\n`;

  md += '## Batch Statistics\n\n';
  md += '| Batch | Name | Buttons | Files |\n';
  md += '|-------|------|---------|-------|\n';
  report.batches.forEach((batch) => {
    md += `| ${batch.id} | ${batch.name} | ${batch.buttonCount} | ${batch.fileCount} |\n`;
  });
  md += '\n';

  md += '## Confidence Distribution\n\n';
  md += '| Confidence | Count | Percentage |\n';
  md += '|------------|-------|------------|\n';
  md += `| High | ${report.statistics.highConfidence} | ${((report.statistics.highConfidence / report.totalButtons) * 100).toFixed(1)}% |\n`;
  md += `| Medium | ${report.statistics.mediumConfidence} | ${((report.statistics.mediumConfidence / report.totalButtons) * 100).toFixed(1)}% |\n`;
  md += `| Low | ${report.statistics.lowConfidence} | ${((report.statistics.lowConfidence / report.totalButtons) * 100).toFixed(1)}% |\n\n`;

  md += '## Variant Distribution\n\n';
  md += '| Variant | Count | Percentage |\n';
  md += '|---------|-------|------------|\n';
  Object.entries(report.variantDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([variant, count]) => {
      md += `| ${variant} | ${count} | ${((count / report.totalButtons) * 100).toFixed(1)}% |\n`;
    });
  md += '\n';

  md += '## Size Distribution\n\n';
  md += '| Size | Count | Percentage |\n';
  md += '|------|-------|------------|\n';
  Object.entries(report.sizeDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([size, count]) => {
      md += `| ${size} | ${count} | ${((count / report.totalButtons) * 100).toFixed(1)}% |\n`;
    });
  md += '\n';

  if (report.lowConfidenceCases.length > 0) {
    md += `## Low Confidence Cases (${report.lowConfidenceCases.length})\n\n`;
    md += '| File | Line | Current ClassName | Suggested Variant | Suggested Size | Reasoning |\n';
    md += '|------|------|-------------------|-------------------|----------------|----------|\n';
    report.lowConfidenceCases.forEach((c) => {
      const className = c.currentClassName || '(none)';
      const reasoning = c.reasoning.replace(/\|/g, '\\|');
      md += `| ${c.filePath} | ${c.line} | \`${className}\` | ${c.suggestedVariant} | ${c.suggestedSize} | ${reasoning} |\n`;
    });
    md += '\n';
  }

  return md;
}

main().catch(console.error);
