
const express = require("express");
const router = express.Router();

const authmiddleware = require("../middlewares/authmiddleware");
const analyticsController = require("../controllers/analyticsController");

// Protect all analytics routes
router.use(authmiddleware);

// Student overview
router.post("/overview", analyticsController.getStudentOverview);

// Course enrollment
router.post("/course-enrollment", analyticsController.getCourseEnrollment);

// Monthly admissions
router.post("/monthly-admissions", analyticsController.getMonthlyAdmissions);

// Top attendance students
router.post("/top-attendance", analyticsController.getTopAttendanceStudents);

module.exports = router;
