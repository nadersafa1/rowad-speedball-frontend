"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  SUPPORTED_OAUTH_PROVIDERS,
  SUPPORTED_OAUTH_PROVIDERS_DETAILS,
} from "@/lib/o-auth-provider";

const SocialAuthButtons = () => {
  return SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
    const Icon = SUPPORTED_OAUTH_PROVIDERS_DETAILS[provider].icon;
    return (
      <Button
        key={provider}
        onClick={() => {
          authClient.signIn.social(
            {
              provider,
              callbackURL: "/",
            },
            {
              onError: (error) => {
                toast.error("Sign in failed", {
                  description: error.error.message,
                });
              },
            }
          );
        }}
      >
        <Icon />
        {SUPPORTED_OAUTH_PROVIDERS_DETAILS[provider].name}
      </Button>
    );
  });
};

export default SocialAuthButtons;

