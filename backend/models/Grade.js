const mongoose = require('mongoose');
const DEPARTMENTS = require('../config/departments');

const gradeSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: String,
        enum: DEPARTMENTS,
        required: true
    },
    examScores: [{
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam'
        },
        title: String,
        score: Number,
        maxScore: Number,
        percentage: Number,
        submittedAt: Date
    }],
    attendanceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    projectScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    testScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    overallScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Calculate overall score before saving
gradeSchema.pre('save', function (next) {
    const scores = [];

    // Add attendance score if available
    if (this.attendanceScore > 0) {
        scores.push(this.attendanceScore);
    }

    // Add project score if available
    if (this.projectScore > 0) {
        scores.push(this.projectScore);
    }

    // Calculate test score from exam scores
    if (this.examScores && this.examScores.length > 0) {
        const totalPercentage = this.examScores.reduce((sum, exam) => sum + (exam.percentage || 0), 0);
        this.testScore = totalPercentage / this.examScores.length;
        scores.push(this.testScore);
    }

    // Calculate overall average
    if (scores.length > 0) {
        this.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    } else {
        this.overallScore = 0;
    }

    this.lastUpdated = new Date();
    next();
});

// Index for efficient querying
gradeSchema.index({ studentId: 1 }, { unique: true });
gradeSchema.index({ department: 1 });

// Check if model already exists before compiling
module.exports = mongoose.models.Grade || mongoose.model('Grade', gradeSchema);