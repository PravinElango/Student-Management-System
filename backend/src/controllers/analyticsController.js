
const Students = require("../models/Students");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");


// 1. Student Overview Analytics
const getStudentOverview = async (req, res) => {
    try {
        const overview = await Students.aggregate([
            {
                $group: {
                    _id: null,
                    totalStudents: { $sum: 1 },
                    averageAge: { $avg: "$age" },
                    youngestAge: { $min: "$age" },
                    oldestAge: { $max: "$age" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalStudents: 1,
                    averageAge: { $round: ["$averageAge", 2] },
                    youngestAge: 1,
                    oldestAge: 1
                }
            }
        ]);

        res.status(200).json({
            message: "Student overview fetched successfully!",
            overview: overview[0] || {
                totalStudents: 0,
                averageAge: 0,
                youngestAge: null,
                oldestAge: null
            }
        });

    } catch (error) {
        console.error("Overview API error:", error);

        res.status(500).json({
            message: "Failed to fetch student overview!",
            error: error.message
        });
    }
};


// 2. Course-wise Student Enrollment Analytics
const getCourseEnrollment = async (req, res) => {
    try {
        const enrollmentAnalytics = await Course.aggregate([
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "course",
                    as: "students"
                }
            },
            {
                $project: {
                    _id: 0,
                    courseId: "$_id",
                    courseName: "$name",
                    courseCode: "$code",
                    totalStudents: { $size: "$students" }
                }
            },
            {
                $sort: {
                    totalStudents: -1
                }
            }
        ]);

        res.status(200).json({
            message: "Course enrollment analytics fetched successfully!",
            totalCourses: enrollmentAnalytics.length,
            courses: enrollmentAnalytics
        });

    } catch (error) {
        console.error("Course enrollment analytics error:", error);

        res.status(500).json({
            message: "Failed to fetch course enrollment analytics!",
            error: error.message
        });
    }
};


// 3. Monthly Student Admissions Analytics
const getMonthlyAdmissions = async (req, res) => {
    try {
        const monthlyAdmissions = await Students.aggregate([
            {
                $match: {
                    admissionDate: {
                        $exists: true,
                        $ne: null
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$admissionDate"
                        }
                    },
                    totalAdmissions: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    totalAdmissions: 1
                }
            },
            {
                $sort: {
                    month: 1
                }
            }
        ]);

        res.status(200).json({
            message: "Monthly admissions analytics fetched successfully!",
            totalMonths: monthlyAdmissions.length,
            monthlyAdmissions
        });

    } catch (error) {
        console.error("Monthly admissions analytics error:", error);

        res.status(500).json({
            message: "Failed to fetch monthly admissions analytics!",
            error: error.message
        });
    }
};


// 4. Top-performing Attendance Students
const getTopAttendanceStudents = async (req, res) => {
    try {
        const limit = Number(req.body?.limit ?? 5);

        if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
            return res.status(400).json({
                message: "Limit must be an integer between 1 and 50!"
            });
        }

        const topStudents = await Attendance.aggregate([
            // Group attendance records by student
            {
                $group: {
                    _id: "$student",
                    totalDays: { $sum: 1 },

                    presentDays: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "Present"] },
                                1,
                                0
                            ]
                        }
                    },

                    absentDays: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "Absent"] },
                                1,
                                0
                            ]
                        }
                    },

                    lateDays: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "Late"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },

            // Calculate attendance percentage
            {
                $project: {
                    _id: 0,
                    studentId: "$_id",
                    totalDays: 1,
                    presentDays: 1,
                    absentDays: 1,
                    lateDays: 1,

                    attendancePercentage: {
                        $round: [
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            "$presentDays",
                                            "$totalDays"
                                        ]
                                    },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },

            // Sort by attendance percentage
            {
                $sort: {
                    attendancePercentage: -1,
                    totalDays: -1
                }
            },

            // Get only the requested number of students
            {
                $limit: limit
            },

            // Join student details
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "studentDetails"
                }
            },

            {
                $unwind: "$studentDetails"
            },

            // Format final response
            {
                $project: {
                    _id: 0,
                    studentId: 1,
                    name: "$studentDetails.name",
                    email: "$studentDetails.email",
                    totalDays: 1,
                    presentDays: 1,
                    absentDays: 1,
                    lateDays: 1,
                    attendancePercentage: 1
                }
            }
        ]);

        res.status(200).json({
            message: "Top attendance students fetched successfully!",
            totalStudents: topStudents.length,
            students: topStudents
        });

    } catch (error) {
        console.error("Top attendance analytics error:", error);

        res.status(500).json({
            message: "Failed to fetch top attendance students!",
            error: error.message
        });
    }
};


module.exports = {
    getStudentOverview,
    getCourseEnrollment,
    getMonthlyAdmissions,
    getTopAttendanceStudents
};
