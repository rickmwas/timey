import { Buffer } from "node:buffer";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { DayOfWeek } from "@prisma/client";
import { AppError } from "@/server/errors/app-error";

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export type ParsedImportRow = {
  rawRowIndex: number;
  rawCourseCode: string | null;
  rawCourseTitle: string | null;
  rawVenue: string | null;
  rawDay: string | null;
  rawTime: string | null;
  rawLecturer: string | null;
  rawCohort: string | null;
  sheetName?: string;
};

const headerPatterns: Record<keyof Omit<ParsedImportRow, "rawRowIndex" | "sheetName">, RegExp> = {
  rawCourseCode: /(course|unit|code|subject)/i,
  rawCourseTitle: /(title|description|course\s*name)/i,
  rawVenue: /(venue|room|hall|location|lab)/i,
  rawDay: /(day|weekday)/i,
  rawTime: /(time|slot|hours|period)/i,
  rawLecturer: /(lecturer|instructor|teacher|staff|prof)/i,
  rawCohort: /(cohort|class|group|programme|program|year)/i,
};

function cellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined && value.result !== null) {
      return cellString(value.result);
    }
    if ("text" in value) return String((value as any).text ?? "").trim();
    if ("richText" in value && Array.isArray((value as any).richText)) {
      return (value as any).richText.map((item: any) => String(item.text ?? "")).join("").trim();
    }
    if (value instanceof Date) {
      return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
    }
  }
  return String(value).trim();
}

function normalizeTable(rows: string[][], sheetName?: string, baseRowOffset = 0): ParsedImportRow[] {
  const headerIndex = rows.findIndex((row) => row.some((cell) => cell.trim().length > 0));
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex].map((cell) => cell.trim());
  const columns = new Map<keyof Omit<ParsedImportRow, "rawRowIndex" | "sheetName">, number>();
  for (const [field, pattern] of Object.entries(headerPatterns) as Array<[keyof Omit<ParsedImportRow, "rawRowIndex" | "sheetName">, RegExp]>) {
    const position = headers.findIndex((header) => pattern.test(header));
    if (position >= 0) columns.set(field, position);
  }
  for (const required of ["rawCourseCode", "rawVenue", "rawDay", "rawTime", "rawLecturer", "rawCohort"] as const) {
    if (!columns.has(required)) {
      if (sheetName) {
        // If sheet is missing required columns, it's not a timetable sheet
        return [];
      }
      throw new AppError("IMPORT_HEADERS_INVALID", `Required timetable column is missing: ${required.replace("raw", "")}`, 400);
    }
  }

  return rows.slice(headerIndex + 1).flatMap((row, index) => {
    if (row.every((cell) => !cell.trim())) return [];
    const read = (field: keyof Omit<ParsedImportRow, "rawRowIndex" | "sheetName">) => {
      const column = columns.get(field);
      const value = column === undefined ? "" : row[column] ?? "";
      return value.trim() || null;
    };
    return [{
      rawRowIndex: baseRowOffset + headerIndex + index + 2,
      rawCourseCode: read("rawCourseCode"),
      rawCourseTitle: read("rawCourseTitle"),
      rawVenue: read("rawVenue"),
      rawDay: read("rawDay"),
      rawTime: read("rawTime"),
      rawLecturer: read("rawLecturer"),
      rawCohort: read("rawCohort"),
      ...(sheetName ? { sheetName } : {}),
    }];
  });
}

export function normalizeDay(value: string): DayOfWeek | null {
  const normalized = value.trim().toLowerCase().replace(/[^a-z]/g, "");
  const days: Record<string, DayOfWeek> = {
    m: DayOfWeek.MONDAY, mon: DayOfWeek.MONDAY, monday: DayOfWeek.MONDAY,
    tu: DayOfWeek.TUESDAY, tue: DayOfWeek.TUESDAY, tues: DayOfWeek.TUESDAY, tuesday: DayOfWeek.TUESDAY,
    w: DayOfWeek.WEDNESDAY, wed: DayOfWeek.WEDNESDAY, weds: DayOfWeek.WEDNESDAY, wednesday: DayOfWeek.WEDNESDAY,
    th: DayOfWeek.THURSDAY, thu: DayOfWeek.THURSDAY, thur: DayOfWeek.THURSDAY, thurs: DayOfWeek.THURSDAY, thursday: DayOfWeek.THURSDAY,
    f: DayOfWeek.FRIDAY, fri: DayOfWeek.FRIDAY, friday: DayOfWeek.FRIDAY,
    sa: DayOfWeek.SATURDAY, sat: DayOfWeek.SATURDAY, saturday: DayOfWeek.SATURDAY,
    su: DayOfWeek.SUNDAY, sun: DayOfWeek.SUNDAY, sunday: DayOfWeek.SUNDAY,
  };
  return days[normalized] ?? null;
}

function timeToMinutes(hourText: string, minuteText: string, meridiem?: string): number | null {
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute > 59 || minute < 0) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour %= 12;
    if (meridiem.toLowerCase() === "pm") hour += 12;
  }
  if (hour < 0 || hour > 23) return null;
  return hour * 60 + minute;
}

function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function normalizeTimeRange(value: string): { startTime: string; endTime: string } | null {
  const trimmed = value.trim();
  // Standard format: 8:00am - 11:00am or 08:00-11:00 or 8.00-11.00 or 0800-1100
  const match = trimmed.match(/^\s*(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?\s*(?:[-–]|to)\s*(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?\s*$/i);
  if (match) {
    const sharedMeridiem = match[6] ?? match[3];
    const start = timeToMinutes(match[1], match[2] ?? "0", match[3] ?? sharedMeridiem);
    const end = timeToMinutes(match[4], match[5] ?? "0", match[6] ?? sharedMeridiem);
    if (start !== null && end !== null && end > start) {
      return { startTime: formatTime(start), endTime: formatTime(end) };
    }
  }

  // 4-digit military format without separators: e.g. 0800 - 1100
  const militaryMatch = trimmed.match(/^\s*(\d{2})(\d{2})\s*[-–]\s*(\d{2})(\d{2})\s*$/);
  if (militaryMatch) {
    const start = timeToMinutes(militaryMatch[1], militaryMatch[2]);
    const end = timeToMinutes(militaryMatch[3], militaryMatch[4]);
    if (start !== null && end !== null && end > start) {
      return { startTime: formatTime(start), endTime: formatTime(end) };
    }
  }

  return null;
}

/**
 * Basic heuristic parser for PDF timetable text extraction vs scanned OCR check
 */
function parsePdfDocument(contents: Uint8Array): ParsedImportRow[] {
  const buffer = Buffer.from(contents);
  if (buffer.subarray(0, 4).toString() !== "%PDF") {
    throw new AppError("IMPORT_FILE_INVALID", "PDF signature is invalid", 400);
  }

  const textContent = buffer.toString("latin1");
  // Extract visible ASCII strings from PDF stream
  const asciiMatches = textContent.match(/[A-Za-z0-9\s:.,\-\/]{4,}/g) || [];
  const combinedText = asciiMatches.join(" ");

  if (combinedText.trim().length < 80) {
    throw new AppError(
      "SCANNED_PDF_DETECTED",
      "The uploaded PDF appears to be a scanned document without selectable text. Please export to CSV/Excel or run OCR before uploading.",
      422
    );
  }

  // Find CSV/tabular-like structure in extracted text lines
  const lines = combinedText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const rows: string[][] = lines.map((line) => line.split(/[\t,|]/).map((c) => c.trim()));

  const parsed = normalizeTable(rows);
  if (parsed.length === 0) {
    throw new AppError(
      "PDF_PARSE_INCOMPLETE",
      "Text extracted from PDF could not be automatically grouped into standard timetable columns. Please convert this PDF to CSV or Excel for precision.",
      422
    );
  }

  return parsed;
}

export async function parseTimetableFile(fileName: string, contents: Uint8Array): Promise<ParsedImportRow[]> {
  if (contents.byteLength === 0) throw new AppError("EMPTY_IMPORT", "The uploaded file is empty", 400);
  if (contents.byteLength > MAX_IMPORT_BYTES) throw new AppError("IMPORT_TOO_LARGE", "Import files must be 10 MB or smaller", 413);
  const extension = fileName.toLowerCase().split(".").at(-1);

  if (extension === "csv") {
    const buffer = Buffer.from(contents);
    const text = buffer.toString("utf8");
    if (text.includes("\u0000") || buffer.subarray(0, 4).toString("hex") === "504b0304") {
      throw new AppError("IMPORT_FILE_INVALID", "CSV file contains binary data", 400);
    }
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy", dynamicTyping: false });
    if (parsed.errors.length > 0) throw new AppError("CSV_PARSE_FAILED", parsed.errors[0].message, 400);
    const result = normalizeTable(parsed.data.map((row) => row.map(cellString)));
    if (result.length === 0) throw new AppError("EMPTY_IMPORT", "The uploaded file has no tabular data", 400);
    return result;
  }

  if (extension === "xlsx") {
    if (contents.byteLength < 4 || Buffer.from(contents.subarray(0, 4)).toString("hex") !== "504b0304") {
      throw new AppError("IMPORT_FILE_INVALID", "XLSX signature is invalid", 400);
    }
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(contents) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      if (!workbook.worksheets || workbook.worksheets.length === 0) {
        throw new AppError("EMPTY_IMPORT", "The workbook contains no worksheets", 400);
      }

      const allRows: ParsedImportRow[] = [];
      let totalRowOffset = 0;

      // Iterate across all worksheets in the workbook
      for (const worksheet of workbook.worksheets) {
        const rows: string[][] = [];
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          const values: string[] = [];
          row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
            values[columnNumber - 1] = cellString(cell.value);
          });
          rows.push(values);
        });

        if (rows.length > 0) {
          const sheetRows = normalizeTable(rows, worksheet.name, totalRowOffset);
          allRows.push(...sheetRows);
          totalRowOffset += rows.length + 10;
        }
      }

      if (allRows.length === 0) {
        // If multi-sheet parsing didn't find headers, try sheet 0 directly to surface column error
        const firstSheet = workbook.worksheets[0];
        const rows: string[][] = [];
        firstSheet.eachRow({ includeEmpty: false }, (row) => {
          const values: string[] = [];
          row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
            values[columnNumber - 1] = cellString(cell.value);
          });
          rows.push(values);
        });
        return normalizeTable(rows);
      }

      return allRows;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("XLSX_PARSE_FAILED", "The XLSX workbook could not be parsed", 400);
    }
  }

  if (extension === "pdf") {
    return parsePdfDocument(contents);
  }

  throw new AppError("UNSUPPORTED_IMPORT_TYPE", "Only CSV, XLSX, and PDF files are supported", 415);
}
