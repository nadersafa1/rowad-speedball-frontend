import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export const requireAuth = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return {
      authenticated: false,
      response: Response.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    authenticated: true,
    session,
    user: session.user,
  };
};

export const requireAdmin = async (request: NextRequest) => {
  // First check authentication
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult;
  }

  // Then check admin permission
  const hasPermission = await auth.api.userHasPermission({
    headers: request.headers,
    body: { permission: { user: ["list"] } },
  });

  if (!hasPermission.success) {
    return {
      authenticated: true,
      authorized: false,
      response: Response.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  return {
    authenticated: true,
    authorized: true,
    session: authResult.session,
    user: authResult.user,
  };
};
