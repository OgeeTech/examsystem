const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const NotificationController = require('../controllers/notificationController');

const router = express.Router();

router.use(authMiddleware);

// Get user's notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await NotificationController.getUserNotifications(req.user._id);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching notifications',
            error: error.message
        });
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await NotificationController.markAsRead(
            req.params.id,
            req.user._id
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({
            message: 'Error updating notification',
            error: error.message
        });
    }
});

module.exports = router;