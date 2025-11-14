const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const User = require('../models/User');
const DEPARTMENTS = require('../config/departments');
const Grade = require('../models/Grade');

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

// ------------------------- CREATE EXAM -------------------------
exports.createExam = async (req, res) => {
    try {
        const { title, description, timeLimitMinutes, department, questions, startsAt, endsAt, assignedStudentIds } = req.body;
        const tutorId = req.user._id;

        // Validate department
        if (!DEPARTMENTS.includes(department)) {
            return res.status(400).json({ message: 'Invalid department' });
        }

        // Create exam WITH embedded questions
        const exam = new Exam({
            tutorId,
            title,
            description,
            timeLimitMinutes,
            department,
            startsAt,
            endsAt,
            assignedStudentIds: assignedStudentIds || [],
            questions: questions || [],
            isActive: true
        });

        await exam.save();

        // Populate exam with assigned students
        const populatedExam = await Exam.findById(exam._id)
            .populate('assignedStudentIds', 'name email');

        res.status(201).json({
            message: 'Exam created successfully',
            exam: populatedExam
        });

    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ message: 'Error creating exam', error: error.message });
    }
};

// ------------------------- GET TUTOR STUDENTS -------------------------
exports.getTutorStudents = async (req, res) => {
    try {
        const tutorDepartment = req.user.department;

        // Get students from User model
        const students = await User.find({
            department: tutorDepartment,
            role: 'student'
        }).select('name email studentId department lastActivity')
            .sort({ name: 1 });

        console.log(`Found ${students.length} students in department ${tutorDepartment}`);

        // Get grade data for all students
        const studentIds = students.map(student => student._id);
        const grades = await Grade.find({ studentId: { $in: studentIds } });

        // Create a map for quick grade lookup
        const gradeMap = {};
        grades.forEach(grade => {
            gradeMap[grade.studentId.toString()] = grade;
        });

        // Combine student data with grade data
        const studentsWithGrades = students.map(student => {
            const grade = gradeMap[student._id.toString()];

            return {
                _id: student._id,
                name: student.name,
                email: student.email,
                department: student.department,
                lastActivity: student.lastActivity,
                // ✅ FIX: Round all scores to 2 decimal places
                overallScore: grade?.overallScore ? Number(grade.overallScore.toFixed(2)) : 0,
                attendance: grade?.attendanceScore ? Number(grade.attendanceScore.toFixed(2)) : 0,
                projectScore: grade?.projectScore ? Number(grade.projectScore.toFixed(2)) : 0,
                assignmentScore: grade?.assignmentScore ? Number(grade.assignmentScore.toFixed(2)) : 0,
                testScore: grade?.testScore ? Number(grade.testScore.toFixed(2)) : 0
            };
        });

        res.json(studentsWithGrades);

    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
};
// ------------------------- GET EXAM BY ID -------------------------
exports.getExamById = async (req, res) => {
    try {
        const { id } = req.params;
        const tutorId = req.user._id;

        const exam = await Exam.findOne({ _id: id, tutorId })
            .populate('assignedStudentIds', 'name email');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json(exam);
    } catch (error) {
        console.error('Error fetching exam:', error);
        res.status(500).json({ message: 'Error fetching exam', error: error.message });
    }
};

// ------------------------- ADD QUESTIONS TO EXAM -------------------------
exports.addQuestionsToExam = async (req, res) => {
    try {
        const { id: examId } = req.params;
        const { questions } = req.body;
        const tutorId = req.user._id;

        // Verify exam exists and belongs to tutor
        const exam = await Exam.findOne({ _id: examId, tutorId });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({ message: 'Questions array is required' });
        }

        // Validate each question has required text field
        const validatedQuestions = questions.map((q, index) => {
            if (!q.text || q.text.trim() === '') {
                throw new Error(`Question ${index + 1} is missing text`);
            }
            return {
                text: q.text.trim(),
                questionType: q.questionType || 'multiple_choice',
                options: q.options || [],
                correctIndex: q.correctIndex,
                correctAnswer: q.correctAnswer,
                score: q.score || 1
            };
        });

        // Add questions directly to exam (embedded)
        exam.questions.push(...validatedQuestions);

        // Update max score
        const newQuestionsScore = validatedQuestions.reduce((total, q) => total + (q.score || 1), 0);
        exam.maxScore = (exam.maxScore || 0) + newQuestionsScore;

        await exam.save();

        res.json({
            message: 'Questions added successfully',
            exam: exam,
            addedQuestions: validatedQuestions.length
        });

    } catch (error) {
        console.error('Error adding questions:', error);
        res.status(500).json({ message: 'Error adding questions', error: error.message });
    }
};

// ------------------------- UPDATE EXAM -------------------------
exports.updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const tutorId = req.user._id;

        // Remove fields that shouldn't be updated directly
        delete updateData.questions;
        delete updateData.maxScore;
        delete updateData.tutorId;

        const exam = await Exam.findOneAndUpdate(
            { _id: id, tutorId },
            updateData,
            { new: true, runValidators: true }
        )
            .populate('assignedStudentIds', 'name email');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json({
            message: 'Exam updated successfully',
            exam
        });

    } catch (error) {
        console.error('Error updating exam:', error);
        res.status(500).json({ message: 'Error updating exam', error: error.message });
    }
};

// ------------------------- DELETE EXAM -------------------------
exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const tutorId = req.user._id;

        const exam = await Exam.findOne({ _id: id, tutorId });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Delete associated submissions (questions are embedded, so no need to delete separately)
        await Submission.deleteMany({ examId: id });

        // Delete the exam
        await Exam.findByIdAndDelete(id);

        res.json({ message: 'Exam deleted successfully' });

    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ message: 'Error deleting exam', error: error.message });
    }
};

// ------------------------- TOGGLE EXAM STATUS -------------------------
exports.toggleExamStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const tutorId = req.user._id;

        const exam = await Exam.findOneAndUpdate(
            { _id: id, tutorId },
            { isActive },
            { new: true, runValidators: true }
        )
            .populate('assignedStudentIds', 'name email');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json({
            message: `Exam ${isActive ? 'activated' : 'deactivated'} successfully`,
            exam
        });

    } catch (error) {
        console.error('Error toggling exam status:', error);
        res.status(500).json({ message: 'Error updating exam status', error: error.message });
    }
};

// ------------------------- ASSIGN EXAM TO STUDENTS -------------------------
exports.assignExamToStudents = async (req, res) => {
    try {
        const { id: examId } = req.params;
        const { studentIds } = req.body;
        const tutorId = req.user._id;

        // Verify exam exists and belongs to tutor
        const exam = await Exam.findOne({ _id: examId, tutorId });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        exam.assignedStudentIds = studentIds || [];
        await exam.save();

        // Populate and return updated exam
        const updatedExam = await Exam.findById(examId)
            .populate('assignedStudentIds', 'name email');

        res.json({
            message: 'Exam assigned successfully',
            exam: updatedExam
        });

    } catch (error) {
        console.error('Error assigning exam:', error);
        res.status(500).json({ message: 'Error assigning exam', error: error.message });
    }
};

// ------------------------- GET TUTOR EXAMS -------------------------
exports.getTutorExams = async (req, res) => {
    try {
        const tutorId = req.user._id;

        const exams = await Exam.find({ tutorId })
            .populate('assignedStudentIds', 'name email')
            .sort({ createdAt: -1 });

        res.json(exams);

    } catch (error) {
        console.error('Error fetching tutor exams:', error);
        res.status(500).json({ message: 'Error fetching exams', error: error.message });
    }
};

// ------------------------- GET EXAM SUBMISSIONS -------------------------
exports.getExamSubmissions = async (req, res) => {
    try {
        const { examId } = req.params;
        const tutorId = req.user._id;

        // Verify exam belongs to tutor
        const exam = await Exam.findOne({ _id: examId, tutorId });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const submissions = await Submission.find({ examId })
            .populate('studentId', 'name email studentId')
            .populate('examId', 'title maxScore')
            .sort({ submittedAt: -1 });

        res.json(submissions);

    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
};

// ------------------------- UPDATE STUDENT ASSIGNMENT SCORE -------------------------
exports.updateStudentAssignmentScore = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { assignmentScore } = req.body;
        const tutorId = req.user._id;

        // Validate assignment score (0-10 points)
        if (assignmentScore < 0 || assignmentScore > 10) {
            return res.status(400).json({ message: 'Assignment score must be between 0 and 10' });
        }

        // Get tutor's department
        const tutor = await User.findById(tutorId);
        if (!tutor) {
            return res.status(404).json({ message: 'Tutor not found' });
        }

        // Verify student exists and is in tutor's department
        const student = await User.findOne({
            _id: studentId,
            department: tutor.department,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found in your department' });
        }

        // Update or create grade record
        let grade = await Grade.findOne({ studentId });

        if (!grade) {
            grade = new Grade({
                studentId,
                department: tutor.department,
                assignmentScore
            });
        } else {
            grade.assignmentScore = assignmentScore;
        }

        // ✅ FIX: Calculate overall score using fixed point system
        grade.overallScore = calculateOverallScore(grade);

        await grade.save();

        res.json({
            message: 'Assignment score updated successfully',
            grade: {
                studentId: grade.studentId,
                attendanceScore: Number(grade.attendanceScore.toFixed(2)), // ✅ Rounded
                projectScore: Number(grade.projectScore.toFixed(2)),       // ✅ Rounded  
                assignmentScore: Number(grade.assignmentScore.toFixed(2)), // ✅ Rounded
                overallScore: Number(grade.overallScore.toFixed(2)),       // ✅ Rounded
                lastUpdated: grade.lastUpdated
            }
        });

    } catch (error) {
        console.error('Error updating assignment score:', error);
        res.status(500).json({ message: 'Error updating assignment score', error: error.message });
    }
};

// ------------------------- UPDATE STUDENT ATTENDANCE -------------------------
exports.updateStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { attendanceScore } = req.body;
        const tutorId = req.user._id;

        // ✅ FIX: Validate attendance score (0-10 points)
        if (attendanceScore < 0 || attendanceScore > 10) {
            return res.status(400).json({ message: 'Attendance score must be between 0 and 10' });
        }

        // Get tutor's department
        const tutor = await User.findById(tutorId);
        if (!tutor) {
            return res.status(404).json({ message: 'Tutor not found' });
        }

        // Verify student exists and is in tutor's department
        const student = await User.findOne({
            _id: studentId,
            department: tutor.department,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found in your department' });
        }

        // Update or create grade record
        let grade = await Grade.findOne({ studentId });

        if (!grade) {
            grade = new Grade({
                studentId,
                department: tutor.department,
                attendanceScore
            });
        } else {
            grade.attendanceScore = attendanceScore;
        }

        // ✅ FIX: Calculate overall score using fixed point system
        grade.overallScore = calculateOverallScore(grade);

        await grade.save();

        res.json({
            message: 'Attendance score updated successfully',
            grade: {
                studentId: grade.studentId,
                attendanceScore: grade.attendanceScore,
                overallScore: grade.overallScore,
                lastUpdated: grade.lastUpdated
            }
        });

    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ message: 'Error updating attendance score', error: error.message });
    }
};

// ------------------------- UPDATE STUDENT PROJECT SCORE -------------------------
exports.updateStudentProjectScore = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { projectScore } = req.body;
        const tutorId = req.user._id;

        // ✅ FIX: Validate project score (0-50 points)
        if (projectScore < 0 || projectScore > 50) {
            return res.status(400).json({ message: 'Project score must be between 0 and 50' });
        }

        // Get tutor's department
        const tutor = await User.findById(tutorId);
        if (!tutor) {
            return res.status(404).json({ message: 'Tutor not found' });
        }

        // Verify student exists and is in tutor's department
        const student = await User.findOne({
            _id: studentId,
            department: tutor.department,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found in your department' });
        }

        // Update or create grade record
        let grade = await Grade.findOne({ studentId });

        if (!grade) {
            grade = new Grade({
                studentId,
                department: tutor.department,
                projectScore
            });
        } else {
            grade.projectScore = projectScore;
        }

        // ✅ FIX: Calculate overall score using fixed point system
        grade.overallScore = calculateOverallScore(grade);

        await grade.save();

        res.json({
            message: 'Project score updated successfully',
            grade: {
                studentId: grade.studentId,
                projectScore: grade.projectScore,
                overallScore: grade.overallScore,
                lastUpdated: grade.lastUpdated
            }
        });

    } catch (error) {
        console.error('Error updating project score:', error);
        res.status(500).json({ message: 'Error updating project score', error: error.message });
    }
};

// ------------------------- GET STUDENT GRADE DETAILS -------------------------
exports.getStudentGradeDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        const tutorId = req.user._id;

        // Get tutor's department
        const tutor = await User.findById(tutorId);
        if (!tutor) {
            return res.status(404).json({ message: 'Tutor not found' });
        }

        // Verify student is in tutor's department
        const student = await User.findOne({
            _id: studentId,
            department: tutor.department,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found in your department' });
        }

        // Get grade details
        const grade = await Grade.findOne({ studentId })
            .populate('examScores.examId', 'title');

        if (!grade) {
            return res.json({
                student: {
                    _id: student._id,
                    name: student.name,
                    email: student.email
                },
                examScores: [],
                attendanceScore: 0,
                projectScore: 0,
                assignmentScore: 0, // ✅ ADDED
                testScore: 0,
                overallScore: 0
            });
        }

        res.json({
            student: {
                _id: student._id,
                name: student.name,
                email: student.email
            },
            ...grade.toObject()
        });

    } catch (error) {
        console.error('Error fetching student grade details:', error);
        res.status(500).json({ message: 'Error fetching student grade details', error: error.message });
    }
};

// ------------------------- OVERRIDE GRADE -------------------------
exports.overrideGrade = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { newScore, comments } = req.body;
        const tutorId = req.user._id;

        const submission = await Submission.findById(submissionId)
            .populate('examId');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Verify the exam belongs to this tutor
        const exam = await Exam.findOne({ _id: submission.examId, tutorId });
        if (!exam) {
            return res.status(403).json({ message: 'Access denied to this submission' });
        }

        // Validate new score
        if (newScore < 0 || newScore > submission.maxScore) {
            return res.status(400).json({
                message: `Score must be between 0 and ${submission.maxScore}`
            });
        }

        // Update submission
        submission.totalScore = newScore;
        submission.percentage = (newScore / submission.maxScore) * 100;
        submission.status = 'overridden';
        submission.overrideComments = comments;
        submission.overriddenAt = new Date();
        submission.overriddenBy = tutorId;

        await submission.save();

        res.json({
            message: 'Grade overridden successfully',
            submission: {
                _id: submission._id,
                totalScore: submission.totalScore,
                maxScore: submission.maxScore,
                percentage: submission.percentage,
                status: submission.status,
                overrideComments: submission.overrideComments
            }
        });

    } catch (error) {
        console.error('Error overriding grade:', error);
        res.status(500).json({ message: 'Error overriding grade', error: error.message });
    }
};