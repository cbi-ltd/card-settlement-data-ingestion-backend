import multer from "multer";
import path from "path";

const storage = multer.diskStorage({ 
    destination: (req, file, cb) => { cb(null, "uploads/" )},
    filename: (req, file, cb) => {
        const unique = Date.now() + path.extname(file.originalname)
        cb(null, unique)
    }
})

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".xlsx", ".xls", ".xlsm"];
    const ext = path.extname(file.originalname);

    if (!allowed.includes(ext)) { return cb(new Error("Only Excel files allowed")) }
    cb(null, true);
  }
})