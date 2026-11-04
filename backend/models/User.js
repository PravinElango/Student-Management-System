const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:true,
        required:true,
        minlength:[3,"username should be more than 4 characters!"],
        maxlength:[20,"username should be less than 15 characters!"],
        match:[
            /^[a-zA-Z0-9_]{3,20}$/,"Invalid username!"
        ]
    },
    email:{
        type:String,
        required:[true,"Email is required!"],
        unique:[true,"Email already in use"],
        trim:true,
        lowercase:true,
        maxlength:[254,"email length is too long"],
        match:[
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,"Please provide a valid email!"
        ]
    },
    password:{
        type:String,
        required:true,
        minlength:[3,"password should be more than 3 characters!"]
    }
})

module.exports=mongoose.model("User",userSchema)