import nodemailer from 'nodemailer';
import crypto from 'crypto';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️ Email configuration is incomplete. OTP emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport(emailConfig);
  return transporter;
}

export function generateOTP(): string {
  // Generate cryptographically secure random 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
}

export async function sendOTPEmail(email: string, username: string, otp: string): Promise<boolean> {
  const transport = getTransporter();
  
  if (!transport) {
    console.error('❌ Cannot send OTP email: Email transporter not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your Admin Login OTP - Ankylo Gaming',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .otp-code {
                background: white;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                text-align: center;
                padding: 20px;
                margin: 20px 0;
                border: 2px dashed #667eea;
                border-radius: 8px;
                color: #667eea;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎮 Ankylo Gaming</h1>
              <p>Admin Login Verification</p>
            </div>
            <div class="content">
              <p>Hello <strong>${username}</strong>,</p>
              <p>You are attempting to log in to the admin panel. Please use the following One-Time Password (OTP) to complete your login:</p>
              
              <div class="otp-code">${otp}</div>
              
              <div class="warning">
                <strong>⏰ Important:</strong> This OTP will expire in <strong>10 minutes</strong>.
              </div>
              
              <p>If you did not request this login, please ignore this email and ensure your account is secure.</p>
              
              <p>For security reasons, never share this code with anyone.</p>
              
              <div class="footer">
                <p>This is an automated email from Ankylo Gaming Staff Panel.</p>
                <p>&copy; ${new Date().getFullYear()} Ankylo Gaming. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Ankylo Gaming - Admin Login Verification
        
        Hello ${username},
        
        You are attempting to log in to the admin panel. Please use the following OTP to complete your login:
        
        OTP: ${otp}
        
        This OTP will expire in 10 minutes.
        
        If you did not request this login, please ignore this email and ensure your account is secure.
        
        For security reasons, never share this code with anyone.
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
}
