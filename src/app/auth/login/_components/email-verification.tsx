"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth-client";

const EmailVerification = ({ email }: { email: string }) => {
  const [isSendingVerificationEmail, setIsSendingVerificationEmail] =
    useState(false);

  const [timeToNextResend, setTimeToNextResend] = useState(30);

  const interval = useRef<NodeJS.Timeout | undefined>(undefined);

  const startVerificationCountdown = useCallback((time = 30) => {
    setTimeToNextResend(time);

    interval.current = setInterval(() => {
      setTimeToNextResend((t) => {
        const newTime = t - 1;
        if (newTime <= 0) {
          clearInterval(interval.current);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startVerificationCountdown();
  }, [startVerificationCountdown]);

  return (
    <div className="space-y-4">
      <p>
        We sent a verification email to {email} please check your email and
        click the link to verify your email
      </p>

      <Button
        className="w-full mt-2"
        disabled={isSendingVerificationEmail || timeToNextResend > 0}
        onClick={async () => {
          startVerificationCountdown();
          setIsSendingVerificationEmail(true);
          await authClient.sendVerificationEmail({
            email,
            callbackURL: "/",
          });
          toast.success("Verification email sent");
          setIsSendingVerificationEmail(false);
        }}
      >
        <LoadingSwap isLoading={isSendingVerificationEmail}>
          {timeToNextResend > 0
            ? `Resend in ${timeToNextResend}s`
            : "Verify Email"}
        </LoadingSwap>
      </Button>
    </div>
  );
};

export default EmailVerification;

