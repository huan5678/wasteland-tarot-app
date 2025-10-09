#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyze and report on bundle size and dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing bundle...\n');

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.error('❌ .next directory not found. Please run `bun run build` first.');
  process.exit(1);
}

// Analyze bundle size
console.log('📦 Bundle Size Analysis:\n');

try {
  // Get build directory size
  const getBuildSize = (dir) => {
    let size = 0;
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += getBuildSize(filePath);
      } else {
        size += stats.size;
      }
    });

    return size;
  };

  const buildSize = getBuildSize(nextDir);
  const buildSizeMB = (buildSize / (1024 * 1024)).toFixed(2);

  console.log(`Total build size: ${buildSizeMB} MB\n`);

  // Analyze static files
  const staticDir = path.join(nextDir, 'static');
  if (fs.existsSync(staticDir)) {
    const staticSize = getBuildSize(staticDir);
    const staticSizeMB = (staticSize / (1024 * 1024)).toFixed(2);
    console.log(`Static assets: ${staticSizeMB} MB`);
  }

  // Analyze chunks
  const chunksDir = path.join(nextDir, 'static', 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunks = fs.readdirSync(chunksDir);
    console.log(`\n📊 Chunks (${chunks.length}):\n`);

    const chunkSizes = chunks
      .filter((chunk) => chunk.endsWith('.js'))
      .map((chunk) => {
        const chunkPath = path.join(chunksDir, chunk);
        const size = fs.statSync(chunkPath).size;
        return {
          name: chunk,
          size,
          sizeKB: (size / 1024).toFixed(2),
        };
      })
      .sort((a, b) => b.size - a.size);

    // Show top 10 largest chunks
    chunkSizes.slice(0, 10).forEach((chunk, index) => {
      console.log(`${index + 1}. ${chunk.name} - ${chunk.sizeKB} KB`);
    });
  }

  // Analyze package.json for unused dependencies
  console.log('\n📋 Dependency Analysis:\n');

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  );

  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  console.log(`Total dependencies: ${Object.keys(dependencies).length}`);

  // Check for large packages
  const largePackages = [
    '@antropic/sdk',
    'react',
    'react-dom',
    'next',
    '@radix-ui/react-dialog',
    'framer-motion',
  ];

  console.log('\n📦 Key packages:');
  largePackages.forEach((pkg) => {
    if (dependencies[pkg]) {
      console.log(`  ✓ ${pkg}: ${dependencies[pkg]}`);
    }
  });

  // Recommendations
  console.log('\n💡 Optimization Recommendations:\n');

  const recommendations = [];

  if (buildSizeMB > 10) {
    recommendations.push(
      '- Build size is large. Consider code splitting and lazy loading.'
    );
  }

  if (chunkSizes && chunkSizes[0]?.size > 500 * 1024) {
    recommendations.push(
      '- Largest chunk is over 500KB. Split into smaller chunks.'
    );
  }

  if (Object.keys(dependencies).length > 50) {
    recommendations.push(
      '- Many dependencies. Review and remove unused packages.'
    );
  }

  if (recommendations.length === 0) {
    console.log('✅ Bundle looks good!');
  } else {
    recommendations.forEach((rec) => console.log(rec));
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    buildSize: buildSizeMB,
    chunks: chunkSizes?.length || 0,
    dependencies: Object.keys(dependencies).length,
    largestChunk: chunkSizes?.[0] || null,
  };

  const reportPath = path.join(process.cwd(), 'bundle-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: bundle-report.json`);
} catch (error) {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
}
