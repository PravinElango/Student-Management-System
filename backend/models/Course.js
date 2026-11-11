
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Course name is required!"],
        trim: true,
        minlength: [2, "Course name must contain at least 2 characters!"],
        maxlength: [100, "Course name cannot exceed 100 characters!"],
        uppercase: true
    },
    code: {
        type: String,
        required: [true, "Course code is required!"],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [3, "Course code must contain at least 3 characters!"],
        maxlength: [15, "Course code cannot exceed 15 characters!"],
        match: [
            /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/,
            "Invalid course code!"
        ]
    },
    subjects: {
        type: [String],
        default: []
    },
    duration: {
        type: Number,
        required: [true, "Course duration is required!"],
        min: [1, "Course duration must be at least 1!"],
        validate: {
            validator: Number.isInteger,
            message: "Course duration must be a whole number!"
        }
    },
    durationUnit: {
        type: String,
        required: true,
        enum: ["Days", "Weeks", "Months", "Years"],
        default: "Months"
    }
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
