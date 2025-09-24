"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoginForm from "./login-form";
import SignupForm from "./signup-form";
import { authClient } from "@/lib/auth-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

const AuthModal = ({
  isOpen,
  onClose,
  defaultMode = "login",
}: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  const handleSuccess = () => {
    onClose();
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Sign in to manage SpeedballHub for Rowad Club"
              : "Sign up to get started with SpeedballHub"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "login" ? (
            <LoginForm onSuccess={handleSuccess} onCancel={onClose} />
          ) : (
            <SignupForm onSuccess={handleSuccess} onCancel={onClose} />
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Button
              variant="link"
              onClick={switchMode}
              className="p-0 h-auto font-normal"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
