import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { AppError } from "@/server/errors/app-error";
import { normalizeDay, normalizeTimeRange, parseTimetableFile } from "@/server/services/import-parser";

describe("import parser", () => {
  it("maps CSV header aliases and preserves source row numbers", async () => {
    const csv = "Unit Code,Room,Weekday,Hours,Instructor,Programme\nSOEN 311,LH 26,Mon,8:00am - 11:00am,A. Lecturer,BSc SE Year 2\n";
    const rows = await parseTimetableFile("timetable.csv", new TextEncoder().encode(csv));
    expect(rows).toEqual([{
      rawRowIndex: 2,
      rawCourseCode: "SOEN 311",
      rawCourseTitle: null,
      rawVenue: "LH 26",
      rawDay: "Mon",
      rawTime: "8:00am - 11:00am",
      rawLecturer: "A. Lecturer",
      rawCohort: "BSc SE Year 2",
    }]);
  });

  it("normalizes weekday aliases and common time formats", () => {
    expect(normalizeDay("M")).toBe("MONDAY");
    expect(normalizeDay("Thurs")).toBe("THURSDAY");
    expect(normalizeTimeRange("8:00am - 11:00am")).toEqual({ startTime: "08:00", endTime: "11:00" });
    expect(normalizeTimeRange("08:00-11:00")).toEqual({ startTime: "08:00", endTime: "11:00" });
    expect(normalizeTimeRange("8.00-11.00")).toEqual({ startTime: "08:00", endTime: "11:00" });
    expect(normalizeTimeRange("0800 - 1100")).toEqual({ startTime: "08:00", endTime: "11:00" });
    expect(normalizeTimeRange("8:00am to 11:00am")).toEqual({ startTime: "08:00", endTime: "11:00" });
    expect(normalizeTimeRange("TBD")).toBeNull();
  });

  it("parses multi-sheet XLSX workbooks across distinct department worksheets", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet1 = workbook.addWorksheet("Computing");
    sheet1.addRow(["Course Code", "Venue", "Day", "Time", "Lecturer", "Cohort"]);
    sheet1.addRow(["COMP 210", "LH 26", "Monday", "09:00-11:00", "Lecturer A", "IN16-Y2"]);

    const sheet2 = workbook.addWorksheet("Information Science");
    sheet2.addRow(["Course Code", "Venue", "Day", "Time", "Lecturer", "Cohort"]);
    sheet2.addRow(["INFO 320", "LAB 2", "Tuesday", "14:00-16:00", "Lecturer B", "IS14-Y3"]);

    const bytes = await workbook.xlsx.writeBuffer();
    const rows = await parseTimetableFile("multi-dept.xlsx", new Uint8Array(bytes));
    expect(rows).toHaveLength(2);
    expect(rows[0].rawCourseCode).toBe("COMP 210");
    expect(rows[0].sheetName).toBe("Computing");
    expect(rows[1].rawCourseCode).toBe("INFO 320");
    expect(rows[1].sheetName).toBe("Information Science");
  });

  it("detects and flags scanned PDFs without extractable text runs", async () => {
    // Scanned PDF with valid PDF header but no extractable text lines
    const mockPdf = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<>>\n%%EOF");
    await expect(parseTimetableFile("scanned.pdf", mockPdf)).rejects.toThrow("scanned document without selectable text");
  });

  it("parses XLSX workbooks and rejects masquerading CSV files", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Schedule");
    worksheet.addRow(["Course Code", "Venue", "Day", "Time", "Lecturer", "Cohort"]);
    worksheet.addRow(["COMP 210", "LH 26", "Monday", "09:00-11:00", "Lecturer A", "IN16-Y2"]);
    const bytes = await workbook.xlsx.writeBuffer();
    const rows = await parseTimetableFile("timetable.xlsx", new Uint8Array(bytes));
    expect(rows).toHaveLength(1);
    expect(rows[0].rawCourseCode).toBe("COMP 210");

    await expect(parseTimetableFile("fake.csv", new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).rejects.toBeInstanceOf(AppError);
  });
});