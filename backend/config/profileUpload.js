const multer = require("multer");
const storage = multer.memoryStorage();

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const profileImage = multer({
    storage: storage,

    limits: {
        fileSize: 2 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)){
            return cb(null, true);
        }
        else{
            
cb(new Error("Invalid image format!"));
        }
    }
});

module.exports = profileImage;