const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    getDepartmentPerformance,
    exportDepartmentReport
} = require('../controllers/reportController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/department/:dept', getDepartmentPerformance);
router.get('/export', exportDepartmentReport);

module.exports = router;