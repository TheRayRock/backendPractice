import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import req from "express/lib/request.js";

const generateAccessTokenAndgenerateRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError("Failed to generate tokens", 500);
  }
};
const registerUser = asyncHandler(async (req, res) => {
  // Registration logic here
  //   return res.status(200).json({
  //     success: true,
  //     message: "User registered successfully shahnawaz",
  //   });
  // get user details from request body
  // validate - not empty
  // check if user already exists: username or email
  // check for image for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token from response
  // check for user creation
  // return res

  const { username, email, fullname, password } = req.body;
  console.log(req.body);

  if (
    [username, email, fullname, password].some(
      (fields) => fields?.trim() === "",
    )
  ) {
    throw new ApiError("All fields are required", 400);
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError("User already exists", 400);
  }
  const avatarlocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let coverimagelocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverimagelocalpath = req.files.coverImage?.[0]?.path;
  }

  if (!avatarlocalPath) {
    throw new ApiError("Avatar image is required", 400);
  }

  const avatar = await uploadOnCloudinary(avatarlocalPath);
  // const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;
  if (!avatar) {
    throw new ApiError("Failed to upload avatar image", 500);
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError("something when wrong while creating user", 500);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  // Login logic here
  // re body -> data
  // username or email
  // find ther user
  // check for password
  // generate access token and refresh token
  // send cookies and response

  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError("Email or username is required", 400);
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError("invalid credentials", 401);
  }

  // const isPasswordCorrect = await user.isPasswordCorrect(password);
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError("invalid user credentials", 401);
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndgenerateRefreshToken(user._id);

  const loggedInUser = await User.findById(user.id).select(
    "-password -refreshToken",
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        "User logged in successfully",
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", cookieOptions)
    .cookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully", null));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError("Refresh token is required", 400);
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError("Invalid refresh token", 401);
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(
        "Invalid refresh token over please refresh again",
        401,
      );
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { newaccessToken, newrefreshToken } = await user.generateAccessToken(
      user._id,
    );

    return res
      .status(200)
      .cookie("accessToken", newaccessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(200, "Access token refreshed successfully", {
          accessToken: newaccessToken,
          refreshToken: newrefreshToken,
        }),
      );
  } catch (error) {
    throw new ApiError(
      "Unauthorized",
      401,
      error?.message || "Invalid refresh token",
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError("Old password is incorrect", 400);
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentuser = asyncHandler(async (req, res) => {
  const user = await User.find();

  if (!user) {
    return res.status(401).json({
      message: "User not authenticated",
    });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, fullname } = req.body;
  if (!email || !fullname) {
    throw new ApiError("All fields are required to update", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        email,
        fullname,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, " Acoount details update succesfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true },
  ).select("-password");

  return res.status(200).json(200, user, "update coverImage successfully");
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true },
  ).select("-password");

  return res.status(200).json(200, user, "update coverImage successfully");
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentuser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
};
