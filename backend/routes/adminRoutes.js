const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    getTutors,
    getStudents,
    assignTutor,
    sendAdmissionLetters,
    getDepartments
} = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/tutors', getTutors);
router.get('/students', getStudents);
router.get('/departments', getDepartments);
router.post('/tutors/assign', assignTutor);
router.post('/admissions/send', sendAdmissionLetters);

module.exports = router;