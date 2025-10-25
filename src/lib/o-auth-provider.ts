import type { ComponentProps, ElementType } from "react";
import { FcGoogle } from "react-icons/fc";

export const SUPPORTED_OAUTH_PROVIDERS = ["google"] as const;

export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

export const SUPPORTED_OAUTH_PROVIDERS_DETAILS: Record<
  SupportedOAuthProvider,
  { name: string; icon: ElementType<ComponentProps<"svg">> }
> = {
  google: {
    name: "Google",
    icon: FcGoogle,
  },
};
