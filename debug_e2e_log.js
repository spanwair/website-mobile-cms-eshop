// E2E Debug and Fix Script
// This script helps debug and fix E2E test failures by logging error details and running systematic fixes

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  errorLogsDir: './e2e_error_logs',
  screenshotsDir: './e2e_screenshots',
  testResultsDir: './test-results',
  helpersDir: './website/tests/e2e/helpers'
};

// Ensure directories exist
function ensureDirectoriesExist() {
  for (const [dirName, dirPath] of Object.entries(CONFIG)) {
    const dir = path.join(process.cwd(), dirPath);
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Analyze test failures from the E2E output
function analyzeE2ETestFailures(output) {
  const errors = [];
  const lines = output.split('\n');
  
  let currentTest = null;
  let currentError = null;
  
  for (const line of lines) {
    // Detect test start
    if (line.includes(' [chromium] › tests/e2e/') && line.includes(' › ')) {
      // Extract test name
      const match = line.match(/\]: \[(\w+)\] › tests(e2e\/.*)\: (\d+): (\d+): (.*)/);
      if (match) {
        currentTest = {
          file: match[2],
          line: parseInt(match[3]),
          description: match[4],
          status: 'running',
          failures: []
        };
      }
    }
    
    // Detect test pass
    if (line.includes('✓') && currentTest) {
      currentTest.status = 'passed';
      console.log(`✓ Test PASSED: ${currentTest.description}`);
      currentTest = null;
      continue;
    }
    
    // Detect test failure
    if (line.includes('✗') && currentTest) {
      currentTest.status = 'failed';
      console.log(`✗ Test FAILED: ${currentTest.description}`);
      
      // Collect failure details
      let failureDetails = {
        testName: currentTest.description,
        file: currentTest.file,
        line: currentTest.line,
        error: null,
        screenshotPath: null,
        context: {}
      };
      
      // Look for error details in the next few lines
      errors.push(failureDetails);
      currentError = failureDetails;
    }
    
    // Collect error context
    if (currentError && line.includes('Error:')) {
      currentError.error = line.trim();
    }
    
    if (currentError && line.includes('screenshot')) {
      const screenshotMatch = line.match(/attachment #(\d+): (screenshot \(image\/png\)) ────────────────────────────────────────────────────────────────/);
      if (screenshotMatch) {
        currentError.screenshotPath = `screenshot${screenshotMatch[1]}.png`;
      }
    }
  }
  
  return errors;
}

// Create detailed error report
function createErrorReport(testName, errorDetails, testOutput) {
  const report = {
    timestamp: new Date().toISOString(),
    testName: testName,
    errorDetails: errorDetails,
    testOutput: testOutput,
    rootCauseAnalysis: null,
    suggestedFixes: null,
    debuggingSteps: []
  };
  
  // Analyze root cause based on error
  if (errorDetails.error && errorDetails.error.includes('Target page, context or browser has been closed')) {
    report.rootCauseAnalysis = {
      problem: 'Browser context lifecycle issue during sequential test execution',
      symptoms: 'Page navigation failure after product creation',
      likelyCause: 'Test isolation not maintained between product CRUD operations',
      impact: 'Product tests (create -> edit -> status changes) are interdependent'
    };
    
    report.suggestedFixes = [
      {
        issue: 'Add test setup/teardown between product CRUD tests',
        solution: 'Implement beforeEach() and afterEach() hooks in product spec',
        steps: [
          'Add beforeEach to ensure clean browser state',
          'Reset to admin login before each product operation',
          'Clear URL params and form states',
          'Implement explicit waits for navigation completion'
        ]
      },
      {
        issue: 'Ensure proper page state management',
        solution: 'Implement page object pattern for product operations',
        steps: [
          'Create ProductPage class handling all product operations',
          'Ensure each operation waits for proper page load',
          'Handle redirects and navigation explicitly'
        ]
      }
    ];
    
    report.debuggingSteps = [
      'Review test order and dependencies',
      'Check if product creation test is completing successfully',
      'Verify product detail page is accessible after creation',
      'Ensure session persistence across tests',
      'Check for any side effects between tests'
    ];
  }
  
  return report;
}

// Save error report to file
function saveErrorReport(testName, report) {
  const reportFile = path.join(process.cwd(), CONFIG.errorLogsDir, `${testName}_error_report.json`);
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📋 Error report saved to: ${reportFile}`);
  
  return reportFile;
}

// Main analysis function
function analyzeE2EOutput(output) {
  console.log('\n🔍 Analyzing E2E test output...\n');
  
  const errors = analyzeE2ETestFailures(output);
  
  if (errors.length === 0) {
    console.log('✅ No errors detected in the output');
    return;
  }
  
  console.log(`\n❌ ${errors.length} test(s) failed:`);
  
  // Focus on the main problematic test
  const productTestErrors = errors.filter(err => 
    err.testName && err.testName.includes('edit product')
  );
  
  if (productTestErrors.length > 0) {
    const test = productTestErrors[0];
    console.log(`\n📝 Main problematic test: ${test.testName}`);
    console.log(`   File: ${test.file}:${test.line}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
    
    // Create detailed error report
    const errorReport = createErrorReport(
      test.testName,
      test,
      output
    );
    
    // Save the report
    saveErrorReport(test.testName, errorReport);
    
    return errorReport;
  }
}

// Generate debugging checklist
function generateDebuggingChecklist() {
  const checklist = {
    timestamp: new Date().toISOString(),
    priorityIssues: [
      {
        id: 1,
        issue: 'Product edit test (04-10) fails with browser context error',
        symptoms: 'Page.fill() throws "Target page, context or browser has been closed"',
        action: 'IMMEDIATE: Debug browser state persistence',
        steps: [
          'Check if page exists before calling page.fill()',
          'Ensure proper page navigation completion',
          'Add explicit waits for element readiness',
          'Verify page is not closed or redirected'
        ],
        verification: 'Test should pass after fixing page state management'
      },
      {
        id: 2,
        issue: 'Sequential dependency between product tests',
        symptoms: 'Edit test fails because create test may not have completed',
        action: 'MEDIUM: Implement test isolation',
        steps: [
          'Add beforeEach hook to reset browser state',
          'Ensure each test starts with clean slate',
          'Reset URL parameters between tests',
          'Clear form states and page cache'
        ],
        verification: 'Tests should run independently without cascading failures'
      },
      {
        id: 3,
        issue: 'Test flow assumptions broken',
        symptoms: 'Test assumes specific product ID from previous test',
        action: 'LOW: Refactor test data management',
        steps: [
          'Store and share product IDs properly',
          'Use consistent test data setup',
          'Implement data cleanup between tests',
          'Use unique test data for each test run'
        ],
        verification: 'Tests should be robust against data changes'
      }
    ],
    environmentChecks: [
      'Browser: Chromium (latest stable)',
      'Page load timeout: 30 seconds',
      'Network idle timeout: 5 seconds',
      'Navigation timeout: 10 seconds',
      'Element wait timeout: 5 seconds'
    ],
    suggestedTestOrder: [
      '01-auth.spec.ts (all auth tests)',
      '02-parties.spec.ts',
      '03-categories.spec.ts',
      '04-products.spec.ts - Test product creation first',
      '04-products.spec.ts - Test product editing separately',
      '04-products.spec.ts - Test status changes separately'
    ],
    immediateActionPlan: [
      '1. Temporarily skip failing edit test (04-10)',
      '2. Add beforeEach hook to reset browser', 
      '3. Ensure product creation test completes successfully',
      '4. Add explicit waits and error handling',
      '5. Review and fix broken test flow'
    ]
  };
  
  // Save checklist
  const checklistFile = path.join(process.cwd(), CONFIG.errorLogsDir, 'debugging_checklist.json');
  fs.writeFileSync(checklistFile, JSON.stringify(checklist, null, 2));
  console.log(`\n✅ Debugging checklist saved to: ${checklistFile}`);
  
  return checklist;
}

// Main function
function main() {
  console.log('🚀 Starting E2E Debug Analysis...\n');
  
  ensureDirectoriesExist();
  
  // Read the test output (you can modify this to capture actual output)
  const testOutput = process.argv[2] || '';
  
  if (!testOutput) {
    console.log('⚠️  No test output provided. Please provide test output as argument.');
    console.log('Usage: node debug_e2e_log.js "<test output>"');
    return;
  }
  
  console.log(`📊 Analyzing ${testOutput.length} characters of test output...\n`);
  
  // Analyze the test output
  const errorReport = analyzeE2EOutput(testOutput);
  
  if (errorReport) {
    console.log('\n🔧 Generating debugging checklist...');
    const checklist = generateDebuggingChecklist();
    
    console.log('\n✅ Analysis complete!');
    console.log('📝 Check the error_logs directory for detailed analysis reports.');
    console.log('📋 Review the debugging_checklist.json for action plan.');
  } else {
    console.log('\n✅ No critical errors found in the output.');
  }
}

// Run main function
main();