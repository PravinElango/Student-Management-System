
const Attendance = require("../models/Attendance");
const Student = require("../models/Students");
const Class = require("../models/Class");

// Normalize and validate attendance date
const normalizeDate = (date) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return null;
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    // Reject invalid calendar dates
    if (parsedDate.toISOString().slice(0, 10) !== date) {
        return null;
    }

    return parsedDate;
};


// Mark Attendance
const markAttendance = async (req, res) => {
    try {
        const { student, class: classId, date, status } = req.body;

        const existingClass = await Class.findById(classId);

        if (!existingClass) {
            return res.status(404).json({
                message: "Class not found!"
            });
        }

        const existingStudent = await Student.findById(student);

        if (!existingStudent) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }

        if (
            !existingStudent.class ||
            existingStudent.class.toString() !== classId
        ) {
            return res.status(400).json({
                message: "Student is not assigned to this class!"
            });
        }

        const attendanceDate = normalizeDate(date);

        if (!date || !attendanceDate) {
            return res.status(400).json({
                message: "Please provide a valid attendance date!"
            });
        }

        const attendance = await Attendance.create({
            student,
            class: classId,
            date: attendanceDate,
            status
        });

        res.status(201).json({
            message: "Attendance marked successfully!",
            attendance
        });

    } catch (error) {
        console.error("Attendance marking error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Attendance already marked for this student on this date!"
            });
        }

        res.status(400).json({
            message: "Failed to mark attendance!",
            error: error.message
        });
    }
};


// Fetch Attendance by Class and Date
const getAttendance = async (req, res) => {
    try {
        const { class: classId, date } = req.body;

        const existingClass = await Class.findById(classId);

        if (!existingClass) {
            return res.status(404).json({
                message: "Class not found!"
            });
        }

        const attendanceDate = normalizeDate(date);

        if (!date || !attendanceDate) {
            return res.status(400).json({
                message: "Please provide a valid attendance date!"
            });
        }

        const nextDate = new Date(attendanceDate);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);

        const attendance = await Attendance.find({
            class: classId,
            date: {
                $gte: attendanceDate,
                $lt: nextDate
            }
        })
            .populate("student", "name email")
            .populate("class", "name code")
            .sort({ createdAt: 1 });

        res.status(200).json({
            message: "Attendance fetched successfully!",
            totalRecords: attendance.length,
            attendance
        });

    } catch (error) {
        console.error("Attendance listing error:", error);

        res.status(500).json({
            message: "Failed to fetch attendance!",
            error: error.message
        });
    }
};


// Fetch Student Attendance History
const getStudentAttendanceHistory = async (req, res) => {
    try {
        const existingStudent = await Student.findById(
            req.params.studentId
        );

        if (!existingStudent) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }

        const attendance = await Attendance.find({
            student: existingStudent._id
        })
            .populate("class", "name code")
            .sort({ date: -1 });

        res.status(200).json({
            message: "Student attendance history fetched successfully!",
            totalRecords: attendance.length,
            attendance
        });

    } catch (error) {
        console.error("Student attendance history error:", error);

        res.status(500).json({
            message: "Failed to fetch student attendance history!",
            error: error.message
        });
    }
};


// Update Attendance
const updateAttendance = async (req, res) => {
    try {
        const { status, date } = req.body;

        const existingAttendance = await Attendance.findById(req.params.id);

        if (!existingAttendance) {
            return res.status(404).json({
                message: "Attendance record not found!"
            });
        }

        if (status !== undefined) {
            existingAttendance.status = status;
        }

        if (date !== undefined) {
            const attendanceDate = normalizeDate(date);

            if (!attendanceDate) {
                return res.status(400).json({
                    message: "Please provide a valid attendance date!"
                });
            }

            existingAttendance.date = attendanceDate;
        }

        await existingAttendance.save();

        res.status(200).json({
            message: "Attendance updated successfully!",
            attendance: existingAttendance
        });

    } catch (error) {
        console.error("Attendance update error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Attendance already exists for this student on this date!"
            });
        }

        res.status(400).json({
            message: "Failed to update attendance!",
            error: error.message
        });
    }
};


// Delete Attendance
const deleteAttendance = async (req, res) => {
    try {
        const existingAttendance = await Attendance.findById(req.params.id);

        if (!existingAttendance) {
            return res.status(404).json({
                message: "Attendance record not found!"
            });
        }

        await Attendance.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Attendance deleted successfully!"
        });

    } catch (error) {
        console.error("Attendance deletion error:", error);

        res.status(500).json({
            message: "Failed to delete attendance!",
            error: error.message
        });
    }
};


// Fetch Student Attendance Details with Statistics
const getStudentAttendanceDetails = async (req, res) => {
    try {
        const existingStudent = await Student.findById(
            req.params.studentId
        ).select("-profileImage.data");

        if (!existingStudent) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }

        // Fetch attendance history and calculate statistics together
        const [attendance, summaryResult] = await Promise.all([

            Attendance.find({
                student: existingStudent._id
            })
                .populate("class", "name code")
                .sort({ date: -1 }),

            // Attendance statistics using aggregation
            Attendance.aggregate([
                {
                    $match: {
                        student: existingStudent._id
                    }
                },
                {
                    $group: {
                        _id: null,

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
                {
                    $project: {
                        _id: 0,
                        totalDays: 1,
                        presentDays: 1,
                        absentDays: 1,
                        lateDays: 1,

                        attendancePercentage: {
                            $cond: [
                                { $eq: ["$totalDays", 0] },
                                0,
                                {
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
                            ]
                        }
                    }
                }
            ])
        ]);

        const summary = summaryResult[0] || {
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            attendancePercentage: 0
        };

        res.status(200).json({
            message: "Student attendance details fetched successfully!",
            student: existingStudent,
            summary,
            attendance
        });

    } catch (error) {
        console.error("Student attendance details error:", error);

        res.status(500).json({
            message: "Failed to fetch student attendance details!",
            error: error.message
        });
    }
};


module.exports = {
    markAttendance,
    getAttendance,
    getStudentAttendanceHistory,
    updateAttendance,
    deleteAttendance,
    getStudentAttendanceDetails
};
