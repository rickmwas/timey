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
};

const headerPatterns: Record<keyof Omit<ParsedImportRow, "rawRowIndex">, RegExp> = {
  rawCourseCode: /(course|unit|code|subject)/i,
  rawCourseTitle: /(title|description|course\s*name)/i,
  rawVenue: /(venue|room|hall|location)/i,
  rawDay: /(day|weekday)/i,
  rawTime: /(time|slot|hours|period)/i,
  rawLecturer: /(lecturer|instructor|teacher|staff|prof)/i,
  rawCohort: /(cohort|class|group|programme|program|year)/i,
};

function cellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) return String(value.text ?? "").trim();
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((item) => String(item.text ?? "")).join("").trim();
  }
  return String(value).trim();
}

function normalizeTable(rows: string[][]): ParsedImportRow[] {
  const headerIndex = rows.findIndex((row) => row.some((cell) => cell.trim().length > 0));
  if (headerIndex < 0) throw new AppError("EMPTY_IMPORT", "The uploaded file has no tabular data", 400);
  const headers = rows[headerIndex].map((cell) => cell.trim());
  const columns = new Map<keyof Omit<ParsedImportRow, "rawRowIndex">, number>();
  for (const [field, pattern] of Object.entries(headerPatterns) as Array<[keyof Omit<ParsedImportRow, "rawRowIndex">, RegExp]>) {
    const position = headers.findIndex((header) => pattern.test(header));
    if (position >= 0) columns.set(field, position);
  }
  for (const required of ["rawCourseCode", "rawVenue", "rawDay", "rawTime", "rawLecturer", "rawCohort"] as const) {
    if (!columns.has(required)) throw new AppError("IMPORT_HEADERS_INVALID", `Required timetable column is missing: ${required.replace("raw", "")}`, 400);
  }

  return rows.slice(headerIndex + 1).flatMap((row, index) => {
    if (row.every((cell) => !cell.trim())) return [];
    const read = (field: keyof Omit<ParsedImportRow, "rawRowIndex">) => {
      const column = columns.get(field);
      const value = column === undefined ? "" : row[column] ?? "";
      return value.trim() || null;
    };
    return [{
      rawRowIndex: headerIndex + index + 2,
      rawCourseCode: read("rawCourseCode"),
      rawCourseTitle: read("rawCourseTitle"),
      rawVenue: read("rawVenue"),
      rawDay: read("rawDay"),
      rawTime: read("rawTime"),
      rawLecturer: read("rawLecturer"),
      rawCohort: read("rawCohort"),
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
  const match = value.trim().match(/^\s*(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?\s*[-–]\s*(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?\s*$/i);
  if (!match) return null;
  const sharedMeridiem = match[6] ?? match[3];
  const start = timeToMinutes(match[1], match[2] ?? "0", match[3] ?? sharedMeridiem);
  const end = timeToMinutes(match[4], match[5] ?? "0", match[6] ?? sharedMeridiem);
  if (start === null || end === null || end <= start) return null;
  return { startTime: formatTime(start), endTime: formatTime(end) };
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
    return normalizeTable(parsed.data.map((row) => row.map(cellString)));
  }

  if (extension === "xlsx") {
    if (contents.byteLength < 4 || Buffer.from(contents.subarray(0, 4)).toString("hex") !== "504b0304") {
      throw new AppError("IMPORT_FILE_INVALID", "XLSX signature is invalid", 400);
    }
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(contents) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new AppError("EMPTY_IMPORT", "The workbook contains no worksheets", 400);
      const rows: string[][] = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        const values: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
          values[columnNumber - 1] = cellString(cell.value);
        });
        rows.push(values);
      });
      return normalizeTable(rows);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("XLSX_PARSE_FAILED", "The XLSX workbook could not be parsed", 400);
    }
  }

  throw new AppError("UNSUPPORTED_IMPORT_TYPE", "Only CSV and XLSX files are supported", 415);
}