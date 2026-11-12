
const express = require("express");
const router = express.Router();

const authmiddleware = require("../middlewares/authmiddleware");
const courseController = require("../controllers/courseController");

// Protect all course routes
router.use(authmiddleware);

// Create course
router.post("/create", courseController.createCourse);

// List courses
router.post("/list", courseController.getCourses);

// Get course details and enrolled students
router.post("/:courseId/details", courseController.getCourseDetails);

// Update course
router.post("/:courseId/update", courseController.updateCourse);

// Delete course
router.post("/:courseId/delete", courseController.deleteCourse);

// Add subject
router.post("/add-subject", courseController.addSubject);

// Remove subject
router.post("/remove-subject", courseController.removeSubject);

// Export courses to Excel
router.post("/export", courseController.exportCourses);

module.exports = router;
