import XLSX from "xlsx"
import { prisma } from "../utils/prisma"
import fs from "fs"
import csvParser from "csv-parser"
import { convertExcelToCsv } from "../utils/pythonConverter"


function parseNumber(value: any): number | null {
  if (!value) return null;

  const cleaned = String(value).replace(/,/g, "").trim();
  if (cleaned === "") return null;

  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(value: any): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function ingestExcel(filePath: string, originalName: string, enforceDateSheetNames = true) {
  try {
    const workbook = XLSX.readFile(filePath, { cellDates: true });

    if (!workbook.SheetNames.length) {
      throw new Error("No sheets found in Excel file");
    }

    // regex for DD-MM-YYYY
    const dateSheetRegex = /^\d{2}-\d{2}-\d{4}$/;

    const fileRecord = await prisma.file.create({
      data: { fileName: originalName },
    });

    const fileId = fileRecord.id;
    const existingColumns = new Set<string>();

    const savedColumns = await prisma.fileColumn.findMany({
      where: { fileId },
    });

    savedColumns.forEach((c) => existingColumns.add(c.columnName));

    let totalRows = 0;
    let columnsSaved = false;

    for (const sheetName of workbook.SheetNames) {
      if (enforceDateSheetNames && !dateSheetRegex.test(sheetName)) {
        console.log(`Skipping sheet: ${sheetName}`);
        continue;
      }

      console.log(`Parsing sheet: ${sheetName}`);

      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, {
        header: 0,
        defval: null,
        raw: false,
      });

      if (!jsonData.length) continue;


      //---------------------------------------------
      // Save columns only once
    //   if (!columnsSaved) {
    //     const columns = Object.keys(jsonData[0]).map((col) => col.trim());

    //     await prisma.fileColumn.createMany({
    //       data: columns.map((col, index) => ({
    //         fileId,
    //         columnName: col,
    //         columnIndex: index,
    //       })),
    //     });

    //     columnsSaved = true;
    //   }

          const headers = Object.keys(jsonData[0]).map((h) => h.trim());

      const newColumns = headers.filter((h) => !existingColumns.has(h));

      if (newColumns.length) {
        const maxIndex =
          (await prisma.fileColumn.aggregate({
            where: { fileId },
            _max: { columnIndex: true },
          }))._max.columnIndex ?? -1;

        await prisma.fileColumn.createMany({
          data: newColumns.map((col, i) => ({
            fileId,
            columnName: col,
            columnIndex: headers.indexOf(col)
          })),
          skipDuplicates: true,
        });

        newColumns.forEach((c) => existingColumns.add(c));
      }

      const rows = jsonData.map((row) => {
        const cleanedRow: any = {};

        Object.entries(row).forEach(([key, value]) => {
          cleanedRow[key.trim()] = value;
        });

        return {
          fileId,
          sheetDate: sheetName,
          data: cleanedRow,
        };
      });

      await prisma.fileRow.createMany({ data: rows });

      totalRows += rows.length;
    }

    if (totalRows === 0) {
      throw new Error("No rows were parsed from this Excel file");
    }

    return {
      message: "Excel file ingested successfully",
      rows: totalRows,
    };
  } catch (err: any) {
    if (err.message.includes("ECMA-376 Encrypted")) {
      console.log("Encrypted Excel detected. Converting to CSV...");
      const csvPath = await convertExcelToCsv(filePath);
      return ingestCsv(csvPath, originalName);
    }

    throw err;
  }
}

// export async function ingestExcel2(filePath: string, originalName: string, enforceDateSheetNames: boolean) {
//   try {
//     const workbook = XLSX.readFile(filePath, { cellDates: true });

//     if (!workbook.SheetNames.length) {
//       throw new Error("No sheets found in Excel file");
//     }

//     // regex for DD-MM-YYYY
//     const dateSheetRegex = /^\d{2}-\d{2}-\d{4}$/;

//     const fileRecord = await prisma.file.create({
//       data: { fileName: originalName },
//     });

//     const fileId = fileRecord.id;

//     let totalRows = 0;
//     let columnsSaved = false;

//     for (const sheetName of workbook.SheetNames) {
//       if (enforceDateSheetNames && !dateSheetRegex.test(sheetName)) {
//         console.log(`Skipping sheet: ${sheetName}`);
//         continue;
//       }

//       console.log(`Parsing sheet: ${sheetName}`);

//       const sheet = workbook.Sheets[sheetName];
//       if (!sheet) continue;

//       const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, {
//         header: 0,
//         defval: null,
//         raw: false,
//       });

//       if (!jsonData.length) continue;

//       // Save columns only once
//       if (!columnsSaved) {
//         const columns = Object.keys(jsonData[0]).map((col) => col.trim());

//         await prisma.fileColumn.createMany({
//           data: columns.map((col, index) => ({
//             fileId,
//             columnName: col,
//             columnIndex: index,
//           })),
//         });

//         columnsSaved = true;
//       }

//       const rows = jsonData.map((row) => {
//         const cleanedRow: any = {};

//         Object.entries(row).forEach(([key, value]) => {
//           cleanedRow[key.trim()] = value;
//         });

//         const reference = cleanedRow["Reference"];
//         const txDate = cleanedRow["Transaction Date"];

//         let uniqueRef = null;

//         if (reference && txDate) {
//             const cleanDate = txDate.replace(/[-:TZ.]/g, "");
//             uniqueRef = reference + cleanDate;
//         }

//         return {
//           fileId,
//           uniqueRef,
//           data: {...cleanedRow, uniqueRef},
//         };
//       });

//       await prisma.fileRow.createMany({ data: rows });

//     //   const insertedRows = await prisma.fileRow.findMany({ where: { fileId }, select: { id: true, data: true, uniqueRef: true }, });
//       const validRows = rows.filter(row => { const d = row.data as any;
//                                 return d["Reference"] && d["Transaction Date"]});

//       const transactionRecords = validRows.map((row) => {
//         const d = row.data as Record<string, any>;

//         if (!d["Reference"] || d["Reference"] === "Reference" || !d["Transaction Date"] || d["Transaction Date"] === "Transaction Date") { return null; }

//         return {
//             reference: d["Reference"],
//             merchantName: d["Merchant Name"],
//             paymentMethod: d["Payment Method"],
//             paymentSource: d["Payment Source"],
//             amount: parseNumber(d["Amount"]),
//             charges: parseNumber(d["Charges"]),
//             vat: parseNumber(d["Vat"]),
//             stampDuty: parseNumber(d["Stamp Duty"]),
//             blusaltCharge: parseNumber(d["Blusalt Charge"]),
//             aggregatorCharge: parseNumber(d["Aggregator Charge"]),
//             amountSettled: parseNumber(d["Amount Settled"]),
//             netToCBI: parseNumber(d["Net to CBI"]),
//             description: d["Description"] || null,
//             settlementDue: parseNumber(d["Settlement Due"]),
//             currency: d["Currency"],
//             status: d["Status"],
//             transactionDate: parseDate(d["Transaction Date"]),
//             uniqueRef: d["uniqueRef"],
//         };
//         }).filter((x): x is NonNullable<typeof x> => x !== undefined);

//       if (transactionRecords.length) { await prisma.transactionRecord.createMany({ data: transactionRecords, skipDuplicates: true, });}

//       totalRows += rows.length;
//     }

//     if (totalRows === 0) {
//       throw new Error("No valid sheets found with DD-MM-YYYY format");
//     }

//     return {
//       message: "Excel file ingested successfully",
//       rows: totalRows,
//     };
//   } catch (err: any) {
//     if (err.message.includes("ECMA-376 Encrypted")) {
//       console.log("Encrypted Excel detected. Converting to CSV...");
//       const csvPath = await convertExcelToCsv(filePath);
//       return ingestCsv(csvPath, originalName);
//     }

//     throw err;
//   }
// }



// copy of above
export async function ingestExcel2(filePath: string, originalName: string, enforceDateSheetNames: boolean) {
  try {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    if (!workbook.SheetNames.length) throw new Error("No sheets found in Excel file");

    const dateSheetRegex = /^\d{2}-\d{2}-\d{4}$/;

    const fileRecord = await prisma.file.create({ data: { fileName: originalName } });
    const fileId = fileRecord.id;

    let totalRows = 0;
    let columnsSaved = false;

    for (const sheetName of workbook.SheetNames) {
      if (enforceDateSheetNames && !dateSheetRegex.test(sheetName)) {
        console.log(`Skipping sheet: ${sheetName}`);
        continue;
      }

      console.log(`Parsing sheet: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 0, defval: null, raw: false });
      if (!jsonData.length) continue;

      // Save columns once
      if (!columnsSaved) {
        const columns = Object.keys(jsonData[0]).map(c => c.trim());
        await prisma.fileColumn.createMany({
          data: columns.map((col, idx) => ({ fileId, columnName: col, columnIndex: idx })),
        });
        columnsSaved = true;
      }

      // Prepare FileRow entries
      const fileRows = jsonData.map(row => {
        const cleaned: any = {};
        Object.entries(row).forEach(([k, v]) => cleaned[k.trim()] = v);

        // generate uniqueRef
        const reference = cleaned["Reference"];
        const txDate = cleaned["Transaction Date"];
        const uniqueRef = reference && txDate ? reference + txDate.replace(/[-:TZ.]/g, "") : null;

        return { fileId, uniqueRef, data: { ...cleaned, uniqueRef } };
      });

      await prisma.fileRow.createMany({ data: fileRows });
      totalRows += fileRows.length;
    }

    // --- TransactionRecord mapping AFTER all sheets are ingested ---
    const insertedRows = await prisma.fileRow.findMany({
      where: { fileId },
      select: { data: true, uniqueRef: true }
    });

    const transactionRecords = insertedRows
      .map(row => {
        const d = row.data as Record<string, any>;
        if (!d["Reference"] || !d["Transaction Date"]) return null;

        return {
          reference: d["Reference"],
          merchantName: d["Merchant Name"],
          paymentMethod: d["Payment Method"],
          paymentSource: d["Payment Source"],
          amount: parseNumber(d["Amount"]),
          charges: parseNumber(d["Charges"]),
          vat: parseNumber(d["Vat"]),
          stampDuty: parseNumber(d["Stamp Duty"]),
          blusaltCharge: parseNumber(d["Blusalt Charge"]),
          aggregatorCharge: parseNumber(d["Aggregator Charge"]),
          amountSettled: parseNumber(d["Amount Settled"]),
          netToCBI: parseNumber(d["Net to CBI"]),
          description: d["Description"] || null,
          settlementDue: parseNumber(d["Settlement Due"]),
          currency: d["Currency"],
          status: d["Status"],
          transactionDate: parseDate(d["Transaction Date"]),
          uniqueRef: d["uniqueRef"],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (transactionRecords.length) {
      await prisma.transactionRecord.createMany({ data: transactionRecords, skipDuplicates: true });
    }

    return { message: "Excel file ingested successfully", rows: totalRows };
  } catch (err: any) {
    if (err.message.includes("ECMA-376 Encrypted")) {
      console.log("Encrypted Excel detected. Converting to CSV...");
      const csvPath = await convertExcelToCsv(filePath);
      return ingestCsv(csvPath, originalName);
    }
    throw err;
  }
}










// export async function ingestExcel(filePath: string, originalName: string) {
//   try {
//     const workbook = XLSX.readFile(filePath, { cellDates: true });
//     const sheetName = workbook.SheetNames[0];
//     if (!sheetName) throw new Error("No sheets found in Excel file");

//     const sheet = workbook.Sheets[sheetName];
//     if (!sheet) throw new Error("Worksheet could not be loaded");

//     const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, {
//       header: 0,
//       defval: null,
//       raw: false,
//     });

//     if (jsonData.length === 0) throw new Error("Excel file is empty");

//     const columns = Object.keys(jsonData[0]).map((col) => col.trim());

//     const fileRecord = await prisma.file.create({ data: { fileName: originalName } });
//     const fileId = fileRecord.id;

//     await prisma.fileColumn.createMany({
//       data: columns.map((col, index) => ({
//         fileId,
//         columnName: col,
//         columnIndex: index,
//       })),
//     });

//     const rows = jsonData.map((row) => {
//       const cleanedRow: any = {};
//       Object.entries(row).forEach(([key, value]) => {
//         cleanedRow[key.trim()] = value;
//       });
//       return { fileId, data: cleanedRow };
//     });

//     await prisma.fileRow.createMany({ data: rows });

//     return { message: "Excel file ingested successfully", rows: rows.length };
//   } catch (err: any) {
//     if (err.message.includes("ECMA-376 Encrypted")) {
//       console.log("Encrypted Excel detected. Converting to CSV...");
//       const csvPath = await convertExcelToCsv(filePath);
//       return ingestCsv(csvPath, originalName);
//     }
//     throw err;
//   }
// }




// export async function ingestExcel(filePath: string, originalName: string) {

//   try {
//         const workbook = XLSX.readFile(filePath);
//         const sheetName = workbook.SheetNames[0];
//         if (!sheetName) { throw new Error("No sheets found in Excel file") }

//         const sheet = workbook.Sheets[sheetName];
//         if (!sheet) { throw new Error("Worksheet could not be loaded")}

//         const jsonData: any[] = XLSX.utils.sheet_to_json(sheet)
//         if (jsonData.length === 0) { throw new Error("Excel file is empty")}

//         const columns = Object.keys(jsonData[0]);

//         const fileRecord = await prisma.file.create({ data: { fileName: originalName } })

//         const fileId = fileRecord.id;

//         await prisma.fileColumn.createMany({
//             data: columns.map((col, index) => ({
//             fileId,
//             columnName: col,
//             columnIndex: index
//             }))
//         });

//         const rows = jsonData.map((row) => ({ fileId, data: row }))

//         await prisma.fileRow.createMany({ data: rows })
//         return { message: "Excel file ingested successfully", rows: rows.length }
//   } 
//   catch (err: any) {
//     if(err.message.includes("ECMA-376 Encrypted")) { 
//         console.log("Encrypted Excel detected. Converting to CSV...");
//         const csvPath = await convertExcelToCsv(filePath);
//         return ingestCsv(csvPath, originalName)
//     }
//     throw err
//   }
// }



export async function ingestExcelViaCsv(filePath: string, originalName: string) {
  try {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) { throw new Error("No sheets found in Excel file") }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) { throw new Error("Worksheet could not be loaded") }

    const csv = XLSX.utils.sheet_to_csv(sheet);
    const csvPath = filePath + ".csv";

    fs.writeFileSync(csvPath, csv);
    const rows: any[] = [];

    return new Promise(async (resolve, reject) => {

      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on("data", (data) => rows.push(data))
        .on("end", async () => {

          if (rows.length === 0) {
            reject(new Error("CSV file is empty"));
            return;
          }

          const columns = Object.keys(rows[0]);
          const fileRecord = await prisma.file.create({ data: { fileName: originalName } })

          const fileId = fileRecord.id;

          await prisma.fileColumn.createMany({
            data: columns.map((col, index) => ({
              fileId,
              columnName: col,
              columnIndex: index
            }))
          })

          const dbRows = rows.map(row => ({ fileId, data: row }))
          await prisma.fileRow.createMany({ data: dbRows })

          fs.unlinkSync(csvPath);
          fs.unlinkSync(filePath);

          resolve({ message: "Excel converted to CSV and ingested successfully", rows: dbRows.length })
        })
        .on("error", reject)
    })
  } 
  catch (err: any) {
    if (err.message.includes("ECMA-376 Encrypted")) { throw new Error("Cannot parse the Excel file because it is encrypted") }
    throw err;
  }
}


export async function ingestCsv(filePath: string, originalName: string) {

  const rows: any[] = [];

  return new Promise((resolve, reject) => {

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {

        if (rows.length === 0) {
          reject(new Error("CSV file empty"));
          return;
        }

        const columns = Object.keys(rows[0]);

        const fileRecord = await prisma.file.create({
          data: { fileName: originalName }
        });

        const fileId = fileRecord.id;

        await prisma.fileColumn.createMany({
          data: columns.map((col, index) => ({
            fileId,
            columnName: col,
            columnIndex: index
          }))
        });

        const dbRows = rows.map(r => ({
          fileId,
          data: r
        }));

        await prisma.fileRow.createMany({
          data: dbRows
        });

        resolve({
          message: "CSV ingested successfully",
          rows: dbRows.length
        });

      })
      .on("error", reject);
  })
}


export async function getSheetData(sheetName: string) {
  // Validate and parse sheetName DD-MM-YYYY
  const parts = sheetName.split("-");
  if (parts.length !== 3) throw new Error("Invalid sheetName format, expected DD-MM-YYYY");

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (isNaN(day) || isNaN(month) || isNaN(year)) throw new Error("Invalid sheetName, not a valid date");

  // Date range for that sheet
  const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // Fetch all columns
  const columns = await prisma.fileColumn.findMany({
    orderBy: { columnIndex: "asc" },
  });
  const headers = columns.map((c) => c.columnName);

  // Fetch rows filtered by Transaction Date in JSON
  const rows = await prisma.fileRow.findMany({
    where: {
      data: {
        path: ["Transaction Date"],
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    },
    orderBy: { id: "asc" },
  });

  // Reconstruct sheet exactly like Excel
  const reconstructed = rows.map((r) => {
    const row: Record<string, any> = {};
    const data = r.data as Record<string, any>;
    headers.forEach((h) => {
      row[h] = data[h] ?? null;
    });
    return row;
  });

  return { headers, rows: reconstructed };
}
