# Dokploy Deployment Guide

This guide explains how to deploy the Rowad Speedball Frontend application to Dokploy with proper configuration.

## Overview

The application uses a production-ready multi-stage Docker build that:
- Runs database migrations automatically on startup
- Uses Node.js 20 Alpine for minimal image size (~150MB)
- Includes health checks for monitoring
- Runs as non-root user for security
- Uses Next.js standalone output for optimal performance

## Dokploy Configuration

### 1. Build Time Variables

In Dokploy's **Build Time Variables** section, add:

```bash
NODE_ENV=production
```

**Important**: Do NOT add sensitive information (secrets, passwords, API keys) in build-time variables. These are baked into the Docker image layers and can be inspected.

### 2. Environment Settings (Runtime Variables)

In Dokploy's **Environment Settings** section, add these runtime environment variables:

#### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
```

**Example for Dokploy-managed PostgreSQL**:
```bash
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/speedball_hub
```

#### Authentication Configuration
```bash
BETTER_AUTH_SECRET=your-random-secret-minimum-32-characters-long
BETTER_AUTH_URL=https://your-domain.com
```

**Generate a secure secret**:
```bash
openssl rand -base64 32
```

#### Google OAuth (Optional but Recommended)
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
```

To get Google OAuth credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

#### Email Configuration
```bash
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_APP_PASSWORD=your-16-character-app-password
```

**For Gmail**: Generate an App Password in Google Account Settings → Security → App Passwords

**For other providers**:
- Outlook/Hotmail: `smtp.office365.com`
- Yahoo: `smtp.mail.yahoo.com`
- SendGrid: `smtp.sendgrid.net`
- Custom SMTP: Use your provider's SMTP server

## Port Configuration

- **Container Port**: `3000`
- **Protocol**: HTTP
- **Health Check Path**: `/api/health`

Configure Dokploy to:
1. Map external port (80/443) to container port 3000
2. Enable health checks on `/api/health`
3. Set health check interval to 30 seconds
4. Set start period to 40 seconds (allows time for migrations)

## Database Setup

### Option 1: Dokploy-Managed PostgreSQL (Recommended)

1. Create a PostgreSQL service in Dokploy
2. Use the internal connection string:
   ```bash
   DATABASE_URL=postgresql://postgres:password@postgres:5432/speedball_hub
   ```

### Option 2: External PostgreSQL

Use your external PostgreSQL connection string:
```bash
DATABASE_URL=postgresql://user:password@external-host:5432/database
```

**Important**: Ensure the database allows connections from your Dokploy server's IP.

## Deployment Process

### Initial Deployment

1. **Create the application in Dokploy**
   - Name: `rowad-speedball-frontend`
   - Repository: Your Git repository URL
   - Branch: `main`

2. **Configure Build Settings**
   - Dockerfile path: `./Dockerfile` (default)
   - Build context: `.` (root)

3. **Set Build Time Variables**
   - `NODE_ENV=production`

4. **Set Environment Variables**
   - Add all runtime variables listed above

5. **Configure Port Mapping**
   - Container port: `3000`
   - Public port: `80` (or `443` with SSL)

6. **Deploy**
   - Click "Deploy" button
   - Monitor logs for successful migration and startup

### Verify Deployment

After deployment, verify:

1. **Health Check**: Visit `https://your-domain.com/api/health`
   - Should return: `{"status":"ok","timestamp":"...","service":"rowad-speedball-frontend"}`

2. **Home Page**: Visit `https://your-domain.com`
   - Application should load correctly

3. **Authentication**: Try signing up/logging in
   - Email verification should work
   - Google OAuth should work

4. **Check Logs** in Dokploy:
   ```
   🚀 Starting Rowad Speedball Frontend...
   🔄 Running database migrations...
   ✅ Migrations complete!
   🌐 Starting Next.js application...
   ```

## Troubleshooting

### Container Fails to Start

**Check logs for**:
- Database connection errors → Verify `DATABASE_URL`
- Missing environment variables → Add all required env vars
- Migration failures → Check database permissions

### Health Check Failing

**Common causes**:
- Container not fully started → Increase start period to 60s
- Port mapping incorrect → Verify container port is 3000
- Database not accessible → Check `DATABASE_URL` and network connectivity

### Email Not Sending

**Solutions**:
- For Gmail: Use App Password (not regular password)
- Enable 2FA first, then generate App Password
- Check SMTP settings for your provider

### Google OAuth Not Working

**Solutions**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
2. Check authorized redirect URIs in Google Cloud Console:
   - Should be: `https://your-domain.com/api/auth/callback/google`
3. Ensure `BETTER_AUTH_URL` matches your domain exactly

### Database Connection Error

**Solutions**:
- Verify database is running in Dokploy
- Check `DATABASE_URL` format is correct
- Test database connection from container:
  ```bash
  # In Dokploy terminal
  node -e "const { Client } = require('pg'); const c = new Client(process.env.DATABASE_URL); c.connect().then(() => console.log('OK')).catch(e => console.error(e))"
  ```

## Updating the Application

### Standard Update
1. Push changes to your Git repository
2. In Dokploy, click "Rebuild & Deploy"
3. Monitor logs for successful deployment

### Environment Variable Changes
1. Update variables in Dokploy
2. Restart the container (no rebuild needed)

### Database Schema Changes
- Migrations run automatically on container startup
- No manual intervention needed
- Check logs to confirm migrations ran successfully

## Security Best Practices

### ✅ Do's
- ✅ Use strong `BETTER_AUTH_SECRET` (32+ characters)
- ✅ Enable HTTPS/SSL in Dokploy
- ✅ Use App Passwords for email (not regular passwords)
- ✅ Regularly rotate secrets
- ✅ Use Dokploy's secret management
- ✅ Monitor application logs
- ✅ Keep dependencies updated

### ❌ Don'ts
- ❌ Never commit `.env` files to Git
- ❌ Never put secrets in build-time variables
- ❌ Don't use weak passwords
- ❌ Don't expose database directly to internet
- ❌ Don't disable SSL/HTTPS in production

## Monitoring

### Health Check Endpoint
```bash
curl https://your-domain.com/api/health
```

**Expected response**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T12:00:00.000Z",
  "service": "rowad-speedball-frontend"
}
```

### Application Logs
Monitor in Dokploy dashboard:
- Startup messages
- Migration logs
- API request logs
- Error messages

### Database Health
Check that migrations completed:
```sql
SELECT * FROM drizzle_migrations;
```

## Performance Optimization

### Recommended Dokploy Settings
- **Memory**: 512MB minimum (1GB recommended)
- **CPU**: 0.5 cores minimum (1 core recommended)
- **Restart Policy**: Always
- **Health Check Grace Period**: 40 seconds
- **Max Restart Attempts**: 3

### Scaling
For high traffic:
1. Increase container resources
2. Use Dokploy's horizontal scaling (multiple instances)
3. Configure load balancer
4. Consider database read replicas

## Backup & Recovery

### Database Backups
Use Dokploy's PostgreSQL backup feature:
- Schedule daily backups
- Test restore process regularly
- Store backups in external storage

### Application State
The application is stateless, so:
- No application data to backup
- All data is in PostgreSQL
- Can redeploy from Git anytime

## Cost Optimization

- Multi-stage build reduces image size (~150MB vs ~500MB)
- Standalone output reduces memory usage
- Alpine Linux base minimizes storage costs
- Efficient layer caching speeds up builds

## Support

### Useful Commands

**View logs**:
```bash
# In Dokploy terminal
docker logs -f <container-id>
```

**Test database connection**:
```bash
# In Dokploy terminal/exec
psql $DATABASE_URL -c "SELECT 1"
```

**Check environment variables**:
```bash
# In Dokploy terminal/exec
env | grep -E "DATABASE_URL|BETTER_AUTH|GOOGLE|NODEMAILER"
```

### Resources
- [Dokploy Documentation](https://docs.dokploy.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Quick Reference

### Minimum Required Environment Variables
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-domain.com
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_APP_PASSWORD=...
```

### Optional but Recommended
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Port Configuration
- Container Port: `3000`
- Health Check: `/api/health`
- Protocol: HTTP (Dokploy handles HTTPS)

---

**Ready to Deploy!** Follow the steps above and your application will be running in production with automatic migrations, health checks, and optimal performance.

