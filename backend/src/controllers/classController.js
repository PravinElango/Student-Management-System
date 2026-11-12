
const Student = require("../models/Students");
const Class = require("../models/Class");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");

// Create class
const createClass = async (req, res) => {
    try {
        const {
            name,
            code,
            course,
            capacity,
            startDate,
            endDate,
            startTime,
            endTime,
            status
        } = req.body;

        // Verify whether the course exists
        const existingCourse = await Course.findById(course);

        if (!existingCourse) {
            return res.status(404).json({
                message: "Selected course not found!"
            });
        }

        const newClass = await Class.create({
            name,
            code,
            course,
            capacity,
            startDate,
            endDate,
            startTime,
            endTime,
            status
        });

        res.status(201).json({
            message: "Class created successfully!",
            class: newClass
        });

    } catch (error) {
        console.error("Class creation error:", error);

        res.status(400).json({
            message: "Failed to create class!",
            error: error.message
        });
    }
};


// List all classes
const getClasses = async (req, res) => {
    try {
        const classes = await Class.find()
            .populate("course", "name code")
            .sort({ createdAt: -1 })
            .lean();

        const classesWithCounts = await Promise.all(
            classes.map(async (classItem) => ({
                ...classItem,
                totalStudents: await Student.countDocuments({
                    class: classItem._id
                })
            }))
        );

        res.status(200).json({
            message: "Classes fetched successfully!",
            totalClasses: classesWithCounts.length,
            classes: classesWithCounts
        });

    } catch (error) {
        console.error("Class listing error:", error);

        res.status(500).json({
            message: "Failed to fetch classes!",
            error: error.message
        });
    }
};


// Get class details
const getClassDetails = async (req, res) => {
    try {
        const classId = req.params.id;

        if (!mongoose.isValidObjectId(classId)) {
            return res.status(400).json({
                message: "Invalid class ID!"
            });
        }

        const classDetails = await Class.findById(classId)
            .populate("course", "name code")
            .lean();

        if (!classDetails) {
            return res.status(404).json({
                message: "Class not found!"
            });
        }

        const students = await Student.find({ class: classId })
            .select("name email age status admissionDate")
            .sort({ name: 1 })
            .lean();

        res.status(200).json({
            message: "Class details fetched successfully!",
            class: {
                ...classDetails,
                totalStudents: students.length,
                availableSeats: Math.max(
                    classDetails.capacity - students.length,
                    0
                )
            },
            students
        });

    } catch (error) {
        console.error("Class details error:", error);

        res.status(500).json({
            message: "Failed to fetch class details!",
            error: error.message
        });
    }
};


// Update class
const updateClass = async (req, res) => {
    try {
        const {
            name,
            code,
            course,
            capacity,
            startDate,
            endDate,
            startTime,
            endTime,
            status
        } = req.body;

        const existingClass = await Class.findById(req.params.id);

        if (!existingClass) {
            return res.status(404).json({
                message: "Class not found!"
            });
        }

        // Validate the selected course
        if (course) {
            const existingCourse = await Course.findById(course);

            if (!existingCourse) {
                return res.status(404).json({
                    message: "Selected course not found!"
                });
            }
        }

        // Check current enrollment before changing capacity
        if (capacity !== undefined) {
            const totalStudents = await Student.countDocuments({
                class: existingClass._id
            });

            if (capacity < totalStudents) {
                return res.status(400).json({
                    message: `Capacity cannot be less than enrolled students (${totalStudents})!`
                });
            }
        }

        // Update only the fields supplied by the admin
        const updates = {
            name,
            code,
            course,
            capacity,
            startDate,
            endDate,
            startTime,
            endTime,
            status
        };

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                existingClass[key] = value;
            }
        });

        await existingClass.save();

        res.status(200).json({
            message: "Class updated successfully!",
            class: existingClass
        });

    } catch (error) {
        console.error("Class update error:", error);

        res.status(400).json({
            message: "Failed to update class!",
            error: error.message
        });
    }
};


// Delete class
const deleteClass = async (req, res) => {
    try {
        const existingClass = await Class.findById(req.params.id);

        if (!existingClass) {
            return res.status(404).json({
                message: "Class not found!"
            });
        }

        // Check whether students are assigned to this class
        const totalStudents = await Student.countDocuments({
            class: existingClass._id
        });

        if (totalStudents > 0) {
            return res.status(409).json({
                message: "Cannot delete this class because students are assigned to it!",
                totalStudents
            });
        }

        // Check whether attendance records exist
        const totalAttendance = await Attendance.countDocuments({
            class: existingClass._id
        });

        if (totalAttendance > 0) {
            return res.status(409).json({
                message: "Cannot delete this class because attendance records exist!",
                totalAttendance
            });
        }

        await Class.findByIdAndDelete(existingClass._id);

        res.status(200).json({
            message: "Class deleted successfully!"
        });

    } catch (error) {
        console.error("Class deletion error:", error);

        res.status(500).json({
            message: "Failed to delete class!",
            error: error.message
        });
    }
};


// Export controller functions
module.exports = {
    createClass,
    getClasses,
    getClassDetails,
    updateClass,
    deleteClass
};
