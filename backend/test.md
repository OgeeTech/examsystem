I'll prepare all the test routes you can paste directly into your browser to test the complete system. Here are the organized test routes:

## 1. **Authentication Test Routes**

### Signup Routes:
```
http://localhost:5000/api/auth/signup
```
**Test Data for POST:**
```json
{
  "name": "Test Admin",
  "email": "admin@test.com",
  "password": "password123",
  "role": "admin"
}
```

```
http://localhost:5000/api/auth/signup
```
**Test Data for POST:**
```json
{
  "name": "Test Tutor",
  "email": "tutor@test.com",
  "password": "password123",
  "role": "tutor",
  "department": "Computer Science"
}
```

```
http://localhost:5000/api/auth/signup
```
**Test Data for POST:**
```json
{
  "name": "Test Student",
  "email": "student@test.com",
  "password": "password123",
  "role": "student",
  "department": "Computer Science"
}
```

### Login Routes:
```
http://localhost:5000/api/auth/login
```
**Test Data for POST:**
```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

## 2. **Admin Test Routes** (Requires Admin Token)

### Get Tutors:
```
http://localhost:5000/api/admin/tutors
```
**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN_HERE
```

### Get Students:
```
http://localhost:5000/api/admin/students
```
**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN_HERE
```

### Send Admission Letters:
```
http://localhost:5000/api/admin/admissions/send
```
**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN_HERE
```
**Test Data for POST:**
```json
{
  "studentIds": ["STUDENT_ID_HERE"],
  "admissionDetails": {
    "program": "Bachelor of Computer Science"
  }
}
```

### Department Reports:
```
http://localhost:5000/api/admin/reports/department/Computer%20Science
```
**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN_HERE
```

## 3. **Tutor Test Routes** (Requires Tutor Token)

### Create Exam:
```
http://localhost:5000/api/tutor/exams
```
**Headers:**
```
Authorization: Bearer YOUR_TUTOR_TOKEN_HERE
```
**Test Data for POST:**
```json
{
  "title": "Midterm Exam",
  "description": "Test your knowledge from chapters 1-5",
  "timeLimitMinutes": 60,
  "department": "Computer Science",
  "questions": [
    {
      "text": "What is 2 + 2?",
      "questionType": "multiple_choice",
      "options": ["3", "4", "5", "6"],
      "correctIndex": 1,
      "score": 5
    },
    {
      "text": "What is the capital of France?",
      "questionType": "multiple_choice",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctIndex": 2,
      "score": 5
    }
  ]
}
```

### Get Tutor Exams:
```
http://localhost:5000/api/tutor/exams
```
**Headers:**
```
Authorization: Bearer YOUR_TUTOR_TOKEN_HERE
```

### Get Tutor Students:
```
http://localhost:5000/api/tutor/students
```
**Headers:**
```
Authorization: Bearer YOUR_TUTOR_TOKEN_HERE
```

## 4. **Student Test Routes** (Requires Student Token)

### Get Available Exams:
```
http://localhost:5000/api/student/exams
```
**Headers:**
```
Authorization: Bearer YOUR_STUDENT_TOKEN_HERE
```

### Start Exam:
```
http://localhost:5000/api/student/exams/EXAM_ID_HERE/start
```
**Headers:**
```
Authorization: Bearer YOUR_STUDENT_TOKEN_HERE
```

### Submit Exam:
```
http://localhost:5000/api/student/exams/EXAM_ID_HERE/submit
```
**Headers:**
```
Authorization: Bearer YOUR_STUDENT_TOKEN_HERE
```
**Test Data for POST:**
```json
{
  "answers": [
    {
      "questionId": "QUESTION_ID_1",
      "selectedIndex": 1
    },
    {
      "questionId": "QUESTION_ID_2", 
      "selectedIndex": 2
    }
  ]
}
```

### Get Student Grades:
```
http://localhost:5000/api/student/grades
```
**Headers:**
```
Authorization: Bearer YOUR_STUDENT_TOKEN_HERE
```

## 5. **File Upload Test Routes**

### Upload Project Submission:
```
http://localhost:5000/api/files/submissions
```
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```
**Form Data:**
- `files`: (Select files)
- `examId`: "EXAM_ID_HERE"
- `description`: "My project submission"

## 6. **Notification Test Routes**

### Get Notifications:
```
http://localhost:5000/api/notifications
```
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Mark Notification as Read:
```
http://localhost:5000/api/notifications/NOTIFICATION_ID/read
```
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## 7. **Frontend Test Routes** (HTML Pages)

### Admin Dashboard:
```
http://localhost:3000/adminDashboard.html
```

### Tutor Dashboard:
```
http://localhost:3000/tutorDashboard.html
```

### Student Dashboard:
```
http://localhost:3000/studentDashboard.html
```

### Login Page:
```
http://localhost:3000/index.html
```

## 8. **Complete Test Flow**

### Step 1: Create Test Users
1. Open Postman or browser console
2. POST to `/api/auth/signup` with admin, tutor, and student data

### Step 2: Login as Admin
```
POST http://localhost:5000/api/auth/login
{"email":"admin@test.com","password":"password123"}
```
**Save the token from response**

### Step 3: Test Admin Routes
```
GET http://localhost:5000/api/admin/tutors
Authorization: Bearer YOUR_ADMIN_TOKEN

GET http://localhost:5000/api/admin/students  
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Step 4: Login as Tutor
```
POST http://localhost:5000/api/auth/login
{"email":"tutor@test.com","password":"password123"}
```
**Save the token**

### Step 5: Create Exam as Tutor
```
POST http://localhost:5000/api/tutor/exams
Authorization: Bearer YOUR_TUTOR_TOKEN
```
**Use the exam creation JSON above**

### Step 6: Login as Student
```
POST http://localhost:5000/api/auth/login
{"email":"student@test.com","password":"password123"}
```
**Save the token**

### Step 7: Student Takes Exam
```
GET http://localhost:5000/api/student/exams
Authorization: Bearer YOUR_STUDENT_TOKEN

POST http://localhost:5000/api/student/exams/EXAM_ID/start
Authorization: Bearer YOUR_STUDENT_TOKEN

POST http://localhost:5000/api/student/exams/EXAM_ID/submit
Authorization: Bearer YOUR_STUDENT_TOKEN
```
**Use the answers from the exam you created**

### Step 8: Verify Results
```
GET http://localhost:5000/api/student/grades
Authorization: Bearer YOUR_STUDENT_TOKEN

GET http://localhost:5000/api/tutor/exams/EXAM_ID/submissions
Authorization: Bearer YOUR_TUTOR_TOKEN
```

## 9. **Quick Test Commands (Using curl)**

### Create Admin User:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"admin@test.com","password":"password123","role":"admin"}'
```

### Login and Get Token:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

### Test Admin Route:
```bash
curl -X GET http://localhost:5000/api/admin/tutors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 10. **Database Check Routes** (For Debugging)

### Check All Users:
```
http://localhost:5000/api/debug/users
```

### Check All Exams:
```
http://localhost:5000/api/debug/exams
```

### Check All Submissions:
```
http://localhost:5000/api/debug/submissions
```

## Testing Tips:

1. **Start with authentication** - Create users and get tokens first
2. **Use Postman** for API testing - easier to manage headers and JSON
3. **Test one role at a time** - Admin → Tutor → Student
4. **Check console logs** for any errors
5. **Verify MongoDB** - Check if data is being saved properly
6. **Test file uploads** - Use the file upload endpoint with actual files
7. **Check email functionality** - Verify admission letters are being sent

All these routes are ready to be pasted into your browser (for GET requests) or Postman (for POST requests with JSON data). The system should handle the complete flow from user registration to exam submission and grading!