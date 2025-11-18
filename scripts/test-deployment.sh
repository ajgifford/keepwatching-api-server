#!/bin/bash

# KeepWatching API Server - Deployment Testing Script
# This script helps validate that the deployment system works correctly

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
}

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Run a test
run_test() {
    local test_name=$1
    local test_command=$2

    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Running: $test_name"

    if eval "$test_command" > /dev/null 2>&1; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "✓ $test_name"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "✗ $test_name"
        return 1
    fi
}

# Show test results
show_results() {
    echo ""
    echo "=========================================="
    echo "Test Results:"
    echo "=========================================="
    echo -e "Total Tests:  $TESTS_RUN"
    echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
    if [ $TESTS_FAILED -gt 0 ]; then
        echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
    else
        echo -e "Failed:       $TESTS_FAILED"
    fi
    echo "=========================================="

    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All tests passed!"
        return 0
    else
        log_error "Some tests failed."
        return 1
    fi
}

# Main test suite
main() {
    echo ""
    log_info "=== KeepWatching API Server - Deployment Testing ==="
    echo ""

    # Test 1: Check if scripts exist
    log_info "Phase 1: Checking if deployment scripts exist..."
    run_test "deploy.sh exists" "[ -f ./scripts/deploy.sh ]"
    run_test "rollback.sh exists" "[ -f ./scripts/rollback.sh ]"
    run_test "deployment-status.sh exists" "[ -f ./scripts/deployment-status.sh ]"
    echo ""

    # Test 2: Check if scripts are executable
    log_info "Phase 2: Checking if scripts are executable..."
    run_test "deploy.sh is executable" "[ -x ./scripts/deploy.sh ]"
    run_test "rollback.sh is executable" "[ -x ./scripts/rollback.sh ]"
    run_test "deployment-status.sh is executable" "[ -x ./scripts/deployment-status.sh ]"
    echo ""

    # Test 3: Check if required commands exist
    log_info "Phase 3: Checking required system commands..."
    run_test "git command exists" "command -v git"
    run_test "yarn command exists" "command -v yarn"
    run_test "pm2 command exists" "command -v pm2"
    run_test "rsync command exists" "command -v rsync"
    run_test "curl command exists" "command -v curl"
    echo ""

    # Test 4: Check git repository status
    log_info "Phase 4: Checking git repository..."
    run_test "Is a git repository" "git rev-parse --git-dir"
    run_test "Can get git commit hash" "git rev-parse --short HEAD"
    run_test "Can get git branch" "git rev-parse --abbrev-ref HEAD"
    echo ""

    # Test 5: Check project files
    log_info "Phase 5: Checking project files..."
    run_test "package.json exists" "[ -f ./package.json ]"
    run_test "ecosystem.config.js exists" "[ -f ./ecosystem.config.js ]"
    run_test "node_modules directory exists" "[ -d ./node_modules ]"
    echo ""

    # Test 6: Check script help flags
    log_info "Phase 6: Testing script help flags..."
    run_test "deploy.sh --help works" "./scripts/deploy.sh --help"
    run_test "rollback.sh --help works" "./scripts/rollback.sh --help"
    run_test "deployment-status.sh --help works" "./scripts/deployment-status.sh --help"
    echo ""

    # Test 7: Test dry-run mode
    log_info "Phase 7: Testing dry-run mode..."
    log_warning "This will simulate a deployment without making changes..."

    if ./scripts/deploy.sh --dry-run 2>&1 | grep -q "DRY-RUN MODE"; then
        TESTS_RUN=$((TESTS_RUN + 1))
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "✓ deploy.sh dry-run mode works"
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "✗ deploy.sh dry-run mode failed"
    fi

    # Only test rollback dry-run if deployments directory exists
    if [ -d ./deployments ] && [ "$(ls -A ./deployments 2>/dev/null | grep -v '^current$' | wc -l)" -gt 0 ]; then
        # Get first deployment for testing
        cd ./deployments
        local test_deployment=$(ls -dt */ 2>/dev/null | sed 's:/*$::' | grep -v '^current$' | head -1)
        cd ..

        if [ -n "$test_deployment" ]; then
            if ./scripts/rollback.sh --dry-run "$test_deployment" 2>&1 | grep -q "DRY-RUN MODE"; then
                TESTS_RUN=$((TESTS_RUN + 1))
                TESTS_PASSED=$((TESTS_PASSED + 1))
                log_success "✓ rollback.sh dry-run mode works"
            else
                TESTS_RUN=$((TESTS_RUN + 1))
                TESTS_FAILED=$((TESTS_FAILED + 1))
                log_error "✗ rollback.sh dry-run mode failed"
            fi
        else
            log_warning "⊘ Skipping rollback dry-run test (no deployments found)"
        fi
    else
        log_warning "⊘ Skipping rollback dry-run test (no deployments directory)"
    fi
    echo ""

    # Test 8: Check deployment-status.sh options
    if [ -d ./deployments ]; then
        log_info "Phase 8: Testing deployment-status.sh options..."
        run_test "deployment-status.sh --current works" "./scripts/deployment-status.sh --current"
        run_test "deployment-status.sh --history works" "./scripts/deployment-status.sh --history"
        run_test "deployment-status.sh --available works" "./scripts/deployment-status.sh --available"
        echo ""
    else
        log_warning "⊘ Skipping deployment-status tests (no deployments directory)"
        echo ""
    fi

    # Show final results
    show_results
}

# Show usage
show_usage() {
    echo "Usage: $0"
    echo ""
    echo "This script tests the deployment system to ensure all components are working correctly."
    echo "It performs the following checks:"
    echo ""
    echo "  - Script existence and executability"
    echo "  - Required system commands (git, yarn, pm2, etc.)"
    echo "  - Git repository status"
    echo "  - Project files and dependencies"
    echo "  - Script help flags"
    echo "  - Dry-run mode functionality"
    echo "  - Deployment status options"
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help message"
}

# Parse arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

# Run main test suite
main
exit_code=$?

exit $exit_code
