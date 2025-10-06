#!/usr/bin/env node

/**
 * Comprehensive Accessibility Test Runner
 *
 * This script orchestrates the execution of all accessibility tests and generates
 * a unified report. It can be run locally or integrated into CI/CD pipelines.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testDir: path.join(__dirname, '..', '..'),
  reportsDir: path.join(__dirname, '..', '..', 'test-results', 'accessibility-reports'),
  testFiles: [
    'tests/accessibility/color-contrast.spec.ts',
    'tests/accessibility/wcag-aa-compliance.spec.ts',
    'tests/accessibility/color-blindness-simulation.spec.ts',
    'tests/accessibility/keyboard-navigation.spec.ts',
    'tests/accessibility/screen-reader-compatibility.spec.ts',
    'tests/accessibility/multi-environment-testing.spec.ts',
    'tests/accessibility/automated-reporting.spec.ts'
  ],
  browsers: ['chromium'], // Can be extended to include 'firefox', 'webkit'
  parallel: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 2 : 1,
  timeout: 60000, // 60 seconds per test
  baseURL: process.env.BASE_URL || 'http://localhost:3000'
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };

  console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`);
  }
}

function checkServerHealth() {
  log('Checking server health...');

  try {
    const response = execSync(`curl -f -s -o /dev/null -w "%{http_code}" ${config.baseURL}`, {
      encoding: 'utf-8',
      timeout: 10000
    });

    if (response.trim() === '200') {
      log('Server is healthy and ready for testing', 'success');
      return true;
    } else {
      log(`Server returned status code: ${response.trim()}`, 'warning');
      return false;
    }
  } catch (error) {
    log('Server health check failed. Attempting to start development server...', 'warning');
    return false;
  }
}

function startDevServer() {
  log('Starting development server...');

  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: config.testDir,
    stdio: 'pipe',
    detached: true
  });

  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => {
      serverProcess.kill();
      reject(new Error('Server startup timeout'));
    }, 30000);

    serverProcess.stdout.on('data', (data) => {
      output += data.toString();

      // Check for various server ready indicators
      if (output.includes('Local:') ||
          output.includes('ready') ||
          output.includes('compiled successfully') ||
          output.includes('started server on')) {
        clearTimeout(timeout);
        log('Development server started successfully', 'success');

        // Wait a bit more for server to be fully ready
        setTimeout(() => {
          resolve(serverProcess);
        }, 3000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      if (errorOutput.includes('Error') || errorOutput.includes('EADDRINUSE')) {
        clearTimeout(timeout);
        log(`Server startup error: ${errorOutput}`, 'error');
        reject(new Error(errorOutput));
      }
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function runPlaywrightTests() {
  log('Running Playwright accessibility tests...');

  const playwrightConfig = {
    testDir: config.testDir,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: config.retries,
    workers: config.parallel,
    reporter: [
      ['html', { outputFolder: path.join(config.reportsDir, 'playwright-html') }],
      ['json', { outputFile: path.join(config.reportsDir, 'playwright-results.json') }],
      ['junit', { outputFile: path.join(config.reportsDir, 'playwright-junit.xml') }]
    ],
    use: {
      baseURL: config.baseURL,
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      timeout: config.timeout
    },
    projects: config.browsers.map(browser => ({
      name: browser,
      use: { ...require('@playwright/test').devices[`Desktop ${browser.charAt(0).toUpperCase() + browser.slice(1)}`] }
    })),
    webServer: {
      command: 'npm run dev',
      url: config.baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000
    }
  };

  // Write temporary Playwright config
  const tempConfigPath = path.join(config.testDir, 'playwright.accessibility.config.js');
  fs.writeFileSync(tempConfigPath, `module.exports = ${JSON.stringify(playwrightConfig, null, 2)};`);

  try {
    // Run specific accessibility test files
    const testPattern = config.testFiles.join(' ');
    const command = `npx playwright test ${testPattern} --config=${tempConfigPath}`;

    log(`Executing: ${command}`);

    const result = execSync(command, {
      cwd: config.testDir,
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    log('Playwright tests completed successfully', 'success');
    return { success: true, output: result };

  } catch (error) {
    log(`Playwright tests failed: ${error.message}`, 'error');
    return { success: false, output: error.stdout || error.message };
  } finally {
    // Clean up temporary config
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  }
}

function generateSummaryReport() {
  log('Generating summary report...');

  const summaryPath = path.join(config.reportsDir, 'latest-summary.json');
  const detailedReports = fs.readdirSync(config.reportsDir)
    .filter(file => file.startsWith('accessibility-report-') && file.endsWith('.json'))
    .sort()
    .slice(-1); // Get the most recent report

  if (detailedReports.length === 0) {
    log('No detailed accessibility reports found', 'warning');
    return;
  }

  try {
    const latestReportPath = path.join(config.reportsDir, detailedReports[0]);
    const reportData = JSON.parse(fs.readFileSync(latestReportPath, 'utf-8'));

    const summary = {
      timestamp: new Date().toISOString(),
      testRun: {
        date: reportData.metadata?.timestamp || new Date().toISOString(),
        duration: reportData.metadata?.testDuration || 0,
        testsRun: reportData.metadata?.totalTestsRun || 0
      },
      results: {
        overallScore: reportData.executiveSummary?.overallScore || 0,
        complianceLevel: reportData.executiveSummary?.complianceLevel || 'Unknown',
        criticalIssues: reportData.executiveSummary?.criticalIssues || 0,
        totalIssues: reportData.executiveSummary?.totalIssues || 0,
        pagesAffected: reportData.executiveSummary?.pagesAffected || 0
      },
      compliance: {
        wcagLevel: reportData.complianceCertification?.wcagLevel || 'A',
        readyForCertification: reportData.complianceCertification?.readyForCertification || false,
        certificationScore: reportData.complianceCertification?.certificationScore || 0,
        missingCriteria: reportData.complianceCertification?.missingCriteria || []
      },
      categories: {
        colorContrast: reportData.detailedFindings?.colorContrast?.score || 0,
        wcagCompliance: reportData.detailedFindings?.wcagCompliance?.score || 0,
        colorBlindness: reportData.detailedFindings?.colorBlindness?.score || 0,
        keyboardNavigation: reportData.detailedFindings?.keyboardNavigation?.score || 0,
        screenReader: reportData.detailedFindings?.screenReader?.score || 0,
        multiEnvironment: reportData.detailedFindings?.multiEnvironment?.score || 0
      },
      recommendations: (reportData.recommendations || []).slice(0, 5).map(rec => ({
        priority: rec.priority,
        title: rec.title,
        category: rec.category,
        effort: rec.effort,
        impact: rec.impact
      }))
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    log(`Summary report saved to: ${summaryPath}`, 'success');

    return summary;

  } catch (error) {
    log(`Failed to generate summary report: ${error.message}`, 'error');
    return null;
  }
}

function printResults(summary) {
  if (!summary) {
    log('No summary data available for results display', 'warning');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 ACCESSIBILITY TEST RESULTS');
  console.log('='.repeat(60));

  console.log(`\n📊 OVERALL SCORE: ${summary.results.overallScore}/100`);
  console.log(`🏆 COMPLIANCE LEVEL: ${summary.results.complianceLevel}`);
  console.log(`⚠️  CRITICAL ISSUES: ${summary.results.criticalIssues}`);
  console.log(`📋 TOTAL ISSUES: ${summary.results.totalIssues}`);
  console.log(`📄 PAGES AFFECTED: ${summary.results.pagesAffected}`);

  console.log(`\n🎯 WCAG COMPLIANCE:`);
  console.log(`   Level: ${summary.compliance.wcagLevel}`);
  console.log(`   Ready for Certification: ${summary.compliance.readyForCertification ? '✅ Yes' : '❌ No'}`);
  console.log(`   Certification Score: ${summary.compliance.certificationScore}/100`);

  console.log(`\n📈 CATEGORY SCORES:`);
  console.log(`   Color Contrast: ${summary.categories.colorContrast}/100`);
  console.log(`   WCAG Compliance: ${summary.categories.wcagCompliance}/100`);
  console.log(`   Color Blindness: ${summary.categories.colorBlindness}/100`);
  console.log(`   Keyboard Navigation: ${summary.categories.keyboardNavigation}/100`);
  console.log(`   Screen Reader: ${summary.categories.screenReader}/100`);
  console.log(`   Multi-Environment: ${summary.categories.multiEnvironment}/100`);

  if (summary.recommendations.length > 0) {
    console.log(`\n🔧 TOP RECOMMENDATIONS:`);
    summary.recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${priorityIcon} ${rec.title} (${rec.effort} effort, ${rec.impact} impact)`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Quality gate evaluation
  const qualityGatePass = summary.results.overallScore >= 75 && summary.results.criticalIssues === 0;
  if (qualityGatePass) {
    log('✅ QUALITY GATE: PASSED', 'success');
  } else {
    log('❌ QUALITY GATE: FAILED', 'error');
    log(`   Minimum score required: 75 (current: ${summary.results.overallScore})`, 'error');
    log(`   Critical issues allowed: 0 (current: ${summary.results.criticalIssues})`, 'error');
  }

  return qualityGatePass;
}

// Main execution function
async function main() {
  console.log('🚀 Starting Comprehensive Accessibility Testing');
  console.log('================================================\n');

  try {
    // Setup
    ensureDirectoryExists(config.reportsDir);

    // Check if server is running, start if needed
    let serverProcess = null;
    if (!checkServerHealth()) {
      serverProcess = await startDevServer();
    }

    // Wait a bit more to ensure server is fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Final health check
    if (!checkServerHealth()) {
      throw new Error('Server is not ready for testing');
    }

    // Run accessibility tests
    const testResult = await runPlaywrightTests();

    // Generate reports
    const summary = generateSummaryReport();

    // Display results
    const qualityGatePass = printResults(summary);

    // Cleanup
    if (serverProcess) {
      log('Stopping development server...');
      serverProcess.kill();
    }

    // Exit with appropriate code
    if (!testResult.success || !qualityGatePass) {
      log('Accessibility testing failed or quality gate not met', 'error');
      process.exit(1);
    } else {
      log('Accessibility testing completed successfully!', 'success');
      process.exit(0);
    }

  } catch (error) {
    log(`Fatal error during accessibility testing: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Accessibility Test Runner

Usage: node run-accessibility-tests.js [options]

Options:
  --help, -h          Show this help message
  --base-url <url>    Set the base URL for testing (default: http://localhost:3000)
  --parallel <num>    Set number of parallel workers (default: 2, 1 in CI)
  --retries <num>     Set number of retries for failed tests (default: 1, 2 in CI)
  --browser <name>    Set browser to test with (default: chromium)
  --no-server         Skip server health check and startup

Environment Variables:
  CI                  Set to enable CI mode (affects parallelism and retries)
  BASE_URL           Base URL for testing
  NODE_ENV           Environment (affects reporting)

Examples:
  node run-accessibility-tests.js
  node run-accessibility-tests.js --base-url http://localhost:4000
  node run-accessibility-tests.js --parallel 1 --retries 3
  CI=true node run-accessibility-tests.js
`);
  process.exit(0);
}

// Parse command line arguments
args.forEach((arg, index) => {
  switch (arg) {
    case '--base-url':
      config.baseURL = args[index + 1];
      break;
    case '--parallel':
      config.parallel = parseInt(args[index + 1]) || config.parallel;
      break;
    case '--retries':
      config.retries = parseInt(args[index + 1]) || config.retries;
      break;
    case '--browser':
      config.browsers = [args[index + 1]];
      break;
    case '--no-server':
      config.skipServerCheck = true;
      break;
  }
});

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, config };