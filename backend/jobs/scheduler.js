const cron = require('node-cron');
const Exam = require('../models/Exam');
const User = require('../models/User');
const NotificationController = require('../controllers/notificationController');

class EmailScheduler {
    constructor() {
        this.jobs = new Map();
    }

    start() {
        console.log('📅 Starting email scheduler...');

        // Schedule exam reminders every minute (for testing)
        // In production, you might want to run this every 5-30 minutes
        cron.schedule('* * * * *', () => {
            this.sendExamReminders();
        });

        // Schedule daily summary at 8 AM
        cron.schedule('0 8 * * *', () => {
            this.sendDailySummaries();
        });

        // Schedule weekly reports on Monday at 9 AM
        cron.schedule('0 9 * * 1', () => {
            this.sendWeeklyReports();
        });

        console.log('✅ Email scheduler started');
    }

    async sendExamReminders() {
        try {
            const now = new Date();
            const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

            // Find exams starting in the next 24 hours
            const upcomingExams = await Exam.find({
                startsAt: {
                    $gte: now,
                    $lte: oneDayFromNow
                },
                isActive: true
            }).populate('questions');

            for (const exam of upcomingExams) {
                // Check if we should send 24-hour reminder
                const hoursUntilStart = (exam.startsAt - now) / (1000 * 60 * 60);

                if (hoursUntilStart <= 24 && hoursUntilStart > 23) {
                    await this.sendReminderForExam(exam, '24h');
                }

                // Check if we should send 1-hour reminder
                if (hoursUntilStart <= 1 && hoursUntilStart > 0) {
                    await this.sendReminderForExam(exam, '1h');
                }
            }

        } catch (error) {
            console.error('Error sending exam reminders:', error);
        }
    }

    async sendReminderForExam(exam, reminderType) {
        try {
            console.log(`Sending ${reminderType} reminder for exam: ${exam.title}`);

            // Get students who should receive this reminder
            let students;
            if (exam.assignedStudentIds && exam.assignedStudentIds.length > 0) {
                students = await User.find({
                    _id: { $in: exam.assignedStudentIds },
                    role: 'student'
                });
            } else {
                // If no specific students assigned, send to all in department
                students = await User.find({
                    department: exam.department,
                    role: 'student'
                });
            }

            // Send reminders to each student
            for (const student of students) {
                try {
                    await NotificationController.sendExamReminder(exam, student._id);
                    console.log(`Sent ${reminderType} reminder to ${student.email}`);

                    // Add delay to avoid overwhelming the email service
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`Failed to send reminder to ${student.email}:`, error);
                }
            }

        } catch (error) {
            console.error(`Error sending ${reminderType} reminders for exam ${exam.title}:`, error);
        }
    }

    async sendDailySummaries() {
        try {
            console.log('Sending daily summaries...');

            // Get all tutors
            const tutors = await User.find({ role: 'tutor' });

            for (const tutor of tutors) {
                await this.sendTutorDailySummary(tutor);
            }

        } catch (error) {
            console.error('Error sending daily summaries:', error);
        }
    }

    async sendTutorDailySummary(tutor) {
        try {
            // Get tutor's exams and recent submissions
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const recentExams = await Exam.find({
                tutorId: tutor._id,
                createdAt: { $gte: yesterday }
            });

            const recentSubmissions = await Submission.find({
                submittedAt: { $gte: yesterday }
            }).populate({
                path: 'examId',
                match: { tutorId: tutor._id }
            });

            const validSubmissions = recentSubmissions.filter(sub => sub.examId);

            // Only send summary if there's activity
            if (recentExams.length > 0 || validSubmissions.length > 0) {
                await this.sendSummaryEmail(tutor, {
                    newExams: recentExams.length,
                    newSubmissions: validSubmissions.length,
                    period: 'daily'
                });
            }

        } catch (error) {
            console.error(`Error sending daily summary to ${tutor.email}:`, error);
        }
    }

    async sendWeeklyReports() {
        try {
            console.log('Sending weekly reports...');

            // Get all admins
            const admins = await User.find({ role: 'admin' });

            for (const admin of admins) {
                await this.sendAdminWeeklyReport(admin);
            }

        } catch (error) {
            console.error('Error sending weekly reports:', error);
        }
    }

    async sendAdminWeeklyReport(admin) {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            // Get weekly statistics
            const newStudents = await User.countDocuments({
                role: 'student',
                createdAt: { $gte: oneWeekAgo }
            });

            const newExams = await Exam.countDocuments({
                createdAt: { $gte: oneWeekAgo }
            });

            const totalSubmissions = await Submission.countDocuments({
                submittedAt: { $gte: oneWeekAgo }
            });

            await this.sendSummaryEmail(admin, {
                newStudents,
                newExams,
                totalSubmissions,
                period: 'weekly'
            });

        } catch (error) {
            console.error(`Error sending weekly report to ${admin.email}:`, error);
        }
    }

    async sendSummaryEmail(user, stats) {
        // This would use your email service to send the summary
        // Implementation depends on your email template system
        console.log(`Would send ${stats.period} summary to ${user.email}`, stats);
    }

    stop() {
        // Stop all scheduled jobs
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped job: ${name}`);
        });
        this.jobs.clear();
    }
}

module.exports = new EmailScheduler();