import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const trans = getTransporter();
  if (!trans || !process.env.EMAIL_FROM) return false;
  try {
    await trans.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: text || (html && html.replace(/<[^>]*>/g, '')),
      html,
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
}

export function templates() {
  return {
    registration: (name) => ({
      subject: 'Registration Confirmation - Education Aid Disbursement System',
      html: `<p>Hello ${name},</p><p>Your registration has been received. You can now log in to the platform.</p>`,
    }),
    applicationSubmitted: (name, programTitle) => ({
      subject: 'Application Submitted - EADS',
      html: `<p>Hello ${name},</p><p>Your application for "${programTitle}" has been submitted successfully. We will notify you when it is reviewed.</p>`,
    }),
    applicationApproved: (name, programTitle, amount) => ({
      subject: 'Scholarship Approved - EADS',
      html: `<p>Hello ${name},</p><p>Your application for "${programTitle}" has been approved. Amount: BDT ${amount}.</p>`,
    }),
    applicationRejected: (name, programTitle, reason) => ({
      subject: 'Application Update - EADS',
      html: `<p>Hello ${name},</p><p>Your application for "${programTitle}" was not approved. ${reason ? `Reason: ${reason}` : ''}</p>`,
    }),
    disbursementRelease: (name, amount, method, ref) => ({
      subject: 'Fund Disbursement - EADS',
      html: `<p>Hello ${name},</p><p>An amount of BDT ${amount} has been released via ${method}. ${ref ? `Reference: ${ref}` : ''}</p>`,
    }),
  };
}
