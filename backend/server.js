import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import connectMongoDB from "./db/connectMongoDB.js";

// This will allow us to read the .env variables
dotenv.config();

// we will configure our cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 5000;

// data submited will be attached to the express request as req.body. This is when we submit a json data
app.use(express.json());

// This will be parse data and add it to the request as req.body when we submit a form urlencoded data
app.use(express.urlencoded({ extended: true }));

// This will help us to access the token cookie (jwt)
app.use(cookieParser());

// database username:abanwachinaza
// database password:Xgo8qCvmPfot8GjS

// AUTHENTICATION ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectMongoDB();
});
