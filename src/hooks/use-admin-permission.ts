"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export const useAdminPermission = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const checkAdminPermission = async () => {
      if (!session?.user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await authClient.admin.hasPermission({
          permission: { user: ["list"] },
        });
        setIsAdmin(data?.success ?? false);
      } catch (error) {
        console.error("Error checking admin permission:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminPermission();
  }, [session?.user]);

  return { isAdmin, isLoading };
};
