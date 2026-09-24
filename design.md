# Design System & UI Direction — Timy

## 1. Product Philosophy & Visual Identity
Timy is an academic utility built for Kisii University. It is an everyday tool used by students rushing between lecture halls, lecturers verifying their schedules, and timetable coordinators balancing hundreds of courses and venues.

### Anti-Patterns to Avoid:
- ❌ **No AI Slop**: No decorative pastel gradients, floating purple blobs, or generic crypto/SaaS glassmorphism cards.
- ❌ **No Wasted Whitespace**: Avoid massive paddings that force students to scroll endlessly just to see today's three lectures.
- ❌ **No Ambiguous Statuses**: Never use vague icons without labels or ambiguous color codes.

### Core Design Principles:
1. **High Information Density with Absolute Clarity**: Display course code, venue, time, and lecturer at a glance.
2. **Mobile-First & High Contrast**: Readable outdoors under direct sunlight on low-cost Android smartphone screens.
3. **Institutional Trust & Restraint**: Authoritative, clean typography, purposeful color accents, and crisp borders.
4. **Predictable State Transitions**: Clear visual feedback for cancelled classes, room moves, and rescheduled slots.

---

## 2. Color Palette & Semantics

| Token | Hex / HSL | Usage & Meaning |
|---|---|---|
| **Primary (Kisii Navy)** | `#0F2942` (`hsl(210, 63%, 16%)`) | Core brand, headers, primary action buttons, navigation bars |
| **Secondary (Academic Slate)**| `#1E3A8A` (`hsl(224, 64%, 33%)`) | Active tabs, section highlights, interactive elements |
| **Surface Ground** | `#F8FAFC` (`hsl(210, 40%, 98%)`) | Page background, clean neutral base |
| **Card / Surface Elevated** | `#FFFFFF` (`hsl(0, 0%, 100%)`) | Timetable slot cards, modals, content containers |
| **Border Neutral** | `#E2E8F0` (`hsl(214, 32%, 91%)`) | Crisp 1px borders, table dividers, card boundaries |
| **Text Primary** | `#0F172A` (`hsl(222, 47%, 11%)`) | Headings, main timetable slot titles, course codes |
| **Text Muted** | `#64748B` (`hsl(215, 16%, 47%)`) | Timings, lecturer names, secondary metadata |
| **Urgent Alert (Cancelled/Clash)**| `#DC2626` (`hsl(0, 72%, 51%)`) | Cancelled classes, blocking venue clashes, error alerts |
| **Warning / Rescheduled** | `#D97706` (`hsl(38, 92%, 50%)`) | Rescheduled lecture, venue swap pending, warning banners |
| **Success / Published** | `#16A34A` (`hsl(142, 76%, 36%)`) | Confirmed venue, active class in session, published timetable |

---

## 3. Typography & Hierarchy
- **Primary Typeface**: Inter or Plus Jakarta Sans (via `next/font/google`). Clean humanist sans-serif with excellent legibility at micro sizes (11px–13px).
- **Monospace Typeface**: JetBrains Mono or Roboto Mono for Course Codes (`SOEN 311`, `ACMP 353`) and Timeslots (`08:00 - 11:00`).

### Type Scale:
- `Page Title (h1)`: 24px (1.5rem), font-weight 700, line-height 1.2
- `Section Header (h2)`: 18px (1.125rem), font-weight 600, line-height 1.3
- `Slot Title / Unit Name`: 14px (0.875rem), font-weight 600, line-height 1.4
- `Body / Metadata`: 13px (0.8125rem), font-weight 400, line-height 1.5
- `Micro Badge / Timestamp`: 11px (0.6875rem), font-weight 500, uppercase letter-spacing 0.05em

---

## 4. Timetable Visualization Patterns

### 4.1 Mobile View (Default for Students)
- **Daily Agenda Stream**: Tabs for [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] with the current day auto-selected.
- **Slot Card anatomy**:
  - Top row: Course Code badge (`COMP 210`) + Status badge (`CONFIRMED` / `MOVED` / `CANCELLED`).
  - Middle row: Full Course Unit Title (`Object-Oriented Programming`).
  - Bottom row: Venue (`LH 26`) with icon + Lecturer (`Dr. Gordon Ouma`) + Time (`10:00 - 12:00`).
- **"Happening Now" Indicator**: Subtle green left border accent (3px) on currently active lecture session.

### 4.2 Desktop View (For Timetable Coordinators & Admins)
- **Matrix Grid**: Columns = Days of the Week (Monday to Friday/Saturday); Rows = Standard Academic Time Slots (07:00–10:00, 10:00–13:00, 13:00–16:00, 16:00–19:00).
- **Conflict Highlighting**: Red diagonal hatch or prominent alert badge when multiple classes overlap in the same cell.

---

## 5. Component Principles
- **Modals**: Restricted to confirmation actions (e.g., "Confirm Rescheduling to LH 26", "Publish Timetable v1.2").
- **Badges**: Functional and compact. Maximum 2 badges per card.
- **Empty States**: Must be educational (e.g., "No classes scheduled for Wednesday. Enjoy your free study day!" or "Upload a timetable file to begin parsing.").
- **Loading Skeletons**: Match exact layout geometry to prevent content layout shifts (`CLS`).
