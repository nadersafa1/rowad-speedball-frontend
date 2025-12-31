"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { emailSchema, passwordSignInSchema } from "@/lib/forms/patterns";

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSignInSchema,
});

type SignInSchema = z.infer<typeof signInSchema>;

const SignInTab = ({
  openEmailVerification,
  openForgotPassword,
}: {
  openEmailVerification: (email: string) => void;
  openForgotPassword: () => void;
}) => {
  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInSchema) => {
    const response = await authClient.signIn.email(
      {
        ...data,
        callbackURL: "/",
      },
      {
        onError: (error) => {
          if (error.error.code === "EMAIL_NOT_VERIFIED") {
            openEmailVerification(data.email);
          }
          toast.error("Sign in failed", {
            description: error.error.message,
          });
        },
      }
    );
    console.log(response);
  };

  const { isSubmitting } = form.formState;

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="email webauthn"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  We will never share your email with anyone else.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Password</FormLabel>
                  <Button
                    onClick={openForgotPassword}
                    type="button"
                    variant="link"
                  >
                    forgot password?
                  </Button>
                </div>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password webauthn"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full mt-2" disabled={isSubmitting} type="submit">
            <LoadingSwap isLoading={isSubmitting}>Sign In</LoadingSwap>
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SignInTab;

