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
MAX_DEPLOYMENT_AGE_DAYS=30  # Remove deployments older than this many days
MIN_KEEP_DEPLOYMENTS=3      # Always keep at least this many regardless of age
HEALTH_CHECK_URL="https://localhost:3033/health"
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

# Warn and prompt if there are uncommitted changes
check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Working directory has uncommitted changes:"
        git status --short
        echo ""
        echo -e "${YELLOW}Continue anyway? (y/N)${NC}"
        read -r reply
        if [ "$reply" != "y" ] && [ "$reply" != "Y" ]; then
            log_info "Deployment cancelled."
            exit 0
        fi
    fi
}

# Perform health check — returns 1 if the server fails to respond within the timeout
health_check() {
    log_info "Performing health check..."

    local elapsed=0
    while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
        if curl -f -s -k "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi

        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done

    echo ""
    log_error "Health check timed out after ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

# Roll back the symlink and PM2 to a previous deployment after a failed deploy
emergency_rollback() {
    local previous_deploy=$1
    local failed_deploy=$2

    if [ -z "$previous_deploy" ] || [ ! -d "$previous_deploy" ]; then
        log_error "No previous deployment available to roll back to."
        if [ -n "$failed_deploy" ]; then
            log_info "Cleaning up failed deployment: $(basename "$failed_deploy")"
            rm -rf "$failed_deploy"
        fi
        exit 1
    fi

    log_warning "=== Emergency rollback to: $(basename "$previous_deploy") ==="

    rm -f "$CURRENT_LINK"
    ln -s "$previous_deploy" "$CURRENT_LINK"

    if is_pm2_running; then
        pm2 delete "$PM2_APP_NAME"
    fi
    cd "$previous_deploy"
    pm2 start ecosystem.config.cjs --only "$PM2_APP_NAME" --env production
    pm2 save

    log_success "Rolled back to: $(basename "$previous_deploy")"

    if [ -n "$failed_deploy" ] && [ -d "$failed_deploy" ]; then
        log_info "Removing failed deployment: $(basename "$failed_deploy")"
        rm -rf "$failed_deploy"
    fi
}

# Clean old deployments (time-based, with a minimum kept count)
cleanup_old_deployments() {
    log_info "Cleaning up deployments older than ${MAX_DEPLOYMENT_AGE_DAYS} days (keeping at least ${MIN_KEEP_DEPLOYMENTS})..."

    cd "$DEPLOY_BASE_DIR"

    # Sorted newest-first; exclude the current symlink entry
    local deployments=($(ls -dt */ 2>/dev/null | sed 's:/*$::' | grep -v '^current$' || true))
    local count=${#deployments[@]}
    local removed=0

    for ((i=MIN_KEEP_DEPLOYMENTS; i<count; i++)); do
        local deploy="${deployments[$i]}"
        # find returns output only if the directory is older than MAX_DEPLOYMENT_AGE_DAYS
        if find "$deploy" -maxdepth 0 -mtime "+${MAX_DEPLOYMENT_AGE_DAYS}" 2>/dev/null | grep -q .; then
            log_info "Removing old deployment (>${MAX_DEPLOYMENT_AGE_DAYS} days): $deploy"
            rm -rf "$deploy"
            removed=$((removed + 1))
        fi
    done

    if [ $removed -eq 0 ]; then
        log_info "No old deployments to remove"
    else
        log_success "Removed $removed old deployment(s)"
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

    # Warn if the working tree is dirty (skipped in dry-run — no intent to deploy)
    if [ "$DRY_RUN" = false ]; then
        check_git_status
    fi

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

    # Remember the current deployment so we can roll back if this one fails
    local previous_deploy=""
    if [ -L "$CURRENT_LINK" ]; then
        previous_deploy=$(readlink -f "$CURRENT_LINK")
    fi

    # Create new deployment directory
    local deploy_name=$(create_deployment_name)
    local deploy_dir="$DEPLOY_BASE_DIR/$deploy_name"

    log_info "Deployment name: $deploy_name"
    log_info "Deployment directory: $deploy_dir"
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

        # Verify the build output is present before touching PM2
        if [ ! -f "$deploy_dir/dist/index.mjs" ]; then
            log_error "Build failed - dist/index.mjs not found!"
            log_warning "Cleaning up failed deployment..."
            rm -rf "$deploy_dir"
            exit 1
        fi
    fi
    echo ""

    # Update current symlink
    # Use delete + start from the new deployment directory so PM2 resolves its cwd
    # to the real path of the new deployment, not a stale previous one. "pm2 restart"
    # reuses the cwd from when the process was first started and would ignore the
    # updated symlink.
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
        log_dry_run "pm2 delete $PM2_APP_NAME (if running)"
        log_dry_run "cd $CURRENT_LINK && pm2 start ecosystem.config.cjs --only $PM2_APP_NAME --env production"
        log_dry_run "pm2 save"
        log_dry_run "sleep 5"
    else
        log_info "Restarting PM2 application from new deployment..."
        if is_pm2_running; then
            pm2 delete "$PM2_APP_NAME"
        fi
        cd "$CURRENT_LINK"
        pm2 start ecosystem.config.cjs --only "$PM2_APP_NAME" --env production
        pm2 save
        # Wait for app to start
        sleep 5
    fi

    # Health check — roll back automatically if the server doesn't come up
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "curl -f -s -k $HEALTH_CHECK_URL (timeout: ${HEALTH_CHECK_TIMEOUT}s)"
    else
        if ! health_check; then
            log_error "Health check failed — capturing diagnostics before rollback..."
            echo ""
            echo "--- PM2 stdout (last 50 lines) ---"
            pm2 logs "$PM2_APP_NAME" --lines 50 --nostream 2>/dev/null || true
            echo "--- end PM2 logs ---"
            echo ""
            echo "--- Diagnostic curl (verbose) ---"
            curl -v -k "$HEALTH_CHECK_URL" 2>&1 | tail -40 || true
            echo "--- end diagnostic curl ---"
            echo ""
            echo "--- Listening sockets on port 3033 ---"
            (ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | grep 3033 || echo "(nothing listening on 3033)"
            echo "--- end socket check ---"
            echo ""
            log_error "Rolling back to previous deployment..."
            # Return to project root before calling emergency_rollback (which does cd)
            cd "$(dirname "$DEPLOY_BASE_DIR")"
            emergency_rollback "$previous_deploy" "$deploy_dir"
            exit 1
        fi
    fi
    echo ""

    # Record successful deployment
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "echo '\$timestamp|$deploy_name|$current_commit|$current_branch' >> $HISTORY_FILE"
    else
        log_info "Recording deployment in history..."
        record_deployment "$deploy_name" "$current_commit" "$current_branch"
    fi

    # Clean up old deployments
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Clean up deployments older than ${MAX_DEPLOYMENT_AGE_DAYS} days (keeping at least ${MIN_KEEP_DEPLOYMENTS})"

        if [ -d "$DEPLOY_BASE_DIR" ]; then
            local deployments=($(ls -dt "$DEPLOY_BASE_DIR"/*/ 2>/dev/null | grep -v 'current' | xargs -n1 basename 2>/dev/null || true))
            local count=${#deployments[@]}

            if [ $count -gt $MIN_KEEP_DEPLOYMENTS ]; then
                log_info "Would check ${count} deployment(s) for age-based removal"
            else
                log_info "No old deployments to remove (total: $count, minimum kept: $MIN_KEEP_DEPLOYMENTS)"
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
