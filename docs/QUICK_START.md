# Quick Start Guide

Get your migrated application running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ PostgreSQL database running
- ✅ Gmail account (or SMTP server) for emails
- ✅ Google Cloud Console project (for OAuth)

## Step 1: Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy this template and fill in your values
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/speedball_hub
BETTER_AUTH_SECRET=generate-a-random-32-character-string-here
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_APP_PASSWORD=your-gmail-app-password
```

💡 **Tip**: Generate a strong secret with: `openssl rand -base64 32`

📖 **Need help?** See `ENV_SETUP.md` for detailed instructions.

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Setup Database

```bash
# Push database schema to PostgreSQL
npm run db:push
```

This will create all necessary tables (user, session, players, tests, results, etc.)

## Step 4: Start Development Server

```bash
npm run dev
```

Your app will be available at: **http://localhost:3000**

## Step 5: Test the Application

### Test Authentication
1. Go to http://localhost:3000
2. Click "Sign Up" and create an account
3. Check your email for verification link
4. Click the verification link
5. Log in with your credentials
6. Try "Sign in with Google"

### Test API Routes
The API is now at the same server:
- Players: http://localhost:3000/api/v1/players
- Tests: http://localhost:3000/api/v1/tests
- Results: http://localhost:3000/api/v1/results

### Test Database GUI (Optional)
```bash
npm run db:studio
```
Opens Drizzle Studio at http://local.drizzle.studio

## Common Issues & Solutions

### Database Connection Error
```
Error: Connection refused
```
**Solution**: Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Email Not Sending
```
Error: Invalid login
```
**Solution**: 
1. For Gmail, use an App Password (not your regular password)
2. Enable 2-Factor Authentication first
3. Generate App Password in Google Account Settings

### Google OAuth Error
```
Error: redirect_uri_mismatch
```
**Solution**: Add these to your Google Cloud Console:
- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://yourdomain.com/api/auth/callback/google`

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution**: Kill the process or use a different port:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

## Verification Checklist

- [ ] Development server starts without errors
- [ ] Can access homepage at http://localhost:3000
- [ ] Can sign up with email/password
- [ ] Receive verification email
- [ ] Can verify email and login
- [ ] Can login with Google OAuth
- [ ] Can create/view/edit/delete players (when logged in)
- [ ] Can create/view/edit/delete tests (when logged in)
- [ ] Can create/view/edit/delete results (when logged in)
- [ ] Public routes work without authentication
- [ ] Protected routes require authentication

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
```

## What's Different from Backend?

| Aspect | Old Backend | New (Integrated) |
|--------|-------------|------------------|
| **Server** | Express (port 2000) | Next.js (port 3000) |
| **API URL** | `http://localhost:2000/api/v1/*` | `/api/v1/*` (relative) |
| **Auth** | Bearer tokens | Cookie-based sessions |
| **Database** | Drizzle with pooling | Drizzle (Next.js managed) |
| **Emails** | TODO comments | Nodemailer integrated |
| **Deployment** | Separate deployment | Single deployment |

## Architecture Overview

```
Frontend (Next.js 15)
├── Client Components (React 19)
│   ├── Pages (App Router)
│   └── Components (Radix UI)
├── Server Components
│   └── API Routes
│       ├── /api/auth/[...all] (Better Auth)
│       └── /api/v1/* (Business Logic)
└── Database (PostgreSQL + Drizzle)
    ├── Auth Tables
    ├── Players
    ├── Tests
    └── Results
```

## Next Steps

1. ✅ **Read**: `MIGRATION_SUMMARY.md` for complete details
2. ✅ **Review**: `PACKAGE_UPGRADES.md` for what changed
3. ✅ **Configure**: `ENV_SETUP.md` for environment setup
4. 🚀 **Deploy**: Configure your hosting platform
5. 📊 **Monitor**: Set up logging and analytics

## Need Help?

- **Migration Details**: See `MIGRATION_SUMMARY.md`
- **Environment Setup**: See `ENV_SETUP.md`
- **Package Changes**: See `PACKAGE_UPGRADES.md`
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Drizzle ORM Docs**: https://orm.drizzle.team/docs
- **Next.js 15 Docs**: https://nextjs.org/docs

## Success! 🎉

If you can:
- ✅ Sign up and verify email
- ✅ Login with email/password and Google
- ✅ Create and manage players/tests/results
- ✅ See API responses in the UI

**You're ready to go! The migration is complete.**

---

**Pro Tip**: Use `npm run db:studio` to visually explore and manage your database during development!

