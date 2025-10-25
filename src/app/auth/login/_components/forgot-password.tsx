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
import { authClient } from "@/lib/auth-client";

const forgotPasswordSchema = z.object({
  email: z.string().email().min(1),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordTab = ({ openSignIn }: { openSignIn: () => void }) => {
  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    await authClient.forgetPassword(
      {
        email: data.email,
        redirectTo: "/auth/reset-password",
      },
      {
        onSuccess: () => {
          toast.success("Reset password email sent");
        },
        onError: (error) => {
          toast.error("Reset password email failed", {
            description: error.error.message,
          });
        },
      }
    );
  };

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
              <FormDescription>
                We will never share your email with anyone else.
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="flex mt-2 justify-between gap-2">
          <Button
            disabled={isSubmitting}
            onClick={openSignIn}
            type="button"
            variant="outline"
          >
            Back to Sign In
          </Button>
          <Button
            className="flex-1"
            disabled={isSubmitting || !form.formState.isValid}
            type="submit"
          >
            <LoadingSwap isLoading={isSubmitting}>
              Send Reset Password Email
            </LoadingSwap>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ForgotPasswordTab;

