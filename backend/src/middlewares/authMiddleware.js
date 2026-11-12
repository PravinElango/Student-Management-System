const jwt = require("jsonwebtoken");

const authmiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized access!"
    })
  }
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({
      message: "Invalid Authorization format!"
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access!"
    });
  }
};


module.exports = authmiddleware;