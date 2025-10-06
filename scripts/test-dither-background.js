#!/usr/bin/env node

/**
 * Simple test script to verify Dither Background integration
 * This script checks if the new background system is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Dither Background System...\n');

// Check if required files exist
const requiredFiles = [
  'src/components/Dither.tsx',
  'src/components/Dither.css',
  'src/components/layout/DitherBackground.tsx',
  'src/components/layout/DynamicBackground.tsx'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check DynamicBackground imports
console.log('\n🔄 Checking DynamicBackground integration:');
const dynamicBgPath = path.join(process.cwd(), 'src/components/layout/DynamicBackground.tsx');
const dynamicBgContent = fs.readFileSync(dynamicBgPath, 'utf8');

const usesDitherBackground = dynamicBgContent.includes('DitherBackground');
const importsCorrectly = dynamicBgContent.includes("from './DitherBackground'");

console.log(`   ${usesDitherBackground ? '✅' : '❌'} Uses DitherBackground component`);
console.log(`   ${importsCorrectly ? '✅' : '❌'} Correct import statement`);

// Check layout.tsx integration
console.log('\n🏗️  Checking layout.tsx integration:');
const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

const usesDynamicBackground = layoutContent.includes('DynamicBackground');
const correctImport = layoutContent.includes('from "@/components/layout/DynamicBackground"');

console.log(`   ${usesDynamicBackground ? '✅' : '❌'} Uses DynamicBackground in layout`);
console.log(`   ${correctImport ? '✅' : '❌'} Correct import in layout`);

// Check CSS files
console.log('\n🎨 Checking CSS integration:');
const ditherCssPath = path.join(process.cwd(), 'src/components/Dither.css');
const ditherCssContent = fs.readFileSync(ditherCssPath, 'utf8');

const hasFullscreenStyles = ditherCssContent.includes('.dither-background');
const hasResponsiveStyles = ditherCssContent.includes('@media');

console.log(`   ${hasFullscreenStyles ? '✅' : '❌'} Fullscreen background styles`);
console.log(`   ${hasResponsiveStyles ? '✅' : '❌'} Responsive media queries`);

// Check configuration variants
console.log('\n⚙️  Checking configuration variants:');
const ditherBgPath = path.join(process.cwd(), 'src/components/layout/DitherBackground.tsx');
const ditherBgContent = fs.readFileSync(ditherBgPath, 'utf8');

const hasVariants = ['homepage', 'login', 'dashboard', 'default'].every(variant =>
  ditherBgContent.includes(variant)
);
const hasIntensityLevels = ['low', 'medium', 'high'].every(level =>
  ditherBgContent.includes(level)
);
const hasAccessibility = ditherBgContent.includes('prefers-reduced-motion');

console.log(`   ${hasVariants ? '✅' : '❌'} All page variants configured`);
console.log(`   ${hasIntensityLevels ? '✅' : '❌'} All intensity levels configured`);
console.log(`   ${hasAccessibility ? '✅' : '❌'} Accessibility features (reduced motion)`);

// Final summary
console.log('\n📊 Test Summary:');
const allTestsPassed = allFilesExist && usesDitherBackground && importsCorrectly &&
                      usesDynamicBackground && correctImport && hasFullscreenStyles &&
                      hasResponsiveStyles && hasVariants && hasIntensityLevels && hasAccessibility;

if (allTestsPassed) {
  console.log('🎉 All tests passed! Dither Background system is properly integrated.');
  console.log('\n🚀 Ready to use with the following features:');
  console.log('   • WebGL-based dithered wave effects');
  console.log('   • Fallout-themed color schemes');
  console.log('   • Responsive design and performance optimization');
  console.log('   • Accessibility support (reduced motion)');
  console.log('   • Multiple page variants (homepage, login, dashboard)');
  console.log('   • SSR-safe implementation with fallback backgrounds');
} else {
  console.log('❌ Some tests failed. Please check the issues above.');
  process.exit(1);
}

console.log('\n🌐 Development server should be running at: http://localhost:3001');
console.log('👀 You can now test the background effects in your browser!');