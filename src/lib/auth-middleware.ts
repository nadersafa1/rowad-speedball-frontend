import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export const requireAuth = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return {
      authenticated: false,
      response: Response.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    session,
    user: session.user,
  };
};

