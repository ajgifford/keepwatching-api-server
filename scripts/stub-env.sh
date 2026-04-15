#!/bin/bash

# KeepWatching API Server - Local Deployment Stub Environment
#
# Stubs out commands with side effects so deploy.sh can be exercised locally
# without PM2, a running server, or an active git remote.
#
# Usage (from repo root):
#   source scripts/stub-env.sh && bash scripts/deploy.sh
#
# To restore your shell after testing:
#   unset -f pm2 curl git yarn

# ─── Configuration ────────────────────────────────────────────────────────────

# Controls what is_pm2_running() returns.
# "running"     → deploy.sh takes the "pm2 restart" path
# "stopped"     → deploy.sh takes the "pm2 start" path
STUB_PM2_STATE="${STUB_PM2_STATE:-running}"

# Set to "true" to skip yarn install + build (fast iteration on script logic)
STUB_SKIP_YARN="${STUB_SKIP_YARN:-false}"

# Set to "true" to skip the git pull (useful when you have uncommitted changes
# or no remote configured in the test environment)
STUB_SKIP_GIT_PULL="${STUB_SKIP_GIT_PULL:-true}"

# ─── Helpers ──────────────────────────────────────────────────────────────────

CYAN='\033[0;36m'
NC='\033[0m'

_stub_log() {
    echo -e "${CYAN}[STUB]${NC} $*"
}
export -f _stub_log

# ─── pm2 stub ─────────────────────────────────────────────────────────────────
# Intercepts: describe, restart, start

pm2() {
    local subcommand="$1"
    shift

    case "$subcommand" in
        describe)
            if [ "$STUB_PM2_STATE" = "running" ]; then
                _stub_log "pm2 describe $* → reporting app as RUNNING"
                return 0
            else
                _stub_log "pm2 describe $* → reporting app as STOPPED"
                return 1
            fi
            ;;
        restart)
            _stub_log "pm2 restart $* → skipped (stub)"
            return 0
            ;;
        start)
            _stub_log "pm2 start $* → skipped (stub)"
            return 0
            ;;
        *)
            _stub_log "pm2 $subcommand $* → unhandled subcommand, returning 0"
            return 0
            ;;
    esac
}
export -f pm2

# ─── curl stub ────────────────────────────────────────────────────────────────
# Only intercepts the health-check call (-f -s <url>).
# Passes all other curl calls through to the real binary so rsync/yarn/git
# are unaffected.

curl() {
    # Health check pattern: curl -f -s <url>
    if [[ "$*" == *"-f"* && "$*" == *"-s"* ]]; then
        _stub_log "curl $* → health check passed (stub)"
        return 0
    fi
    command curl "$@"
}
export -f curl

# ─── git stub (selective) ─────────────────────────────────────────────────────
# Only intercepts "git pull". All other git commands run normally so
# rev-parse, branch detection, etc. still work.

if [ "$STUB_SKIP_GIT_PULL" = "true" ]; then
    git() {
        if [ "$1" = "pull" ]; then
            _stub_log "git pull → skipped (stub)"
            return 0
        fi
        command git "$@"
    }
    export -f git
fi

# ─── rsync stub (auto, when rsync is not installed) ──────────────────────────
# Uses cp as a fallback, honouring the same exclusions deploy.sh passes.
# Only active when rsync isn't found on PATH (e.g. plain Git Bash on Windows).

if ! command -v rsync &>/dev/null; then
    rsync() {
        # Last argument is the destination; second-to-last is the source.
        local dst="${@: -1}"
        local src="${@: -2:1}"
        _stub_log "rsync → cp fallback (rsync not installed)"
        mkdir -p "$dst"
        find "$src" -maxdepth 1 ! -name '.' \
            ! -name 'deployments' \
            ! -name 'node_modules' \
            ! -name 'dist' \
            ! -name '.git' \
            ! -name 'logs' \
            ! -name 'uploads' \
            ! -name '.env' \
            -exec cp -r {} "$dst/" \;
    }
    export -f rsync
fi

# ─── yarn stub (optional) ─────────────────────────────────────────────────────
# Skips install + build entirely. Use when you only care about testing the
# directory/symlink/PM2 logic and don't want to wait for a full build.

if [ "$STUB_SKIP_YARN" = "true" ]; then
    yarn() {
        _stub_log "yarn $* → skipped (stub)"
        # Simulate the build output directory so the deploy doesn't break
        # if something downstream checks for dist/
        if [ "$1" = "build" ]; then
            mkdir -p dist
            _stub_log "Created empty dist/ directory as placeholder"
        fi
        return 0
    }
    export -f yarn
fi

# ─── Summary ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}[STUB ENV LOADED]${NC}"
echo "  pm2          → stubbed (state: $STUB_PM2_STATE)"
echo "  curl -f -s   → stubbed (health check always passes)"
echo "  rsync        → $(command -v rsync &>/dev/null && echo "real (rsync found on PATH)" || echo "stubbed (cp fallback, rsync not found)")"
echo "  git pull     → $([ "$STUB_SKIP_GIT_PULL" = "true" ] && echo "stubbed (skipped)" || echo "real")"
echo "  yarn         → $([ "$STUB_SKIP_YARN" = "true" ] && echo "stubbed (skipped)" || echo "real")"
echo ""
echo "Override defaults:"
echo "  STUB_PM2_STATE=stopped      → exercise the pm2 start path"
echo "  STUB_SKIP_YARN=true         → skip yarn install + build"
echo "  STUB_SKIP_GIT_PULL=false    → run real git pull"
echo ""
echo "Run:   bash scripts/deploy.sh"
echo "Reset: unset -f pm2 curl git yarn rsync _stub_log"
echo ""
