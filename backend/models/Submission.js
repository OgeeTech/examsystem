const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedIndex: {
            type: Number,
            required: function () {
                return this.parent().questionType === 'multiple_choice' || this.parent().questionType === 'true_false';
            }
        },
        textAnswer: {
            type: String,
            required: function () {
                return this.parent().questionType === 'short_answer';
            },
            trim: true
        },
        isCorrect: Boolean,
        score: Number
    }],
    totalScore: {
        type: Number,
        default: 0
    },
    maxScore: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    gradedAt: {
        type: Date
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    submittedAt: {
        type: Date
    },
    timeSpentMinutes: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: ['in_progress', 'submitted', 'graded', 'overridden'],
        default: 'in_progress'
    },
    resultDetails: {
        correctCount: Number,
        incorrectCount: Number,
        unansweredCount: Number
    }
});

// Compound index to ensure one submission per student per exam
submissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });

// Calculate percentage before saving
submissionSchema.pre('save', function (next) {
    if (this.totalScore !== undefined && this.maxScore > 0) {
        this.percentage = (this.totalScore / this.maxScore) * 100;
    }
    next();
});

module.exports = mongoose.model('Submission', submissionSchema);