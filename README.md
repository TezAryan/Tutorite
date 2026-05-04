# Tutorite — Full-Stack Tutoring Platform

A platform where teachers upload time slots, students book one-to-one sessions, and sessions are conducted via live video calls. Built with **Next.js 14 (App Router)**, **JavaScript**, **MongoDB/Mongoose**, **NextAuth.js**, and **Tailwind CSS**.

---

## Scope of This Build

We will build all 6 phases in sequence. The plan below documents every file, model, API route, and UI screen. Each phase builds on the previous.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router, JS only) |
| Styling | Tailwind CSS |
| Database | MongoDB Atlas + Mongoose |
| Auth | NextAuth.js v4 (Credentials provider) |
| Video | Jitsi Meet (iframe embed, free) |
| Email | Resend (free tier) |
| File Storage | Cloudinary (free tier) |
| Deployment | Vercel |

---

## Phase 1 — Project Setup & Auth

### Project Init
```
npx create-next-app@latest ./ --js --tailwind --app --no-src-dir --no-import-alias
```

### Data Models

#### [NEW] `/models/User.js`
Base schema with `name`, `email`, `password` (bcrypt hashed), `role` (`student` | `teacher` | `admin`), `createdAt`.

#### [NEW] `/models/Teacher.js`
Extends user ref. Fields: `userId` (ref User), `bio`, `tags` (array of strings like `["DSA", "DBMS"]`), `subjects`, `averageRating`, `profileImage`.

#### [NEW] `/models/Student.js`
Fields: `userId` (ref User), `grade`, `profileImage`.

### Auth Setup

#### [NEW] `/lib/db.js`
Mongoose connection utility with connection caching.

#### [NEW] `/app/api/auth/[...nextauth]/route.js`
NextAuth with Credentials provider. Looks up user by email, verifies bcrypt password, returns session with `role` and `userId`.

#### [NEW] `/middleware.js`
Route protection:
- `/dashboard/teacher/*` → must have `role === 'teacher'`
- `/dashboard/student/*` → must have `role === 'student'`
- `/admin/*` → must have `role === 'admin'`
- Redirect unauthenticated users to `/login`

### API Routes

#### [NEW] `/app/api/register/route.js`
`POST` — Create user + Teacher or Student profile based on `role` field.

### Pages

#### [NEW] `/app/(auth)/login/page.js`
Login form (email + password). Role-based redirect after login.

#### [NEW] `/app/(auth)/register/page.js`
Register form with role selector (Student / Teacher). Teacher gets extra fields (bio, tags, subjects).

#### [NEW] `/app/page.js`
Landing page — hero section, features overview, CTA buttons.

---

## Phase 2 — Slot Management

### Data Model

#### [NEW] `/models/Slot.js`
Fields: `teacherId` (ref Teacher), `date`, `startTime`, `endTime`, `isBooked` (bool, default false), `maxStudents` (default 1). Unique index on `(teacherId, date, startTime)`.

### API Routes

#### [NEW] `/app/api/slots/route.js`
- `POST /api/slots` — Teacher creates a slot (auth guard: teacher role)
- `GET /api/slots?teacherId=...` — Get slots for a teacher (filters available only)

#### [NEW] `/app/api/slots/[id]/route.js`
- `DELETE /api/slots/:id` — Teacher deletes their own slot (only if not booked)

### Pages

#### [NEW] `/app/dashboard/teacher/slots/page.js`
Teacher's slot management UI. Time-picker to add slots. Table view of existing slots with delete option.

#### [NEW] `/app/dashboard/student/browse/page.js`
Browse all teachers. Filter by subject tag. For each teacher card, show name, tags, average rating, and available slots.

---

## Phase 3 — Booking System

### Data Model

#### [NEW] `/models/Booking.js`
Fields: `studentId` (ref Student), `teacherId` (ref Teacher), `slotId` (ref Slot), `status` (`pending` | `confirmed` | `cancelled` | `completed`), `doubtDescription` (string), `createdAt`.

### API Routes

#### [NEW] `/app/api/bookings/route.js`
- `POST /api/bookings` — Student books a slot. Sets slot `isBooked: true`. Sends confirmation email.
- `GET /api/bookings` — Fetch bookings for logged-in user (student sees their own; teacher sees bookings for them)

#### [NEW] `/app/api/bookings/[id]/route.js`
- `PATCH /api/bookings/:id` — Update status (cancel, confirm, complete)

### Pages

#### [NEW] `/app/dashboard/student/bookings/page.js`
Student's booking list. Shows teacher name, date, time, status badge, doubt preview.

#### [NEW] `/app/dashboard/teacher/bookings/page.js`
Teacher's upcoming bookings. Shows student name, doubt description preview, slot time, join session button.

---

## Phase 4 — Video Sessions

### Data Model

#### [NEW] `/models/Session.js`
Fields: `bookingId` (ref Booking), `roomName` (string), `startedAt`, `endedAt`, `duration` (minutes).

### API Routes

#### [NEW] `/app/api/sessions/route.js`
- `POST /api/sessions` — Create session log when "Join" is clicked
- `PATCH /api/sessions/[id]/route.js` — Mark session complete, log end time

### Pages

#### [NEW] `/app/session/[bookingId]/page.js`
Jitsi Meet iframe embedded with room `tutorite-{bookingId}`. "Join session" button only visible within 10 minutes of session start time.

---

## Phase 5 — Advanced Features

### Rating & Feedback

#### [NEW] `/models/Rating.js`
Fields: `sessionId`, `teacherId`, `studentId`, `stars` (1–5), `comment`, `createdAt`.

#### [NEW] `/app/api/ratings/route.js`
- `POST /api/ratings` — Student submits rating after session completes
- `GET /api/ratings?teacherId=...` — Fetch ratings for a teacher

After a rating is saved, recompute and update `Teacher.averageRating`.

### Email Reminders

#### [NEW] `/app/api/cron/reminders/route.js`
Called by Vercel Cron 1 hour before sessions. Queries bookings starting within next hour and sends email via Resend.

### Resource Sharing

#### [NEW] `/app/api/resources/route.js`
- `POST` — Teacher uploads a PDF/link to a booking. Store Cloudinary URL in `Session.resources`.

Resources array added to Session model: `[{ type: 'pdf'|'link', url, title }]`.

### Doubt History Dashboard

#### [NEW] `/app/dashboard/student/history/page.js`
All past bookings with teacher name, topic, date, status, resources shared. Filterable by date range and subject tag.

### Teacher Specialization Tags

Already on the Teacher model. Browse page shows tag badges and supports tag filtering.

---

## Phase 6 — Admin Dashboard

### Middleware Update
`/middleware.js` — Add admin role check for `/admin/*` routes.

### API Routes

#### [NEW] `/app/api/admin/stats/route.js`
MongoDB aggregation:
- Total sessions count
- Sessions this week
- Average rating per teacher
- Most booked subjects

#### [NEW] `/app/api/admin/teachers/route.js`
- `GET` — List all teachers with session count + average rating
- `PATCH /api/admin/teachers/[id]` — Disable/enable account

#### [NEW] `/app/api/admin/feedback/route.js`
All ratings with comments.

### Pages

#### [NEW] `/app/admin/page.js`
Stats cards: total sessions, active teachers, average platform rating, sessions this week.

#### [NEW] `/app/admin/teachers/page.js`
Teacher management table with disable/enable toggle.

#### [NEW] `/app/admin/feedback/page.js`
Paginated feedback log.

---

## UI Design System

- **Color palette**: Deep navy + electric violet accent + soft white text
- **Font**: Inter (Google Fonts)
- **Components**: Glassmorphism cards, gradient buttons, animated stat counters
- **Dark mode**: Default dark theme throughout

---

## Environment Variables Needed

```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RESEND_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Verification Plan

### Per Phase
1. **Phase 1**: Register as teacher + student, login, verify role-based redirect, check middleware blocks wrong role
2. **Phase 2**: Teacher adds/deletes slots, student sees them on browse page
3. **Phase 3**: Student books slot → isBooked flips → teacher sees booking with doubt
4. **Phase 4**: Join session opens Jitsi iframe, session log created
5. **Phase 5**: Rate session → averageRating updates on teacher card
6. **Phase 6**: Admin sees stats, can disable teacher account

### Browser Testing
Run browser subagent to verify each page renders correctly and flows work end to end.

---

## Open Questions

> [!IMPORTANT]
> **MongoDB connection**: Do you have a MongoDB Atlas URI ready, or should we use a local MongoDB? The `.env.local` will need `MONGODB_URI`.

> [!IMPORTANT]
> **Email reminders**: Do you want to set up Resend (free, requires account + API key) for email reminders, or skip email for now and add later?

> [!NOTE]
> **Cloudinary for resource sharing**: You'll need a free Cloudinary account for PDF uploads. We can mock this with just URL links initially and add real upload later.

> [!NOTE]
> **Admin account**: We'll seed a default admin user via a setup script. Is that OK, or do you want a specific email/password for the admin?



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
