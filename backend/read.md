High-level summary

We extend the existing Admin–Tutor–Student system with:

* **Email notifications** (admission letters, exam reminders, password reset, result notifications)
* **Role-based auth using JWT** (secure login + role checks)
* **Export features** (CSV / Excel via ExcelJS, PDF via PDFKit or Puppeteer)
* **Department performance charts** on the Admin dashboard (Chart.js)
* **File uploads** for student project submissions (multer / S3 / disk), with storage and access controls

All features are implemented server-side (Node/Express) with appropriate frontend hooks that call the APIs. The client remains HTML/CSS/JS (or React later).

---

# 🗂️ Updated file & folder structure

```
/project-root
├─ /frontend
│  ├─ index.html                # landing / login / signup
│  ├─ adminDashboard.html
│  ├─ tutorDashboard.html
│  ├─ studentDashboard.html
│  ├─ /css
│  │  └─ style.css
│  └─ /js
│     ├─ auth.js
│     ├─ data.js                # local dev shim talking to backend APIs
│     ├─ admin.js
│     ├─ tutor.js
│     └─ student.js
│
└─ /backend
   ├─ server.js
   ├─ /config
   │   ├─ db.js
   │   └─ mailer.js             # email transport config
   ├─ /models
   │   ├─ User.js
   │   ├─ Exam.js
   │   ├─ Question.js
   │   ├─ Submission.js
   │   ├─ Grade.js
   │   ├─ Complaint.js
   │   └─ Notification.js
   ├─ /controllers
   │   ├─ authController.js
   │   ├─ adminController.js
   │   ├─ tutorController.js
   │   ├─ studentController.js
   │   ├─ fileController.js
   │   └─ reportController.js
   ├─ /routes
   │   ├─ authRoutes.js
   │   ├─ adminRoutes.js
   │   ├─ tutorRoutes.js
   │   ├─ studentRoutes.js
   │   ├─ fileRoutes.js
   │   └─ reportRoutes.js
   ├─ /middleware
   │   ├─ authMiddleware.js      # verifies JWT
   │   └─ roleMiddleware.js      # checks role (admin/tutor/student)
   ├─ /uploads
   │   ├─ admissions/            # generated admission PDFs
   │   ├─ submissions/           # project files
   │   └─ photos/
   ├─ /jobs
   │   └─ scheduler.js           # cron jobs / reminder dispatch
   └─ /utils
       ├─ excel.js               # helpers using exceljs
       └─ pdf.js                 # pdf generation utilities
```

---

# 📚 Core data models (schema sketches)

Use MongoDB + Mongoose (or SQL equivalents). Key fields:

**User**

```js
{
  _id,
  name,
  email,
  passwordHash,
  role: 'admin' | 'tutor' | 'student',
  department,        // for tutors/students
  assignedTutorId,   // for students
  photoUrl,
  createdAt
}
```

**Exam**

```js
{
  _id,
  tutorId,
  department,
  title,
  description,
  timeLimitMinutes,
  assignedStudentIds: [..],    // optional: when tutor assigns to specific students
  questions: [ questionId, ... ],
  createdAt,
  startsAt,                    // optional schedule
  endsAt
}
```

**Question**

```js
{
  _id,
  examId,
  text,
  options: ['A','B','C','D'],
  correctIndex,   // integer index into options
  score           // weight for this question
}
```

**Submission**

```js
{
  _id,
  examId,
  studentId,
  answers: [{questionId, selectedIndex}],
  totalScore,
  maxScore,
  gradedAt,
  resultDetails, // optional per-question correctness
  startedAt,
  submittedAt
}
```

**Grade (attendance/project/test aggregate)**

```js
{
  studentId,
  dept,
  attendanceScore,
  projectScore,
  testScore,    // optional computed from Submissions
  lastUpdated
}
```

**Notification**

```js
{
  _id,
  type: 'admission'|'exam_reminder'|'result'|'general',
  userId,
  payload: {...},
  sentAt,
  read: boolean
}
```

---

# 🔌 Backend APIs (key endpoints)

> All protected endpoints require Authorization: `Bearer <jwt>`. Role checks enforced via `roleMiddleware`.

## Auth

* `POST /api/auth/signup` — sign up (role defaults to student or unassigned)
* `POST /api/auth/login` — returns JWT + user profile
* `POST /api/auth/refresh` — refresh token (optional)

## Admin

* `GET /api/admin/tutors` — list tutors (filter by dept)
* `POST /api/admin/tutors/assign` — assign tutor role / set department
* `DELETE /api/admin/tutors/:id`
* `GET /api/admin/students?dept=...` — students by dept
* `POST /api/admin/admissions/send` — generate & email admission letter to student(s)
* `GET /api/admin/reports/department/:dept` — aggregated analytics for the dept (for charts)
* `GET /api/admin/reports/export?dept=...&type=excel|pdf` — exports

## Tutor

* `POST /api/tutor/exams` — create exam (body includes questions)
* `PUT /api/tutor/exams/:id` — modify exam
* `GET /api/tutor/exams?dept=` — list exams for a tutor or department
* `POST /api/tutor/exams/:id/assign` — assign exam to selected students (pass array of studentIds)
* `POST /api/tutor/exams/:id/grade` — manually record/override grades or attendance/project scores
* `GET /api/tutor/students` — students in tutor’s department

## Student

* `GET /api/student/exams` — returns exams assigned or available for the student's department
* `POST /api/student/exams/:id/submit` — submit answers (server grades using correctIndex)
* `GET /api/student/submissions/:id` — view submission and scores
* `GET /api/student/admission/:id/download` — download admission letter

## Files

* `POST /api/files/submissions` — upload project submission (multer)
* `GET /api/files/submissions/:id` — download (auth + ownership check)
* `GET /api/files/admissions/:filename` — admission letter (only for that student)

## Notifications / Scheduler

* `POST /api/notifications/send` — immediate custom notification/email
* `GET /api/notifications` — list for user
* Scheduler job triggers send of exam reminders (see below)

---

# ✉️ Email notifications (design & implementation)

**When to send**

* Admission letter (when admin sends)
* Exam reminder (e.g., 24h or 1h before start)
* Exam result (on submission)
* Account actions (welcome, password reset)

**Implementation**

* Use `nodemailer` (or an email service API: SendGrid, Mailgun)
* `backend/config/mailer.js` contains SMTP or API client config
* Create a `Notification` document when sending email so admins can audit deliveries
* For scheduled reminders: use a job scheduler (cron or queue)

  * lightweight: `node-cron` that checks `Exam.startsAt` every minute and queues reminders to students
  * robust: use `Bull` (Redis-backed) for retries, backoff, concurrency

**Example flow (exam reminder)**

1. Tutor creates/schedules exam with `startsAt`.
2. A scheduled job (cron) queries upcoming exams starting in 24h / 1h.
3. For each exam, create Notification entries and call mailer to send email, and push in-app notification.

---

# 🔐 Role-based JWT auth

* Use `jsonwebtoken` to issue tokens on login. Example payload:

  ```js
  { userId, role: 'tutor', department: 'Frontend' }
  ```
* Tokens expire (e.g., 1h). Use refresh tokens if desired.
* Middleware:

  * `authMiddleware` — verify token and attach `req.user`.
  * `roleMiddleware(['admin'])` — only allows admins.
* Protect file download endpoints: only tutor/admin or the specific student can access.

---

# 📥 File uploads (project submissions & photos)

* Use `multer` for multipart file uploads.
* Storage options:

  * Local disk `/uploads/submissions` for dev,
  * S3 / Cloud Storage for production.
* Store metadata in `Submission` model: filename, path/url, uploadedBy, examId, timestamp.
* Security:

  * Validate file types/extensions and size limits.
  * Ensure only allowed users can upload for a given exam.
  * Use presigned URLs for downloads if using S3.

---

# 📈 Exports (Excel / PDF)

**Excel**

* Use `exceljs` to generate `.xlsx` files server-side.
* Example: `/api/admin/reports/export?dept=Frontend&type=excel`

  * Gather students & grades → build a sheet → stream `.xlsx` as response.

**PDF**

* Use `PDFKit` or render HTML + convert to PDF (`puppeteer`) for styled letters and reports.
* Admission letters can be generated as PDF and stored in `/uploads/admissions` and emailed as attachment.

---

# 📊 Department performance charts (Chart.js)

* Backend endpoint: `/api/admin/reports/department/:dept` returns JSON:

  ```json
  {
    "dept": "Frontend",
    "totalStudents": 120,
    "avgAttendance": 82,
    "avgExamScore": 73,
    "examDistribution": { "0-49": 12, "50-69": 34, "70-89": 52, "90-100": 22 },
    "trend": [ { date: '2025-09-01', avg: 72 }, ... ]
  }
  ```
* Frontend uses Chart.js to visualize:

  * Line chart for trend,
  * Bar chart for exam distribution,
  * Gauges / donut for averages.

---

# ✅ UX additions for workflows you mentioned

**Admission Letter (Admin → Student)**

* Admin composes letter → `POST /api/admin/admissions/send` with studentId(s) and optionally `generatePdf: true`.
* Backend generates PDF, stores it, sends email with PDF attachment, creates `Notification`.
* Student dashboard shows notification with "Download" button (calls file endpoint + logs download).

**Assign exam to specific students**

* Tutor creates exam with `assignedStudentIds` or calls `POST /api/tutor/exams/:id/assign` passing student IDs.
* Only assigned students (or students in the dept if left empty) can see/take the exam.

**Dynamic grading**

* Tutor sets per-question `score`.
* When student submits, backend calculates `totalScore = sum(question.score for each correct answer)`.
* Tutor can later override a student’s score via `/api/tutor/exams/:id/grade`.

---

# 🛡 Security & best practices

* Hash passwords with bcrypt (salted).
* Validate & sanitize all inputs.
* Use HTTPS in production and secure cookies if implementing refresh tokens.
* Rate-limit critical endpoints (login).
* Log important actions (admissions sent, exam created, grade changed).
* For sensitive files, never expose direct file paths; serve through authenticated endpoints or use presigned S3 URLs.

---

# 🧩 Example minimal tech stack & libs

**Backend**

* Node.js + Express
* MongoDB + Mongoose (or PostgreSQL + Sequelize)
* nodemailer / SendGrid
* multer (uploads)
* jsonwebtoken
* exceljs
* pdfkit or puppeteer
* node-cron or Bull (Redis)

**Frontend**

* Vanilla JS (fetch) or React later
* Chart.js for charts
* File input + FormData for uploads

---

# ✅ Next 



1. `/backend` skeleton (server, auth, models) + a working JWT auth example.
2. `/backend` mailer + sample admission PDF generation + endpoint to send email.
3. `/backend` exam endpoints + automatic grading on submission.
4. `/frontend` connected pages + `data.js` that calls the backend REST API.
5. A demo that runs fully in-browser using `localStorage` (no backend) to prototype the flows quickly.


