# SPEC-005. Timy public landing page

**Date**: 2026-11-18
**Status**: In Progress

## Summary

Timy needs a public product page before its university portal. This spec introduces a responsive landing page that explains the system through its existing capabilities and keeps the current sign in and role access behavior. The Sign Up page explains how to request an account, without adding public account creation.

## Context

The root route currently displays the sign in form. A first time visitor therefore has to understand the product from an authentication screen. The project is now being prepared for its final demonstration, so the public experience needs to present Timy as an already developed academic timetable and venue management system.

The application already has student, lecturer, timetable officer, and administrator experiences, but it has no separate public landing page or registration route. The root layout also waits for session restoration before showing its children. The page must remain useful without a signed in session, while existing role checks and portal operations continue to work.

The repository has no landing page photographs or screenshots in its `public/` assets. Public product visuals must explain the real system without exposing real student records, inventing features, or implying unsupported institutional endorsements.

> Premise note: The current authentication system has no public registration flow. A Sign Up button cannot create an account without expanding authentication. The agreed scope uses an account access information page and leaves account creation unchanged.

## Requirements

**User stories**:

* As a student, lecturer, timetable officer, or administrator, I want to understand Timy's current capabilities before I sign in so that I know how the system supports my work.
* As a university user, I want to reach the existing sign in page from the public site so that I can continue to my role based portal.
* As a visitor without an account, I want clear account access instructions so that I know how to request university access.

**Acceptance criteria**:

* **AC-1**: A signed out visitor opening `/` sees the public Timy landing page, not the sign in form or a session loading screen. The page content remains visible if session restoration is slow or fails.
* **AC-2**: The navigation presents Overview, Features, How it works, and FAQs in that order, followed by clearly visible Sign In and Sign Up actions. The links target `#overview`, `#features`, `#how-it-works`, and `#faqs`; Sign In opens `/login` and Sign Up opens `/signup`.
* **AC-3**: `/signup` explains that accounts are issued by the university administrator and links to `/login`. It does not create accounts, submit registration data, or add an authentication API.
* **AC-4**: A signed in user opening `/` is sent to `/dashboard` after the existing session check succeeds. A successful sign in continues to `/dashboard`; the dashboard continues to render the existing role appropriate view. No return URL behavior is added.
* **AC-5**: A signed out visitor opening a protected portal route is sent directly to `/login`. Successful sign in continues to `/dashboard`, matching the current flow. Existing role checks and protected API behavior remain in place.
* **AC-6**: The landing page explains what Timy is, the scheduling problem it addresses, how the system works, who it serves, and the benefits supported by its current implementation.
* **AC-7**: The page includes dedicated visual sections for timetable setup and administration, venue availability and conflict detection, schedule changes, student timetable access, lecturer timetable management, and academic announcements and notifications. It also includes an overview, a getting started explanation, FAQs, a closing action, and a footer.
* **AC-8**: Page copy describes only current system capabilities. It does not present future scope as available, describe Timy as a proposal, or use invented testimonials, ratings, usage metrics, institutional approvals, or partner logos.
* **AC-9**: The page uses the live portal colors `#1a2f5c` and `#3b6fd4`, an editorial product story, locally stored licensed university related photography, and product demonstrations based on existing Timy screens. Availability checks and postponement are shown with explanatory diagrams, not as portal controls or screenshots. Demonstration data is synthetic and anonymized, with no real student names, IDs, or private records.
* **AC-10**: The landing page works at mobile, tablet, and desktop widths using existing Tailwind breakpoints, without horizontal overflow. The mobile menu opens and closes by button, Escape, and link selection. Escape and the close action return focus to its trigger; selecting an anchor moves focus to its target section. Navigation, disclosures, and actions are keyboard accessible, have visible focus, and honor reduced motion preferences.
* **AC-11**: Public page content renders without requiring a successful authentication API request. Images are optimized and served as local assets with a readable fallback. Motion uses native CSS, keeps content visible without animation, and does not add an animation library.
* **AC-12**: Public metadata uses the title `Timy | Academic Timetable and Venue Management`, a summary based on the verified product description, the canonical root URL based on `APP_URL`, and a local 1200 by 630 social sharing image. `SoftwareApplication` structured data contains only the verified name, education category, web platform, description, and URL, with no price, rating, or endorsement claims. The sitemap lists only `/`, login and signup pages are not indexed, and robots rules exclude protected portal and API routes without replacing authorization.

## Options considered

### Option 1: Keep the sign in screen at the root

The current root page remains the sign in form, with product information added elsewhere. This makes the smallest route change, but visitors still encounter authentication before learning what Timy does. (basis: `src/app/page.tsx` and the requested first visit experience)

**Pros**:

* Preserves the current root behavior without changing public routes.
* Requires the least implementation work.

**Cons**:

* Does not meet the requirement for a public product introduction.
* Keeps the sign in screen as the first impression for new visitors.

### Option 2: Make the root public and keep authentication on its own route

The root route becomes the product landing page. The existing sign in form moves to `/login`, and `/signup` explains the university account access process. The portal and authentication API remain in the same application. (basis: `src/legacy-pages/LoginPage.tsx`, `src/contexts/AuthContext.tsx`, and the requested separate public experience)

**Pros**:

* Gives new visitors a complete product introduction before sign in.
* Preserves the existing authentication API and role checks.
* Avoids a second deployment and shared session configuration.

**Cons**:

* Requires updating the public route allowlist and protected route redirect.
* Adds a public account information page that does not create an account.

### Option 3: Host a separate marketing site

A distinct site or subdomain hosts marketing content while the existing application remains the portal. This provides stronger deployment separation but adds domain, hosting, and session boundary work. (basis: existing Next.js application and the requirement to retain its authentication)

**Pros**:

* Separates marketing content from portal code.
* Allows the two experiences to deploy independently.

**Cons**:

* Adds deployment and domain configuration for a page that can live in the current application.
* Increases the chance of sign in, CSRF, and session integration problems.

## Decision

**Chosen option**: Option 2: Make the root public and keep authentication on its own route.

Use the existing Next.js application for the landing page, login route, and account access information page. Keep existing authentication and role checks, while making the public routes render before session restoration completes. (basis: `src/app/layout.tsx`, `src/components/auth/RoleGuard.tsx`, `SPEC-001-auth-and-rbac.md`, and the agreed route behavior)

## Rationale

Timy already has the role protected portal, login form, and authentication API in one Next.js application. Making the root a public page meets the first visit requirement without introducing another deployment or changing authentication. Directing protected routes to `/login` keeps deep links useful after the root becomes public.

The product story will follow the operational lifecycle chosen for the page, from timetable setup and conflict checks through schedule changes and the student and lecturer experience. It will use the live portal colors rather than the different values in `design.md`, because visual continuity with the implemented portal was selected. Zoom is a quality reference for varied product storytelling and imagery only. Its brand, copy, assets, and page layout will not be reused. (basis: `src/components/layout/Sidebar.tsx`, `design.md`, and the Zoom homepage)

## Feature design

**Data model sketch**:

None. The landing page and account access information page use static content. No database migration or model change is needed.

**Visual direction and composition**:

Use an editorial product story with purposeful whitespace, strong typography, varied section compositions, restrained blue accents, and no generic card grid or decorative gradients. Keep the existing Timy icon and wordmark pattern.

Use this approved copy direction:

* Hero headline: “A clearer view of every class.”
* Hero summary: “Timy brings academic timetables, venue coordination, class changes, announcements, and notifications together for Kisii University.”
* Overview: “From timetable setup and venue checks to class updates and student notifications, Timy gives each university role a dedicated way to work with the academic schedule.”
* Describe benefits only through verified outcomes: students can find class details, timetable officers can prepare and manage schedules, and users can receive in app updates.

The hero action “Explore how it works” scrolls to `#how-it-works`. The sticky navigation links, in order, to Overview (`#overview`), Features (`#features`), How it works (`#how-it-works`), and FAQs (`#faqs`). The overview, feature group, how it works, and FAQ sections own those IDs; each feature section also has one of these IDs: `#timetable-operations`, `#venue-availability`, `#schedule-changes`, `#student-timetable`, `#lecturer-timetable`, and `#announcements-notifications`. Set anchor scroll margins so the sticky navigation does not cover section headings.

Present the system in this order:

1. Hero with a product promise, an Explore how it works action, and a product visual.
2. Product overview that explains the scheduling and communication problem.
3. Timetable setup and administration, including import, preview, validation, publishing, and venue management. Demonstrate `ImportTimetable`, `TimetableManagement`, and `VenueManagement`.
4. Venue availability and scheduling conflict detection. Demonstrate the existing conflict screen. Venue availability is an authenticated API capability with no current portal screen, so explain it with a diagram and do not show a fabricated portal control.
5. Class changes, including cancellations, postponements, and rescheduling. Demonstrate existing cancellation and rescheduling screens. Postponement is an authenticated API capability with no current portal control, so explain it with a diagram rather than a screenshot.
6. Student timetable access and class information. Demonstrate `StudentTimetable`.
7. Lecturer timetable and assigned class information. Demonstrate `LecturerTimetable` as a read view for assigned classes, day selection, and weekly overview. Explain that lecturers receive class updates, but do not imply this screen edits or reschedules entries.
8. Academic announcements and notifications. Demonstrate `Announcements` and `Notifications`.
9. How to get started, FAQs, a closing action, and a professional footer.

Use licensed campus, classroom, or lecture hall photography for the hero and selected story sections. Product demonstrations are read only images rendered from current Timy screens using synthetic fixture data where feasible. When a screen cannot be rendered safely with fixtures, create a static landing visual based on its verified layout and controls. Do not mount full portal pages on the public route, call protected APIs, or copy real looking names and IDs from the conflict screen. Availability and postponement visuals are explanatory diagrams, not screenshots or interactive controls. Store images locally and record each source, license, attribution requirement, alt text, and focal point in an asset manifest. Use a 16 by 9 hero image and 4 by 3 supporting images, with responsive sizes. The hero image loads eagerly; other images load lazily. If an image cannot load, retain the text and show a neutral brand background.

The “How it works” section explains this current flow: timetable officers prepare and manage schedules and venues, the system supports conflict checks and venue availability services, lecturers review assigned classes, students view their timetables, and schedule changes or announcements reach users through existing notifications. The getting started steps are: contact the university administrator for an account, sign in at `/login`, then use the role appropriate dashboard. Include these FAQ questions and answer them from the verified capabilities: “What is Timy?”, “Who can use Timy?”, “How do I get an account?”, “What can I do in Timy?”, and “How will I know when a class changes?” State that accounts come from a university administrator and schedule updates are available through existing notifications. Do not imply that Sign Up creates an account. Do not advertise course registration, examination management, fee management, future features, or public registration.

The closing action invites users to sign in or request an account through Sign Up. The footer contains the Timy mark, this product description, “Academic timetable and venue management for Kisii University”, section links, Sign In, and Sign Up. Do not add contact, privacy, terms, social, or legal links unless verified destinations are supplied.

**Component inventory**:

* New public navigation with section anchors, responsive menu, Sign In, and Sign Up actions.
* New hero, overview, lifecycle feature sections, getting started section, FAQ, closing action, and footer.
* Reuse the current Timy mark, button patterns, typography, and colors where they fit.
* Use native `<details>` and `<summary>` disclosures for FAQs and native CSS transitions for subtle motion.
* Use Tailwind's existing `sm`, `md`, and `lg` breakpoints. Collapse navigation below `md`; stack feature visuals on small screens and use alternating split layouts at larger widths.
* On mobile, expose the menu state with `aria-expanded` and `aria-controls`. Close it with Escape, its close action, or a selected link. Escape and the close action return focus to the trigger; selecting an anchor moves focus to its target section.
* Keep content visible if the browser does not run motion code. Disable nonessential movement and smooth scrolling when reduced motion is requested.

**Data consistency**:

No live timetable or personal data is loaded for the landing page. Product demonstrations use static, anonymized values that match existing screen components. The page remains informative when the authentication service is unavailable.

**Public metadata**:

Use the existing validated `env.APP_URL` as `metadataBase`. It defaults to localhost for local development; production deployment must set it to the public site origin. The canonical URL is the normalized root URL with a trailing slash. Existing environment parsing rejects invalid URLs; do not add another fallback or a new setting. The title is `Timy | Academic Timetable and Venue Management`. The summary is `Timy helps students, lecturers, and university administrators manage academic timetables, venue availability, class changes, announcements, and notifications at Kisii University.` Build the 1200 by 630 Open Graph and social sharing image locally from the selected blue palette and an existing product screen visual. Its alternative text is `Timy academic timetable and venue management`.

Add `SoftwareApplication` structured data with the name `Timy`, `applicationCategory` set to `EducationalApplication`, `operatingSystem` set to `Web`, the same verified summary, and the canonical URL. Omit price, ratings, reviews, publisher, and institutional endorsement claims. List only `/` in the sitemap. Mark `/login` and `/signup` as not for indexing. The robots file disallows these protected route prefixes: `/api`, `/admin`, `/announcements`, `/cohorts`, `/conflicts`, `/courses`, `/dashboard`, `/departments`, `/import`, `/notifications`, `/rescheduling`, `/timetable`, and `/venues`. These crawler rules are not security controls. Portal pages and APIs remain protected by the existing authorization checks.

**API surface**:

| Route | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/` | GET | None | Public landing page | Public | Static page failure only |
| `/login` | GET | None | Existing sign in form | Public | Existing sign in errors |
| `/signup` | GET | None | Account access instructions and link to `/login` | Public | Static page failure only |
| `/api/v1/auth/login` | POST | `identifier` string, `password` string | Existing user and session cookie | Public | Existing invalid credential and service errors |
| `/dashboard` | GET | Existing session | Existing role appropriate portal view | Authenticated | Redirect to `/login` when signed out; existing role guard behavior |

No new API endpoint is introduced. `/api/v1/auth/login` retains its existing request and response behavior.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Explain Timy and its feature sections | Product description and currently implemented capabilities | User requirements, `docs/scope/mvp-scope.md`, existing feature pages, and `SPEC-001` through `SPEC-004` |
| Render product demonstrations | Screen layout and available controls | Existing Timy page and component implementations |
| Populate product demonstrations | Example timetable and venue details | Static anonymized demonstration values; no production user records |
| Render the feature story | Import and schedule management | `src/legacy-pages/officer/ImportTimetable.tsx` and `src/legacy-pages/officer/TimetableManagement.tsx` |
| Render venue and conflict story | Conflict types, severity, and availability capability | `src/legacy-pages/officer/ConflictDetection.tsx` and authenticated `GET /api/v1/venues/availability`; the availability API has no current portal screen |
| Render schedule change story | Cancellation and rescheduling screens, plus postponement capability | `src/legacy-pages/officer/TimetableManagement.tsx`, `src/legacy-pages/officer/Rescheduling.tsx`, and authenticated `POST /api/v1/timetable-entries/{id}/postpone`; postponement has no current portal control |
| Render student and lecturer story | Timetable fields and views | `src/legacy-pages/student/StudentTimetable.tsx` and `src/legacy-pages/lecturer/LecturerTimetable.tsx`; the lecturer screen is a read view |
| Render communication story | Announcement and notification fields and actions | `src/legacy-pages/shared/Announcements.tsx` and `src/legacy-pages/shared/Notifications.tsx` |
| Render navigation and actions | Section IDs, `/login`, and `/signup` destinations | Decisions recorded in this spec |
| Show brand colors | `#1a2f5c` and `#3b6fd4` | Existing login and sidebar styles, confirmed by the engineer |
| Render canonical metadata | Public site origin | Validated `env.APP_URL`; local default is `http://localhost:3000`, production deployment sets the public origin |
| Render social sharing metadata | Page title and summary | Verified product description in this spec |
| Render social sharing image | Timy brand and product screen visual | New local asset using the selected palette and existing screen components |
| Render structured software data | Name, category, platform, description, and URL | User supplied product identity, existing Next.js application, verified copy, and `APP_URL` |
| Render campus and classroom photography | Locally stored licensed image assets | Asset manifest records the source, license, attribution, alt text, and focal point |
| Route an authenticated visitor | Role home at `/dashboard` | Existing `ROLE_HOME` mapping and role guard |

**Key invariants**:

* Only `/`, `/login`, and `/signup` are public page routes. Portal pages and protected APIs retain their existing authorization rules.
* A public landing page render does not wait for session restoration or require live timetable data.
* Sign Up does not create an account. Accounts continue to be issued by the university administrator.
* Public product demonstrations do not contain real student names, IDs, or private records.
* Published copy and visuals do not claim unsupported or future capabilities.
* Stock photographs are stored locally after license verification. The page does not depend on remote image hosts at runtime.
* A signed in visitor at `/` continues to the existing role home. A signed out visitor opening a protected route goes directly to `/login`.
* Successful sign in continues to `/dashboard`. Do not add a protected route return target.
* Venue availability and postponement are API supported capabilities, not existing portal controls. Their landing page visuals are explanatory diagrams only.
* Lecturer timetable demonstrations show assigned class information and timetable views, not schedule editing controls.
* Product visuals use synthetic fixture data and never mount authenticated portal pages or fetch live records.
* Robots rules guide crawlers and never replace route guards or API authorization.

**Security model**:

The landing and account access pages are public and contain no user specific data. Login continues to use the existing authentication flow. `/dashboard` and all other portal routes remain behind the existing role guard. The root route renders immediately while session restoration runs; a confirmed session redirects to `/dashboard`, while a signed out or unverifiable session leaves the public content visible. A protected route redirects a signed out visitor to `/login`. No authorization rule or session API is weakened. Robots and noindex directives do not provide access control.

**Critical test scenarios**:

* Happy path: a signed out visitor sees the landing page, follows an anchor, opens `/login`, and signs in to `/dashboard`, verifies **AC-1**, **AC-2**, **AC-4**, **AC-6**, and **AC-7**.
* Failure case: `/api/v1/auth/me` returns unauthenticated, fails, or responds slowly and the public landing page remains visible; a missing image uses its local fallback, verifies **AC-1** and **AC-11**.
* Account access: `/signup` explains account access and links to `/login` without submitting a registration request, verifies **AC-3**.
* Auth and permission: test signed in and signed out visits to `/`, `/login`, `/signup`, and protected routes; sign in always ends at `/dashboard`, verifies **AC-3**, **AC-4**, and **AC-5**.
* Responsive and accessibility: test menu open, close, Escape, link selection, focus return, anchor offsets, reduced motion, and layout at the default mobile, tablet, and desktop breakpoints, verifies **AC-10**.
* Public metadata: verify exact title and summary, trailing slash canonical URL, 1200 by 630 image, structured data fields, validated `APP_URL` usage, sitemap contents, and crawler exclusions, verifies **AC-12**.

## Build plan

The project has no recorded build approach. This plan assumes a Tracer Bullet, first connecting the public route and existing authentication flow, then adding the full visual story and quality work.

1. Make `/` a public route, move the existing sign in page to `/login`, add the account access page at `/signup`, and update guard behavior so public pages render during session restoration, protected routes send signed out users to `/login`, and successful sign in still ends at `/dashboard`. Do not add a return target or change authentication APIs, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, and **AC-5**.
2. Build the hero, overview, exact section anchors, verified copy, and lifecycle story. Map each visual to the existing components and use explanatory diagrams, not fictional portal controls, for API only capabilities, satisfies **AC-6**, **AC-7**, **AC-8**, and **AC-9**.
3. Add local licensed photography and its asset manifest, the responsive navigation and section layouts, accessible disclosures, and CSS motion with reduced motion support, satisfies **AC-7**, **AC-9**, **AC-10**, and **AC-11**.
4. Add exact public metadata, canonical origin from validated `env.APP_URL`, local social image, structured software information, sitemap, robots, and noindex rules, satisfies **AC-12**.
5. Add the route matrix, session failure, sign in, responsive, accessibility, image fallback, and metadata tests, satisfies **AC-1** through **AC-12**.

## Consequences

**Positive**:

* New visitors can understand Timy before signing in.
* Existing authentication APIs, user accounts, and role permissions stay unchanged.
* Product claims and demonstrations remain tied to implemented features.
* Public content can render even when session restoration is slow or unavailable.

**Negative / tradeoffs**:

* Visitors who need an account must contact a university administrator; public registration remains unavailable.
* Local photographs add assets to the repository and require license records.
* Product demonstrations must be updated when the underlying screens change.

**Neutral**:

* The root route changes from a login page to a public page.
* A new `/login` route hosts the existing sign in form.
* `APP_URL` is reused for canonical metadata, with no new deployment setting.

## Follow-up

* [ ] The root `AGENTS.md` describes a Vite scaffold, while `package.json` and `src/app` use Next.js. Reconcile the project guidance before future work that relies on it.

## References

**Project sources**:

* `docs/scope/mvp-scope.md` for current and future product boundaries.
* `docs/specs/SPEC-001-auth-and-rbac.md` for the existing authentication contract.
* `src/app/page.tsx`, `src/app/layout.tsx`, and `src/components/auth/RoleGuard.tsx` for current routing and session behavior.
* `src/server/config/env.ts` for the validated `APP_URL` value and its local development default.
* `src/legacy-pages/LoginPage.tsx`, `src/contexts/AuthContext.tsx`, and `src/components/layout/Sidebar.tsx` for current sign in and brand patterns.
* `src/legacy-pages/officer/ImportTimetable.tsx`, `TimetableManagement.tsx`, `ConflictDetection.tsx`, `VenueManagement.tsx`, and `Rescheduling.tsx` for existing timetable operations.
* `src/legacy-pages/student/StudentTimetable.tsx`, `src/legacy-pages/lecturer/LecturerTimetable.tsx`, `src/legacy-pages/shared/Announcements.tsx`, and `Notifications.tsx` for existing user experiences.
* `src/app/api/v1/venues/availability/route.ts` and `src/app/api/v1/timetable-entries/[id]/postpone/route.ts` for API supported capabilities that do not have matching portal controls.
* `design.md` for existing visual principles and the documented color palette.

**Practices & standards**:

* Next.js App Router server rendering and metadata conventions.
* WCAG 2.2 principles for keyboard access, visible focus, contrast, and reduced motion.
* Local image optimization and license tracking for reliable, rights aware media.

**Links**:

* Zoom homepage, studied as a product storytelling quality reference only: https://www.zoom.com/
