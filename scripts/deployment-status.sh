#!/bin/bash

# KeepWatching API Server Deployment Status Script
# This script shows the current deployment status and history

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

# Get current deployment
get_current_deployment() {
    if [ -L "$CURRENT_LINK" ]; then
        basename "$(readlink -f "$CURRENT_LINK")"
    else
        echo "none"
    fi
}

# Show current status
show_current_status() {
    echo -e "${CYAN}=== Current Deployment Status ===${NC}"
    echo ""

    # Check if deployments directory exists
    if [ ! -d "$DEPLOY_BASE_DIR" ]; then
        log_warning "No deployments directory found."
        echo ""
        return
    fi

    local current_deploy=$(get_current_deployment)

    if [ "$current_deploy" = "none" ]; then
        log_warning "No active deployment found."
        echo ""
        return
    fi

    echo -e "${GREEN}Active Deployment:${NC} $current_deploy"

    # Parse deployment info
    local timestamp=$(echo "$current_deploy" | cut -d'_' -f1-2 | sed 's/_/ /')
    local commit=$(echo "$current_deploy" | cut -d'_' -f3)

    echo -e "${GREEN}Commit Hash:${NC} $commit"
    echo -e "${GREEN}Deployed At:${NC} $timestamp"

    # Get branch from history if available
    if [ -f "$HISTORY_FILE" ]; then
        local branch=$(grep "$current_deploy" "$HISTORY_FILE" | tail -1 | cut -d'|' -f4 || echo "")
        if [ -n "$branch" ]; then
            echo -e "${GREEN}Branch:${NC} $branch"
        fi
    fi

    # Get deployment path
    echo -e "${GREEN}Deployment Path:${NC} $DEPLOY_BASE_DIR/$current_deploy"

    echo ""

    # Check PM2 status
    if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
        local pm2_status=$(pm2 jlist | jq -r ".[] | select(.name==\"$PM2_APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
        local pm2_uptime=$(pm2 jlist | jq -r ".[] | select(.name==\"$PM2_APP_NAME\") | .pm2_env.pm_uptime" 2>/dev/null || echo "0")

        if [ "$pm2_status" = "online" ]; then
            log_success "PM2 Status: Online"

            # Calculate uptime
            if [ "$pm2_uptime" != "0" ] && [ "$pm2_uptime" != "unknown" ]; then
                local current_time=$(date +%s)
                local uptime_seconds=$(( (current_time * 1000 - pm2_uptime) / 1000 ))
                local uptime_formatted=$(printf '%dd %dh %dm %ds' $((uptime_seconds/86400)) $((uptime_seconds%86400/3600)) $((uptime_seconds%3600/60)) $((uptime_seconds%60)))
                echo -e "${GREEN}Uptime:${NC} $uptime_formatted"
            fi
        else
            log_warning "PM2 Status: $pm2_status"
        fi
    else
        log_error "PM2 app not found or not running"
    fi

    echo ""
}

# Show deployment history
show_deployment_history() {
    echo -e "${CYAN}=== Deployment History ===${NC}"
    echo ""

    if [ ! -f "$HISTORY_FILE" ]; then
        log_warning "No deployment history found."
        echo ""
        return
    fi

    # Read history file (newest first)
    local count=0
    local max_display=10

    # Use tac to reverse the file (newest first)
    while IFS='|' read -r timestamp deploy_name commit_hash branch; do
        if [ $count -ge $max_display ]; then
            break
        fi

        local current_marker=""
        if [ "$deploy_name" = "$(get_current_deployment)" ]; then
            current_marker=" ${GREEN}← CURRENT${NC}"
        fi

        echo -e "${YELLOW}$((count + 1)).${NC} $deploy_name$current_marker"
        echo "   Timestamp: $timestamp"
        echo "   Commit: $commit_hash"
        echo "   Branch: $branch"
        echo ""

        count=$((count + 1))
    done < <(tac "$HISTORY_FILE")

    if [ $count -eq 0 ]; then
        log_warning "No deployment history found."
        echo ""
    elif [ $count -ge $max_display ]; then
        log_info "Showing last $max_display deployments. Full history in: $HISTORY_FILE"
        echo ""
    fi
}

# Show available deployments
show_available_deployments() {
    echo -e "${CYAN}=== Available Deployments ===${NC}"
    echo ""

    if [ ! -d "$DEPLOY_BASE_DIR" ]; then
        log_warning "No deployments directory found."
        echo ""
        return
    fi

    cd "$DEPLOY_BASE_DIR"
    local deployments=($(ls -dt */ 2>/dev/null | sed 's:/*$::' | grep -v '^current$' || true))

    if [ ${#deployments[@]} -eq 0 ]; then
        log_warning "No deployments found."
        echo ""
        return
    fi

    local current_deploy=$(get_current_deployment)
    local total_size=0

    echo -e "${BLUE}Total deployments:${NC} ${#deployments[@]}"
    echo ""

    for deploy in "${deployments[@]}"; do
        local size=$(du -sh "$deploy" 2>/dev/null | cut -f1)
        local marker=""

        if [ "$deploy" = "$current_deploy" ]; then
            marker=" ${GREEN}(active)${NC}"
        fi

        echo -e "  • ${YELLOW}$deploy${NC}$marker - Size: $size"

        # Add to total size calculation (convert to bytes for accurate total)
        local size_bytes=$(du -sb "$deploy" 2>/dev/null | cut -f1)
        total_size=$((total_size + size_bytes))
    done

    echo ""
    # Convert bytes to human readable
    local total_human=$(echo "$total_size" | awk '
        function human(x) {
            if (x<1024) {return x}
            x/=1024
            s="KMGTEPYZ"
            while (x>=1024 && length(s)>1) {
                x/=1024
                s=substr(s,2)
            }
            return int(x+0.5) substr(s,1,1) "B"
        }
        {print human($1)}
    ')

    echo -e "${BLUE}Total disk usage:${NC} $total_human"
    echo ""
}

# Show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --current     Show only current deployment status"
    echo "  --history     Show only deployment history"
    echo "  --available   Show only available deployments"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "If no options are provided, all information will be displayed."
}

# Main function
main() {
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_usage
        exit 0
    fi

    case "$1" in
        --current)
            show_current_status
            ;;
        --history)
            show_deployment_history
            ;;
        --available)
            show_available_deployments
            ;;
        *)
            show_current_status
            show_deployment_history
            show_available_deployments
            ;;
    esac
}

# Run main function
main "$@"
