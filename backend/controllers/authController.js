import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    console.log("Email " + email);
    console.log("reqBody " + req.body);

    // reqgular expression to check for valid email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format"
      });
    }

    // check if the username already exist
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        error: "Username is already taken"
      });
    }

    // check if the email already exist
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        error: "Email is already taken"
      });
    }

    // check if the password is less than 6 characters
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long"
      });
    }

    // we will hash the user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // we will create or insert the new user
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword
    });

    // if user was not inserted/created successfully
    if (!newUser) {
      res.status(400).json({
        error: "Invalid user data"
      });
    }

    // we will generate and set the cookie
    generateTokenAndSetCookie(newUser._id, res);

    // we will save the new created/inserted user
    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      followers: newUser.followers,
      following: newUser.following,
      profileImg: newUser.profileImg,
      coverImg: newUser.coverImg
    });
  } catch (err) {
    console.log(`sign up error in signup controller : ${err.message}`);
    res.status(500).json({
      error: "Internal Server Error"
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    // find the username in our database in user table
    const user = await User.findOne({ username });
    // check if the password is correct. if user is undefined, it will compare it with an empty string
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect) {
      return res.status(400).json({
        error: "Invalid username or password"
      });
    }

    // we will generate token and set the cookie
    generateTokenAndSetCookie(user._id, res);

    // we will send the response to the client
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg
    });
  } catch (err) {
    console.log(`login up error : ${err.message}`);
    res.status(500).json({
      error: "Internal Server Error"
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0
    });
    res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (err) {
    console.log(`logout up error : ${err.message}`);
    res.status(500).json({
      error: "Internal Server Error"
    });
  }
};

// THIS IS FOR THE LOGGED IN USER
export const getMe = async (req, res) => {
  try {
    // the user._id is from the logged in user data that we attcahed to the request bosy (req.body) in the portectRoute.js middleware
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    console.log(`Error in getMe in authController error : ${err.message}`);
    res.status(500).json({
      error: "Internal Server Error"
    });
  }
};
