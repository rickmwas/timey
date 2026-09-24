# UI Component Registry & UX Context — Timy

## 1. UI Architecture & Primitives
- **Framework**: Next.js 14+ with React 18 / 19 Server Components.
- **Styling**: Tailwind CSS with custom CSS variables matching `design.md` tokens.
- **Primitives**: Radix UI (accessible Dialog, DropdownMenu, Tabs, Popover, Tooltip, Select).
- **Icons**: Lucide React (clean, stroke-based iconography).

---

## 2. Breakpoints & Responsive Strategy

| Breakpoint | Width Range | Target Devices | Layout Behavior |
|---|---|---|---|
| `sm` | 640px+ | Large smartphones / phablets | Single column agenda list |
| `md` | 768px+ | Tablets / iPads | 2-column or collapsable sidebar |
| `lg` | 1024px+ | Laptops / Desktops | Persistent sidebar + Full timetable matrix grid |
| `xl` | 1280px+ | Large monitors | Matrix grid with side-by-side venue inspector |

---

## 3. Core Component Catalog

### 3.1 `TimetableSlotCard`
- **Purpose**: Displays an individual scheduled class in the mobile agenda or daily list.
- **Variants**:
  - `Default`: Clean white card with slate border.
  - `ActiveNow`: Emerald green left border strip (`border-l-4 border-emerald-600`).
  - `Rescheduled`: Amber warning stripe, shows original time/venue struck through and new time/venue in bold.
  - `Cancelled`: Red muted background with strikethrough text and reason badge.
- **States**: Hover elevation, focus-visible ring for keyboard navigation.

### 3.2 `TimetableMatrixGrid`
- **Purpose**: Full-screen grid view for timetable coordinators and admins.
- **Columns**: Days of the week (`MONDAY` through `FRIDAY` / `SATURDAY`).
- **Rows**: Dynamic or standard time bands (e.g., 07:00–10:00, 10:00–13:00, 13:00–16:00, 16:00–19:00).
- **Cell Content**: Stacked draggable or clickable blocks representing class units.
- **Conflict Display**: Red border alert indicator showing `[2 Conflicts]` badge with popover detailing conflicting entries.

### 3.3 `VenueAvailabilityPill`
- **Purpose**: At-a-glance status badge for a physical venue (e.g. `LH 26`, `Computer Lab 1`).
- **States**:
  - `AVAILABLE`: Green dot + "Available until 14:00"
  - `OCCUPIED`: Red dot + "Occupied (SOEN 311)"
  - `MAINTENANCE`: Amber dot + "Closed for Exams / Maintenance"

### 3.4 `NotificationDrawer & Dropdown`
- **Purpose**: Displays student and lecturer notification feed.
- **Item Format**:
  - Icon: 🔄 (Moved), ❌ (Cancelled), 📢 (Announcement).
  - Title: "SOEN 311 Moved to LH 26"
  - Timestamp: "12 mins ago"
  - Unread indicator: Blue dot.
  - Quick action: "View in Timetable".

### 3.5 `FileDropzone & IngestionStepper`
- **Purpose**: Timetable coordinator upload interface.
- **Phases**:
  1. File Upload (drag-and-drop .xlsx, .csv, .pdf with size & mime validation).
  2. Parsing & Entity Matching (progress bar with counts: 42 courses, 18 venues, 12 lecturers found).
  3. Conflict & Warning Preview (interactive table showing detected clashes).
  4. Confirmation & Publish (action with atomic commit).

---

## 4. State Patterns

### 4.1 Loading States
- Always use skeleton loaders that replicate the exact dimensions of cards or grid cells.
- Skeletons use subtle pulse animation (`bg-slate-200 animate-pulse rounded`).

### 4.2 Empty States
- Always present an informative graphic or icon with an actionable primary button:
  - *No classes today*: "You have no scheduled lectures for today." + [View Full Week]
  - *No conflicts found*: "Zero conflicts detected across all venues and cohorts."
  - *No notifications*: "You're all caught up!"

### 4.3 Error States
- Banner-level errors for network/API failures with a clear `[Retry]` button.
- Field-level validation errors displayed directly beneath input controls with red text (`text-xs text-red-600 font-medium`).

---

## 5. Accessibility & Performance
- **WCAG AA Compliance**: All color combinations pass 4.5:1 contrast ratio.
- **Keyboard Navigation**: Full tab index accessibility across all interactive grid items and filters.
- **Bundle Optimization**: Dynamic imports for heavy data-grid or chart components.
