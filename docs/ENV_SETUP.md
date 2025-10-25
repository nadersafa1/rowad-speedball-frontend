# Environment Setup

This document describes the required environment variables for the Rowad Speedball application.

## Required Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

### Database Configuration

⚠️ **IMPORTANT**: Postgres.app requires a password in the connection string!

```bash
# Default Postgres.app password is usually 'postgres'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/speedball_hub

# Or if you set a custom password:
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/speedball_hub
```

**Common mistake**: Forgetting the password will cause "trust authentication rejected" errors.

### Better Auth Configuration
```bash
BETTER_AUTH_SECRET=your-secret-key-here-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
```

For production, set `BETTER_AUTH_URL` to your production domain (e.g., `https://rowad.speedballhub.com`).

### Google OAuth Configuration
```bash
GOOGLE_CLIENT_ID=your-google-client-id-from-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-console
```

To get these credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to Credentials and create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### Email Configuration (Nodemailer)
```bash
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_APP_PASSWORD=your-app-specific-password
```

**For Gmail:**
1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification
3. Scroll down to App passwords
4. Generate a new app password for "Mail"
5. Use this generated password as `NODEMAILER_APP_PASSWORD`

**For other email providers:**
- Update `NODEMAILER_HOST` with your SMTP server
- Port 465 (SSL) is used by default (configured in code)

## Example .env.local File

```bash
# Database
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/speedball_hub

# Better Auth
BETTER_AUTH_SECRET=this-is-a-very-long-secret-key-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
  
# Email
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_USER=myemail@gmail.com
NODEMAILER_APP_PASSWORD=abcd efgh ijkl mnop
```

## Notes

- **Never commit `.env.local` to version control**
- The `.env.local` file is already in `.gitignore`
- For production deployment, set these variables in your hosting platform's environment configuration
- Generate a strong `BETTER_AUTH_SECRET` using: `openssl rand -base64 32`

## Running Database Migrations

After setting up your environment variables, run the following to set up your database:

```bash
npm run db:push
```

This will create all the necessary tables in your PostgreSQL database.

