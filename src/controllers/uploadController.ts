import { Request, Response } from "express";
import { ingestExcelViaCsv } from "../services/excelService";

export async function uploadExcelViaCsv(req: Request, res: Response) {

  try {
    if (!req.file) { return res.status(400).json({ message: "No file uploaded" }) }
    const result = await ingestExcelViaCsv(req.file.path, req.file.originalname)
    res.json(result);
  } 
  catch (err: any) {
    res.status(500).json({ message: err.message || "Error processing file" })
  }
}






















// import { Request, Response } from "express"
// import { processExcel } from "../services/excelService"

// export const uploadExcel = async (req: Request, res: Response) => {

//  try {

//   if (!req.file) {
//    return res.status(400).json({ message: "No file uploaded" })
//   }

//   await processExcel(req.file.path, req.file.originalname)

//   res.json({ message: "File processed successfully" })

//  } catch (error) {

//   console.error(error)

//   res.status(500).json({ message: "Error processing file" })

//  }
// }