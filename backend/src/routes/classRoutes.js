
const express = require("express");
const router = express.Router();

const authmiddleware = require("../middlewares/authmiddleware");
const classController = require("../controllers/classController");

// Protect all class routes
router.use(authmiddleware);

// Create class
router.post("/create", classController.createClass);

// List all classes
router.post("/list", classController.getClasses);

// Get class details
router.post("/:id/details", classController.getClassDetails);

// Update class
router.post("/:id/update", classController.updateClass);

// Delete class
router.post("/:id/delete", classController.deleteClass);

module.exports = router;
