
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const apiRoutes = require("./src/routes");

// Middlewares
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:4200",
    credentials: true
}));

// Health check
app.get("/", (req, res) => {
    res.send("Node backend is working!");
});

// API routes
app.use("/api", apiRoutes);

module.exports = app;
