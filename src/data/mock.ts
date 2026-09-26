import type { Department, Cohort, Course, Venue, User, TimetableEntry, Notification, Announcement, ImportJob } from '../types';

export const DEPARTMENTS: Department[] = [
  { id: 'd1', code: 'SCS', name: 'School of Computing & Informatics', school: 'Science & Technology' },
  { id: 'd2', code: 'SBS', name: 'School of Business & Economics', school: 'Business' },
  { id: 'd3', code: 'SED', name: 'School of Education', school: 'Education' },
  { id: 'd4', code: 'SCI', name: 'School of Sciences', school: 'Science & Technology' },
  { id: 'd5', code: 'SLW', name: 'School of Law', school: 'Humanities' },
];

export const COHORTS: Cohort[] = [
  { id: 'c1', code: 'CS-2024-Y1-A', name: 'Computer Science Year 1 Group A', departmentId: 'd1', department: DEPARTMENTS[0], academicYear: '2024/2025', semester: 1, expectedSize: 45 },
  { id: 'c2', code: 'CS-2024-Y1-B', name: 'Computer Science Year 1 Group B', departmentId: 'd1', department: DEPARTMENTS[0], academicYear: '2024/2025', semester: 1, expectedSize: 43 },
  { id: 'c3', code: 'CS-2023-Y2-A', name: 'Computer Science Year 2 Group A', departmentId: 'd1', department: DEPARTMENTS[0], academicYear: '2024/2025', semester: 1, expectedSize: 40 },
  { id: 'c4', code: 'CS-2023-Y2-B', name: 'Computer Science Year 2 Group B', departmentId: 'd1', department: DEPARTMENTS[0], academicYear: '2024/2025', semester: 1, expectedSize: 38 },
  { id: 'c5', code: 'BBA-2024-Y1', name: 'Business Administration Year 1', departmentId: 'd2', department: DEPARTMENTS[1], academicYear: '2024/2025', semester: 1, expectedSize: 60 },
  { id: 'c6', code: 'BBA-2023-Y2', name: 'Business Administration Year 2', departmentId: 'd2', department: DEPARTMENTS[1], academicYear: '2024/2025', semester: 1, expectedSize: 55 },
  { id: 'c7', code: 'ED-2024-Y1', name: 'Education Year 1', departmentId: 'd3', department: DEPARTMENTS[2], academicYear: '2024/2025', semester: 1, expectedSize: 50 },
];

export const COURSES: Course[] = [
  { id: 'cr1', code: 'CS 101', title: 'Introduction to Programming', departmentId: 'd1', department: DEPARTMENTS[0], credits: 3 },
  { id: 'cr2', code: 'CS 102', title: 'Computer Architecture', departmentId: 'd1', department: DEPARTMENTS[0], credits: 3 },
  { id: 'cr3', code: 'CS 201', title: 'Data Structures & Algorithms', departmentId: 'd1', department: DEPARTMENTS[0], credits: 4 },
  { id: 'cr4', code: 'CS 202', title: 'Database Systems', departmentId: 'd1', department: DEPARTMENTS[0], credits: 3 },
  { id: 'cr5', code: 'CS 203', title: 'Operating Systems', departmentId: 'd1', department: DEPARTMENTS[0], credits: 3 },
  { id: 'cr6', code: 'CS 301', title: 'Software Engineering', departmentId: 'd1', department: DEPARTMENTS[0], credits: 4 },
  { id: 'cr7', code: 'BBA 101', title: 'Principles of Management', departmentId: 'd2', department: DEPARTMENTS[1], credits: 3 },
  { id: 'cr8', code: 'BBA 102', title: 'Business Communication', departmentId: 'd2', department: DEPARTMENTS[1], credits: 2 },
  { id: 'cr9', code: 'BBA 201', title: 'Financial Accounting', departmentId: 'd2', department: DEPARTMENTS[1], credits: 4 },
  { id: 'cr10', code: 'MTH 101', title: 'Calculus I', departmentId: 'd4', department: DEPARTMENTS[3], credits: 4 },
  { id: 'cr11', code: 'MTH 102', title: 'Linear Algebra', departmentId: 'd4', department: DEPARTMENTS[3], credits: 3 },
  { id: 'cr12', code: 'CS 103', title: 'Discrete Mathematics', departmentId: 'd1', department: DEPARTMENTS[0], credits: 3 },
];

export const VENUES: Venue[] = [
  { id: 'v1', code: 'LH 1', name: 'Lecture Hall 1', building: 'Main Block', floor: 'Ground Floor', capacity: 120, active: true, aliases: ['Main LH1'] },
  { id: 'v2', code: 'LH 2', name: 'Lecture Hall 2', building: 'Main Block', floor: 'Ground Floor', capacity: 100, active: true, aliases: ['Main LH2'] },
  { id: 'v3', code: 'LH 12', name: 'Lecture Hall 12', building: 'Science Block', floor: 'First Floor', capacity: 80, active: true, aliases: ['Sci LH12'] },
  { id: 'v4', code: 'LH 26', name: 'Lecture Hall 26', building: 'New Academic Block', floor: 'Second Floor', capacity: 60, active: true, aliases: ['NAB LH26'] },
  { id: 'v5', code: 'LH 30', name: 'Lecture Hall 30', building: 'New Academic Block', floor: 'Third Floor', capacity: 50, active: true, aliases: [] },
  { id: 'v6', code: 'CS LAB 1', name: 'Computer Science Lab 1', building: 'ICT Block', floor: 'Ground Floor', capacity: 40, active: true, aliases: ['ICT Lab A'] },
  { id: 'v7', code: 'CS LAB 2', name: 'Computer Science Lab 2', building: 'ICT Block', floor: 'Ground Floor', capacity: 40, active: true, aliases: ['ICT Lab B'] },
  { id: 'v8', code: 'BBA HALL', name: 'Business Administration Hall', building: 'Commerce Block', floor: 'First Floor', capacity: 70, active: true, aliases: ['BBA LH'] },
  { id: 'v9', code: 'SEMINAR 1', name: 'Seminar Room 1', building: 'Admin Block', floor: 'Second Floor', capacity: 25, active: true, aliases: [] },
  { id: 'v10', code: 'LH 5', name: 'Lecture Hall 5', building: 'Main Block', floor: 'First Floor', capacity: 90, active: false, aliases: [] },
];

const lecturers: User[] = [
  { id: 'l1', identifier: 'STF/089', name: 'Dr. James Omondi', email: 'j.omondi@kisii.ac.ke', role: 'LECTURER', departmentId: 'd1', department: DEPARTMENTS[0], active: true, createdAt: '2022-01-15' },
  { id: 'l2', identifier: 'STF/112', name: 'Prof. Mary Wanjiku', email: 'm.wanjiku@kisii.ac.ke', role: 'LECTURER', departmentId: 'd1', department: DEPARTMENTS[0], active: true, createdAt: '2020-03-01' },
  { id: 'l3', identifier: 'STF/145', name: 'Dr. Peter Mutua', email: 'p.mutua@kisii.ac.ke', role: 'LECTURER', departmentId: 'd1', department: DEPARTMENTS[0], active: true, createdAt: '2021-08-10' },
  { id: 'l4', identifier: 'STF/067', name: 'Mrs. Grace Akinyi', email: 'g.akinyi@kisii.ac.ke', role: 'LECTURER', departmentId: 'd2', department: DEPARTMENTS[1], active: true, createdAt: '2019-05-20' },
  { id: 'l5', identifier: 'STF/201', name: 'Dr. Samuel Kipchoge', email: 's.kipchoge@kisii.ac.ke', role: 'LECTURER', departmentId: 'd4', department: DEPARTMENTS[3], active: true, createdAt: '2023-01-10' },
  { id: 'l6', identifier: 'STF/178', name: 'Dr. Faith Chebet', email: 'f.chebet@kisii.ac.ke', role: 'LECTURER', departmentId: 'd1', department: DEPARTMENTS[0], active: true, createdAt: '2022-09-01' },
];

const students: User[] = [
  { id: 's1', identifier: 'IN16/00015/24', name: 'Alice Mwangi', email: 'a.mwangi@students.kisii.ac.ke', role: 'STUDENT', departmentId: 'd1', department: DEPARTMENTS[0], active: true, createdAt: '2024-09-01' },
  { id: 's2', identifier: 'IN16/00032/24', name: 'Brian Otieno', email: 'b.otieno@students.kisii.ac.ke', role: 'STUDENT', departmentId: 'd1', department: DEPARTMENTS[0], active: true, createdAt: '2024-09-01' },
  { id: 's3', identifier: 'IN16/00088/23', name: 'Catherine Njoroge', email: 'c.njoroge@students.kisii.ac.ke', role: 'STUDENT', departmentId: 'd1', department: DEPARTMENTS[0], active: true, createdAt: '2023-09-01' },
];

const officers: User[] = [
  { id: 'o1', identifier: 'STF/030', name: 'Mr. David Kamau', email: 'd.kamau@kisii.ac.ke', role: 'TIMETABLE_OFFICER', departmentId: 'd1', department: DEPARTMENTS[0], active: true, createdAt: '2018-01-01' },
];

const admins: User[] = [
  { id: 'a1', identifier: 'ADM/001', name: 'Ms. Susan Moraa', email: 's.moraa@kisii.ac.ke', role: 'ADMIN', active: true, createdAt: '2015-06-01' },
];

export const USERS: User[] = [...students, ...lecturers, ...officers, ...admins];

export const DEMO_ACCOUNTS = [
  { identifier: 'IN16/00015/24', password: 'student123', role: 'STUDENT', name: 'Alice Mwangi' },
  { identifier: 'STF/089', password: 'lecturer123', role: 'LECTURER', name: 'Dr. James Omondi' },
  { identifier: 'STF/030', password: 'officer123', role: 'TIMETABLE_OFFICER', name: 'Mr. David Kamau' },
  { identifier: 'ADM/001', password: 'admin123', role: 'ADMIN', name: 'Ms. Susan Moraa' },
];

export const TIMETABLE_ENTRIES: TimetableEntry[] = [
  {
    id: 'te1', courseId: 'cr1', course: COURSES[0], lecturerId: 'l1', lecturer: lecturers[0],
    cohortId: 'c1', cohort: COHORTS[0], venueId: 'v1', venue: VENUES[0],
    day: 'MONDAY', startTime: '08:00', endTime: '10:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te2', courseId: 'cr2', course: COURSES[1], lecturerId: 'l2', lecturer: lecturers[1],
    cohortId: 'c1', cohort: COHORTS[0], venueId: 'v2', venue: VENUES[1],
    day: 'MONDAY', startTime: '10:00', endTime: '12:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te3', courseId: 'cr10', course: COURSES[9], lecturerId: 'l5', lecturer: lecturers[4],
    cohortId: 'c1', cohort: COHORTS[0], venueId: 'v3', venue: VENUES[2],
    day: 'MONDAY', startTime: '14:00', endTime: '16:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te4', courseId: 'cr1', course: COURSES[0], lecturerId: 'l1', lecturer: lecturers[0],
    cohortId: 'c2', cohort: COHORTS[1], venueId: 'v4', venue: VENUES[3],
    day: 'TUESDAY', startTime: '08:00', endTime: '10:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te5', courseId: 'cr12', course: COURSES[11], lecturerId: 'l3', lecturer: lecturers[2],
    cohortId: 'c1', cohort: COHORTS[0], venueId: 'v5', venue: VENUES[4],
    day: 'TUESDAY', startTime: '10:00', endTime: '12:00', academicYear: '2024/2025', semester: 1, status: 'RESCHEDULED',
    rescheduledDay: 'WEDNESDAY', rescheduledStartTime: '14:00', rescheduledEndTime: '16:00', rescheduledVenueId: 'v3', rescheduledVenue: VENUES[2],
    reschedulingReason: 'Lecturer attending academic conference',
  },
  {
    id: 'te6', courseId: 'cr2', course: COURSES[1], lecturerId: 'l2', lecturer: lecturers[1],
    cohortId: 'c2', cohort: COHORTS[1], venueId: 'v2', venue: VENUES[1],
    day: 'TUESDAY', startTime: '14:00', endTime: '16:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te7', courseId: 'cr3', course: COURSES[2], lecturerId: 'l1', lecturer: lecturers[0],
    cohortId: 'c3', cohort: COHORTS[2], venueId: 'v1', venue: VENUES[0],
    day: 'WEDNESDAY', startTime: '08:00', endTime: '10:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te8', courseId: 'cr4', course: COURSES[3], lecturerId: 'l6', lecturer: lecturers[5],
    cohortId: 'c3', cohort: COHORTS[2], venueId: 'v6', venue: VENUES[5],
    day: 'WEDNESDAY', startTime: '10:00', endTime: '12:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te9', courseId: 'cr5', course: COURSES[4], lecturerId: 'l3', lecturer: lecturers[2],
    cohortId: 'c3', cohort: COHORTS[2], venueId: 'v3', venue: VENUES[2],
    day: 'THURSDAY', startTime: '08:00', endTime: '10:00', academicYear: '2024/2025', semester: 1, status: 'CANCELLED',
    cancellationReason: 'Lecturer on medical leave',
  },
  {
    id: 'te10', courseId: 'cr6', course: COURSES[5], lecturerId: 'l2', lecturer: lecturers[1],
    cohortId: 'c3', cohort: COHORTS[2], venueId: 'v9', venue: VENUES[8],
    day: 'THURSDAY', startTime: '14:00', endTime: '16:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te11', courseId: 'cr1', course: COURSES[0], lecturerId: 'l1', lecturer: lecturers[0],
    cohortId: 'c1', cohort: COHORTS[0], venueId: 'v6', venue: VENUES[5],
    day: 'FRIDAY', startTime: '10:00', endTime: '12:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te12', courseId: 'cr7', course: COURSES[6], lecturerId: 'l4', lecturer: lecturers[3],
    cohortId: 'c5', cohort: COHORTS[4], venueId: 'v8', venue: VENUES[7],
    day: 'MONDAY', startTime: '08:00', endTime: '10:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te13', courseId: 'cr8', course: COURSES[7], lecturerId: 'l4', lecturer: lecturers[3],
    cohortId: 'c5', cohort: COHORTS[4], venueId: 'v8', venue: VENUES[7],
    day: 'WEDNESDAY', startTime: '08:00', endTime: '10:00', academicYear: '2024/2025', semester: 1, status: 'MOVED',
    rescheduledVenueId: 'v9', rescheduledVenue: VENUES[8],
    reschedulingReason: 'Venue maintenance',
  },
  {
    id: 'te14', courseId: 'cr11', course: COURSES[10], lecturerId: 'l5', lecturer: lecturers[4],
    cohortId: 'c1', cohort: COHORTS[0], venueId: 'v3', venue: VENUES[2],
    day: 'FRIDAY', startTime: '08:00', endTime: '10:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
  {
    id: 'te15', courseId: 'cr3', course: COURSES[2], lecturerId: 'l1', lecturer: lecturers[0],
    cohortId: 'c3', cohort: COHORTS[2], venueId: 'v1', venue: VENUES[0],
    day: 'FRIDAY', startTime: '14:00', endTime: '16:00', academicYear: '2024/2025', semester: 1, status: 'ACTIVE',
  },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 's1', type: 'CLASS_RESCHEDULED', title: 'Discrete Mathematics Rescheduled', message: 'CS 103 (Tuesday 10:00–12:00) has been rescheduled to Wednesday 14:00–16:00 at LH 12. Reason: Lecturer attending academic conference.', read: false, createdAt: '2025-01-18T09:30:00Z', relatedEntryId: 'te5' },
  { id: 'n2', userId: 's1', type: 'CLASS_CANCELLED', title: 'Operating Systems Cancelled', message: 'CS 203 (Thursday 08:00–10:00) has been cancelled. Reason: Lecturer on medical leave.', read: false, createdAt: '2025-01-17T08:00:00Z', relatedEntryId: 'te9' },
  { id: 'n3', userId: 's1', type: 'ANNOUNCEMENT', title: 'End of Semester CAT Dates', message: 'Continuous Assessment Tests for Semester 1 will begin on 27th January 2025. Please check the academic calendar for your specific dates.', read: true, createdAt: '2025-01-15T12:00:00Z' },
  { id: 'n4', userId: 's1', type: 'VENUE_SWAP', title: 'Venue Change: Business Communication', message: 'BBA 102 (Wednesday 08:00–10:00) has been moved from BBA Hall to Seminar Room 1 due to maintenance.', read: true, createdAt: '2025-01-14T10:00:00Z', relatedEntryId: 'te13' },
  { id: 'n5', userId: 'l1', type: 'GENERAL', title: 'Timetable Published', message: 'The Semester 1 timetable has been published. Please review your teaching schedule.', read: false, createdAt: '2025-01-10T09:00:00Z' },
];

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'an1', authorId: 'a1', author: admins[0], title: 'Semester 1 Examinations Schedule', content: 'The Semester 1 examinations are scheduled to begin on 10th February 2025. The detailed timetable will be published on the university portal by 27th January 2025. All students are advised to prepare adequately and report any clashes to the Academic Registrar\'s office.', createdAt: '2025-01-18T10:00:00Z' },
  { id: 'an2', authorId: 'o1', author: officers[0], title: 'Timetable Adjustment Notice – Week of 20th January', content: 'Due to scheduled maintenance in the New Academic Block, several classes originally allocated to LH 26 and LH 30 have been temporarily moved. Affected students will receive individual notifications. Please check your updated timetable on Timy.', createdAt: '2025-01-17T14:00:00Z' },
  { id: 'an3', authorId: 'a1', author: admins[0], title: 'Library Extended Hours – CAT Period', content: 'The Kisii University Library will operate extended hours during the Continuous Assessment Test period (27th January – 7th February 2025). The library will be open from 07:00 to 22:00 on weekdays.', createdAt: '2025-01-16T11:00:00Z' },
  { id: 'an4', authorId: 'o1', author: officers[0], title: 'Computer Science Lab Booking Policy', content: 'All requests for Computer Science Lab access outside of scheduled class hours must be submitted to the School of Computing & Informatics office at least 24 hours in advance. Walk-in access will not be permitted during class hours.', createdAt: '2025-01-12T09:30:00Z', targetCohortId: 'c1' },
];

export const IMPORT_JOBS: ImportJob[] = [
  { id: 'ij1', filename: 'timetable_sem1_2025.csv', fileSize: 48320, uploadedById: 'o1', uploadedBy: officers[0], status: 'COMMITTED', totalRows: 120, validRows: 115, conflictRows: 3, unresolvedRows: 2, createdAt: '2025-01-10T09:00:00Z', processedAt: '2025-01-10T09:15:00Z' },
  { id: 'ij2', filename: 'timetable_revision_jan2025.xlsx', fileSize: 23500, uploadedById: 'o1', uploadedBy: officers[0], status: 'CONFLICTS_DETECTED', totalRows: 45, validRows: 38, conflictRows: 7, unresolvedRows: 0, createdAt: '2025-01-17T14:30:00Z', processedAt: '2025-01-17T14:32:00Z' },
  { id: 'ij3', filename: 'bba_timetable_s1.csv', fileSize: 12100, uploadedById: 'o1', uploadedBy: officers[0], status: 'VALIDATED', totalRows: 30, validRows: 30, conflictRows: 0, unresolvedRows: 0, createdAt: '2025-01-18T10:00:00Z', processedAt: '2025-01-18T10:02:00Z' },
];
