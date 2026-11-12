
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


// Signup Controller
const signup = async (req, res) => {
    try {
        const password = await bcrypt.hash(req.body.password, 10);

        const user = await User.create({
            ...req.body,
            password: password
        });

        return res.status(201).json({
            message: "User created Successfully!",
            data: user.username
        });

    } catch (error) {
        console.error("Signup Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Username or email already registered"
            });
        }

        return res.status(400).json({
            message: "Failed to create user!",
            error: error.message
        });
    }
};


const login = async (req, res) => {
    try {
        const login_email = await User.findOne({
            email: req.body.email
        });

        if (login_email === null) {
            return res.status(401).json({
                message: "Invalid email or password!"
            });
        }

        const login_password = await bcrypt.compare(
            req.body.password,
            login_email.password
        );

        if (login_password === false) {
            return res.status(401).json({
                message: "Invalid email or password!"
            });
        }

        const accessToken = jwt.sign(
            { userId: login_email._id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { userId: login_email._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "User logged In successfully!",
            accessToken: accessToken
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            message: "Internal server error!",
            error: error.message
        });
    }
}

const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found!"
        });
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const newAccessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        return res.status(200).json({
            message: "Access token refreshed successfully!",
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error("Refresh Error:", error);

        return res.status(401).json({
            message: "Invalid or expired refresh token!"
        });
    }

}

module.exports = {
    signup, login, refresh
};