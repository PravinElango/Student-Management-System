
const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Class name is required!"],
        trim: true,
        minlength: [2, "Class name must contain at least 2 characters!"],
        maxlength: [100, "Class name cannot exceed 100 characters!"],
        uppercase: true
    },

    code: {
        type: String,
        required: [true, "Class code is required!"],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [3, "Class code must contain at least 3 characters!"],
        maxlength: [20, "Class code cannot exceed 20 characters!"],
        match: [
            /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/,
            "Invalid class code!"
        ]
    },

    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course reference is required!"]
    },

    capacity: {
        type: Number,
        default: 25,
        min: [1, "Class capacity must be at least 1!"],
        validate: {
            validator: Number.isInteger,
            message: "Class capacity must be a whole number!"
        }
    },

    startDate: {
        type: Date,
        required: [true, "Class start date is required!"]
    },

    endDate: {
        type: Date,
        required: [true, "Class end date is required!"],
        validate: {
            validator: function (value) {
                return !this.startDate || value > this.startDate;
            },
            message: "Class end date must be later than start date!"
        }
    },

    startTime: {
        type: String,
        required: [true, "Class start time is required!"],
        match: [
            /^([01]\d|2[0-3]):[0-5]\d$/,
            "Start time must be in HH:mm format!"
        ]
    },

    endTime: {
        type: String,
        required: [true, "Class end time is required!"],
        match: [
            /^([01]\d|2[0-3]):[0-5]\d$/,
            "End time must be in HH:mm format!"
        ],
        validate: {
            validator: function (value) {
                return value > this.startTime;
            },
            message: "Class end time must be later than start time!"
        }
    },

    status: {
        type: String,
        required: true,
        enum: {
            values: ["Active", "Inactive"],
            message: "Class status must be Active or Inactive!"
        },
        default: "Active"
    }

}, { timestamps: true });

module.exports = mongoose.model("Class", classSchema);
