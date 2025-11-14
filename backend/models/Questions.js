const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    questionType: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer'],
        default: 'multiple_choice'
    },
    options: [{
        type: String,
        required: function () {
            return this.questionType === 'multiple_choice';
        }
    }],
    correctIndex: {
        type: Number,
        required: function () {
            return this.questionType === 'multiple_choice' || this.questionType === 'true_false';
        },
        min: 0,
        validate: {
            validator: function (value) {
                if (this.questionType === 'multiple_choice') {
                    return value >= 0 && value < this.options.length;
                }
                return value >= 0 && value <= 1; // 0 for false, 1 for true
            },
            message: 'Correct index must be within options range'
        }
    },
    correctAnswer: {
        type: String,
        required: function () {
            return this.questionType === 'short_answer';
        }
    },
    score: {
        type: Number,
        default: 1,
        min: 0
    },
    explanation: {
        type: String,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    }
});

// Index for efficient querying
questionSchema.index({ examId: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);