import { createAuthClient } from "better-auth/react";

// Get the base URL from environment variables
const getAuthBaseURL = () => {
  const apiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseURL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL environment variable is required"
    );
  }
  return `${apiBaseURL.replace("/api/v1", "")}/api/auth`;
};

export const authClient = createAuthClient({
  /** The base URL of the server */
  baseURL: getAuthBaseURL(),
  fetchOptions: {
    credentials: "include", // Important for session cookies
  },
});
