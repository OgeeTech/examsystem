const User = require('../models/User');
const NotificationController = require('./notificationController');
const DEPARTMENTS = require('../config/departments');

exports.getDepartments = async (req, res) => {
    try {
        res.json(DEPARTMENTS);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching departments',
            error: error.message
        });
    }
};

exports.sendAdmissionLetters = async (req, res) => {
    try {
        const { studentIds, admissionDetails = {} } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                message: 'Student IDs array is required'
            });
        }

        const results = [];

        for (const studentId of studentIds) {
            try {
                const result = await NotificationController.sendAdmissionNotification(
                    studentId,
                    admissionDetails
                );
                results.push({
                    studentId,
                    success: result.success,
                    emailSent: result.emailSent,
                    error: result.error
                });
            } catch (error) {
                results.push({
                    studentId,
                    success: false,
                    error: error.message
                });
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        res.json({
            message: `Admission letters processed. Successful: ${successful}, Failed: ${failed}`,
            results
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error sending admission letters',
            error: error.message
        });
    }
};

exports.getTutors = async (req, res) => {
    try {
        const { department } = req.query;
        const filter = { role: 'tutor' };

        if (department && DEPARTMENTS.includes(department)) {
            filter.department = department;
        }

        const tutors = await User.find(filter)
            .select('-passwordHash')
            .sort({ name: 1 });

        res.json(tutors);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching tutors',
            error: error.message
        });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const { department } = req.query;
        const filter = { role: 'student' };

        if (department && DEPARTMENTS.includes(department)) {
            filter.department = department;
        }

        const students = await User.find(filter)
            .select('-passwordHash')
            .populate('assignedTutorId', 'name email')
            .sort({ name: 1 });

        res.json(students);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching students',
            error: error.message
        });
    }
};

exports.assignTutor = async (req, res) => {
    try {
        const { userId, department } = req.body;

        if (!DEPARTMENTS.includes(department)) {
            return res.status(400).json({ message: 'Invalid department' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                role: 'tutor',
                department
            },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Tutor assigned successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error assigning tutor',
            error: error.message
        });
    }
};