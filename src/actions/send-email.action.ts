"use server";

import transporter from "@/lib/nodemailer";

const styles = {
  container:
    "max-width:500px;margin:20px auto;padding:20px;border:1px solid #ddd;border-radius:6px;",
  heading: "font-size:20px;color:#333;",
  paragraph: "font-size:16px;",
  link: "display:inline-block;margin-top:15px;padding:10px 15px;background:#007bff;color:#fff;text-decoration:none;border-radius:4px;",
};

export const sendEmailAction = async ({
  to,
  subject,
  meta,
}: {
  to: string;
  subject: string;
  meta: {
    description: string;
    link?: string;
    linkText?: string;
  };
}) => {
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to,
    subject: `Rowad Speedball - ${subject}`,
    html: `
    <div style="${styles.container}">
      <h1 style="${styles.heading}">${subject}</h1>
      <p style="${styles.paragraph}">${meta.description}</p>
			${meta.link ? `<a href="${meta.link}" style="${styles.link}">${meta.linkText ?? "Click Here"}</a>` : ""}
    </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error("[SendEmail]:", err);
    return { success: false };
  }
};

