import { Router } from "express"
import { upload } from "../config/multer"
import { getSheetData, ingestExcel, ingestExcel2 } from "../services/excelService"
import { uploadExcelViaCsv } from "../controllers/uploadController"

const router = Router()

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) { return res.status(400).json({ error: "No file uploaded" }) }
    const result = await ingestExcel2(req.file.path, req.file.originalname, false)
    res.json(result)
  } 
  catch (error) {
    console.error(error)
    res.status(500).json({ error: "Ingestion failed" })
  }
})

router.get("/sheet/:sheetDate", async (req, res) => {
  try {
    const { sheetDate } = req.params;
    if (!sheetDate) return res.status(400).json({ error: "Missing fileId or sheetDate" });
    const result = await getSheetData(sheetDate);
    console.table([result.headers, ...result.rows])
    res.json(result);
  } 
  catch (error) {
    console.error(error)
    res.status(500).json({ error: "Ingestion failed" })
  }
})

router.post("/upload-csv", upload.single("file"), uploadExcelViaCsv)



export default router;






// import { Router } from "express";
// import multer from "multer";
// import { uploadExcel } from "../controllers/uploadController";

// const router = Router();

// const upload = multer({ dest: "uploads/" });

// router.post("/upload", upload.single("file"), uploadExcel);

// export default router;