const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const Exam = require('../models/Exam');
const Question = require('../models/Question');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Get all exams (for tutors and admins)
router.get('/', roleMiddleware(['admin', 'tutor']), async (req, res) => {
    try {
        const { department, status } = req.query;
        const filter = {};

        if (department) filter.department = department;
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;

        // For tutors, only show their exams
        if (req.user.role === 'tutor') {
            filter.tutorId = req.user._id;
        }

        const exams = await Exam.find(filter)
            .populate('tutorId', 'name email')
            .populate('questions')
            .sort({ createdAt: -1 });

        res.json(exams);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching exams',
            error: error.message
        });
    }
});

// Get single exam
router.get('/:id', roleMiddleware(['admin', 'tutor']), async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('tutorId', 'name email')
            .populate('questions')
            .populate('assignedStudentIds', 'name email');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if tutor owns this exam
        if (req.user.role === 'tutor' && exam.tutorId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(exam);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching exam',
            error: error.message
        });
    }
});

// Update exam
router.put('/:id', roleMiddleware(['tutor']), async (req, res) => {
    try {
        const { title, description, timeLimitMinutes, isActive, assignedStudentIds } = req.body;

        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Verify tutor owns this exam
        if (exam.tutorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const updatedExam = await Exam.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                timeLimitMinutes,
                isActive,
                assignedStudentIds
            },
            { new: true }
        ).populate('questions');

        res.json({
            message: 'Exam updated successfully',
            exam: updatedExam
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating exam',
            error: error.message
        });
    }
});

// Delete exam
router.delete('/:id', roleMiddleware(['tutor']), async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Verify tutor owns this exam
        if (exam.tutorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Delete associated questions
        await Question.deleteMany({ examId: req.params.id });

        // Delete the exam
        await Exam.findByIdAndDelete(req.params.id);

        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting exam',
            error: error.message
        });
    }
});

module.exports = router;