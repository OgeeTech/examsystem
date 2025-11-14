const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
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
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Question', questionSchema);