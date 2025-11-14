const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    getStudentExams,
    getFullExam,
    startExam,
    submitExam,
    getStudentGrades,
    getSubmission,
    getStudentSubmissions
} = require('../controllers/studentController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['student']));

// Exam routes
router.get('/exams', getStudentExams);
router.get('/exams/:examId/full', getFullExam);
router.post('/exams/:examId/start', startExam);
router.post('/exams/:examId/submit', submitExam);

// Grade and submission routes
router.get('/grades', getStudentGrades);
router.get('/submissions/:submissionId', getSubmission);
router.get('/submissions', getStudentSubmissions);

module.exports = router;