import type { User } from "better-auth";
import { sendEmailAction } from "../send-email.action";

export const sendVerificationEmail = async ({
  user,
  url,
}: {
  user: User;
  url: string;
}) => {
  await sendEmailAction({
    to: user.email,
    subject: "Email Verification",
    meta: {
      description: "Click the link below to verify your email address",
      link: url,
      linkText: "Verify Email",
    },
  });
};

