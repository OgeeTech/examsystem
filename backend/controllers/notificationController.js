const transporter = require('../config/mailer');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailTemplates = require('../utils/emailTemplates');
const PDFGenerator = require('../utils/pdf');

class NotificationController {
    static async sendAdmissionNotification(studentId, admissionDetails = {}) {
        try {
            const student = await User.findById(studentId);
            if (!student) {
                throw new Error('Student not found');
            }

            // Generate PDF admission letter
            const pdfResult = await PDFGenerator.generateAdmissionLetter(student, admissionDetails);

            // Prepare email
            const emailTemplate = EmailTemplates.getAdmissionEmail(student, pdfResult.url);

            // Send email with attachment
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'admissions@institution.edu',
                to: student.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                attachments: [
                    {
                        filename: `admission_letter_${student.name}.pdf`,
                        path: pdfResult.filepath
                    }
                ]
            };

            let emailSent = false;
            let emailError = null;

            try {
                await transporter.sendMail(mailOptions);
                emailSent = true;
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                emailError = emailError.message;
            }

            // Create notification record
            const notification = new Notification({
                type: 'admission',
                userId: studentId,
                payload: {
                    admissionDetails,
                    pdfUrl: pdfResult.url,
                    pdfFilename: pdfResult.filename
                },
                emailSent,
                emailError
            });

            await notification.save();

            return {
                success: true,
                notification,
                pdfUrl: pdfResult.url,
                emailSent
            };

        } catch (error) {
            console.error('Admission notification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async sendExamReminder(exam, studentId) {
        try {
            const student = await User.findById(studentId);
            if (!student) {
                throw new Error('Student not found');
            }

            const emailTemplate = EmailTemplates.getExamReminder(student, exam);

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@institution.edu',
                to: student.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html
            };

            let emailSent = false;
            let emailError = null;

            try {
                await transporter.sendMail(mailOptions);
                emailSent = true;
            } catch (error) {
                console.error('Exam reminder email failed:', error);
                emailError = error.message;
            }

            const notification = new Notification({
                type: 'exam_reminder',
                userId: studentId,
                payload: {
                    examId: exam._id,
                    examTitle: exam.title,
                    startsAt: exam.startsAt
                },
                emailSent,
                emailError
            });

            await notification.save();

            return {
                success: true,
                notification,
                emailSent
            };

        } catch (error) {
            console.error('Exam reminder error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async sendExamResults(studentId, examId, submissionId) {
        try {
            // Note: You'll need to populate these from your database
            // This is a simplified version - implement based on your data models
            const student = await User.findById(studentId);
            const exam = { _id: examId, title: 'Sample Exam' }; // Replace with actual exam fetch
            const submission = { _id: submissionId, totalScore: 85, maxScore: 100, submittedAt: new Date() }; // Replace with actual submission

            const emailTemplate = EmailTemplates.getExamResults(student, exam, submission);

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@institution.edu',
                to: student.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html
            };

            let emailSent = false;
            let emailError = null;

            try {
                await transporter.sendMail(mailOptions);
                emailSent = true;
            } catch (error) {
                console.error('Results email failed:', error);
                emailError = error.message;
            }

            const notification = new Notification({
                type: 'result',
                userId: studentId,
                payload: {
                    examId,
                    submissionId,
                    score: submission.totalScore,
                    maxScore: submission.maxScore
                },
                emailSent,
                emailError
            });

            await notification.save();

            return {
                success: true,
                notification,
                emailSent
            };

        } catch (error) {
            console.error('Exam results notification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get notifications for a user
    static async getUserNotifications(userId, limit = 20) {
        try {
            const notifications = await Notification.find({ userId })
                .sort({ sentAt: -1 })
                .limit(limit);

            return notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    static async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId },
                { read: true },
                { new: true }
            );

            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }
}

module.exports = NotificationController;