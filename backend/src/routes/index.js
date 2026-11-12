
const express = require("express");

const router = express.Router();

const studentRoutes = require("./studentRoutes");
const authRoutes = require("./authRoutes");
const courseRoutes = require("./courseRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const classRoutes = require("./classRoutes");
const attendanceRoutes = require("./attendanceRoutes");

router.use("/students", studentRoutes);
router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/classes", classRoutes);
router.use("/attendance", attendanceRoutes);

module.exports = router;
