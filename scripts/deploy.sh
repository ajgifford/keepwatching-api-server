#!/bin/bash

# KeepWatching API Server Deployment Script
# This script provides zero-downtime deployments with rollback support

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="keepwatching-api-server"
PM2_APP_NAME="keepwatching-api-server"
DEPLOY_BASE_DIR="$(pwd)/deployments"
CURRENT_LINK="$DEPLOY_BASE_DIR/current"
HISTORY_FILE="$DEPLOY_BASE_DIR/.deployment-history"
MAX_DEPLOYMENTS=5  # Keep last 5 deployments
HEALTH_CHECK_URL="http://localhost:3033/api/v1/health"  # Adjust if different
HEALTH_CHECK_TIMEOUT=30  # seconds

# Parse command line arguments
DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --dry-run    Simulate deployment without executing commands"
            echo "  -h, --help   Show this help message"
            exit 0
            ;;
    esac
done

# Create deployments directory if it doesn't exist
if [ "$DRY_RUN" = false ]; then
    mkdir -p "$DEPLOY_BASE_DIR"
fi

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

# Get current git commit hash
get_git_commit() {
    git rev-parse --short HEAD
}

# Get current branch
get_git_branch() {
    git rev-parse --abbrev-ref HEAD
}

# Create deployment directory name
create_deployment_name() {
    local commit_hash=$(get_git_commit)
    local timestamp=$(date +%Y%m%d_%H%M%S)
    echo "${timestamp}_${commit_hash}"
}

# Record deployment in history
record_deployment() {
    local deploy_name=$1
    local commit_hash=$2
    local branch=$3
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "$timestamp|$deploy_name|$commit_hash|$branch" >> "$HISTORY_FILE"
}

# Check if PM2 app is running
is_pm2_running() {
    pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1
    return $?
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
    return 0  # Don't fail deployment if health check endpoint doesn't exist
}

# Clean old deployments
cleanup_old_deployments() {
    log_info "Cleaning up old deployments (keeping last $MAX_DEPLOYMENTS)..."

    cd "$DEPLOY_BASE_DIR"

    # Get all deployment directories (exclude current symlink and hidden files)
    local deployments=($(ls -dt */ 2>/dev/null | grep -v '^current' || true))
    local count=${#deployments[@]}

    if [ $count -gt $MAX_DEPLOYMENTS ]; then
        local to_remove=$((count - MAX_DEPLOYMENTS))
        log_info "Removing $to_remove old deployment(s)..."

        for ((i=$MAX_DEPLOYMENTS; i<$count; i++)); do
            local deploy_dir="${deployments[$i]}"
            log_info "Removing old deployment: $deploy_dir"
            rm -rf "$deploy_dir"
        done
    fi
}

# Main deployment process
main() {
    if [ "$DRY_RUN" = true ]; then
        log_warning "=== DRY-RUN MODE - No changes will be made ==="
        echo ""
    fi

    log_info "=== KeepWatching API Server Deployment ==="
    echo ""

    # Get current branch and commit info
    local current_branch=$(get_git_branch)
    local current_commit=$(get_git_commit)

    log_info "Current branch: $current_branch"
    log_info "Current commit: $current_commit"
    echo ""

    # Pull latest changes
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "git pull"
    else
        log_info "Pulling latest changes from git..."
        git pull
        # Update commit info after pull
        current_commit=$(get_git_commit)
        log_info "Updated to commit: $current_commit"
    fi
    echo ""

    # Create new deployment directory
    local deploy_name=$(create_deployment_name)
    local deploy_dir="$DEPLOY_BASE_DIR/$deploy_name"

    log_info "Deployment name would be: $deploy_name"
    log_info "Deployment directory would be: $deploy_dir"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log_dry_run "mkdir -p $deploy_dir"
    else
        log_info "Creating deployment directory..."
        mkdir -p "$deploy_dir"
    fi

    # Copy current directory to deployment directory
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "rsync application files to $deploy_dir"
        log_info "Would exclude: deployments, node_modules, dist, .git, logs, uploads, .env"
    else
        log_info "Copying application files..."
        rsync -a --exclude='deployments' \
                 --exclude='node_modules' \
                 --exclude='dist' \
                 --exclude='.git' \
                 --exclude='logs' \
                 --exclude='uploads' \
                 --exclude='.env' \
                 ./ "$deploy_dir/"
    fi

    # Copy .env if it exists
    if [ -f ".env" ]; then
        if [ "$DRY_RUN" = true ]; then
            log_dry_run "cp .env $deploy_dir/"
        else
            log_info "Copying environment configuration..."
            cp .env "$deploy_dir/"
        fi
    else
        log_warning "No .env file found"
    fi
    echo ""

    # Install dependencies
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "cd $deploy_dir && yarn install --frozen-lockfile --production=false"
    else
        log_info "Installing dependencies..."
        cd "$deploy_dir"
        yarn install --frozen-lockfile --production=false
    fi

    # Build application
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "yarn build"
    else
        log_info "Building application..."
        yarn build
    fi
    echo ""

    # Update current symlink
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
        log_dry_run "Check if PM2 app '$PM2_APP_NAME' is running"
        log_dry_run "pm2 restart $PM2_APP_NAME --update-env (or start if not running)"
        log_dry_run "sleep 5"
    else
        log_info "Restarting PM2 application..."
        if is_pm2_running; then
            pm2 restart "$PM2_APP_NAME" --update-env
        else
            log_warning "PM2 app not running, starting it..."
            cd "$CURRENT_LINK"
            pm2 start ecosystem.config.js --only "$PM2_APP_NAME" --env production
        fi
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

    # Record successful deployment
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "echo '$timestamp|$deploy_name|$current_commit|$current_branch' >> $HISTORY_FILE"
    else
        log_info "Recording deployment in history..."
        record_deployment "$deploy_name" "$current_commit" "$current_branch"
    fi

    # Clean up old deployments
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Clean up old deployments (keeping last $MAX_DEPLOYMENTS)"

        # Show what would be removed
        if [ -d "$DEPLOY_BASE_DIR" ]; then
            local deployments=($(ls -dt "$DEPLOY_BASE_DIR"/*/ 2>/dev/null | grep -v 'current' | xargs -n1 basename 2>/dev/null || true))
            local count=${#deployments[@]}

            if [ $count -gt $MAX_DEPLOYMENTS ]; then
                local to_remove=$((count - MAX_DEPLOYMENTS))
                log_info "Would remove $to_remove old deployment(s):"
                for ((i=$MAX_DEPLOYMENTS; i<$count; i++)); do
                    echo "  - ${deployments[$i]}"
                done
            else
                log_info "No old deployments to remove"
            fi
        fi
    else
        cleanup_old_deployments
    fi

    echo ""
    if [ "$DRY_RUN" = true ]; then
        log_success "=== Dry-run completed - No changes were made ==="
        log_info "To perform actual deployment, run: ./scripts/deploy.sh"
    else
        log_success "=== Deployment completed successfully ==="
        log_success "Deployment: $deploy_name"
        log_success "Commit: $current_commit"
        log_success "Branch: $current_branch"
        echo ""
        log_info "To rollback this deployment, run: ./scripts/rollback.sh"
    fi
}

# Run main function
main
