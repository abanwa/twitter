import Notification from "../models/notificationModel.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    // we will get notifications that is sent to this user
    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg"
    });

    // Those notification we got that was sent to the user, we will update them as read
    await Notification.updateMany({ to: userId }, { read: true });

    res.status(200).json(notifications);
  } catch (err) {
    console.log(`Error in getNotifications in postController: ${err.message}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // delete all the notifications that was sent to the user
    await Notification.deleteMany({ to: userId });

    res.status(200).json({
      message: "Notifications deleted successfully"
    });
  } catch (err) {
    console.log(
      `Error in deleteNotifications in postController: ${err.message}`
    );
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    // check if the notification the user wants to delete belongs to that user
    if (notification.toString() !== userId.toString()) {
      return res.status(403).json({
        error: "You are not allowed to delete this notification"
      });
    }

    // delete the notification
    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      message: "Notification deleted successfully"
    });
  } catch (err) {
    console.log(
      `Error in deleteNotification in postController: ${err.message}`
    );
    res.status(500).json({
      error: "Internal server error"
    });
  }
};
