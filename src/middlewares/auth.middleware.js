import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // get token from header
  // verify token
  // attach user to req object
  // call next()

  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "") ||
      null;
    if (!token) {
      throw new ApiError("Unauthorized", 401);
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken",
    );
    if (!user) {
      throw new ApiError("Invalid Access Token", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      "Unauthorized",
      401,
      error?.message || "Invalid Access Token",
    );
  }
});
