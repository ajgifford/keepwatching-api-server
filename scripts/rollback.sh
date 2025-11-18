#!/bin/bash

# KeepWatching API Server Rollback Script
# This script allows rolling back to a previous deployment

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PM2_APP_NAME="keepwatching-api-server"
DEPLOY_BASE_DIR="$(pwd)/deployments"
CURRENT_LINK="$DEPLOY_BASE_DIR/current"
HISTORY_FILE="$DEPLOY_BASE_DIR/.deployment-history"
HEALTH_CHECK_URL="http://localhost:3033/api/v1/health"
HEALTH_CHECK_TIMEOUT=30

# Parse command line arguments
DRY_RUN=false
TARGET_DEPLOY=""

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options] [deployment-name]"
            echo ""
            echo "Options:"
            echo "  --dry-run              Simulate rollback without executing commands"
            echo "  -h, --help             Show this help message"
            echo "  deployment-name        Specific deployment to rollback to (optional)"
            echo ""
            echo "If no deployment name is provided, an interactive menu will be shown."
            exit 0
            ;;
        *)
            if [ -z "$TARGET_DEPLOY" ]; then
                TARGET_DEPLOY="$arg"
            fi
            ;;
    esac
done

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

log_dry_run() {
    echo -e "${CYAN}[DRY-RUN]${NC} Would execute: $1"
}

# Check if deployments directory exists
check_deployments_exist() {
    if [ ! -d "$DEPLOY_BASE_DIR" ]; then
        log_error "No deployments directory found. Have you run deploy.sh yet?"
        exit 1
    fi
}

# Get current deployment
get_current_deployment() {
    if [ -L "$CURRENT_LINK" ]; then
        basename "$(readlink -f "$CURRENT_LINK")"
    else
        echo "none"
    fi
}

# List available deployments
list_deployments() {
    log_info "Available deployments:"
    echo ""

    local current_deploy=$(get_current_deployment)
    local count=1

    # Get deployments sorted by date (newest first)
    cd "$DEPLOY_BASE_DIR"
    local deployments=($(ls -dt */ 2>/dev/null | sed 's:/*$::' || true))

    if [ ${#deployments[@]} -eq 0 ]; then
        log_warning "No deployments found."
        exit 1
    fi

    for deploy in "${deployments[@]}"; do
        # Skip if it's just "current"
        if [ "$deploy" = "current" ]; then
            continue
        fi

        local marker=""
        if [ "$deploy" = "$current_deploy" ]; then
            marker=" ${GREEN}(current)${NC}"
        fi

        # Parse deployment name (format: YYYYMMDD_HHMMSS_commithash)
        local timestamp=$(echo "$deploy" | cut -d'_' -f1-2 | sed 's/_/ /')
        local commit=$(echo "$deploy" | cut -d'_' -f3)

        # Try to get branch info from history file
        local branch=""
        if [ -f "$HISTORY_FILE" ]; then
            branch=$(grep "$deploy" "$HISTORY_FILE" | tail -1 | cut -d'|' -f4 || echo "")
        fi

        echo -e "${count}) ${YELLOW}${deploy}${NC}${marker}"
        echo "   Commit: $commit"
        if [ -n "$branch" ]; then
            echo "   Branch: $branch"
        fi
        echo "   Date: $timestamp"
        echo ""

        count=$((count + 1))
    done
}

# Perform health check
health_check() {
    log_info "Performing health check..."

    local elapsed=0
    while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi

        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done

    echo ""
    log_warning "Health check skipped or timed out (endpoint may not exist)"
    return 0
}

# Rollback to specific deployment
rollback_to() {
    local target_deploy=$1
    local deploy_dir="$DEPLOY_BASE_DIR/$target_deploy"

    if [ ! -d "$deploy_dir" ]; then
        log_error "Deployment '$target_deploy' not found."
        exit 1
    fi

    local current_deploy=$(get_current_deployment)

    if [ "$target_deploy" = "$current_deploy" ]; then
        log_warning "Already on deployment: $target_deploy"
        exit 0
    fi

    if [ "$DRY_RUN" = true ]; then
        log_warning "=== DRY-RUN MODE - No changes will be made ==="
        echo ""
    fi

    log_info "Rolling back to: $target_deploy"
    log_info "Current deployment: $current_deploy"
    echo ""

    # Update symlink
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "rm -f $CURRENT_LINK"
        log_dry_run "ln -s $deploy_dir $CURRENT_LINK"
    else
        log_info "Updating current deployment symlink..."
        rm -f "$CURRENT_LINK"
        ln -s "$deploy_dir" "$CURRENT_LINK"
    fi

    # Restart PM2 app
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "pm2 restart $PM2_APP_NAME --update-env"
        log_dry_run "sleep 5"
    else
        log_info "Restarting PM2 application..."
        pm2 restart "$PM2_APP_NAME" --update-env
        # Wait for app to start
        sleep 5
    fi

    # Health check
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "curl -f -s $HEALTH_CHECK_URL (timeout: ${HEALTH_CHECK_TIMEOUT}s)"
    else
        health_check
    fi

    echo ""
    if [ "$DRY_RUN" = true ]; then
        log_success "=== Dry-run completed - No changes were made ==="
        log_info "Would have rolled back from: $current_deploy"
        log_info "Would have rolled back to: $target_deploy"
        echo ""
        log_info "To perform actual rollback, run without --dry-run flag"
    else
        log_success "=== Rollback completed successfully ==="
        log_success "Rolled back from: $current_deploy"
        log_success "Rolled back to: $target_deploy"
        echo ""
    fi
}

# Interactive rollback
interactive_rollback() {
    list_deployments

    echo -e "${BLUE}Enter the number of the deployment to rollback to (or 'q' to quit):${NC}"
    read -r selection

    if [ "$selection" = "q" ] || [ "$selection" = "Q" ]; then
        log_info "Rollback cancelled."
        exit 0
    fi

    # Validate input is a number
    if ! [[ "$selection" =~ ^[0-9]+$ ]]; then
        log_error "Invalid selection. Please enter a number."
        exit 1
    fi

    # Get the deployment at that index
    cd "$DEPLOY_BASE_DIR"
    local deployments=($(ls -dt */ 2>/dev/null | sed 's:/*$::' | grep -v '^current$' || true))
    local index=$((selection - 1))

    if [ $index -lt 0 ] || [ $index -ge ${#deployments[@]} ]; then
        log_error "Invalid selection. Please choose a number from the list."
        exit 1
    fi

    local target_deploy="${deployments[$index]}"

    # Confirm rollback
    echo ""
    echo -e "${YELLOW}Are you sure you want to rollback to: $target_deploy? (y/N)${NC}"
    read -r confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "Rollback cancelled."
        exit 0
    fi

    rollback_to "$target_deploy"
}

# Main function
main() {
    check_deployments_exist

    if [ "$DRY_RUN" = true ]; then
        log_warning "Running in DRY-RUN mode"
    fi

    log_info "=== KeepWatching API Server Rollback ==="
    echo ""

    # Check if TARGET_DEPLOY was provided
    if [ -z "$TARGET_DEPLOY" ]; then
        # Interactive mode
        interactive_rollback
    else
        # Direct rollback to specified deployment
        rollback_to "$TARGET_DEPLOY"
    fi
}

# Run main function
main
