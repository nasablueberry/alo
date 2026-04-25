import Notification from '../models/Notification.model.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const { read, limit = 50 } = req.query;
    const query = { user: req.user._id };
    if (read !== undefined) query.read = read === 'true';
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, user: req.user._id },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { read: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
