import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { sendPasswordResetEmail } from "@/actions/emails/send-password-reset-email";
import { sendVerificationEmail } from "@/actions/emails/send-verification-email";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  appName: "Rowad Speedball",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.BETTER_AUTH_URL
      : "http://localhost:3000",
  trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  socialProviders: {
    google: {
      enabled: true,
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    sendResetPassword: sendPasswordResetEmail,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 1 day
    sendOnSignUp: true,
    sendVerificationEmail: sendVerificationEmail,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60, // 1 minute
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  plugins: [nextCookies()],
});
