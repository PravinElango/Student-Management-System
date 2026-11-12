
const express = require("express");
const router = express.Router();

const authmiddleware = require("../middlewares/authmiddleware");
const studentController = require("../controllers/studentController");

const upload = require("../config/upload");
const profileImage = require("../config/profileUpload");

// Protect all student routes
router.use(authmiddleware);

// Create student
router.post(
    "/create",
    profileImage.single("profileImage"),
    studentController.createStudent
);

// List all students
router.post("/list", studentController.getStudents);

// Get student details
router.post("/:studentId/details", studentController.getStudentDetails);

// Update student
router.post(
    "/:studentId/update",
    profileImage.single("profileImage"),
    studentController.updateStudent
);

// Delete student
router.post("/:studentId/delete", studentController.deleteStudent);

// Filter students by course
router.post("/:courseId/filter", studentController.filterStudentsByCourse);

// Export students to Excel
router.post("/export", studentController.exportStudents);

// Import students from Excel
router.post(
    "/import",
    upload.single("file"),
    studentController.importStudents
);

// Get student profile image
router.get("/:id/profile-image", studentController.getProfileImage);

// Generate student PDF
router.post("/:studentId/pdf", studentController.generateStudentPDF);

module.exports = router;
