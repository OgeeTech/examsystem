// const mongoose = require('mongoose');
// const DEPARTMENTS = require('../config/departments');

// const examSchema = new mongoose.Schema({
//     tutorId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     department: {
//         type: String,
//         enum: DEPARTMENTS,
//         required: true
//     },
//     title: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     description: {
//         type: String,
//         trim: true
//     },
//     timeLimitMinutes: {
//         type: Number,
//         required: true,
//         min: 1
//     },
//     assignedStudentIds: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     }],
//     questions: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Question'
//     }],
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     },
//     startsAt: {
//         type: Date
//     },
//     endsAt: {
//         type: Date
//     },
//     maxScore: {
//         type: Number,
//         default: 0
//     }
// });

// // Calculate max score when questions are populated
// examSchema.virtual('calculatedMaxScore').get(function () {
//     if (this.questions && this.questions.length > 0) {
//         return this.questions.reduce((total, question) => total + (question.score || 1), 0);
//     }
//     return 0;
// });

// module.exports = mongoose.model('Exam', examSchema);


const mongoose = require('mongoose'); // ADD THIS LINE
const DEPARTMENTS = require('../config/departments');
const examSchema = new mongoose.Schema({
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: String,
        enum: DEPARTMENTS,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    timeLimitMinutes: {
        type: Number,
        required: true,
        min: 1
    },
    assignedStudentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    questions: [{
        text: {
            type: String,
            required: true
        },
        questionType: {
            type: String,
            enum: ['multiple_choice', 'true_false', 'short_answer'],
            required: true
        },
        options: [String], // For multiple_choice
        correctIndex: Number, // For multiple_choice and true_false
        correctAnswer: String, // For short_answer
        score: {
            type: Number,
            default: 1,
            min: 1
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startsAt: {
        type: Date
    },
    endsAt: {
        type: Date
    },
    maxScore: {
        type: Number,
        default: 0
    }
});

// Calculate max score automatically
examSchema.pre('save', function (next) {
    if (this.questions && this.questions.length > 0) {
        this.maxScore = this.questions.reduce((total, question) => total + question.score, 0);
    }
    next();
});

module.exports = mongoose.model('Exam', examSchema);