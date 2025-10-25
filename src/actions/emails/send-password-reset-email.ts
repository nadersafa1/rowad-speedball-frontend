import type { User } from "better-auth";
import { sendEmailAction } from "../send-email.action";

export const sendPasswordResetEmail = async ({
  user,
  url,
}: {
  user: User;
  url: string;
}) => {
  await sendEmailAction({
    to: user.email,
    subject: "Password Reset",
    meta: {
      description: "Click the link below to reset your password",
      link: url,
      linkText: "Reset Password",
    },
  });
};

