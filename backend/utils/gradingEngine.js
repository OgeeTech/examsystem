const Exam = require('../models/Exam');

class GradingEngine {
    static async gradeSubmission(answers, examId) {
        try {
            console.log(`Grading submission for exam: ${examId}`);
            console.log('Answers received:', answers);

            // Get exam with embedded questions
            const exam = await Exam.findById(examId);
            if (!exam) {
                throw new Error('Exam not found');
            }

            const questions = exam.questions || [];
            console.log(`Found ${questions.length} questions in exam`);

            const questionMap = new Map();
            questions.forEach(q => {
                questionMap.set(q._id.toString(), q);
            });

            let totalScore = 0;
            let maxScore = 0;
            let correctCount = 0;
            let incorrectCount = 0;
            let unansweredCount = 0;

            // Calculate max score from all questions
            questions.forEach(q => {
                maxScore += q.score || 1;
            });

            console.log(`Max score: ${maxScore}, Questions: ${questions.length}`);

            const gradedAnswers = answers.map(answer => {
                const question = questionMap.get(answer.questionId.toString());
                if (!question) {
                    console.log(`Question not found: ${answer.questionId}`);
                    return {
                        ...answer,
                        isCorrect: false,
                        score: 0,
                        error: 'Question not found'
                    };
                }

                let isCorrect = false;
                let score = 0;

                // Handle different question types
                switch (question.questionType) {
                    case 'multiple_choice':
                    case 'true_false':
                        if (answer.selectedIndex !== undefined && answer.selectedIndex === question.correctIndex) {
                            isCorrect = true;
                            score = question.score || 1;
                            correctCount++;
                            console.log(`Correct answer for question ${answer.questionId}`);
                        } else if (answer.selectedIndex !== undefined) {
                            incorrectCount++;
                            console.log(`Incorrect answer for question ${answer.questionId}`);
                        } else {
                            unansweredCount++;
                            console.log(`Unanswered question ${answer.questionId}`);
                        }
                        break;

                    case 'short_answer':
                        if (answer.textAnswer && this.normalizeAnswer(answer.textAnswer) === this.normalizeAnswer(question.correctAnswer)) {
                            isCorrect = true;
                            score = question.score || 1;
                            correctCount++;
                            console.log(`Correct short answer for question ${answer.questionId}`);
                        } else if (answer.textAnswer) {
                            incorrectCount++;
                            console.log(`Incorrect short answer for question ${answer.questionId}`);
                        } else {
                            unansweredCount++;
                            console.log(`Unanswered short answer question ${answer.questionId}`);
                        }
                        break;

                    default:
                        unansweredCount++;
                        console.log(`Unknown question type: ${question.questionType}`);
                }

                totalScore += score;

                return {
                    ...answer,
                    isCorrect,
                    score,
                    questionText: question.text,
                    questionType: question.questionType
                };
            });

            console.log(`Grading complete - Total: ${totalScore}/${maxScore}, Correct: ${correctCount}, Incorrect: ${incorrectCount}, Unanswered: ${unansweredCount}`);

            // Ensure maxScore is at least 1 to avoid division by zero
            if (maxScore === 0) {
                maxScore = 1;
                console.warn('Max score was 0, set to 1 to avoid division by zero');
            }

            return {
                gradedAnswers,
                totalScore,
                maxScore,
                resultDetails: {
                    correctCount,
                    incorrectCount,
                    unansweredCount,
                    totalQuestions: questions.length
                }
            };

        } catch (error) {
            console.error('Grading engine error:', error);
            throw new Error(`Grading failed: ${error.message}`);
        }
    }

    static normalizeAnswer(text) {
        if (!text) return '';
        return text.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    static calculateTimeSpent(startedAt, submittedAt) {
        if (!startedAt || !submittedAt) return 0;
        const diffMs = submittedAt - startedAt;
        return Math.round(diffMs / (1000 * 60)); // Convert to minutes
    }
}

module.exports = GradingEngine;