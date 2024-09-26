import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  getNotifications,
  deleteNotifications,
  deleteNotification
} from "../controllers/notificationController.js";

const router = express.Router();

// THIS WILL GET ALL NOTIFICATIONS
router.get("/", protectRoute, getNotifications);
router.delete("/", protectRoute, deleteNotifications);
// TO DELETE ONE NOTIFICATION BASE ON THE NOTIFICATION ID
router.delete("/:id", protectRoute, deleteNotification);

export default router;
