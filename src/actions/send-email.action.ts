'use server'

import transporter from '@/lib/nodemailer'

// Rowad Speedball brand colors
const brandColors = {
  primary: '#16a34a', // rowad-600
  primaryHover: '#15803d', // rowad-700
  primaryLight: '#dcfce7', // rowad-100
  text: '#1f2937', // gray-800
  textSecondary: '#6b7280', // gray-500
  border: '#e5e7eb', // gray-200
  background: '#ffffff',
}

const emailStyles = {
  wrapper:
    "font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; line-height: 1.6; color: " +
    brandColors.text +
    ';',
  container:
    'max-width: 600px; margin: 0 auto; background-color: ' +
    brandColors.background +
    '; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);',
  header:
    'background: linear-gradient(135deg, ' +
    brandColors.primary +
    ' 0%, ' +
    brandColors.primaryHover +
    ' 100%); padding: 32px 40px; text-align: center;',
  logo: 'font-size: 24px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: -0.5px;',
  content: 'padding: 40px;',
  heading:
    'font-size: 24px; font-weight: 600; color: ' +
    brandColors.text +
    '; margin: 0 0 16px 0; line-height: 1.3;',
  paragraph:
    'font-size: 16px; color: ' +
    brandColors.text +
    '; margin: 0 0 24px 0; line-height: 1.6;',
  paragraphSecondary:
    'font-size: 14px; color: ' +
    brandColors.textSecondary +
    '; margin: 0 0 16px 0; line-height: 1.6;',
  buttonContainer: 'text-align: center; margin: 32px 0;',
  button:
    'display: inline-block; padding: 14px 32px; background-color: ' +
    brandColors.primary +
    '; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);',
  buttonHover: 'background-color: ' + brandColors.primaryHover + ';',
  divider:
    'height: 1px; background-color: ' +
    brandColors.border +
    '; margin: 32px 0; border: none;',
  footer:
    'padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid ' +
    brandColors.border +
    '; text-align: center;',
  footerText:
    'font-size: 12px; color: ' +
    brandColors.textSecondary +
    '; margin: 0; line-height: 1.5;',
  footerLink:
    'color: ' +
    brandColors.primary +
    '; text-decoration: none; font-weight: 500;',
}

export const sendEmailAction = async ({
  to,
  subject,
  meta,
}: {
  to: string
  subject: string
  meta: {
    description: string
    link?: string
    linkText?: string
  }
}) => {
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to,
    subject: `Rowad Speedball - ${subject}`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rowad Speedball - ${subject}</title>
    </head>
    <body style="${emailStyles.wrapper}">
      <div style="${emailStyles.container}">
        <!-- Header -->
        <div style="${emailStyles.header}">
          <h1 style="${emailStyles.logo}">Rowad Speedball</h1>
        </div>
        
        <!-- Content -->
        <div style="${emailStyles.content}">
          <h2 style="${emailStyles.heading}">${subject}</h2>
          <p style="${emailStyles.paragraph}">${meta.description}</p>
          
          ${
            meta.link
              ? `
          <div style="${emailStyles.buttonContainer}">
            <a href="${meta.link}" style="${emailStyles.button}">
              ${meta.linkText ?? 'Get Started'}
            </a>
          </div>
          `
              : ''
          }
        </div>
        
        <!-- Footer -->
        <div style="${emailStyles.footer}">
          <p style="${emailStyles.footerText}">
            This email was sent by Rowad Speedball.<br>
            <a href="${baseUrl}" style="${
      emailStyles.footerLink
    }">Visit our website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (err) {
    console.error('[SendEmail]:', err)
    return { success: false }
  }
}
