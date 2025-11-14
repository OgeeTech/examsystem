const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    static generateAdmissionLetter(student, admissionDetails) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = `admission_${student._id}_${Date.now()}.pdf`;
                const filepath = path.join(__dirname, '../uploads/admissions', filename);

                // Ensure directory exists
                const dir = path.dirname(filepath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Header
                doc.fontSize(20).font('Helvetica-Bold')
                    .text('OFFICIAL ADMISSION LETTER', { align: 'center' });
                doc.moveDown();

                // Institution Info
                doc.fontSize(12).font('Helvetica')
                    .text('Education Institution', { align: 'center' });
                doc.text('123 Campus Drive, Education City', { align: 'center' });
                doc.text('Phone: (555) 123-4567 | Email: admissions@institution.edu', { align: 'center' });
                doc.moveDown(2);

                // Date
                doc.text(`Date: ${new Date().toLocaleDateString()}`);
                doc.moveDown();

                // Student Information
                doc.font('Helvetica-Bold').text('ADMISSION DETAILS:');
                doc.font('Helvetica')
                    .text(`Student Name: ${student.name}`);
                doc.text(`Student ID: ${student._id}`);
                doc.text(`Email: ${student.email}`);
                doc.text(`Department: ${student.department}`);
                doc.text(`Program: ${admissionDetails.program || 'General Studies'}`);
                doc.moveDown();

                // Admission Message
                doc.font('Helvetica-Bold').text('CONGRATULATIONS!');
                doc.font('Helvetica')
                    .text(`Dear ${student.name},`);
                doc.moveDown();
                doc.text(`We are pleased to inform you that you have been admitted to the ${student.department} department for the upcoming academic session. Your dedication and academic achievements have earned you this opportunity.`);
                doc.moveDown();
                doc.text('Please complete your registration by the specified deadline and ensure all required documents are submitted. Welcome to our academic community!');
                doc.moveDown();

                // Next Steps
                doc.font('Helvetica-Bold').text('NEXT STEPS:');
                doc.font('Helvetica')
                    .text('1. Complete online registration within 7 days');
                doc.text('2. Submit required documents');
                doc.text('3. Attend orientation session');
                doc.text('4. Meet with your assigned tutor');
                doc.moveDown(2);

                // Signature
                doc.text('Sincerely,');
                doc.moveDown();
                doc.text('Admissions Office');
                doc.text('Education Institution');

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filepath,
                        url: `/api/files/admissions/${filename}`
                    });
                });

                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    static generateExamResults(student, exam, submission) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = `results_${submission._id}_${Date.now()}.pdf`;
                const filepath = path.join(__dirname, '../uploads/results', filename);

                const dir = path.dirname(filepath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Header
                doc.fontSize(18).font('Helvetica-Bold')
                    .text('EXAM RESULTS', { align: 'center' });
                doc.moveDown();

                // Student Info
                doc.fontSize(12).font('Helvetica')
                    .text(`Student: ${student.name}`);
                doc.text(`Exam: ${exam.title}`);
                doc.text(`Department: ${student.department}`);
                doc.text(`Date: ${new Date(submission.submittedAt).toLocaleDateString()}`);
                doc.moveDown();

                // Results
                doc.font('Helvetica-Bold').text('PERFORMANCE SUMMARY:');
                doc.font('Helvetica')
                    .text(`Score: ${submission.totalScore} / ${submission.maxScore}`);
                doc.text(`Percentage: ${((submission.totalScore / submission.maxScore) * 100).toFixed(1)}%`);
                doc.moveDown();

                // Detailed breakdown could be added here
                doc.text('For detailed question-by-question analysis, please check your student dashboard.');
                doc.moveDown();

                doc.text('This is an official results document.');
                doc.moveDown(2);

                doc.text('Tutor Signature: ________________________');
                doc.text('Date: ________________________');

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filepath,
                        url: `/api/files/results/${filename}`
                    });
                });

                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;