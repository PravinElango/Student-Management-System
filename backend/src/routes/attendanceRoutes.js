
const express = require("express");
const router = express.Router();

const authmiddleware = require("../middlewares/authmiddleware");
const attendanceController = require("../controllers/attendanceController");

// Protect all attendance routes
router.use(authmiddleware);

// Mark attendance
router.post("/mark", attendanceController.markAttendance);

// Fetch attendance by class and date
router.post("/list", attendanceController.getAttendance);

// Fetch student attendance history
router.post(
    "/student/:studentId/history",
    attendanceController.getStudentAttendanceHistory
);

// Update attendance
router.post("/:id/update", attendanceController.updateAttendance);

// Delete attendance
router.post("/:id/delete", attendanceController.deleteAttendance);

// Fetch student attendance details with statistics
router.post(
    "/:studentId/details",
    attendanceController.getStudentAttendanceDetails
);

module.exports = router;
