import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads folder exists
const audioUploadPath = path.join(__dirname, "../uploads/audio");
if (!fs.existsSync(audioUploadPath)) {
  fs.mkdirSync(audioUploadPath, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioUploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for audio only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed!"));
  }
};

// Create upload instance
const audioUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter,
});

export default audioUpload;
