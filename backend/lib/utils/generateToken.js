import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
  // we will set a cookie and send it back to client
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d"
  });

  // we will send it as a cookie
  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // Milliseconds
    httpOnly: true, // prevents XSS attacks which is cross-scripting attack
    sameSite: "strict", // CSRF attacks cross-script request forgery attacks
    secure: process.env.MODE_ENV !== "development"
  });
};
