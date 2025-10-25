# Troubleshooting Guide

## Database Connection Errors

### Error: "Postgres.app rejected 'trust' authentication"

**Problem**: Your DATABASE_URL doesn't include a password.

**Solution**:
```bash
# ❌ Wrong (no password)
DATABASE_URL=postgresql://postgres@localhost:5432/speedball_hub

# ✅ Correct (with password)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/speedball_hub
```

**Steps to fix:**
1. Open `.env.local` in your frontend directory
2. Update `DATABASE_URL` to include `:password` after the username
3. Default Postgres.app password is usually `postgres`
4. Restart your dev server

### Error: "DATABASE_URL is not set"

**Problem**: Missing `.env.local` file or DATABASE_URL variable.

**Solution**:
1. Create `.env.local` in the frontend root
2. Add required environment variables (see ENV_SETUP.md)
3. Restart your dev server

### Error: "Connection refused" or "ECONNREFUSED"

**Problem**: PostgreSQL is not running.

**Solution**:
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Start Postgres.app
# - Open Postgres.app
# - Click "Start" if not running

# Or via Homebrew
brew services start postgresql
```

### Error: "database does not exist"

**Problem**: Database hasn't been created.

**Solution**:
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE speedball_hub;"

# Then push the schema
npm run db:push
```

## Authentication Errors

### Error: "BETTER_AUTH_SECRET is not set"

**Solution**:
```bash
# Generate a random secret
openssl rand -base64 32

# Add to .env.local
BETTER_AUTH_SECRET=the-generated-secret-here
```

### Error: "Google OAuth redirect_uri_mismatch"

**Problem**: Redirect URI not configured in Google Console.

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services > Credentials
4. Edit your OAuth 2.0 Client ID
5. Add these Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (production)

## Email Errors

### Error: "Invalid login" (Nodemailer)

**Problem**: Using regular Gmail password instead of App Password.

**Solution**:
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Go to Security > App Passwords
4. Generate a new app password for "Mail"
5. Use this 16-character password in `NODEMAILER_APP_PASSWORD`

### Email not sending (no error)

**Problem**: SMTP settings incorrect.

**Solution - For Gmail:**
```bash
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_USER=youremail@gmail.com
NODEMAILER_APP_PASSWORD=your-16-char-app-password
```

**Solution - For other providers:**
- **Outlook/Hotmail**: `smtp.office365.com`
- **Yahoo**: `smtp.mail.yahoo.com`
- **Custom SMTP**: Use your provider's SMTP server

## Build & Runtime Errors

### Error: "Module not found" or "Cannot find module"

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Error: Type errors after upgrade

**Solution**:
```bash
# Clear TypeScript cache
rm -rf .next
rm tsconfig.tsbuildinfo

# Regenerate types
npm run type-check
```

### Error: "Port 3000 already in use"

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

## API Errors

### Error: "401 Unauthorized" on protected routes

**Problem**: User not authenticated.

**Solution**:
1. Make sure you're logged in
2. Check if session cookie is set (in browser dev tools > Application > Cookies)
3. Try logging out and back in
4. Clear cookies and try again

### Error: "500 Internal Server Error" on API routes

**Problem**: Multiple possible causes.

**Check:**
1. Database connection is working
2. Environment variables are set correctly
3. Check terminal logs for specific error
4. Ensure database schema is up to date: `npm run db:push`

## Development Issues

### Changes not reflecting

**Solution**:
```bash
# Hard refresh in browser
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R

# Or clear Next.js cache
rm -rf .next
npm run dev
```

### Hot reload not working

**Solution**:
1. Check if file is within `src/` directory
2. File extension is `.ts`, `.tsx`, `.js`, or `.jsx`
3. Restart dev server
4. Check if file is not in `.gitignore`

## Common Setup Mistakes

### ❌ Wrong: Relative DATABASE_URL path
```bash
DATABASE_URL=./database.db
```

### ✅ Correct: PostgreSQL connection string
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/speedball_hub
```

### ❌ Wrong: Missing password in connection string
```bash
DATABASE_URL=postgresql://postgres@localhost:5432/speedball_hub
```

### ✅ Correct: With password
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/speedball_hub
```

### ❌ Wrong: Spaces in environment variables
```bash
BETTER_AUTH_SECRET = my secret
```

### ✅ Correct: No spaces, use quotes if needed
```bash
BETTER_AUTH_SECRET=my-secret
# Or with spaces:
BETTER_AUTH_SECRET="my secret with spaces"
```

## Verification Steps

After fixing issues, verify everything works:

```bash
# 1. Check database connection
npm run db:push

# 2. Start dev server
npm run dev

# 3. Test in browser:
# - Visit http://localhost:3000
# - Try to sign up/login
# - Check API routes work
# - View browser console for errors

# 4. Check terminal for errors
```

## Still Having Issues?

1. **Check the logs**: Look at terminal output for specific errors
2. **Verify environment**: Run `echo $NODE_ENV` and check `.env.local` exists
3. **Database status**: Run `psql -U postgres -l` to list databases
4. **Clean start**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

## Getting Help

When asking for help, provide:
1. Full error message from terminal
2. Your `.env.local` structure (without actual values)
3. PostgreSQL version: `psql --version`
4. Node.js version: `node --version`
5. Steps to reproduce the issue

## Quick Diagnostic Commands

```bash
# Check if PostgreSQL is running
pg_isready

# Test database connection
psql -U postgres speedball_hub -c "SELECT 1;"

# Check environment variables are loaded
node -e "console.log(process.env.DATABASE_URL ? 'DATABASE_URL is set' : 'DATABASE_URL not set')"

# List all tables in database
psql -U postgres speedball_hub -c "\dt"

# Check Next.js installation
npx next info
```

