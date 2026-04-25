import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { sendEmail, templates } from '../utils/email.js';

export async function createAndSendNotification({ userId, title, message, type = 'system', relatedId, relatedType, sendEmailAlert = false }) {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    relatedId,
    relatedType,
  });

  if (sendEmailAlert) {
    const user = await User.findById(userId).select('email');
    if (user?.email) {
      const t = templates();
      let mailOpts = { subject: title, html: `<p>${message}</p>` };
      if (type === 'application') mailOpts = t.applicationSubmitted?.('Student', title) || mailOpts;
      await sendEmail({ to: user.email, ...mailOpts });
      await Notification.findByIdAndUpdate(notification._id, { emailSent: true });
    }
  }

  return notification;
}

export async function notifyApplicationUpdate(application, status, studentUserId, extra = {}) {
  const title = status === 'approved' ? 'Application Approved' : 'Application Update';
  const message = status === 'approved'
    ? `Your application has been approved. ${extra.amount ? `Amount: BDT ${extra.amount}` : ''}`
    : (extra.reason || 'Your application status has been updated.');
  await createAndSendNotification({
    userId: studentUserId,
    title,
    message,
    type: 'application',
    relatedId: application._id,
    relatedType: 'application',
    sendEmailAlert: true,
  });
}

export async function notifyDisbursement(studentUserId, amount, method, transactionRef) {
  await createAndSendNotification({
    userId: studentUserId,
    title: 'Fund Disbursement',
    message: `BDT ${amount} has been released via ${method}. ${transactionRef ? `Ref: ${transactionRef}` : ''}`,
    type: 'disbursement',
    sendEmailAlert: true,
  });
}
