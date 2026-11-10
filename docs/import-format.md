# Import Format

Timy accepts `.csv` and `.xlsx` files up to 10 MB. PDF and legacy `.xls` files are not accepted. Files are parsed into staging rows; publishing is explicit and transactional.

Required header concepts are course code, venue, day, time, lecturer, and cohort. Header aliases include Course/Unit/Code/Subject, Venue/Room/Hall/Location, Day/Weekday, Time/Slot/Hours/Period, Lecturer/Instructor/Teacher/Staff/Professor, and Cohort/Class/Group/Programme/Year. Course title is optional.

Days accept common abbreviated or full names. Time ranges accept `08:00-11:00`, `8:00am - 11:00am`, and dot-separated times such as `8.00-11.00`; values normalize to 24-hour `HH:MM`. Unknown course, venue, lecturer, cohort, offering, invalid day, or invalid time is recorded on its staged row for correction.