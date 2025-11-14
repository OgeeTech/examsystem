const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const User = require('../models/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/submissions');

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomString-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
        cb(null, uniqueSuffix + '-' + safeFileName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow common document and code file types
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'text/x-python',
        'text/javascript',
        'text/html',
        'text/css',
        'application/json'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only documents, code files, and archives are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per upload
    }
});

exports.uploadProjectSubmission = [
    upload.array('files', 5),
    async (req, res) => {
        try {
            const { examId, description } = req.body;
            const studentId = req.user._id;

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'No files uploaded' });
            }

            if (!examId) {
                // Delete uploaded files if examId is missing
                req.files.forEach(file => {
                    fs.unlinkSync(file.path);
                });
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            // Verify exam exists and student has access
            const Exam = require('../models/Exam');
            const exam = await Exam.findById(examId);
            if (!exam) {
                // Delete uploaded files if exam doesn't exist
                req.files.forEach(file => {
                    fs.unlinkSync(file.path);
                });
                return res.status(404).json({ message: 'Exam not found' });
            }

            // Create file metadata
            const fileMetadata = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date()
            }));

            // Find or create submission
            let submission = await Submission.findOne({ examId, studentId });

            if (submission) {
                // Update existing submission with files
                submission.projectFiles = submission.projectFiles || [];
                submission.projectFiles.push(...fileMetadata);
                submission.projectDescription = description;
                await submission.save();
            } else {
                // Create new submission for project files only
                submission = new Submission({
                    examId,
                    studentId,
                    projectFiles: fileMetadata,
                    projectDescription: description,
                    status: 'submitted',
                    submittedAt: new Date()
                });
                await submission.save();
            }

            res.status(201).json({
                message: 'Project files uploaded successfully',
                submission: {
                    id: submission._id,
                    files: fileMetadata,
                    description: submission.projectDescription,
                    submittedAt: submission.submittedAt
                }
            });

        } catch (error) {
            // Clean up uploaded files on error
            if (req.files) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }

            res.status(500).json({
                message: 'Error uploading files',
                error: error.message
            });
        }
    }
];

exports.downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Find submission containing the file
        const submission = await Submission.findOne({
            $or: [
                { 'projectFiles._id': id },
                { 'answers.files._id': id }
            ]
        }).populate('examId').populate('studentId');

        if (!submission) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check permissions
        const canAccess = userRole === 'admin' ||
            userRole === 'tutor' ||
            submission.studentId._id.toString() === userId.toString();

        if (!canAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find the file in projectFiles or answers
        let file = null;
        if (submission.projectFiles) {
            file = submission.projectFiles.find(f => f._id.toString() === id);
        }

        if (!file && submission.answers) {
            for (let answer of submission.answers) {
                if (answer.files) {
                    file = answer.files.find(f => f._id.toString() === id);
                    if (file) break;
                }
            }
        }

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check if file exists
        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        // Set headers and send file
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimetype);

        const fileStream = fs.createReadStream(file.path);
        fileStream.pipe(res);

    } catch (error) {
        res.status(500).json({
            message: 'Error downloading file',
            error: error.message
        });
    }
};

exports.getSubmissionFiles = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const submission = await Submission.findById(submissionId)
            .populate('studentId', 'name email')
            .populate('examId', 'title tutorId');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check permissions
        const canAccess = userRole === 'admin' ||
            (userRole === 'tutor' && submission.examId.tutorId.toString() === userId.toString()) ||
            submission.studentId._id.toString() === userId.toString();

        if (!canAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const files = submission.projectFiles || [];

        res.json({
            submissionId: submission._id,
            studentName: submission.studentId.name,
            examTitle: submission.examId.title,
            files: files.map(file => ({
                id: file._id,
                originalName: file.originalName,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: file.uploadedAt
            }))
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error fetching files',
            error: error.message
        });
    }
};