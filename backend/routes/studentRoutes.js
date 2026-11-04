
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Students = require("../models/Students");
const Course = require("../models/Course");
const XLSX = require("xlsx");

console.log("Student routes file loaded!");
router.use(authMiddleware);
// To create student
router.post("/create", async (req, res) => {
    try {
        const course = await Course.findById(req.body.course);

        if (!course) {
            return res.status(404).json({
                message: "Course not found!"
            });
        }

        const student = await Students.create(req.body);

        res.status(201).json({
            message: "Student created successfully!",
            data: student
        });

    } catch (error) {
        res.status(400).json({
            message: "Failed to create Student!",
            error: error.message
        });
    }
});


// to list all students
router.post("/list", async (req, res) => {
    try {
        const students = await Students.find()
            .populate("course", "name code");

        res.status(200).json({
            message: "Students data fetched successfully!",
            data: students
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch students!",
            error: error.message
        });
    }
});


// to show student details
router.post("/:studentId/details", async (req, res) => {
    try {
        const student = await Students.findById(req.params.studentId)
            .populate("course", "name code");

        if (!student) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }

        res.status(200).json({
            message: "Student details fetched successfully!",
            data: student
        });

    } catch (error) {
        res.status(400).json({
            message: "Failed to fetch student details!",
            error: error.message
        });
    }
});


// to update existing student
router.post("/:studentId/update", async (req, res) => {
    try {
        const student = await Students.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }

        if (req.body.name !== undefined) {
            student.name = req.body.name;
        }

        if (req.body.email !== undefined) {
            student.email = req.body.email;
        }

        if (req.body.age !== undefined) {
            student.age = req.body.age;
        }

        if (req.body.course !== undefined) {
            const course = await Course.findById(req.body.course);

            if (!course) {
                return res.status(404).json({
                    message: "Course not found!"
                });
            }

            student.course = req.body.course;
        }

        await student.save();

        res.status(200).json({
            message: "Student updated successfully!",
            data: student
        });

    } catch (error) {
        res.status(400).json({
            message: "Failed to update student!",
            error: error.message
        });
    }
});


// to delete a student
router.post("/:studentId/delete", async (req, res) => {
    try {
        const student = await Students.findByIdAndDelete(
            req.params.studentId
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }

        res.status(200).json({
            message: "Student deleted successfully!"
        });

    } catch (error) {
        res.status(400).json({
            message: "Failed to delete student!",
            error: error.message
        });
    }
});


// to filter students based on course
router.post("/:courseId/filter", async (req, res) => {
    try {
        const { courseId } = req.params;

        // Check whether courseId is provided
        if (!courseId) {
            return res.status(400).json({
                message: "Course ID is required!"
            });
        }

        const students = await Students.find({ course: courseId })
            .populate("course", "name code");

        return res.status(200).json({
            message: "Students filtered successfully!",
            totalStudents: students.length,
            data: students
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error filtering students!",
            error: error.message
        });
    }
});

// To export students to Excel
router.post("/export", async (req, res) => {
    try {
        const students = await Students.find().populate("course");

        
        const StudentData = students.map(student => ({
            'Name': student.name,
            'Email': student.email,
            'Age': student.age,
            'Adult Status': student.isAdult ? 'Adult' : 'Minor',
            'Course': student.course ? student.course.name : 'Not Assigned'
        }));

        const worksheet = XLSX.utils.json_to_sheet(StudentData);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "buffer"
        });

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="students.xlsx"'
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        return res.send(excelBuffer);

    } catch (error) {
        return res.status(500).json({
            message: "Failed to export students!",
            error: error.message
        });
    }
});

module.exports = router;
