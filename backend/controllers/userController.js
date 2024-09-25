import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.status(200).json(user);
  } catch (err) {
    console.log(`Error in getUserprofile in userController: ${err.message}`);
    res.status(500).json({
      error: err.message
    });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    // This is the id of the user that we will follow or unfollow
    const { id } = req.params;
    const userToModify = await User.findById(id);
    // we will get the loggedIn user or current user based on the id of the current user id we attached to the req body (request body)
    const currentUser = await User.findById(req.user._id);

    // we will not allow the current user to follow himself. so we will check if the id  of the user the current user wants to follow is the same as his own
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        error: "You can't follow/unfollow yourself"
      });
    }

    // we will check if the current user and the user we want to modify is found  or not
    if (!userToModify || !currentUser) {
      return res.status(400).json({
        error: "User not found"
      });
    }

    // we will check if the current user is already following that user he wants to follow or not
    // that is, we check if the id of the user the current user wants to follow is in his following list in the user table
    const isFollowing = currentUser.following.includes(id);

    // if the current user is already following that user, he will unfollow otherwise he will follow that user
    if (isFollowing) {
      // Unfollow the user
      // if the current user is already following, he will unfollow
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });

      // the user id of the user that was unfollowed will be removed from the currenUser's following list
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      res.status(200).json({
        message: "User unfollowed successfully"
      });
    } else {
      // Follow thw user
      // if the current user is not following that user, he will follow the user
      // the user will gain a follower
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      // now the user id that the current user is following will be added the to current user's list of followings
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      // we will send a notification to that user that the currentUser followed
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id
      });

      await newNotification.save();

      // TODO return the id of the user that we followed as a response
      res.status(200).json({
        message: "User followed successfully"
      });
    }
  } catch (err) {
    console.log(
      `Error in followUnfollowUser in userController: ${err.message}`
    );
    res.status(500).json({
      error: err.message
    });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    // we will exclude the current users from the suggested users. we don't want to suggest ourself and we want to exclude the users that we already follow
    const userId = req.user._id;
    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId }
        }
      },
      {
        $sample: { size: 10 }
      }
    ]);

    // we will exclude all those users that we are already following
    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );

    // we will get the suggested users
    const suggestedUsers = filteredUsers.slice(0, 4);

    // we will remove the passwords of the suggested users so that it will not be visisble in the client
    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (err) {
    console.log(`Error in getSuggestedUsers in userController: ${err.message}`);
    res.status(500).json({
      error: err.message
    });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  // curent user id
  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // check if the provide only one password abd leave the other one or if anyone is empty or both is empty
    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        error: "Please provide both current password and new password"
      });
    }

    // check if we have both password and update
    if (currentPassword && newPassword) {
      // check if the currentPassword match with the user password in the database
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          error: "Current password is incorrect"
        });
      }

      // check if the new password length is less than 6
      if (newPassword.length < 6) {
        return res.status(400).json({
          error: "Passowrd must be at least 6 characters long"
        });
      }

      // we will hash the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // check if profile image was provided
    // we will use cloudinary
    if (profileImg) {
      // if user already have a profileImg, we will delete it from cloudinary before we upload the new one
      if (user.profileImg) {
        // https://res.cloudinary.com/dyfqo1v6/image/upload/v2635386473536/tsrxgshstejsshsks.png
        // this is the id "tsrxgshstejsshsks" of the image that we want to get. we split it from "/", get the last one using pop() and slit it by "." and get the first

        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      // we will upload an image to our cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    // if cover image was provided, we wil update it
    if (coverImg) {
      // if there is already a cover image, we will destory it
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    // if user entered a fullName, we will use/update it otherwise we will use the same fullName that was in the database
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    // we will save it to the database
    user = await user.save();

    // we will remove the passowrd so that it will no be sent to the client
    user.password = null;

    return res.status(200).json(user);
  } catch (err) {
    console.log(`Error in updateUser in userController: ${err.message}`);
    res.status(500).json({
      error: err.message
    });
  }
};
