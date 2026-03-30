import { exec } from "child_process"
import path from "path"
import { fileTypeFromFile } from "file-type"




export function convertExcelToCsv(inputPath: string): Promise<string> {

  fileTypeFromFile(inputPath).then((type) => { console.log("File type: ", type) })

  return new Promise((resolve, reject) => {

    const csvPath = inputPath.replace(".xlsx", ".csv");

    const scriptPath = path.join(process.cwd(), "scripts", "convert_excel_to_csv.py");
    const pythonPath = path.join(process.cwd(), ".venv", "Scripts", "python.exe");

    const command = `"${pythonPath}" "${scriptPath}" "${inputPath}" "${csvPath}"`;

    exec(command, (error, stdout, stderr) => {

      if (error) {
        reject(stderr);
        return;
      }

      resolve(csvPath);
    });

  });

}