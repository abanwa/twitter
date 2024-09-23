import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({
        error: "Unauthorized: No Token Provided"
      });
    }

    // if we have a token, we will decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({
        error: "Unauthorized: Invalid Token"
      });
    }

    console.log("Decoded token ", decoded);
    // the userId is the payload (userId) we used when creating the token and we do not want to select the user's password, so we minus it
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    // we will attach the logged in user to the request body
    req.user = user;
    next();
  } catch (err) {
    console.log("Error in protectRoute middleware", err.message);
    return res.status(500).json({
      error: "Internal Server Error"
    });
  }
};
