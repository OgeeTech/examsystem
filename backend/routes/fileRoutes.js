const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    uploadProjectSubmission,
    downloadFile,
    getSubmissionFiles
} = require('../controllers/fileController');

const router = express.Router();

router.use(authMiddleware);

router.post('/submissions', uploadProjectSubmission);
router.get('/submissions/:submissionId/files', getSubmissionFiles);
router.get('/submissions/:id/download', downloadFile);

module.exports = router;