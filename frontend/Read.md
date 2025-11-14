*SYSTEM OVERVIEW**

### **Purpose**

The **DCH Academy Management System** is a comprehensive web platform that connects administrators, tutors, and students under one system.
It allows for seamless management of academic operations such as tutor assignment, student admissions, exam creation, grading, analytics, and communication.

---

##  **USER ROLES & CAPABILITIES**

### **Admin**

The **Admin** is the overall system controller.
Can perform the following functions:

* Assign tutor roles to registered users based on **department/field** (e.g., Frontend, Cyber Security, Dispatch, Data Analysis, etc.)
* Remove tutors
* View all **tutors** and **students** per department
* Send **admission letters** to students (students can download them)
* Receive **complaints** from students
* View and **download reports** (students report, tutors report, and general analytics)
* Analyze data across departments (number of students, tutors, exams, performance rates, etc.)
* Manage system data and backups

---

###  **Tutor**

Tutors are assigned by Admin after registration.
They can:

* View students assigned to them (based on department)
* Create and manage **exams**

  * Add multiple questions
  * Set options (A, B, C, D)
  * Select correct answers
  * Set marks per question and total exam time
* Assign exams to **specific students**
* Input grades for:

  * Attendance
  * Test
  * Project
* View student performance (exam results + other grades)
* Generate department performance reports

---

### **Student**

Students are registered users who choose a **course of study/department** during sign-up.
They can:

* View only exams from their assigned tutor (same field)
* Take exams within the allocated time
* Instantly see **exam results** and **overall grades**
* View and **download admission letters** sent by Admin
* Send **complaints** to Admin
* View performance history and progress analytics

---

##  **SYSTEM STRUCTURE**

### **Frontend (Client-Side)**

The frontend will be built using:

* **HTML**, **CSS**, **JavaScript** (Vanilla JS or React version later)
* **LocalStorage / API calls** for data persistence or backend communication

#### 📁 **Frontend File & Folder Structure**

y

---

## 🔗 **DATA CONNECTION FLOW**

| Action               | Source            | Destination        | Description                                    |
| -------------------- | ----------------- | ------------------ | ---------------------------------------------- |
| Admin assigns Tutor  | Admin Dashboard   | data.js / Database | Adds tutor with department info                |
| Student registers    | Student Signup    | data.js / Database | Student linked to department                   |
| Tutor creates exam   | Tutor Dashboard   | data.js / Database | Exam stored with department info               |
| Student views exam   | Student Dashboard | data.js / Database | Only exams matching student’s department shown |
| Student submits exam | Student Dashboard | data.js / Database | Score auto-calculated and saved                |
| Tutor adds grades    | Tutor Dashboard   | data.js / Database | Updates student’s overall grade                |
| Admin views reports  | Admin Dashboard   | data.js / Database | Pulls data per department for analytics        |

---

## 📊 **FUTURE ADDITIONS**

* Email notifications (exam reminder, admission letter, etc.)
* Role-based authentication using JWT
* Export data to Excel or PDF
* Department performance charts (via Chart.js)
* File uploads for project submissions


