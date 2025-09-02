import multer from "multer";
import path from "path";

// --- Multer setup ---
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) ;
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});

export const upload = multer({ storage });
