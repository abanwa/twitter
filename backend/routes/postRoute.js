import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  createPost,
  deletePost,
  commentOnPost,
  likeUnlikePost,
  getAllPosts,
  getLikedPosts,
  getFollowingPosts,
  getUserPosts
} from "../controllers/postController.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPosts);
// GET POST OF THE USERS THAT WE ARE FOLLOWING
router.get("/following", protectRoute, getFollowingPosts);
// GET THE POSTS THAT WE LIKED BASE ON USERID
router.get("/likes/:id", protectRoute, getLikedPosts);
// WE WILL GET THE LOGGEDIN USER POSTS BASE ON USERNAME
router.get("/user/:username", protectRoute, getUserPosts);
// CREATE A POST
router.post("/create", protectRoute, createPost);
// LIKE AND UNLIKE A POST BASE ON POST ID
router.post("/like/:id", protectRoute, likeUnlikePost);
// COMMENT ON A POST BASE ON POST ID
router.post("/comment/:id", protectRoute, commentOnPost);
// DELETE A POST BASE ON POST ID
router.delete("/:id", protectRoute, deletePost);

export default router;
