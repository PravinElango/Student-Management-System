
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Signup
router.post("/signup", authController.signup);

// Login
router.post("/login", authController.login);
    

// Refresh Access Token
router.post("/refresh", authController.refresh);

module.exports = router;
