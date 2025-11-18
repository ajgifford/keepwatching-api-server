# KeepWatching API Server - Deployment Guide

This guide covers the enhanced deployment system with rollback support for the KeepWatching API Server running on Raspberry Pi 5.

## Overview

The deployment system provides:

- **Versioned Deployments**: Each deployment is stored in a separate directory with a timestamp and git commit hash
- **Rollback Support**: Quickly revert to any previous deployment
- **Deployment History**: Track all deployments with timestamps, commits, and branches
- **Zero-Downtime**: PM2 handles graceful restarts
- **Automatic Cleanup**: Keeps only the last 5 deployments to save disk space

## Architecture

```
keepwatching-api-server/
├── deployments/                    # Deployment storage directory
│   ├── 20241117_143022_a1b2c3d/   # Deployment 1
│   ├── 20241117_150045_e4f5g6h/   # Deployment 2
│   ├── 20241117_153012_i7j8k9l/   # Deployment 3 (current)
│   ├── current -> .../i7j8k9l/    # Symlink to active deployment
│   └── .deployment-history         # Deployment log
└── scripts/                        # Deployment scripts directory
    ├── deploy.sh                   # Deployment script
    ├── rollback.sh                 # Rollback script
    ├── deployment-status.sh        # Status viewer
    ├── test-deployment.sh          # Testing script
    ├── DEPLOYMENT.md               # This guide
    └── DEPLOYMENT-QUICKSTART.md    # Quick reference
```

## Scripts

### 1. deploy.sh

Performs a new deployment with the following steps:

1. Pull latest changes from git
2. Create a new versioned deployment directory (format: `YYYYMMDD_HHMMSS_commithash`)
3. Copy application files (excluding deployments, node_modules, dist)
4. Install dependencies with `yarn install`
5. Build application with `yarn build`
6. Update the `current` symlink to point to the new deployment
7. Restart PM2 application
8. Perform health check (optional)
9. Record deployment in history
10. Clean up old deployments (keeps last 5)

**Usage:**

```bash
./scripts/deploy.sh
```

**Example Output:**

```
[INFO] === KeepWatching API Server Deployment ===

[INFO] Current branch: main
[INFO] Current commit: a1b2c3d

[INFO] Pulling latest changes from git...
[INFO] Updated to commit: e4f5g6h

[INFO] Creating deployment: 20241117_143022_e4f5g6h
[INFO] Copying application files...
[INFO] Installing dependencies...
[INFO] Building application...
[INFO] Updating current deployment symlink...
[INFO] Restarting PM2 application...
[INFO] Performing health check...
[SUCCESS] Health check passed
[INFO] Recording deployment in history...
[INFO] Cleaning up old deployments (keeping last 5)...

[SUCCESS] === Deployment completed successfully ===
[SUCCESS] Deployment: 20241117_143022_e4f5g6h
[SUCCESS] Commit: e4f5g6h
[SUCCESS] Branch: main

[INFO] To rollback this deployment, run: ./scripts/rollback.sh
```

### 2. rollback.sh

Reverts to a previous deployment.

**Interactive Mode (Recommended):**

```bash
./scripts/rollback.sh
```

This will show a menu of available deployments:

```
[INFO] === KeepWatching API Server Rollback ===

[INFO] Available deployments:

1) 20241117_153012_i7j8k9l (current)
   Commit: i7j8k9l
   Branch: main
   Date: 20241117 153012

2) 20241117_150045_e4f5g6h
   Commit: e4f5g6h
   Branch: main
   Date: 20241117 150045

3) 20241117_143022_a1b2c3d
   Commit: a1b2c3d
   Branch: main
   Date: 20241117 143022

Enter the number of the deployment to rollback to (or 'q' to quit):
```

**Direct Mode:**

```bash
./scripts/rollback.sh 20241117_150045_e4f5g6h
```

**Example Output:**

```
[INFO] === KeepWatching API Server Rollback ===

[INFO] Rolling back to: 20241117_150045_e4f5g6h

[INFO] Updating current deployment symlink...
[INFO] Restarting PM2 application...
[INFO] Performing health check...
[SUCCESS] Health check passed

[SUCCESS] === Rollback completed successfully ===
[SUCCESS] Rolled back from: 20241117_153012_i7j8k9l
[SUCCESS] Rolled back to: 20241117_150045_e4f5g6h
```

### 3. deployment-status.sh

View current deployment status, history, and available deployments.

**Show All Information:**

```bash
./scripts/deployment-status.sh
```

**Show Current Status Only:**

```bash
./scripts/deployment-status.sh --current
```

**Show Deployment History Only:**

```bash
./scripts/deployment-status.sh --history
```

**Show Available Deployments Only:**

```bash
./scripts/deployment-status.sh --available
```

**Example Output:**

```
=== Current Deployment Status ===

Active Deployment: 20241117_153012_i7j8k9l
Commit Hash: i7j8k9l
Deployed At: 20241117 153012
Branch: main
Deployment Path: /home/user/keepwatching-api-server/deployments/20241117_153012_i7j8k9l

[SUCCESS] PM2 Status: Online
Uptime: 0d 2h 15m 30s

=== Deployment History ===

1. 20241117_153012_i7j8k9l ← CURRENT
   Timestamp: 2024-11-17 15:30:12
   Commit: i7j8k9l
   Branch: main

2. 20241117_150045_e4f5g6h
   Timestamp: 2024-11-17 15:00:45
   Commit: e4f5g6h
   Branch: main

3. 20241117_143022_a1b2c3d
   Timestamp: 2024-11-17 14:30:22
   Commit: a1b2c3d
   Branch: main

=== Available Deployments ===

Total deployments: 3

  • 20241117_153012_i7j8k9l (active) - Size: 245M
  • 20241117_150045_e4f5g6h - Size: 243M
  • 20241117_143022_a1b2c3d - Size: 241M

Total disk usage: 729MB
```

## Testing the Deployment System

Before running an actual deployment, you can test the deployment system to ensure everything is configured correctly.

### Automated Testing

Run the automated test suite to validate all components:

```bash
./scripts/test-deployment.sh
```

This script tests:
- ✓ Script existence and executability
- ✓ Required system commands (git, yarn, pm2, rsync, curl)
- ✓ Git repository status
- ✓ Project files and dependencies
- ✓ Script help flags
- ✓ Dry-run mode functionality
- ✓ Deployment status options

**Example Output:**

```
[INFO] === KeepWatching API Server - Deployment Testing ===

[INFO] Phase 1: Checking if deployment scripts exist...
[SUCCESS] ✓ deploy.sh exists
[SUCCESS] ✓ rollback.sh exists
[SUCCESS] ✓ deployment-status.sh exists

[INFO] Phase 2: Checking if scripts are executable...
[SUCCESS] ✓ deploy.sh is executable
[SUCCESS] ✓ rollback.sh is executable
[SUCCESS] ✓ deployment-status.sh is executable

...

==========================================
Test Results:
==========================================
Total Tests:  20
Passed:       20
Failed:       0
==========================================
[SUCCESS] All tests passed!
```

### Dry-Run Mode

Both `deploy.sh` and `rollback.sh` support dry-run mode, which simulates the operation without making any changes.

**Test Deployment (Dry-Run):**

```bash
./scripts/deploy.sh --dry-run
```

This will show you exactly what would happen during a deployment without:
- Creating deployment directories
- Installing dependencies
- Building the application
- Updating symlinks
- Restarting PM2
- Modifying deployment history

**Example Dry-Run Output:**

```
[WARNING] === DRY-RUN MODE - No changes will be made ===

[INFO] === KeepWatching API Server Deployment ===

[INFO] Current branch: main
[INFO] Current commit: b767ef4

[DRY-RUN] Would execute: git pull

[INFO] Deployment name would be: 20241117_154522_b767ef4
[INFO] Deployment directory would be: /home/user/keepwatching-api-server/deployments/20241117_154522_b767ef4

[DRY-RUN] Would execute: mkdir -p /home/user/keepwatching-api-server/deployments/20241117_154522_b767ef4
[DRY-RUN] Would execute: rsync application files to /home/user/keepwatching-api-server/deployments/20241117_154522_b767ef4
[INFO] Would exclude: deployments, node_modules, dist, .git, logs, uploads, .env
[DRY-RUN] Would execute: cp .env /home/user/keepwatching-api-server/deployments/20241117_154522_b767ef4/

[DRY-RUN] Would execute: cd /home/user/keepwatching-api-server/deployments/20241117_154522_b767ef4 && yarn install --frozen-lockfile --production=false
[DRY-RUN] Would execute: yarn build

[DRY-RUN] Would execute: rm -f /home/user/keepwatching-api-server/deployments/current
[DRY-RUN] Would execute: ln -s /home/user/keepwatching-api-server/deployments/20241117_154522_b767ef4 /home/user/keepwatching-api-server/deployments/current
[DRY-RUN] Would execute: Check if PM2 app 'keepwatching-api-server' is running
[DRY-RUN] Would execute: pm2 restart keepwatching-api-server --update-env (or start if not running)
[DRY-RUN] Would execute: sleep 5
[DRY-RUN] Would execute: curl -f -s http://localhost:3033/api/v1/health (timeout: 30s)

[DRY-RUN] Would execute: echo '$timestamp|20241117_154522_b767ef4|b767ef4|main' >> /home/user/keepwatching-api-server/deployments/.deployment-history
[DRY-RUN] Would execute: Clean up old deployments (keeping last 5)
[INFO] No old deployments to remove

[SUCCESS] === Dry-run completed - No changes were made ===
[INFO] To perform actual deployment, run: ./scripts/deploy.sh
```

**Test Rollback (Dry-Run):**

If you have existing deployments, you can test rollback:

```bash
# Test rollback to a specific deployment
./scripts/rollback.sh --dry-run 20241117_150045_e4f5g6h

# Or use interactive mode
./scripts/rollback.sh --dry-run
```

**Example Rollback Dry-Run Output:**

```
[WARNING] Running in DRY-RUN mode
[INFO] === KeepWatching API Server Rollback ===

[WARNING] === DRY-RUN MODE - No changes will be made ===

[INFO] Rolling back to: 20241117_150045_e4f5g6h
[INFO] Current deployment: 20241117_153012_i7j8k9l

[DRY-RUN] Would execute: rm -f /home/user/keepwatching-api-server/deployments/current
[DRY-RUN] Would execute: ln -s /home/user/keepwatching-api-server/deployments/20241117_150045_e4f5g6h /home/user/keepwatching-api-server/deployments/current
[DRY-RUN] Would execute: pm2 restart keepwatching-api-server --update-env
[DRY-RUN] Would execute: sleep 5
[DRY-RUN] Would execute: curl -f -s http://localhost:3033/api/v1/health (timeout: 30s)

[SUCCESS] === Dry-run completed - No changes were made ===
[INFO] Would have rolled back from: 20241117_153012_i7j8k9l
[INFO] Would have rolled back to: 20241117_150045_e4f5g6h

[INFO] To perform actual rollback, run without --dry-run flag
```

### Pre-Deployment Checklist

Before deploying to production, verify:

1. ✓ **All tests pass**: Run `./scripts/test-deployment.sh`
2. ✓ **Dry-run succeeds**: Run `./scripts/deploy.sh --dry-run`
3. ✓ **Git status is clean**: No uncommitted changes
4. ✓ **Code is tested**: All unit tests pass locally
5. ✓ **Dependencies are updated**: `yarn install` completed successfully
6. ✓ **Build works**: `yarn build` completes without errors
7. ✓ **Environment variables are set**: `.env` file exists and is configured
8. ✓ **PM2 is running**: `pm2 status` shows the app
9. ✓ **Sufficient disk space**: Check with `df -h`
10. ✓ **Recent backup exists**: Database and important files backed up

## Configuration

### Environment Variables

Ensure your `.env` file is in the root directory. It will be copied to each deployment.

### Health Check

The deployment and rollback scripts include an optional health check. By default, it checks:

```
http://localhost:3033/api/v1/health
```

To customize the health check endpoint, edit these variables in the scripts:

```bash
HEALTH_CHECK_URL="http://localhost:3033/api/v1/health"
HEALTH_CHECK_TIMEOUT=30
```

If the health check endpoint doesn't exist, the scripts will show a warning but continue (non-blocking).

### Deployment Retention

By default, the system keeps the last 5 deployments. To change this, edit `deploy.sh`:

```bash
MAX_DEPLOYMENTS=5  # Change this number
```

## Production Deployment Workflow

### Initial Setup

1. **Clone the repository** (if not already done):

   ```bash
   cd /home/user
   git clone <repository-url> keepwatching-api-server
   cd keepwatching-api-server
   ```

2. **Set up environment**:

   ```bash
   # Create .env file
   cp .env.example .env
   nano .env  # Configure your environment variables
   ```

3. **Make scripts executable** (if not already):

   ```bash
   chmod +x deploy.sh rollback.sh deployment-status.sh
   ```

4. **Run initial deployment**:

   ```bash
   ./scripts/deploy.sh
   ```

### Regular Deployments

When you want to deploy new changes:

```bash
# SSH into your Raspberry Pi
ssh user@raspberry-pi

# Navigate to project directory
cd /home/user/keepwatching-api-server

# Run deployment
./scripts/deploy.sh
```

### Handling Failed Deployments

If a deployment fails:

1. **Check the error output** from the deployment script
2. **Fix the issue** in your code
3. **Commit and push** the fix
4. **Run deployment again**

If the new deployment is broken:

1. **Roll back immediately**:

   ```bash
   ./scripts/rollback.sh
   # Select the previous working deployment
   ```

2. **Verify the rollback**:

   ```bash
   ./scripts/deployment-status.sh --current
   pm2 logs keepwatching-api-server
   ```

3. **Fix the issue** and deploy again when ready

### Monitoring

**Check application status**:

```bash
./scripts/deployment-status.sh
```

**View PM2 logs**:

```bash
pm2 logs keepwatching-api-server
```

**View PM2 status**:

```bash
pm2 status
```

**Monitor in real-time**:

```bash
pm2 monit
```

## Disk Space Management

Each deployment typically takes 200-300MB of disk space. With 5 deployments, this is approximately 1-1.5GB.

**Check current usage**:

```bash
./scripts/deployment-status.sh --available
```

**Manually clean old deployments**:

```bash
cd deployments
ls -lt  # View all deployments
rm -rf <old-deployment-directory>
```

**Warning**: Never delete the deployment that `current` symlink points to!

## Troubleshooting

### Issue: Deployment fails at "yarn install"

**Solution**: Ensure you have enough disk space and internet connectivity.

```bash
df -h  # Check disk space
ping -c 4 google.com  # Check internet
```

### Issue: PM2 restart fails

**Solution**: Check PM2 status and logs.

```bash
pm2 status
pm2 logs keepwatching-api-server --err
```

### Issue: Rollback doesn't work

**Solution**: Verify the deployment directory exists.

```bash
ls -la deployments/
readlink deployments/current
```

### Issue: Health check always fails

**Solution**: Either fix the health endpoint or disable health checks by commenting out the `health_check` call in the scripts.

### Issue: "current" symlink is broken

**Solution**: Recreate the symlink manually.

```bash
cd deployments
ls -lt  # Find a valid deployment
ln -sf /full/path/to/valid/deployment current
pm2 restart keepwatching-api-server
```

## Best Practices

1. **Always test locally first** before deploying to production
2. **Check deployment status** before and after deployment
3. **Monitor logs** immediately after deployment
4. **Keep your git history clean** with meaningful commit messages
5. **Have a rollback plan** - know which deployment to rollback to if needed
6. **Document breaking changes** in commit messages
7. **Test health endpoints** in development
8. **Monitor disk space** periodically

## Advanced Usage

### Automated Deployments with Cron

You can set up automated deployments (use with caution):

```bash
# Edit crontab
crontab -e

# Add line for daily deployment at 2 AM
0 2 * * * cd /home/user/keepwatching-api-server && ./scripts/deploy.sh >> /var/log/keepwatching-deploy.log 2>&1
```

### Pre-deployment Hooks

You can modify `deploy.sh` to add custom hooks:

```bash
# Before deployment
run_pre_deployment_checks() {
    # Run tests
    yarn test
    # Run linting
    yarn lint
}
```

### Post-deployment Hooks

```bash
# After deployment
run_post_deployment_tasks() {
    # Send notification
    # Update monitoring
    # Clear caches
}
```

## Migration from Old Deployment Process

If you were using the old deployment process:

```bash
# Old process
git pull
yarn install
yarn build
pm2 restart keepwatching-api-server --update-env
```

**Migration steps:**

1. Run the new deployment script once:

   ```bash
   ./scripts/deploy.sh
   ```

2. This creates the `deployments/` directory structure
3. Future deployments use `./scripts/deploy.sh`
4. You can still rollback even to deployments made before the new system (if you have the git history)

## Security Considerations

1. **Protect deployment scripts**: Ensure only authorized users can execute them
2. **Secure .env files**: Never commit .env to git
3. **Audit deployment history**: Review `.deployment-history` periodically
4. **Backup before major deployments**: Consider database backups
5. **Use SSH keys**: For git operations on production

## Support

For issues or questions:

- Check this documentation first
- Review PM2 logs: `pm2 logs keepwatching-api-server`
- Check deployment history: `./scripts/deployment-status.sh`
- Review git history: `git log`

---

**Last Updated**: 2024-11-17
**Version**: 1.0.0
