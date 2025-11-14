
// const express = require('express');
// const authMiddleware = require('../middleware/authMiddleware');
// const roleMiddleware = require('../middleware/roleMiddleware');
// const asyncHandler = require('../utils/asyncHandler');

// const {
//     createExam,
//     getTutorExams,
//     getExamById,
//     addQuestionsToExam,
//     updateExam,
//     deleteExam,
//     toggleExamStatus,
//     getTutorStudents,
//     assignExamToStudents,
//     getExamSubmissions,
//     overrideGrade,
//     updateStudentAttendance,
//     updateStudentProjectScore,
//     getStudentGradeDetails
// } = require('../controllers/tutorController');


// const router = express.Router();

// // ✅ FIX: Apply authentication & role middleware FIRST
// router.use(authMiddleware);
// router.use(roleMiddleware(['tutor']));

// // Grade management routes

// router.put('/students/:studentId/assignment-score', updateStudentAssignmentScore);
// router.put('/students/:studentId/attendance', updateStudentAttendance);
// router.put('/students/:studentId/project-score', updateStudentProjectScore);
// router.get('/students/:studentId/grades', getStudentGradeDetails);

// // Exam routes
// router.post('/exams', createExam);
// router.get('/exams', getTutorExams);
// router.get('/exams/:id', getExamById);
// router.put('/exams/:id', updateExam);
// router.delete('/exams/:id', deleteExam);
// router.put('/exams/:id/status', toggleExamStatus);

// // Questions route
// router.post('/exams/:id/questions', addQuestionsToExam);

// // Student routes
// router.get('/students', getTutorStudents);
// router.post('/exams/:id/assign', assignExamToStudents);

// // Submission routes
// router.get('/exams/:examId/submissions', asyncHandler(getExamSubmissions));
// router.patch('/submissions/:submissionId/grade', asyncHandler(overrideGrade));

// module.exports = router;
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const {
    createExam,
    getTutorExams,
    getExamById,
    addQuestionsToExam,
    updateExam,
    deleteExam,
    toggleExamStatus,
    getTutorStudents,
    assignExamToStudents,
    getExamSubmissions,
    overrideGrade,
    updateStudentAttendance,
    updateStudentProjectScore,
    updateStudentAssignmentScore, // ✅ ADD THIS IMPORT
    getStudentGradeDetails
} = require('../controllers/tutorController');

const router = express.Router();

// ✅ Apply authentication & role middleware FIRST
router.use(authMiddleware);
router.use(roleMiddleware(['tutor']));

// Grade management routes
router.put('/students/:studentId/attendance', updateStudentAttendance);
router.put('/students/:studentId/project-score', updateStudentProjectScore);
router.put('/students/:studentId/assignment-score', updateStudentAssignmentScore); // ✅ NOW THIS WILL WORK
router.get('/students/:studentId/grades', getStudentGradeDetails);

// Exam routes
router.post('/exams', createExam);
router.get('/exams', getTutorExams);
router.get('/exams/:id', getExamById);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);
router.put('/exams/:id/status', toggleExamStatus);

// Questions route
router.post('/exams/:id/questions', addQuestionsToExam);

// Student routes
router.get('/students', getTutorStudents);
router.post('/exams/:id/assign', assignExamToStudents);

// Submission routes
router.get('/exams/:examId/submissions', asyncHandler(getExamSubmissions));
router.patch('/submissions/:submissionId/grade', asyncHandler(overrideGrade));

module.exports = router;