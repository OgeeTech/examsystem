const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Grade = require('../models/Grade');
const GradingEngine = require('../utils/gradingEngine');

// ==============================
// ✅ GET STUDENT EXAMS
// ==============================
const getStudentExams = async (req, res) => {
    try {
        const studentId = req.user._id;
        const studentDepartment = req.user.department;

        console.log(`=== DEBUG: Student Exams Query ===`);
        console.log(`Student ID: ${studentId}`);
        console.log(`Student Department: ${studentDepartment}`);
        console.log(`User object:`, req.user);

        // Find exams available to the student
        const exams = await Exam.find({
            $or: [
                { assignedStudentIds: { $size: 0 } }, // Open to all students
                { assignedStudentIds: studentId } // Specifically assigned to this student
            ],
            department: studentDepartment,
            isActive: true
        })
            .populate('tutorId', 'name email')
            .sort({ createdAt: -1 });

        console.log(`=== DEBUG: Query Results ===`);
        console.log(`Found ${exams.length} exams`);

        // Log each exam found
        exams.forEach((exam, index) => {
            console.log(`Exam ${index + 1}:`, {
                title: exam.title,
                department: exam.department,
                isActive: exam.isActive,
                assignedStudentIds: exam.assignedStudentIds,
                questionsCount: exam.questions?.length || 0
            });
        });

        // Process exams - questions are already embedded
        const processedExams = exams.map(exam => {
            const examObj = exam.toObject();

            return {
                _id: examObj._id,
                title: examObj.title,
                description: examObj.description,
                timeLimitMinutes: examObj.timeLimitMinutes,
                department: examObj.department,
                isActive: examObj.isActive,
                createdAt: examObj.createdAt,
                tutorId: examObj.tutorId,
                questionCount: examObj.questions ? examObj.questions.length : 0,
            };
        });

        // Check submission status for each exam
        const examsWithStatus = await Promise.all(
            processedExams.map(async (exam) => {
                const submission = await Submission.findOne({
                    examId: exam._id,
                    studentId: studentId
                });

                let submissionStatus = 'not_started';
                if (submission) {
                    if (submission.status === 'in_progress') {
                        submissionStatus = 'in_progress';
                    } else if (['submitted', 'graded', 'overridden'].includes(submission.status)) {
                        submissionStatus = 'submitted';
                    }
                }

                return {
                    ...exam,
                    submissionStatus,
                    submissionId: submission?._id
                };
            })
        );

        console.log('=== DEBUG: Final exams sent to frontend ===');
        console.log('Exams with status:', examsWithStatus);

        res.json(examsWithStatus);

    } catch (error) {
        console.error('Error fetching student exams:', error);
        res.status(500).json({
            message: 'Error fetching exams',
            error: error.message
        });
    }
};

// ==============================
// ✅ GET FULL EXAM DETAILS (FOR TAKING EXAM)
// ==============================
const getFullExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const studentId = req.user._id;

        // Verify student has access to this exam
        const exam = await Exam.findOne({
            _id: examId,
            $or: [
                { assignedStudentIds: { $size: 0 } },
                { assignedStudentIds: studentId }
            ],
            isActive: true
        });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found or access denied' });
        }

        // Remove correct answers from questions for security
        const secureQuestions = exam.questions.map(question => {
            const { correctIndex, correctAnswer, ...secureQuestion } = question.toObject();
            return secureQuestion;
        });

        const secureExam = {
            ...exam.toObject(),
            questions: secureQuestions
        };

        res.json(secureExam);
    } catch (error) {
        console.error('Error fetching full exam:', error);
        res.status(500).json({
            message: 'Error fetching exam details',
            error: error.message
        });
    }
};

// ==============================
// ✅ START EXAM (CREATE SUBMISSION)
// ==============================
const startExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const studentId = req.user._id;

        // Check if exam exists and student has access
        const exam = await Exam.findOne({
            _id: examId,
            $or: [
                { assignedStudentIds: { $size: 0 } },
                { assignedStudentIds: studentId }
            ],
            isActive: true
        });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found or access denied' });
        }

        // Check if submission already exists
        let submission = await Submission.findOne({
            examId,
            studentId
        });

        if (submission) {
            if (submission.status === 'submitted' || submission.status === 'graded') {
                return res.status(400).json({ message: 'Exam already submitted' });
            }
            // Continue existing exam
            submission.startedAt = new Date();
            await submission.save();
        } else {
            // Create new submission
            submission = new Submission({
                examId,
                studentId,
                maxScore: exam.maxScore || 0,
                startedAt: new Date(),
                status: 'in_progress'
            });
            await submission.save();
        }

        res.json({
            message: 'Exam started successfully',
            submission: {
                id: submission._id,
                examId: submission.examId,
                startedAt: submission.startedAt,
                status: submission.status
            }
        });
    } catch (error) {
        console.error('Error starting exam:', error);
        res.status(500).json({
            message: 'Error starting exam',
            error: error.message
        });
    }
};

// ==============================
// ✅ SUBMIT EXAM (GRADE AND SAVE)
// ==============================
const submitExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const { answers } = req.body;
        const studentId = req.user._id;

        // Find the submission
        const submission = await Submission.findOne({
            examId,
            studentId,
            status: 'in_progress'
        });

        if (!submission) {
            return res.status(404).json({ message: 'No active exam session found' });
        }

        // Get exam details for grading
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Grade the submission using GradingEngine
        const gradingResult = await GradingEngine.gradeSubmission(answers, examId);

        // FIX: Check if maxScore is 0 to avoid division by zero
        const maxScore = gradingResult.maxScore || 1; // Use 1 as fallback to avoid division by zero
        const totalScore = gradingResult.totalScore || 0;

        // Calculate percentage safely
        let percentage = 0;
        if (maxScore > 0) {
            percentage = (totalScore / maxScore) * 100;
        }

        // Update submission with results
        submission.answers = gradingResult.gradedAnswers;
        submission.totalScore = totalScore;
        submission.maxScore = maxScore;
        submission.percentage = percentage; // This was NaN before
        submission.submittedAt = new Date();
        submission.status = 'submitted';
        submission.resultDetails = gradingResult.resultDetails;
        submission.timeSpentMinutes = GradingEngine.calculateTimeSpent(
            submission.startedAt,
            submission.submittedAt
        );

        await submission.save();

        // Update student's grade record
        await updateStudentGrade(studentId, exam.department, submission, exam.title);

        res.json({
            message: 'Exam submitted successfully',
            submission: {
                id: submission._id,
                totalScore: submission.totalScore,
                maxScore: submission.maxScore,
                percentage: submission.percentage,
                submittedAt: submission.submittedAt,
                resultDetails: submission.resultDetails
            }
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({
            message: 'Error submitting exam',
            error: error.message
        });
    }
};

// ==============================
// ✅ GET STUDENT GRADES - UPDATED WITH ASSIGNMENT SCORE
// ==============================
const getStudentGrades = async (req, res) => {
    try {
        const studentId = req.user._id;
        const student = await User.findById(studentId);

        // Get grade record
        let grade = await Grade.findOne({ studentId })
            .populate('examScores.examId', 'title');

        if (!grade) {
            // Create initial grade record if it doesn't exist
            grade = new Grade({
                studentId,
                department: student.department,
                examScores: [],
                attendanceScore: 0,
                projectScore: 0,
                assignmentScore: 0, // ✅ ADD THIS
                testScore: 0,
                overallScore: 0
            });
            await grade.save();
        }

        // Get all submissions for detailed view
        const submissions = await Submission.find({ studentId })
            .populate('examId', 'title tutorId')
            .sort({ submittedAt: -1 });

        // Calculate overall statistics
        const overallStats = calculateOverallStats(submissions);

        // ✅ FIX: Include assignmentScore in breakdown
        const gradeBreakdown = {
            examScore: grade.testScore || 0,
            attendanceScore: grade.attendanceScore || 0,
            projectScore: grade.projectScore || 0,
            assignmentScore: grade.assignmentScore || 0, // ✅ ADD THIS
            overallScore: grade.overallScore || 0
        };

        res.json({
            overallGrade: grade,
            submissions: submissions.map(sub => ({
                _id: sub._id,
                examId: sub.examId,
                totalScore: sub.totalScore,
                maxScore: sub.maxScore,
                percentage: sub.percentage,
                submittedAt: sub.submittedAt,
                status: sub.status,
                timeSpentMinutes: sub.timeSpentMinutes,
                resultDetails: sub.resultDetails
            })),
            overallStats,
            gradeBreakdown
        });
    } catch (error) {
        console.error('Error fetching student grades:', error);
        res.status(500).json({
            message: 'Error fetching grades',
            error: error.message
        });
    }
};
// ==============================
// ✅ GET SUBMISSION DETAILS
// ==============================
const getSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const studentId = req.user._id;

        const submission = await Submission.findOne({
            _id: submissionId,
            studentId
        })
            .populate('examId', 'title description timeLimitMinutes')
            .populate('answers.questionId', 'text questionType options score');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.json(submission);
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({
            message: 'Error fetching submission details',
            error: error.message
        });
    }
};
// ✅ FIXED POINT SYSTEM CALCULATION
const calculateOverallScore = (grade) => {
    const examScore = grade.testScore || 0;        // Out of 30 (auto-calculated from exams)
    const projectScore = grade.projectScore || 0;  // Out of 50 (tutor input)
    const assignmentScore = grade.assignmentScore || 0; // Out of 10 (tutor input)  
    const attendanceScore = grade.attendanceScore || 0; // Out of 10 (tutor input)

    // Simple sum of all components (max 100 points)
    const totalScore = examScore + projectScore + assignmentScore + attendanceScore;

    return Math.min(totalScore, 100); // Cap at 100 points
};

// ==============================
// ✅ GET STUDENT SUBMISSIONS
// ==============================
const getStudentSubmissions = async (req, res) => {
    try {
        const studentId = req.user._id;

        const submissions = await Submission.find({ studentId })
            .populate('examId', 'title description department')
            .sort({ submittedAt: -1 });

        res.json(submissions);
    } catch (error) {
        console.error('Error fetching student submissions:', error);
        res.status(500).json({
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

// ==============================
// ✅ HELPER: UPDATE STUDENT GRADE - FIXED
// ==============================
const updateStudentGrade = async (studentId, department, submission, examTitle) => {
    try {
        let grade = await Grade.findOne({ studentId });

        if (!grade) {
            grade = new Grade({
                studentId,
                department
            });
        }

        // Add or update exam score
        const existingExamIndex = grade.examScores.findIndex(
            score => score.examId.toString() === submission.examId.toString()
        );

        const examScore = {
            examId: submission.examId,
            title: examTitle,
            score: submission.totalScore,
            maxScore: submission.maxScore,
            percentage: submission.percentage,
            submittedAt: submission.submittedAt
        };

        if (existingExamIndex >= 0) {
            grade.examScores[existingExamIndex] = examScore;
        } else {
            grade.examScores.push(examScore);
        }

        // ✅ FIX: Calculate test score properly (convert to 30-point scale)
        if (grade.examScores.length > 0) {
            const totalPercentage = grade.examScores.reduce((sum, score) => sum + score.percentage, 0);
            const averagePercentage = totalPercentage / grade.examScores.length;
            // Convert average percentage to 30-point scale
            grade.testScore = (averagePercentage / 100) * 30;
        }

        // ✅ FIX: Use the new fixed point system calculation
        grade.overallScore = calculateOverallScore(grade);

        grade.lastUpdated = new Date();
        await grade.save();

        console.log(`✅ Grade updated for student ${studentId}:`, {
            testScore: grade.testScore,
            projectScore: grade.projectScore,
            assignmentScore: grade.assignmentScore,
            attendanceScore: grade.attendanceScore,
            overallScore: grade.overallScore
        });

    } catch (error) {
        console.error('Error updating student grade:', error);
    }
};
// ==============================
// ✅ HELPER: CALCULATE OVERALL STATS
// ==============================
const calculateOverallStats = (submissions) => {
    if (submissions.length === 0) {
        return {
            averageScore: 0,
            totalExams: 0,
            bestScore: 0,
            improvement: 0
        };
    }

    const totalScore = submissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0);
    const averageScore = totalScore / submissions.length;
    const bestScore = Math.max(...submissions.map(sub => sub.percentage || 0));

    // Calculate improvement (difference between last two exams)
    let improvement = 0;
    if (submissions.length >= 2) {
        const recentScores = submissions.slice(0, 2).map(sub => sub.percentage || 0);
        improvement = recentScores[0] - recentScores[1];
    }

    return {
        averageScore: Math.round(averageScore * 10) / 10,
        totalExams: submissions.length,
        bestScore: Math.round(bestScore * 10) / 10,
        improvement: Math.round(improvement * 10) / 10
    };
};

// Export all functions
module.exports = {
    getStudentExams,
    getFullExam,
    startExam,
    submitExam,
    getStudentGrades,
    getSubmission,
    getStudentSubmissions,
    updateStudentGrade,
    calculateOverallStats
};