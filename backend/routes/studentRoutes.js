
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Students = require("../models/Students");
const Course = require("../models/Course");
const XLSX = require("xlsx");
const upload = require("../config/upload");
const profileImage = require("../config/profileUpload");
const PDFDocument = require("pdfkit");
const sendEmail = require("../utils/sendEmail");

console.log("Student routes file loaded!");
router.use(authMiddleware);
const Class = require("../models/Class");

// To create student
router.post("/create", profileImage.single("profileImage"), async (req, res) => {
    try {
        const course = await Course.findById(req.body.course);

        if (!course) {
            return res.status(404).json({
                message: "Course not found!"
            });
        }

        let assignedClass = null;

        // Check whether admin manually selected a class
        if (req.body.class) {
            assignedClass = await Class.findOne({
                _id: req.body.class,
                course: course._id,
                status: "Active"
            });

            if (!assignedClass) {
                return res.status(400).json({
                    message: "Selected class is invalid or inactive!"
                });
            }

            const enrolledStudents = await Students.countDocuments({
                class: assignedClass._id
            });

            if (enrolledStudents >= assignedClass.capacity) {
                return res.status(400).json({
                    message: "Selected class has reached its capacity!"
                });
            }
        } else {
            // Find active classes belonging to the selected course
            const availableClasses = await Class.find({
                course: course._id,
                status: "Active"
            }).sort({ startDate: 1, _id: 1 });

            // Find the first class with available seats
            for (const currentClass of availableClasses) {
                const enrolledStudents = await Students.countDocuments({
                    class: currentClass._id
                });

                if (enrolledStudents < currentClass.capacity) {
                    assignedClass = currentClass;
                    break;
                }
            }
        }

        // Prepare student data
        const studentData = {
            ...req.body,
            course: course._id,
            class: assignedClass ? assignedClass._id : undefined
        };

        // Attach uploaded profile image
        if (req.file) {
            studentData.profileImage = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        const student = await Students.create(studentData);

        // Send registration email
        let emailSent = false;

        try {
            await sendEmail(
                student.email,
                "Student Registration Successful",
                `
                    <h2>Welcome, ${student.name}!</h2>
                    <p>Your student registration has been completed successfully.</p>
                    <p><strong>Course:</strong> ${course.name}</p>
                    <p><strong>Class:</strong> ${assignedClass ? assignedClass.name : "Not Assigned"}</p>
                    <p>Thank you for registering with us!</p>
                `
            );

            emailSent = true;

        } catch (emailError) {
            console.error("Registration email failed:", emailError);
        }

        return res.status(201).json({
            message: "Student created successfully!",
            emailSent,
            assignedClass: assignedClass ? assignedClass.name : null,
            data: student
        });

    } catch (error) {
        return res.status(400).json({
            message: "Failed to create Student!",
            error: error.message
        });
    }
});



// to list all students
router.post("/list", async (req, res) => {
    try {
        const students = await Students.find()
            .populate("course", "name code")
            .populate("class", "name code capacity");

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
            .populate("course", "name code")
            .populate("class", "name code capacity");

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
router.post("/:studentId/update", profileImage.single("profileImage"), async (req, res) => {
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);
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
        if (req.body.removeProfileImage === "true") {
            student.profileImage = undefined;
        }
        else if (req.file) {
            student.profileImage = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
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


router.post("/import", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                message: "Please upload an Excel file!"
            });
        }

        const workbook = XLSX.read(file.buffer, {
            type: "buffer"
        });

        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
            return res.status(400).json({
                message: "Excel file contains no worksheets!"
            });
        }

        const worksheet = workbook.Sheets[sheetName];
        const students = XLSX.utils.sheet_to_json(worksheet);

        const requiredColumns = ["Name", "Email", "Age", "Course"];
        const columns = Object.keys(students[0] || {});

        const missingColumns = requiredColumns.filter(
            column => !columns.includes(column)
        );

        if (missingColumns.length > 0) {
            return res.status(400).json({
                message: "Excel file is missing required columns!",
                missingColumns
            });
        }

        const importedRecords = [];
        const invalidRecords = [];

        let emailSentCount = 0;
        let emailFailedCount = 0;

        for (let i = 0; i < students.length; i++) {
            const student = students[i];

            try {
                const courseName = student.Course.trim().toUpperCase();

                const course = await Course.findOne({
                    name: courseName
                });

                if (!course) {
                    invalidRecords.push({
                        row: i + 2,
                        name: student.Name,
                        reason: `Course '${courseName}' not found`
                    });
                    continue;
                }

                // Find active classes for this course
                const availableClasses = await Class.find({
                    course: course._id,
                    status: "Active"
                }).sort({ startDate: 1, _id: 1 });

                let assignedClass = null;

                // Find the first class with available capacity
                for (const currentClass of availableClasses) {
                    const enrolledStudents = await Students.countDocuments({
                        class: currentClass._id
                    });

                    if (enrolledStudents < currentClass.capacity) {
                        assignedClass = currentClass;
                        break;
                    }
                }

                // Create student with automatic class assignment
                const newStudent = await Students.create({
                    name: student.Name,
                    email: student.Email,
                    age: student.Age,
                    course: course._id,
                    class: assignedClass ? assignedClass._id : undefined
                });

                // Send registration email
                try {
                    await sendEmail(
                        newStudent.email,
                        "Student Registration Successful",
                        `
                            <h2>Welcome, ${newStudent.name}!</h2>
                            <p>Your student registration has been completed successfully.</p>
                            <p><strong>Course:</strong> ${course.name}</p>
                            <p><strong>Class:</strong> ${assignedClass ? assignedClass.name : "Not Assigned"}</p>
                            <p>Thank you for registering with us!</p>
                        `
                    );

                    emailSentCount++;

                } catch (emailError) {
                    emailFailedCount++;

                    console.error(
                        `Email failed for ${newStudent.email}:`,
                        emailError.message
                    );
                }

                importedRecords.push({
                    row: i + 2,
                    name: newStudent.name,
                    email: newStudent.email,
                    course: course.name,
                    class: assignedClass ? assignedClass.name : null,
                    status: "Imported"
                });

            } catch (error) {
                invalidRecords.push({
                    row: i + 2,
                    name: student.Name,
                    reason: error.message
                });
            }
        }

        return res.status(200).json({
            message: "Excel import completed!",
            totalRecords: students.length,
            importedCount: importedRecords.length,
            failedCount: invalidRecords.length,
            emailSentCount,
            emailFailedCount,
            importedRecords,
            invalidRecords
        });

    } catch (error) {
        return res.status(500).json({
            message: "Excel file processing failed!",
            error: error.message
        });
    }
});


router.get("/:id/profile-image", async (req, res) => {
    try {
        const student = await Students.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }
        if (!student.profileImage || !student.profileImage.data) {
            return res.status(404).json({
                message: "Profile image not found!"
            });
        }
        res.set("Content-Type", student.profileImage.contentType);
        res.send(student.profileImage.data);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve profile image!",
            error: error.message
        });
    }
});

router.post("/:studentId/pdf", async (req, res) => {
    try {
        const student = await Students.findById(req.params.studentId)
            .populate("course", "name code");

        if (!student) {
            return res.status(404).json({
                message: "Student not found!"
            });
        }

        if (!student.course) {
            return res.status(404).json({
                message: "Student course not found!"
            });
        }

        const studentPdf = new PDFDocument();

        res.set("Content-Type", "application/pdf");
        res.set(
            "Content-Disposition",
            'attachment; filename="student-profile.pdf"'
        );

        studentPdf.pipe(res);

        studentPdf
            .font("Helvetica-Bold")
            .fontSize(28)
            .fillColor("#000000")
            .text("Student Profile", {
                align: "center"
            });

        const imageX = 50;
        const imageY = 140;
        const imageSize = 120;
        const centerX = imageX + imageSize / 2;
        const centerY = imageY + imageSize / 2;
        const radius = imageSize / 2;

        if (student.profileImage?.data) {
            studentPdf.save();

            studentPdf
                .circle(centerX, centerY, radius)
                .clip();

            studentPdf.image(
                student.profileImage.data,
                imageX,
                imageY,
                {
                    cover: [imageSize, imageSize]
                }
            );

            studentPdf.restore();

        } else {
            studentPdf
                .circle(centerX, centerY, radius)
                .fill("#e9ecef");

            studentPdf
                .circle(centerX, centerY - 18, 18)
                .fill("#6c757d");
            studentPdf
                .ellipse(centerX, centerY + 35, 38, 25)
                .fill("#6c757d");
        }
        studentPdf.fillColor("#000000");
        const detailsX = 210;
        let detailsY = 145;

        studentPdf
            .font("Helvetica")
            .fontSize(17);

        studentPdf.text(`Name: ${student.name}`, detailsX, detailsY);
        detailsY += 35;

        studentPdf.text(`Email: ${student.email}`, detailsX, detailsY);
        detailsY += 35;

        studentPdf.text(`Age: ${student.age}`, detailsX, detailsY);
        detailsY += 35;

        studentPdf.text(`Course: ${student.course.name}`, detailsX, detailsY);
        detailsY += 35;

        studentPdf.text(`Course Code: ${student.course.code}`, detailsX, detailsY);
        studentPdf.end();

    } catch (error) {
        console.error("PDF generation failed:", error);

        res.status(500).json({
            message: "Failed to generate student PDF!",
            error: error.message
        });
    }
});

module.exports = router;
