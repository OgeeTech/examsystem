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
    const scores = [
        this.attendanceScore,
        this.projectScore,
        this.testScore
    ].filter(score => score > 0);

    if (scores.length > 0) {
        this.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    this.lastUpdated = new Date();
    next();
});

// Index for efficient querying
gradeSchema.index({ studentId: 1 }, { unique: true });
gradeSchema.index({ department: 1 });

module.exports = mongoose.model('Grade', gradeSchema);