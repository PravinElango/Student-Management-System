
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: [true, "Student reference is required!"]
    },

    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: [true, "Class reference is required!"]
    },

    date: {
        type: Date,
        required: [true, "Attendance date is required!"]
    },

    status: {
        type: String,
        required: [true, "Attendance status is required!"],
        enum: {
            values: ["Present", "Absent", "Late"],
            message: "Attendance status must be Present, Absent, or Late!"
        }
    }

}, { timestamps: true });

//to prevent duplicate attendancing for same student 
//implementing indexing
attendanceSchema.index(
    { student: 1, class: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
