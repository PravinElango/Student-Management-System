//Importing Express for routing and mongoose for data validation
const express = require("express");
const mongoose = require("mongoose");

//Importing the mongoose schema in models/Students.js
const Students = require("./models/Students");

const cors = require("cors");
const cookieParser = require("cookie-parser");


//loads .env variables to process.env
require("dotenv").config();

//creating a variable app with express framework
const app = express();

//Middleware for parsing JSON requests to the express
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.get('/',(req,res)=>{
    res.send("Node backend is working!");
});
//importing the routes from the routes/studentRoutes.js
const studentRoutes = require("./routes/studentRoutes");
//Mounting routes into server
app.use("/api/students",studentRoutes);

//importing the routes from the routes/authRoutes.js
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth",authRoutes);

const courseRoutes = require("./routes/courseRoutes");
app.use("/api/courses",courseRoutes);

//connecting mongodb atlas
mongoose
    .connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log("Mongodb Atlas connected Successfully!")

    //starting the server in port 3000
    app.listen(3000,()=>{console.log("Server running in port 3000!");});
    })
    .catch((error)=>{
        console.log("Mongodb Connection failed!",error.message);
        process.exit(1);
    });
