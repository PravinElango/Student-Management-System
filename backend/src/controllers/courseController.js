
const Course = require("../models/Course");
const Students = require("../models/Students");
const XLSX = require("xlsx");


// To create course
const createCourse = async (req, res) => {
    try {
        const course = await Course.create(req.body);

        res.status(201).json({
            message: "Course created successfully!",
            data: course
        });

    } catch (error) {
        res.status(error.code === 11000 ? 409 : 400).json({
            message: error.code === 11000
                ? "Course code already exists!"
                : "Failed to create course!",
            error: error.message
        });
    }
};


// To list the courses
const getCourses = async (req, res) => {
    try {
        const courses = await Course.find();

        res.status(200).json({
            message: "Courses fetched successfully!",
            data: courses
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch courses!",
            error: error.message
        });
    }
};


// Details of course with enrolled students
const getCourseDetails = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found!"
            });
        }

        const students = await Students.find({
            course: course._id
        });

        res.status(200).json({
            message: "Course fetched successfully!",
            data: {
                course: course,
                students: students,
                totalStudents: students.length
            }
        });

    } catch (error) {
        res.status(400).json({
            message: "Failed to fetch course!",
            error: error.message
        });
    }
};


// To update a course
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found!"
            });
        }

        if (req.body.name !== undefined) {
            course.name = req.body.name;
        }

        if (req.body.code !== undefined) {
            course.code = req.body.code;
        }

        if (req.body.subjects !== undefined) {
            course.subjects = req.body.subjects;
        }
        if (req.body.duration !== undefined) {
            course.duration = req.body.duration;
        }

        if (req.body.durationUnit !== undefined) {
            course.durationUnit = req.body.durationUnit;
        }
        await course.save();

        res.status(200).json({
            message: "Course updated successfully!",
            data: course
        });

    } catch (error) {
        res.status(error.code === 11000 ? 409 : 400).json({
            message: "Failed to update course!",
            error: error.message
        });
    }
};


// To delete a course
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found!"
            });
        }

        // Prevent deleting a course that has enrolled students
        const enrolledStudents = await Students.exists({
            course: course._id
        });

        if (enrolledStudents) {
            return res.status(409).json({
                message: "Cannot delete this course because students are enrolled in it!"
            });
        }

        await Course.findByIdAndDelete(course._id);

        res.status(200).json({
            message: "Course deleted successfully!"
        });

    } catch (error) {
        res.status(400).json({
            message: "Failed to delete course!",
            error: error.message
        });
    }
};


// To add a subject to a course
const addSubject = async (req, res) => {
    try {
        const { courseId, subject } = req.body;

        // Check whether course exists
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found!"
            });
        }

        // Check whether subject already exists
        const subjectExists = course.subjects.some(
            item => item.toLowerCase() === subject.trim().toLowerCase()
        );

        if (subjectExists) {
            return res.status(409).json({
                message: "Subject already exists in this course!"
            });
        }

        // Add subject
        course.subjects.addToSet(subject.trim());

        await course.save();

        res.status(200).json({
            message: "Subject added successfully!",
            data: course
        });

    } catch (error) {
        res.status(400).json({
            message: "Failed to add subject!",
            error: error.message
        });
    }
};


// To remove a subject from a course
const removeSubject = async (req, res) => {
    try {
        const { courseId, subject } = req.body;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found!"
            });
        }

        const subjectIndex = course.subjects.findIndex(
            item => item.toLowerCase() === subject.trim().toLowerCase()
        );

        if (subjectIndex === -1) {
            return res.status(404).json({
                message: "Subject not found in this course!"
            });
        }

        course.subjects.splice(subjectIndex, 1);

        await course.save();

        res.status(200).json({
            message: "Subject removed successfully!",
            data: course
        });

    } catch (error) {
        res.status(400).json({
            message: "Failed to remove subject!",
            error: error.message
        });
    }
};


// To export courses to Excel
const exportCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        const students = await Students.find();

        const CourseData = courses.map(course => ({
            "Name": course.name,
            "Code": course.code,
            "Subjects": course.subjects.join(", "),
            "Enrolled Students": students.filter(
                student => student.course.toString() === course._id.toString()
            ).length
        }));

        const worksheet = XLSX.utils.json_to_sheet(CourseData);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "buffer"
        });

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="courses.xlsx"'
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        return res.send(excelBuffer);

    } catch (error) {
        return res.status(500).json({
            message: "Failed to export file!",
            error: error.message
        });
    }
};


// Export controller functions
module.exports = {
    createCourse,
    getCourses,
    getCourseDetails,
    updateCourse,
    deleteCourse,
    addSubject,
    removeSubject,
    exportCourses
};
