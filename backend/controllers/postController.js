import User from "../models/userModel.js";
import Post from "../models/postModel.js";

import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notificationModel.js";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    // we will check if the user exist or not
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (!text && !img) {
      return res.status(400).json({
        error: "Post must have text or image"
      });
    }

    // if there is an image, we will upload it to cloudinary
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img
    });

    // save to database
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.log(`Error in createPost in postController: ${err.message}`);
    res.status(500).json({
      error: err.message
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: "Post not found"
      });
    }

    // if the person that wants to delete the post is not the owner of the post, it will not work
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        error: "You are not authorized to delete this post"
      });
    }

    // if the post has an image, we will delete it from the cloduinary account
    if (post.img) {
      // get the id of the image for the cloudinary
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    // we will delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Post deleted successfully"
    });
  } catch (err) {
    console.log(`Error in deletePost in postController: ${err.message}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({
        error: "Text field is required"
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        error: "Post not found"
      });
    }

    // we will create the comment
    const comment = { user: userId, text };

    post.comments.push(comment);

    // we will save the comment in database
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    console.log(`Error in commentOnPost in postController: ${err.message}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        error: "Post no found"
      });
    }

    // check if the user already liked this post
    const userLikedPost = post.likes.includes(userId);

    // if user already liked post, we will unlike it otherwise, we will like it
    if (userLikedPost) {
      // unlike the post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      // we will remove the id of the post from the user's likedPost array field
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
      res.status(200).json({
        message: "Post unliked successfully"
      });
    } else {
      // Like the post
      post.likes.push(userId);
      // we will add the id of the post to the user's likedPost array field
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();

      // we will send a notification to the owner of that post that his/her post has been liked
      const notification = new Notification({
        from: userId, // the person that liked it (curent/loggedIn user)
        to: post.user, // owner of post
        type: "like"
      });

      await notification.save();
      res.status(200).json({
        message: "Post liked successfully"
      });
    }
  } catch (err) {
    console.log(`Error in likeUnlikePost in postController: ${err.message}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    //sorted({ createdAt: -1 }) will return the post in descending order (from the latest post) popluate() will get the data of the user that posted the post. the "user" is referencing the user (userId) in the postModel to get the user data from the ref:User table. the user password will not be selected because of the minus(-) sign
    // const posts = await Post.find().sort({ createdAt: -1 }).populate("user");
    // because we want to remove the password, we did it this way
    // we will also get the users that commented on that post
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password"
      })
      .populate({
        path: "comments.user",
        select: "-password"
      });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(posts);
  } catch (err) {
    console.log(`Error in getAllPosts in postController: ${err.message}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // we will find all the post in which the postd is is in the user likedPosts array
    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts }
    })
      .populate({
        path: "user",
        select: "-password"
      })
      .populate({
        path: "comments.user",
        select: "-password"
      });

    res.status(200).json(likedPosts);
  } catch (err) {
    console.log(`Error in getLikedPosts in postController: ${err.message}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // get all ths post of the users that we are following
    const following = user.following;
    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password"
      })
      .populate({
        path: "comments.user",
        select: "-password"
      });

    res.status(200).json(feedPosts);
  } catch (err) {
    console.log(`Error in getFollowingPosts in postController: ${err.message}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password"
      })
      .populate({
        path: "comments.user",
        select: "-password"
      });

    res.status(200).json(posts);
  } catch (err) {
    console.log(`Error in getUserPosts in postController: ${err.message}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};
