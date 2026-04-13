import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  getCurrentuser,
  changeCurrentPassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getuserChanelProfil,
  getWatchHistory,
} from "../controller/user.controller.js";
import multer from "multer";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },

    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentuser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/coverImg")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(verifyJWT, getuserChanelProfil);
router.route("history").get(verifyJWT, getWatchHistory);

export default router;
