const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const Submission = require('../models/Submission');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Get submissions for an exam (tutors only)
router.get('/exam/:examId', roleMiddleware(['tutor']), async (req, res) => {
    try {
        const { examId } = req.params;

        const submissions = await Submission.find({ examId })
            .populate('studentId', 'name email')
            .populate('examId', 'title')
            .sort({ submittedAt: -1 });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching submissions',
            error: error.message
        });
    }
});

// Get single submission
router.get('/:id', async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('studentId', 'name email')
            .populate('examId', 'title tutorId')
            .populate('answers.questionId', 'text questionType options score');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check permissions
        const canAccess = req.user.role === 'admin' ||
            (req.user.role === 'tutor' && submission.examId.tutorId.toString() === req.user._id.toString()) ||
            submission.studentId._id.toString() === req.user._id.toString();

        if (!canAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(submission);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching submission',
            error: error.message
        });
    }
});

// Override grade (tutors only)
router.patch('/:id/grade', roleMiddleware(['tutor']), async (req, res) => {
    try {
        const { newScore, feedback } = req.body;

        const submission = await Submission.findById(req.params.id)
            .populate('examId', 'tutorId');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Verify tutor owns this exam
        if (submission.examId.tutorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        submission.totalScore = newScore;
        submission.percentage = (newScore / submission.maxScore) * 100;
        submission.status = 'overridden';
        if (feedback) submission.feedback = feedback;

        await submission.save();

        res.json({
            message: 'Grade overridden successfully',
            submission
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error overriding grade',
            error: error.message
        });
    }
});

module.exports = router;