class EmailTemplates {
    static getAdmissionEmail(student, pdfPath) {
        return {
            subject: `Admission Confirmation - ${student.department} Department`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to Our Institution!</h1>
            </div>
            <div class="content">
                <h2>Congratulations, ${student.name}!</h2>
                <p>We are delighted to inform you that you have been admitted to the <strong>${student.department}</strong> department.</p>
                
                <h3>Your Admission Details:</h3>
                <ul>
                    <li><strong>Student ID:</strong> ${student._id}</li>
                    <li><strong>Department:</strong> ${student.department}</li>
                    <li><strong>Email:</strong> ${student.email}</li>
                </ul>
                
                <p>Your official admission letter is attached to this email. Please review it carefully and complete the required next steps.</p>
                
                <h3>Next Steps:</h3>
                <ol>
                    <li>Complete your online registration</li>
                    <li>Submit any required documents</li>
                    <li>Attend the orientation session</li>
                    <li>Meet with your assigned tutor</li>
                </ol>
                
                <p>If you have any questions, please contact our admissions office.</p>
                
                <p>Welcome to our academic community!</p>
            </div>
            <div class="footer">
                <p>Education Institution | 123 Campus Drive | admissions@institution.edu</p>
            </div>
        </body>
        </html>
      `
        };
    }

    static getExamReminder(student, exam) {
        return {
            subject: `Exam Reminder: ${exam.title}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #d35400; color: white; padding: 15px; text-align: center; }
                .content { padding: 20px; }
                .exam-info { background: #f8f9fa; padding: 15px; border-left: 4px solid #d35400; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Exam Reminder</h2>
            </div>
            <div class="content">
                <p>Hello ${student.name},</p>
                
                <p>This is a reminder for your upcoming exam:</p>
                
                <div class="exam-info">
                    <h3>${exam.title}</h3>
                    <p><strong>Description:</strong> ${exam.description}</p>
                    <p><strong>Time Limit:</strong> ${exam.timeLimitMinutes} minutes</p>
                    ${exam.startsAt ? `<p><strong>Scheduled:</strong> ${new Date(exam.startsAt).toLocaleString()}</p>` : ''}
                </div>
                
                <p>Please ensure you:</p>
                <ul>
                    <li>Have a stable internet connection</li>
                    <li>Are in a quiet environment</li>
                    <li>Have all required materials ready</li>
                    <li>Start the exam on time</li>
                </ul>
                
                <p>Good luck with your exam!</p>
            </div>
        </body>
        </html>
      `
        };
    }

    static getExamResults(student, exam, submission) {
        const percentage = ((submission.totalScore / submission.maxScore) * 100).toFixed(1);

        return {
            subject: `Exam Results: ${exam.title}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #27ae60; color: white; padding: 15px; text-align: center; }
                .content { padding: 20px; }
                .results { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                .score { font-size: 24px; font-weight: bold; color: #2c5aa0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Exam Results Available</h2>
            </div>
            <div class="content">
                <p>Hello ${student.name},</p>
                
                <p>Your results for <strong>${exam.title}</strong> are now available.</p>
                
                <div class="results">
                    <p class="score">${submission.totalScore} / ${submission.maxScore} (${percentage}%)</p>
                    <p><strong>Exam:</strong> ${exam.title}</p>
                    <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
                </div>
                
                <p>You can view detailed results and feedback on your student dashboard.</p>
                
                <p>If you have any questions about your results, please contact your tutor.</p>
            </div>
        </body>
        </html>
      `
        };
    }

    static getPasswordReset(user, resetToken) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        return {
            subject: 'Password Reset Request',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #c0392b; color: white; padding: 15px; text-align: center; }
                .content { padding: 20px; }
                .button { background: #c0392b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Password Reset</h2>
            </div>
            <div class="content">
                <p>Hello ${user.name},</p>
                
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                
                <p style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </p>
                
                <p>If you didn't request this reset, please ignore this email. The link will expire in 1 hour.</p>
                
                <p><strong>Note:</strong> For security reasons, please do not share this link with anyone.</p>
            </div>
        </body>
        </html>
      `
        };
    }
}

module.exports = EmailTemplates;