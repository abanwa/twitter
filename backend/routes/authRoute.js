import express from "express";

import { signup, login, logout, getMe } from "../controllers/authController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// GET ME
router.get("/me", protectRoute, getMe);

// FOR SIGN UP
router.post("/signup", signup);

// FOR LOGIN
router.post("/login", login);

// FOR LOGOUT
router.post("/logout", logout);

export default router;
