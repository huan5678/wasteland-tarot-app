import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Teardown for Accessibility Testing
 *
 * Cleans up after accessibility testing and generates final reports
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting accessibility testing teardown...');

  const reportsDir = path.join(process.cwd(), 'test-results', 'accessibility-reports');
  const artifactsDir = path.join(process.cwd(), 'test-results', 'accessibility-artifacts');

  try {
    // Generate final test summary
    await generateFinalSummary(reportsDir);

    // Clean up temporary files
    await cleanupTemporaryFiles(artifactsDir);

    // Generate CI/CD integration files
    await generateCIFiles(reportsDir);

    // Archive old reports if needed
    await archiveOldReports(reportsDir);

    console.log('✅ Global teardown completed successfully!');

  } catch (error) {
    console.error('❌ Error during teardown:', error);
    // Don't throw - teardown should not fail the test run
  }
}

async function generateFinalSummary(reportsDir: string) {
  console.log('📊 Generating final test summary...');

  const startTime = parseInt(process.env.TEST_START_TIME || '0');
  const endTime = Date.now();
  const duration = endTime - startTime;

  // Look for the latest accessibility report
  const reportFiles = fs.readdirSync(reportsDir)
    .filter(file => file.startsWith('accessibility-report-') && file.endsWith('.json'))
    .sort()
    .reverse();

  let finalSummary = {
    testExecution: {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: Math.round(duration / 1000), // seconds
      environment: process.env.NODE_ENV || 'test'
    },
    results: {
      overallScore: 0,
      complianceLevel: 'Unknown',
      criticalIssues: 0,
      totalIssues: 0,
      qualityGatePassed: false
    },
    files: {
      reportCount: reportFiles.length,
      latestReport: reportFiles[0] || null,
      summaryGenerated: new Date().toISOString()
    }
  };

  // If we have a recent report, extract key metrics
  if (reportFiles.length > 0) {
    try {
      const latestReportPath = path.join(reportsDir, reportFiles[0]);
      const reportData = JSON.parse(fs.readFileSync(latestReportPath, 'utf-8'));

      finalSummary.results = {
        overallScore: reportData.executiveSummary?.overallScore || 0,
        complianceLevel: reportData.executiveSummary?.complianceLevel || 'Unknown',
        criticalIssues: reportData.executiveSummary?.criticalIssues || 0,
        totalIssues: reportData.executiveSummary?.totalIssues || 0,
        qualityGatePassed: (reportData.executiveSummary?.overallScore || 0) >= 75 &&
                          (reportData.executiveSummary?.criticalIssues || 999) === 0
      };

    } catch (error) {
      console.warn('⚠️  Could not parse latest accessibility report:', error);
    }
  }

  // Save final summary
  const summaryPath = path.join(reportsDir, 'final-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(finalSummary, null, 2));

  // Also create a simple status file for quick CI checks
  const statusPath = path.join(reportsDir, 'test-status.txt');
  const statusContent = `
ACCESSIBILITY TEST EXECUTION COMPLETE

Duration: ${Math.round(duration / 1000)}s
Overall Score: ${finalSummary.results.overallScore}/100
Compliance Level: ${finalSummary.results.complianceLevel}
Critical Issues: ${finalSummary.results.criticalIssues}
Quality Gate: ${finalSummary.results.qualityGatePassed ? 'PASSED' : 'FAILED'}
Generated: ${new Date().toISOString()}
`.trim();

  fs.writeFileSync(statusPath, statusContent);

  console.log(`📋 Final summary saved to: ${summaryPath}`);
  console.log(`📄 Test status saved to: ${statusPath}`);
}

async function cleanupTemporaryFiles(artifactsDir: string) {
  console.log('🗑️  Cleaning up temporary files...');

  if (!fs.existsSync(artifactsDir)) {
    return;
  }

  try {
    const tempFiles = fs.readdirSync(artifactsDir)
      .filter(file =>
        file.includes('temp-') ||
        file.includes('session-state') ||
        file.endsWith('.tmp')
      );

    tempFiles.forEach(file => {
      const filePath = path.join(artifactsDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`  🗑️  Removed: ${file}`);
      } catch (error) {
        console.warn(`  ⚠️  Could not remove ${file}:`, error);
      }
    });

    console.log(`🧹 Cleaned up ${tempFiles.length} temporary files`);

  } catch (error) {
    console.warn('⚠️  Error during cleanup:', error);
  }
}

async function generateCIFiles(reportsDir: string) {
  console.log('🔧 Generating CI/CD integration files...');

  // Load the latest summary
  const summaryPath = path.join(reportsDir, 'final-summary.json');
  let summary = null;

  if (fs.existsSync(summaryPath)) {
    try {
      summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    } catch (error) {
      console.warn('⚠️  Could not read final summary for CI generation');
    }
  }

  // Generate GitHub Actions output format
  const githubOutputPath = path.join(reportsDir, 'github-output.txt');
  const githubOutput = `
accessibility_score=${summary?.results?.overallScore || 0}
compliance_level=${summary?.results?.complianceLevel || 'Unknown'}
critical_issues=${summary?.results?.criticalIssues || 0}
quality_gate=${summary?.results?.qualityGatePassed ? 'PASSED' : 'FAILED'}
test_duration=${summary?.testExecution?.duration || 0}
`.trim();

  fs.writeFileSync(githubOutputPath, githubOutput);

  // Generate Jenkins/CI properties file
  const jenkinsPropsPath = path.join(reportsDir, 'ci.properties');
  const jenkinsProps = `
ACCESSIBILITY_SCORE=${summary?.results?.overallScore || 0}
ACCESSIBILITY_COMPLIANCE_LEVEL=${summary?.results?.complianceLevel || 'Unknown'}
ACCESSIBILITY_CRITICAL_ISSUES=${summary?.results?.criticalIssues || 0}
ACCESSIBILITY_QUALITY_GATE=${summary?.results?.qualityGatePassed ? 'PASSED' : 'FAILED'}
ACCESSIBILITY_TEST_DURATION=${summary?.testExecution?.duration || 0}
ACCESSIBILITY_REPORT_TIMESTAMP=${summary?.testExecution?.endTime || new Date().toISOString()}
`.trim();

  fs.writeFileSync(jenkinsPropsPath, jenkinsProps);

  // Generate SARIF file for GitHub security tab (if there are issues)
  if (summary?.results?.totalIssues > 0) {
    const sarifReport = {
      version: "2.1.0",
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      runs: [{
        tool: {
          driver: {
            name: "Accessibility Test Suite",
            version: "1.0.0",
            informationUri: "https://www.w3.org/WAI/WCAG21/quickref/",
            rules: [
              {
                id: "accessibility-critical",
                shortDescription: { text: "Critical accessibility issue" },
                helpUri: "https://www.w3.org/WAI/WCAG21/quickref/"
              },
              {
                id: "accessibility-serious",
                shortDescription: { text: "Serious accessibility issue" },
                helpUri: "https://www.w3.org/WAI/WCAG21/quickref/"
              }
            ]
          }
        },
        results: []
      }]
    };

    // Add placeholder results based on summary
    if (summary.results.criticalIssues > 0) {
      sarifReport.runs[0].results.push({
        ruleId: "accessibility-critical",
        message: { text: `Found ${summary.results.criticalIssues} critical accessibility issues` },
        level: "error",
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: "src/" },
            region: { startLine: 1, startColumn: 1 }
          }
        }]
      });
    }

    const sarifPath = path.join(reportsDir, 'accessibility-results.sarif');
    fs.writeFileSync(sarifPath, JSON.stringify(sarifReport, null, 2));
  }

  console.log('📁 CI/CD integration files generated:');
  console.log(`  📄 GitHub Actions: ${githubOutputPath}`);
  console.log(`  📄 Jenkins/CI: ${jenkinsPropsPath}`);
}

async function archiveOldReports(reportsDir: string) {
  console.log('📦 Archiving old reports...');

  try {
    const archiveDir = path.join(reportsDir, 'archive');

    // Create archive directory if it doesn't exist
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Find reports older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const reportFiles = fs.readdirSync(reportsDir)
      .filter(file => file.startsWith('accessibility-report-') && file.endsWith('.json'));

    let archivedCount = 0;

    reportFiles.forEach(file => {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime.getTime() < thirtyDaysAgo) {
        const archivePath = path.join(archiveDir, file);

        try {
          fs.renameSync(filePath, archivePath);
          archivedCount++;
        } catch (error) {
          console.warn(`⚠️  Could not archive ${file}:`, error);
        }
      }
    });

    if (archivedCount > 0) {
      console.log(`📦 Archived ${archivedCount} old reports to ${archiveDir}`);
    } else {
      console.log('📦 No old reports to archive');
    }

    // Also archive old markdown reports
    const markdownFiles = fs.readdirSync(reportsDir)
      .filter(file => file.startsWith('accessibility-report-') && file.endsWith('.md'));

    markdownFiles.forEach(file => {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime.getTime() < thirtyDaysAgo) {
        const archivePath = path.join(archiveDir, file);

        try {
          fs.renameSync(filePath, archivePath);
        } catch (error) {
          console.warn(`⚠️  Could not archive ${file}:`, error);
        }
      }
    });

  } catch (error) {
    console.warn('⚠️  Error during archiving:', error);
  }
}

export default globalTeardown;