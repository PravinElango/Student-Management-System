//data validation for POST request using mongoose
const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required!"],
        trim: true,
        minlength: [2, "Name must contains more than 2 characters!"],
        maxlength: [20, "Name must contain less than 20 characters!"],
        match: [
            /^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/, "Name contains invalid characters!"
        ]
    },
    email: {
        type: String,
        required: [true, "Email is required!"],
        unique: [true, "Email already in use"],
        trim: true,
        lowercase: true,
        maxlength: [254, "email length is too long"],
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email!"
        ]
    },
    age: {
        type: Number,
        required: true,
        min: [5, "Age must be at least 5"],
        max: [100, "Age cannot exceed 100"],
        validate: {
            validator: Number.isInteger,
            message: "Age must be whole number!"
        }
    },
    isAdult: {
        type: Boolean,
        default: false
    },
    studentCategory: {
        type: String
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    profileImage: {
        data: Buffer,
        contentType: String
    }
});

studentSchema.pre("validate", function () {
    if (this.age !== undefined && this.age !== null) {
        this.isAdult = this.age >= 18;

        if (this.age <= 12) {
            this.studentCategory = "Child";
        }
        else if (this.age <= 17) {
            this.studentCategory = "Teenager";
        }
        else if (this.age <= 24) {
            this.studentCategory = "Young Adult";
        }
        else if (this.age <= 30) {
            this.studentCategory = "Adult";
        }
        else {
            this.studentCategory = "Senior"
        }
    }
})

module.exports = mongoose.model("Student", studentSchema);