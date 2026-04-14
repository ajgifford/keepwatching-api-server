# Deployment Quick Start Guide

Quick reference for common deployment operations.

## 🧪 Test Before Deploying

**Run automated tests:**

```bash
./scripts/test-deployment.sh
```

**Test deployment (dry-run):**

```bash
./scripts/deploy.sh --dry-run
```

**Test rollback (dry-run):**

```bash
./scripts/rollback.sh --dry-run
```

## 🚀 Deploy New Version

```bash
./scripts/deploy.sh
```

## ⏮️ Rollback to Previous Version

**Interactive (recommended):**

```bash
./scripts/rollback.sh
```

**Direct rollback:**

```bash
./scripts/rollback.sh 20241117_150045_e4f5g6h
```

## 📊 Check Deployment Status

**All information:**

```bash
./scripts/deployment-status.sh
```

**Current deployment only:**

```bash
./scripts/deployment-status.sh --current
```

**Deployment history only:**

```bash
./scripts/deployment-status.sh --history
```

## 📝 Check PM2 Status

**View status:**

```bash
pm2 status
```

**View logs:**

```bash
pm2 logs keepwatching-api-server
```

**Monitor in real-time:**

```bash
pm2 monit
```

## 🔧 Common Workflows

### New Feature Deployment

```bash
# 1. SSH to server
ssh user@raspberry-pi

# 2. Navigate to project
cd /home/user/keepwatching-api-server

# 3. Deploy
./scripts/deploy.sh

# 4. Monitor logs
pm2 logs keepwatching-api-server --lines 50
```

### Emergency Rollback

```bash
# 1. SSH to server
ssh user@raspberry-pi

# 2. Navigate to project
cd /home/user/keepwatching-api-server

# 3. Rollback
./scripts/rollback.sh

# 4. Select previous working version
# Enter the number when prompted

# 5. Verify
./scripts/deployment-status.sh --current
pm2 logs keepwatching-api-server
```

### Health Check

```bash
# Check if API is responding
curl http://localhost:3033/api/v1/health

# Or check with full details
curl -v http://localhost:3033/api/v1/health
```

## 🛟 Troubleshooting

### Deployment Failed?

```bash
# Check what went wrong
cat deployments/.deployment-history

# View PM2 errors
pm2 logs keepwatching-api-server --err

# Rollback if needed
./scripts/rollback.sh
```

### PM2 Not Running?

```bash
# Check PM2 status
pm2 status

# Start if not running
pm2 start ecosystem.config.cjs --only keepwatching-api-server --env production

# Or restart
pm2 restart keepwatching-api-server
```

### Out of Disk Space?

```bash
# Check current usage
./scripts/deployment-status.sh --available

# Manually remove old deployments (be careful!)
cd deployments
ls -lt
rm -rf <old-deployment-name>
```

## 📁 Deployment Structure

```
deployments/
├── 20241117_143022_a1b2c3d/   ← Old deployment
├── 20241117_150045_e4f5g6h/   ← Previous deployment
├── 20241117_153012_i7j8k9l/   ← Current deployment
├── current -> i7j8k9l/        ← Symlink to active
└── .deployment-history         ← Deployment log
```

## 🔐 Important Notes

- ✅ Always check logs after deployment
- ✅ Test in development first
- ✅ Keep at least one working rollback option
- ✅ Monitor disk space regularly
- ❌ Never delete the current deployment
- ❌ Never commit .env files
- ❌ Never force-push to production

## 📚 Full Documentation

For detailed documentation, see [DEPLOYMENT.md](DEPLOYMENT.md)
