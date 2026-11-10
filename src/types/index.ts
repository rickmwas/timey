export type Role = 'STUDENT' | 'LECTURER' | 'TIMETABLE_OFFICER' | 'ADMIN';

export type TimetableStatus = 'ACTIVE' | 'RESCHEDULED' | 'CANCELLED' | 'MOVED';

export type Day = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export type NotificationType =
  | 'VENUE_SWAP'
  | 'CLASS_RESCHEDULED'
  | 'CLASS_CANCELLED'
  | 'ANNOUNCEMENT'
  | 'SYSTEM_ALERT'
  | 'GENERAL';

export type ImportStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'VALIDATED'
  | 'CONFLICTS_DETECTED'
  | 'COMMITTED'
  | 'DISCARDED'
  | 'FAILED';

export type ConflictSeverity = 'BLOCKING' | 'WARNING' | 'INFO';

export type ConflictType =
  | 'VENUE_CONFLICT'
  | 'LECTURER_CONFLICT'
  | 'COHORT_CONFLICT'
  | 'CAPACITY_CONFLICT'
  | 'INVALID_TIME'
  | 'INVALID_ASSIGNMENT';

export interface Department {
  id: string;
  code: string;
  name: string;
  school: string;
}

export interface Cohort {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  department: Department;
  academicYear: string;
  semester: number;
  expectedSize: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  department: Department;
  credits: number;
}

export interface Venue {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  active: boolean;
  aliases: string[];
}

export interface User {
  id: string;
  identifier: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  department?: Department;
  cohortId?: string;
  active: boolean;
  createdAt: string;
}

export interface TimetableEntry {
  id: string;
  courseId: string;
  course: Course;
  lecturerId: string;
  lecturer: User;
  cohortId: string;
  cohort: Cohort;
  venueId: string;
  venue: Venue;
  day: Day;
  startTime: string;
  endTime: string;
  academicYear: string;
  semester: number;
  status: TimetableStatus;
  rescheduledDay?: Day;
  rescheduledStartTime?: string;
  rescheduledEndTime?: string;
  rescheduledVenueId?: string;
  rescheduledVenue?: Venue;
  cancellationReason?: string;
  reschedulingReason?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedEntryId?: string;
}

export interface Announcement {
  id: string;
  authorId: string;
  author: User;
  title: string;
  content: string;
  targetCohortId?: string;
  targetCourseId?: string;
  createdAt: string;
}

export interface ImportJob {
  id: string;
  filename: string;
  fileSize: number;
  uploadedById: string;
  uploadedBy: User;
  status: ImportStatus;
  totalRows: number;
  validRows: number;
  conflictRows: number;
  unresolvedRows: number;
  createdAt: string;
  processedAt?: string;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  suggestion?: string;
  entryIds: string[];
}

export interface AuthUser {
  id: string;
  identifier: string;
  name: string;
  email: string;
  role: Role;
  cohortId?: string;
}
