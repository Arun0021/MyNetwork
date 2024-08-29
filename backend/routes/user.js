const express = require("express");
const {
  register,
  login,
  logout,
  followUser,
  updateProfile,
  updatePassword,
  resetPassword,
  forgotPassword,
  getAllUsers,
  getUserProfile,
  getUserPosts,
  getMyPosts,
  deleteProfile,
  myProfile,
} = require("../controllers/user"); // Importing the register function
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

// Defining the route
router.route("/register").post(register);

router.route("/login").post(login);

router.route("/logout").get(logout);

router.route("/follow/:id").get(isAuthenticated, followUser);

router.route("/update/password").put(isAuthenticated, updatePassword);

router.route("/update/profile").put(isAuthenticated, updateProfile);

router.route("/delete/me").delete(isAuthenticated, deleteProfile);
router.route("/me").get(isAuthenticated, myProfile);

router.route("/my/posts").get(isAuthenticated, getMyPosts);

router.route("/userposts/:id").get(isAuthenticated, getUserPosts);

router.route("/user/:id").get(isAuthenticated, getUserProfile);

router.route("/users").get(isAuthenticated, getAllUsers);

router.route("/forgot/password").post(forgotPassword);

router.route("/password/reset/:token").put(resetPassword);

module.exports = router;
