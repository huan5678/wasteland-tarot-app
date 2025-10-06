#!/bin/bash

# 🏜️ Wasteland Tarot Test Runner
# Vault-Tec Certified Testing Protocol

set -e

# Colors for Pip-Boy interface
PIP_BOY_GREEN='\033[0;32m'
RADIATION_ORANGE='\033[0;33m'
DANGER_RED='\033[0;31m'
VAULT_BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Pip-Boy ASCII Art
echo -e "${PIP_BOY_GREEN}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║           PIP-BOY 3000 MkIV           ║"
echo "  ║        TESTING PROTOCOL v2.0          ║"
echo "  ║                                       ║"
echo "  ║    🏜️  WASTELAND TAROT TESTS  🎴    ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Function to print status messages
print_status() {
    echo -e "${PIP_BOY_GREEN}📟 [PIP-BOY]: $1${NC}"
}

print_warning() {
    echo -e "${RADIATION_ORANGE}☢️  [RADIATION WARNING]: $1${NC}"
}

print_error() {
    echo -e "${DANGER_RED}💥 [SYSTEM ERROR]: $1${NC}"
}

print_info() {
    echo -e "${VAULT_BLUE}ℹ️  [VAULT-TEC INFO]: $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Vault-Tec systems not detected! Please run from project root."
    exit 1
fi

# Initialize Vault-Tec systems
print_status "Initializing Vault-Tec testing protocols..."

# Parse command line arguments
TEST_TYPE=""
COVERAGE=false
WATCH=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        unit|integration|component)
            TEST_TYPE="$1"
            shift
            ;;
        e2e)
            TEST_TYPE="e2e"
            shift
            ;;
        performance|perf)
            TEST_TYPE="performance"
            shift
            ;;
        visual)
            TEST_TYPE="visual"
            shift
            ;;
        accessibility|a11y)
            TEST_TYPE="accessibility"
            shift
            ;;
        all)
            TEST_TYPE="all"
            shift
            ;;
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --watch|-w)
            WATCH=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "🏜️ Wasteland Tarot Test Runner"
            echo ""
            echo "Usage: $0 [TEST_TYPE] [OPTIONS]"
            echo ""
            echo "TEST_TYPE:"
            echo "  unit           Run unit tests (default)"
            echo "  integration    Run integration tests"
            echo "  component      Run component tests"
            echo "  e2e            Run end-to-end tests"
            echo "  performance    Run performance tests"
            echo "  visual         Run visual regression tests"
            echo "  accessibility  Run accessibility tests"
            echo "  all            Run all test suites"
            echo ""
            echo "OPTIONS:"
            echo "  --coverage, -c    Generate coverage report"
            echo "  --watch, -w       Watch mode for development"
            echo "  --verbose, -v     Verbose output"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 unit --coverage"
            echo "  $0 e2e"
            echo "  $0 all --verbose"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Default to unit tests if no type specified
if [ -z "$TEST_TYPE" ]; then
    TEST_TYPE="unit"
fi

# Check dependencies
print_status "Scanning for radioactive dependencies..."
if ! npm list --depth=0 > /dev/null 2>&1; then
    print_warning "Some dependencies may be contaminated. Running npm install..."
    npm install
fi

# Set up environment variables
export NODE_ENV=test
export VAULT_NUMBER=111
export FACTION_ALIGNMENT=BROTHERHOOD_OF_STEEL
export RADIATION_LEVEL=0.3

# Function to run unit tests
run_unit_tests() {
    print_status "Running Vault Laboratory Tests (Unit)..."

    local cmd="npm run test"

    if [ "$COVERAGE" = true ]; then
        cmd="npm run test:coverage"
    fi

    if [ "$WATCH" = true ]; then
        cmd="npm run test:watch"
    fi

    if [ "$VERBOSE" = true ]; then
        cmd="$cmd -- --verbose"
    fi

    eval $cmd
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running Pip-Boy Integration Tests..."
    npm run test -- --testPathPattern="integration.*test\.(ts|tsx)$"
}

# Function to run component tests
run_component_tests() {
    print_status "Running Component Interface Tests..."
    npm run test -- --testPathPattern="components.*test\.(ts|tsx)$"
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running Wasteland Survival Tests (E2E)..."

    # Start the development server if not running
    if ! curl -s http://localhost:3000 > /dev/null; then
        print_info "Starting Vault-Tec development server..."
        npm run build
        npm start &
        SERVER_PID=$!

        # Wait for server to be ready
        print_info "Waiting for Pip-Boy interface to initialize..."
        npx wait-on http://localhost:3000 --timeout 60000
    fi

    # Run Cypress tests
    if [ "$VERBOSE" = true ]; then
        npm run test:e2e -- --config video=true
    else
        npm run test:e2e
    fi

    # Clean up server if we started it
    if [ ! -z "$SERVER_PID" ]; then
        print_info "Shutting down Vault-Tec development server..."
        kill $SERVER_PID
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running Pip-Boy Performance Analysis..."

    # Build optimized version
    print_info "Building optimized Vault interface..."
    npm run build

    # Start production server
    npm start &
    SERVER_PID=$!

    # Wait for server
    npx wait-on http://localhost:3000 --timeout 60000

    # Run Lighthouse tests
    npm run test:perf

    # Clean up
    kill $SERVER_PID
}

# Function to run visual tests
run_visual_tests() {
    print_status "Running Vault Interface Visual Integrity Tests..."

    if [ -z "$PERCY_TOKEN" ]; then
        print_warning "PERCY_TOKEN not set. Visual tests may not upload results."
    fi

    npm run test:visual
}

# Function to run accessibility tests
run_accessibility_tests() {
    print_status "Running Vault Accessibility Compliance Tests..."

    # Run Jest accessibility tests
    npm run test -- --testNamePattern="accessibility|a11y"

    # Run axe-core CLI tests if server is available
    if curl -s http://localhost:3000 > /dev/null; then
        print_info "Running axe-core accessibility scan..."
        npx @axe-core/cli http://localhost:3000 --reporter json --save accessibility-report.json
    fi
}

# Function to run all tests
run_all_tests() {
    print_status "Running Complete Vault-Tec Test Suite..."

    local start_time=$(date +%s)
    local failed_tests=()

    # Run each test suite
    echo ""
    print_info "Phase 1: Laboratory Tests"
    if ! run_unit_tests; then
        failed_tests+=("Unit Tests")
    fi

    echo ""
    print_info "Phase 2: Integration Tests"
    if ! run_integration_tests; then
        failed_tests+=("Integration Tests")
    fi

    echo ""
    print_info "Phase 3: Component Tests"
    if ! run_component_tests; then
        failed_tests+=("Component Tests")
    fi

    echo ""
    print_info "Phase 4: Accessibility Tests"
    if ! run_accessibility_tests; then
        failed_tests+=("Accessibility Tests")
    fi

    echo ""
    print_info "Phase 5: E2E Tests"
    if ! run_e2e_tests; then
        failed_tests+=("E2E Tests")
    fi

    echo ""
    print_info "Phase 6: Performance Tests"
    if ! run_performance_tests; then
        failed_tests+=("Performance Tests")
    fi

    echo ""
    print_info "Phase 7: Visual Tests"
    if ! run_visual_tests; then
        failed_tests+=("Visual Tests")
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo -e "${PIP_BOY_GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${PIP_BOY_GREEN}║           TEST MISSION SUMMARY        ║${NC}"
    echo -e "${PIP_BOY_GREEN}╠═══════════════════════════════════════╣${NC}"
    echo -e "${PIP_BOY_GREEN}║ Duration: ${duration}s                        ║${NC}"

    if [ ${#failed_tests[@]} -eq 0 ]; then
        echo -e "${PIP_BOY_GREEN}║ Status: ✅ ALL SYSTEMS OPERATIONAL    ║${NC}"
        echo -e "${PIP_BOY_GREEN}║ The wasteland is safe for dwellers!  ║${NC}"
    else
        echo -e "${DANGER_RED}║ Status: ❌ SYSTEM FAILURES DETECTED  ║${NC}"
        echo -e "${DANGER_RED}║ Failed: ${failed_tests[@]}            ║${NC}"
    fi

    echo -e "${PIP_BOY_GREEN}╚═══════════════════════════════════════╝${NC}"

    if [ ${#failed_tests[@]} -gt 0 ]; then
        exit 1
    fi
}

# Main execution
case $TEST_TYPE in
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    component)
        run_component_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    performance)
        run_performance_tests
        ;;
    visual)
        run_visual_tests
        ;;
    accessibility)
        run_accessibility_tests
        ;;
    all)
        run_all_tests
        ;;
    *)
        print_error "Unknown test type: $TEST_TYPE"
        exit 1
        ;;
esac

print_status "Test mission completed! Vault dwellers are safe."
echo ""
echo -e "${PIP_BOY_GREEN}🏜️ Stay safe in the wasteland! 🎴${NC}"