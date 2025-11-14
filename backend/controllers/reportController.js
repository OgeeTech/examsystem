const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Grade = require('../models/Grade');
const DEPARTMENTS = require('../config/departments');

// ✅ Get Department Performance
exports.getDepartmentPerformance = async (req, res) => {
    try {
        const { dept } = req.params;
        const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

        // ✅ Validate department
        if (!DEPARTMENTS.includes(dept)) {
            return res.status(400).json({ message: 'Invalid department' });
        }

        // ✅ Calculate date range based on period
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }

        // ✅ Get department statistics
        const totalStudents = await User.countDocuments({
            department: dept,
            role: 'student'
        });

        const totalTutors = await User.countDocuments({
            department: dept,
            role: 'tutor'
        });

        // ✅ Get grade statistics
        const grades = await Grade.find({ department: dept });

        const avgAttendance =
            grades.length > 0
                ? grades.reduce((sum, grade) => sum + grade.attendanceScore, 0) / grades.length
                : 0;

        const avgExamScore =
            grades.length > 0
                ? grades.reduce((sum, grade) => sum + grade.testScore, 0) / grades.length
                : 0;

        // ✅ Get exam distribution
        const submissions = await Submission.find({
            submittedAt: { $gte: startDate },
            status: { $in: ['graded', 'overridden'] }
        }).populate({
            path: 'examId',
            match: { department: dept }
        });

        const validSubmissions = submissions.filter(sub => sub.examId);

        const examDistribution = {
            '0-49': 0,
            '50-69': 0,
            '70-89': 0,
            '90-100': 0
        };

        validSubmissions.forEach(sub => {
            const percentage = sub.percentage;
            if (percentage < 50) examDistribution['0-49']++;
            else if (percentage < 70) examDistribution['50-69']++;
            else if (percentage < 90) examDistribution['70-89']++;
            else examDistribution['90-100']++;
        });

        // ✅ Get trend data (last 12 months)
        const trend = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthSubmissions = await Submission.find({
                submittedAt: { $gte: monthStart, $lte: monthEnd },
                status: { $in: ['graded', 'overridden'] }
            }).populate({
                path: 'examId',
                match: { department: dept }
            });

            const validMonthSubmissions = monthSubmissions.filter(sub => sub.examId);
            const avgScore =
                validMonthSubmissions.length > 0
                    ? validMonthSubmissions.reduce((sum, sub) => sum + sub.percentage, 0) /
                    validMonthSubmissions.length
                    : 0;

            trend.push({
                date: monthStart.toISOString().substring(0, 7), // YYYY-MM
                avg: Math.round(avgScore * 10) / 10,
                count: validMonthSubmissions.length
            });
        }

        // ✅ Get top performing students
        const topStudents = await Grade.find({ department: dept })
            .sort({ overallScore: -1 })
            .limit(5)
            .populate('studentId', 'name email');

        res.json({
            dept,
            totalStudents,
            totalTutors,
            avgAttendance: Math.round(avgAttendance * 10) / 10,
            avgExamScore: Math.round(avgExamScore * 10) / 10,
            examDistribution,
            trend,
            topStudents: topStudents.map(grade => ({
                name: grade.studentId.name,
                email: grade.studentId.email,
                overallScore: Math.round(grade.overallScore * 10) / 10,
                testScore: Math.round(grade.testScore * 10) / 10
            })),
            lastUpdated: new Date()
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching department performance',
            error: error.message
        });
    }
};

// ✅ Export Department Report
exports.exportDepartmentReport = async (req, res) => {
    try {
        const { dept, type = 'excel' } = req.query;

        if (!DEPARTMENTS.includes(dept)) {
            return res.status(400).json({ message: 'Invalid department' });
        }

        if (type === 'excel') {
            await exportExcelReport(req, res, dept);
        } else if (type === 'pdf') {
            await exportPdfReport(req, res, dept);
        } else {
            res.status(400).json({ message: 'Invalid export type' });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error exporting report',
            error: error.message
        });
    }
};

// ✅ Helper method for Excel export
async function exportExcelReport(req, res, dept) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Department Performance');

    // Add headers
    worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 }
    ];

    // Get department data
    const performanceData = await getDepartmentPerformanceData(dept);

    // Add data
    worksheet.addRow({ metric: 'Department', value: dept });
    worksheet.addRow({ metric: 'Total Students', value: performanceData.totalStudents });
    worksheet.addRow({ metric: 'Total Tutors', value: performanceData.totalTutors });
    worksheet.addRow({ metric: 'Average Attendance', value: performanceData.avgAttendance + '%' });
    worksheet.addRow({ metric: 'Average Exam Score', value: performanceData.avgExamScore + '%' });
    worksheet.addRow({ metric: '', value: '' }); // Empty row

    // Add exam distribution
    worksheet.addRow({ metric: 'Exam Score Distribution', value: '' });
    Object.entries(performanceData.examDistribution).forEach(([range, count]) => {
        worksheet.addRow({ metric: `${range}%`, value: count });
    });

    // Style the header
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C5AA0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${dept}-performance-${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
}

// ✅ Simplified data fetcher (used by Excel export)
async function getDepartmentPerformanceData(dept) {
    // Ideally fetch real data (you can reuse logic above)
    return {
        dept,
        totalStudents: 0,
        totalTutors: 0,
        avgAttendance: 0,
        avgExamScore: 0,
        examDistribution: {}
    };
}
