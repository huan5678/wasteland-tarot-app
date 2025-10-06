#!/bin/bash

# Accessibility Testing Quick Start Script
# This script provides an easy way to run accessibility tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  all                Run all accessibility tests (default)"
    echo "  color-contrast     Run color contrast tests only"
    echo "  wcag               Run WCAG compliance tests only"
    echo "  colorblind         Run color blindness simulation tests only"
    echo "  keyboard           Run keyboard navigation tests only"
    echo "  screen-reader      Run screen reader compatibility tests only"
    echo "  multi-env          Run multi-environment tests only"
    echo "  report             Run reporting tests only"
    echo "  ci                 Run tests in CI mode"
    echo "  setup              Set up testing environment"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Run all tests"
    echo "  $0 color-contrast  # Run only color contrast tests"
    echo "  $0 ci              # Run in CI mode"
    echo "  $0 setup           # Set up testing environment"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi

    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    # Install npm dependencies
    npm ci

    # Install Playwright browsers if needed
    if ! command_exists playwright; then
        print_status "Installing Playwright..."
        npx playwright install --with-deps
    else
        print_status "Updating Playwright browsers..."
        npx playwright install --with-deps
    fi

    print_success "Dependencies installed"
}

# Function to setup testing environment
setup_environment() {
    print_status "Setting up accessibility testing environment..."

    check_prerequisites
    install_dependencies

    # Create test results directory
    mkdir -p test-results/accessibility-reports
    mkdir -p test-results/accessibility-artifacts

    # Make run script executable
    chmod +x tests/accessibility/run-accessibility-tests.js

    print_success "Environment setup completed"
    print_status "You can now run accessibility tests with: $0"
}

# Function to check if development server is running
check_dev_server() {
    print_status "Checking if development server is running..."

    if curl -f -s -o /dev/null http://localhost:3000; then
        print_success "Development server is running"
        return 0
    else
        print_warning "Development server is not running"
        return 1
    fi
}

# Function to start development server
start_dev_server() {
    print_status "Starting development server..."

    # Start server in background
    npm run dev &
    DEV_SERVER_PID=$!

    # Wait for server to be ready
    print_status "Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -f -s -o /dev/null http://localhost:3000; then
            print_success "Development server is ready"
            return 0
        fi
        sleep 2
    done

    print_error "Development server failed to start within 60 seconds"
    kill $DEV_SERVER_PID 2>/dev/null || true
    exit 1
}

# Function to run accessibility tests
run_tests() {
    local test_type="$1"

    print_status "Running accessibility tests: $test_type"

    case "$test_type" in
        "all")
            npm run test:accessibility
            ;;
        "color-contrast")
            npm run test:accessibility:color-contrast
            ;;
        "wcag")
            npm run test:accessibility:wcag
            ;;
        "colorblind")
            npm run test:accessibility:colorblind
            ;;
        "keyboard")
            npm run test:accessibility:keyboard
            ;;
        "screen-reader")
            npm run test:accessibility:screen-reader
            ;;
        "multi-env")
            npm run test:accessibility:multi-env
            ;;
        "report")
            npm run test:accessibility:report
            ;;
        "ci")
            npm run test:accessibility:ci
            ;;
        *)
            print_error "Unknown test type: $test_type"
            show_usage
            exit 1
            ;;
    esac
}

# Function to show test results
show_results() {
    local reports_dir="test-results/accessibility-reports"

    if [ -f "$reports_dir/final-summary.json" ]; then
        print_status "Test Results Summary:"
        echo ""

        # Extract key metrics using grep and sed (works without jq)
        if command_exists jq; then
            # Use jq if available
            SCORE=$(cat "$reports_dir/final-summary.json" | jq -r '.results.overallScore // 0')
            COMPLIANCE=$(cat "$reports_dir/final-summary.json" | jq -r '.results.complianceLevel // "Unknown"')
            CRITICAL=$(cat "$reports_dir/final-summary.json" | jq -r '.results.criticalIssues // 0')
            QUALITY_GATE=$(cat "$reports_dir/final-summary.json" | jq -r '.results.qualityGatePassed // false')
        else
            # Fallback parsing without jq
            SCORE=$(grep -o '"overallScore":[0-9]*' "$reports_dir/final-summary.json" | cut -d':' -f2)
            COMPLIANCE=$(grep -o '"complianceLevel":"[^"]*' "$reports_dir/final-summary.json" | cut -d'"' -f4)
            CRITICAL=$(grep -o '"criticalIssues":[0-9]*' "$reports_dir/final-summary.json" | cut -d':' -f2)
            QUALITY_GATE=$(grep -o '"qualityGatePassed":[a-z]*' "$reports_dir/final-summary.json" | cut -d':' -f2)
        fi

        echo "  📊 Overall Score: ${SCORE}/100"
        echo "  🏆 Compliance Level: ${COMPLIANCE}"
        echo "  ⚠️  Critical Issues: ${CRITICAL}"
        echo "  🎯 Quality Gate: ${QUALITY_GATE}"
        echo ""

        if [ -f "$reports_dir/latest-summary.json" ]; then
            print_status "Detailed reports available in: $reports_dir"
        fi

        # Show latest markdown report if available
        latest_md=$(ls -t "$reports_dir"/*.md 2>/dev/null | head -1)
        if [ -n "$latest_md" ]; then
            print_status "Human-readable report: $latest_md"
        fi

    else
        print_warning "No test results found. Tests may have failed to complete."
    fi
}

# Main execution
main() {
    local test_type="${1:-all}"

    # Handle special commands
    case "$test_type" in
        "help"|"-h"|"--help")
            show_usage
            exit 0
            ;;
        "setup")
            setup_environment
            exit 0
            ;;
    esac

    # Check prerequisites
    check_prerequisites

    # Check if development server is running, start if needed
    server_started=false
    if ! check_dev_server; then
        start_dev_server
        server_started=true
    fi

    # Run tests
    if run_tests "$test_type"; then
        print_success "Accessibility tests completed successfully"
        show_results
        exit_code=0
    else
        print_error "Accessibility tests failed"
        show_results
        exit_code=1
    fi

    # Cleanup: stop development server if we started it
    if [ "$server_started" = true ] && [ -n "$DEV_SERVER_PID" ]; then
        print_status "Stopping development server..."
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi

    exit $exit_code
}

# Handle Ctrl+C gracefully
trap 'print_warning "Interrupted by user"; kill $DEV_SERVER_PID 2>/dev/null || true; exit 130' INT

# Run main function with all arguments
main "$@"