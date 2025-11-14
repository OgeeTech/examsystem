const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

const router = express.Router();

// Add question to exam (Tutor only)
router.post('/exams/:examId/questions', authMiddleware, roleMiddleware(['tutor']), async (req, res) => {
    try {
        const { examId } = req.params;
        const questionData = req.body;

        // Verify exam belongs to tutor
        const exam = await Exam.findOne({ _id: examId, tutorId: req.user._id });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const question = new Question({
            examId,
            ...questionData
        });

        await question.save();

        // Update exam's max score
        exam.maxScore = (exam.maxScore || 0) + question.score;
        await exam.save();

        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({
            message: 'Error adding question',
            error: error.message
        });
    }
});

// Get exam questions (Tutor and Student)
router.get('/exams/:examId/questions', authMiddleware, async (req, res) => {
    try {
        const { examId } = req.params;
        const user = req.user;

        let exam;
        if (user.role === 'tutor') {
            exam = await Exam.findOne({ _id: examId, tutorId: user._id });
        } else {
            // Student can only access if they have access to the exam
            exam = await Exam.findOne({
                _id: examId,
                $or: [
                    { assignedStudentIds: { $size: 0 } },
                    { assignedStudentIds: user._id }
                ]
            });
        }

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const questions = await Question.find({ examId }).sort({ order: 1 });

        res.json(questions);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching questions',
            error: error.message
        });
    }
});

// Get full exam with questions (Student)
router.get('/student/exams/:examId/full', authMiddleware, roleMiddleware(['student']), async (req, res) => {
    try {
        const { examId } = req.params;
        const studentId = req.user._id;

        // Verify student has access to exam
        const exam = await Exam.findOne({
            _id: examId,
            $or: [
                { assignedStudentIds: { $size: 0 } },
                { assignedStudentIds: studentId }
            ]
        });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found or access denied' });
        }

        const questions = await Question.find({ examId })
            .select('-correctIndex -correctAnswer') // Don't send answers to student
            .sort({ order: 1 });

        res.json({
            ...exam.toObject(),
            questions
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching exam details',
            error: error.message
        });
    }
});

module.exports = router;