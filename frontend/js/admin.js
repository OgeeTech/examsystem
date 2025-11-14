// ===============================
// 📘 TUTOR DASHBOARD CLASS
// ===============================
class TutorDashboard {
    constructor() {
        this.currentExam = null;
        this.exams = [];
        this.students = [];
        this.submissions = [];
        this.department = '';
        this.departments = [];
        this.init();
    }

    async init() {
        await this.loadDepartments();

        // Set department from user info
        const user = AuthService.getUser();
        this.department = user.department;

        // Set department in forms
        document.getElementById('examDepartment').value = this.department;
        document.getElementById('tutorProfileDept').value = this.department;
        document.getElementById('tutorProfileName').value = user.name;
        document.getElementById('tutorProfileEmail').value = user.email;

        await this.loadDashboardData();
        this.setupEventListeners();
        this.loadNotifications();
    }

    async loadDepartments() {
        try {
            this.departments = await ApiService.getDepartments();
            this.populateDepartmentFilters();
        } catch (error) {
            console.error('Error loading departments:', error);
            this.departments = ['Frontend', 'Backend', 'Fullstack', 'Cybersecurity', 'Dispatch'];
        }
    }

    populateDepartmentFilters() {
        // Update department filters in tutor dashboard
        const departmentElements = [
            'filterExamDept',
            'reportDept'
        ];

        departmentElements.forEach(selector => {
            const element = document.getElementById(selector);
            if (element) {
                element.innerHTML = '<option value="all">All Departments</option>' +
                    this.departments.map(dept =>
                        `<option value="${dept}">${dept}</option>`
                    ).join('');
            }
        });
    }

    // ✅ Exam creation — validate department
    async submitExamForm() {
        const examData = {
            title: document.getElementById('modalExamTitle').value.trim(),
            description: document.getElementById('modalExamDescription').value.trim(),
            timeLimitMinutes: parseInt(document.getElementById('modalExamTimeLimit').value),
            department: this.department // Use tutor's department
        };

        if (!this.departments.includes(examData.department)) {
            this.showError('Invalid department selected');
            return;
        }

        // ... rest of your exam logic
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => errorDiv.style.display = 'none', 5000);
        }
    }

    async loadDashboardData() {
        // implement loading tutor-specific data (students, exams, etc.)
    }

    setupEventListeners() {
        // implement event listeners for buttons/forms
    }

    loadNotifications() {
        // implement notification loading logic
    }
}


// ===============================
// 🧑‍💼 ADMIN DASHBOARD CLASS
// ===============================
class AdminDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.departments = [];
        this.init();
    }

    async init() {
        await this.loadDepartments();
        await this.loadDashboardData();
        this.setupEventListeners();
        this.loadNotifications();
    }

    async loadDepartments() {
        try {
            this.departments = await ApiService.getDepartments();
            this.populateDepartmentFilters();
        } catch (error) {
            console.error('Error loading departments:', error);
            this.departments = ['Frontend', 'Backend', 'Fullstack', 'Cybersecurity', 'Dispatch'];
        }
    }

    populateDepartmentFilters() {
        const departmentSelectors = [
            'deptFilter',
            'filterDeptStudents',
            'reportDept',
            'tutorDept',
            'departmentFilter'
        ];

        departmentSelectors.forEach(selector => {
            const element = document.getElementById(selector);
            if (element) {
                element.innerHTML = '<option value="all">All Departments</option>' +
                    this.departments.map(dept =>
                        `<option value="${dept}">${dept}</option>`
                    ).join('');
            }
        });
    }

    async fetchDepartmentData(dept) {
        if (!this.departments.includes(dept)) {
            console.error('Invalid department:', dept);
            return null;
        }

        try {
            const response = await fetch(`/api/admin/reports/department/${encodeURIComponent(dept)}`, {
                headers: AuthService.getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch department data');
            return await response.json();
        } catch (error) {
            console.error(`Error fetching data for ${dept}:`, error);
            return null;
        }
    }

    async loadDepartmentCharts() {
        try {
            const chartContainer = document.getElementById('chartsContainer');
            if (!chartContainer) return;

            chartContainer.innerHTML = '<div class="loading">Loading charts...</div>';
            const chartPromises = this.departments.map(dept => this.fetchDepartmentData(dept));
            const departmentsData = await Promise.all(chartPromises);

            chartContainer.innerHTML = '';
            departmentsData.forEach((data, index) => {
                if (data) this.renderDepartmentChart(this.departments[index], data);
            });
        } catch (error) {
            console.error('Error loading charts:', error);
        }
    }

    renderDepartmentChart(department, data) {
        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart';
        chartDiv.innerHTML = `<h4>${department}</h4><p>${JSON.stringify(data)}</p>`;
        document.getElementById('chartsContainer').appendChild(chartDiv);
    }

    async loadDashboardData() {
        try {
            const [tutors, students, notifications] = await Promise.all([
                ApiService.getTutors(),
                ApiService.getStudents(),
                ApiService.getNotifications()
            ]);

            this.renderStats(tutors, students);
            this.renderTutorsTable(tutors);
            this.renderStudentsTable(students);
            this.renderNotifications(notifications);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    renderStats(tutors, students) {
        const statsElement = document.getElementById('stats');
        if (!statsElement) return;

        statsElement.innerHTML = `
            <div class="stat-card"><h3>Total Tutors</h3><div class="stat-number">${tutors.length}</div></div>
            <div class="stat-card"><h3>Total Students</h3><div class="stat-number">${students.length}</div></div>
            <div class="stat-card"><h3>Departments</h3><div class="stat-number">${new Set(students.map(s => s.department)).size}</div></div>
        `;
    }

    renderTutorsTable(tutors) {
        const tableBody = document.getElementById('tutorsTableBody');
        if (!tableBody) return;

        if (tutors.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No tutors found</td></tr>';
            return;
        }

        tableBody.innerHTML = tutors.map(tutor => `
            <tr>
                <td>${tutor.name}</td>
                <td>${tutor.email}</td>
                <td>${tutor.department}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.sendAdmissionToTutorStudents('${tutor.department}')">
                        Send Admissions
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderStudentsTable(students) {
        const tableBody = document.getElementById('studentsTableBody');
        if (!tableBody) return;

        if (students.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No students found</td></tr>';
            return;
        }

        tableBody.innerHTML = students.map(student => `
            <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.department}</td>
                <td>${student.assignedTutorId?.name || 'Not assigned'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.sendAdmissionLetter('${student._id}')">
                        Send Admission
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async sendAdmissionLetter(studentId) {
        if (!confirm('Send admission letter to this student?')) return;
        try {
            await ApiService.sendAdmissionLetters([studentId]);
            alert('Admission letter sent successfully!');
            this.loadDashboardData();
        } catch (error) {
            alert('Error sending admission letter: ' + error.message);
        }
    }

    async sendAdmissionToTutorStudents(department) {
        if (!confirm(`Send admission letters to all students in ${department}?`)) return;
        try {
            const students = await ApiService.getStudents(department);
            const studentIds = students.map(s => s._id);
            const result = await ApiService.sendAdmissionLetters(studentIds);
            alert(`Admission letters sent to ${result.results.filter(r => r.success).length} students successfully!`);
            this.loadDashboardData();
        } catch (error) {
            alert('Error sending admission letters: ' + error.message);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => errorDiv.style.display = 'none', 5000);
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.switchView(link.dataset.view);
            });
        });

        const departmentFilter = document.getElementById('departmentFilter');
        if (departmentFilter) {
            departmentFilter.addEventListener('change', e => {
                this.filterByDepartment(e.target.value);
            });
        }
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        const currentViewElement = document.getElementById(`${view}View`);
        if (currentViewElement) currentViewElement.style.display = 'block';
        this.loadViewData(view);
    }

    async loadViewData(view) {
        switch (view) {
            case 'tutors': await this.loadTutorsView(); break;
            case 'students': await this.loadStudentsView(); break;
            case 'admissions': await this.loadAdmissionsView(); break;
        }
    }

    async loadTutorsView() {
        try {
            const tutors = await ApiService.getTutors();
            this.renderTutorsTable(tutors);
        } catch {
            this.showError('Failed to load tutors');
        }
    }

    async loadStudentsView() {
        try {
            const students = await ApiService.getStudents();
            this.renderStudentsTable(students);
        } catch {
            this.showError('Failed to load students');
        }
    }

    async loadAdmissionsView() {
        console.log('Loading admissions view...');
    }

    async loadNotifications() {
        try {
            const notifications = await ApiService.getNotifications();
            this.renderNotifications(notifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    renderNotifications(notifications) {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;

        const unread = notifications.filter(n => !n.read);
        if (unread.length === 0) {
            notificationsList.innerHTML = '<div class="notification-item">No new notifications</div>';
            return;
        }

        notificationsList.innerHTML = unread.map(notification => `
            <div class="notification-item ${!notification.read ? 'unread' : ''}">
                <div class="notification-content">
                    <strong>${this.getNotificationTitle(notification)}</strong>
                    <p>${this.getNotificationMessage(notification)}</p>
                    <small>${UIHelpers.formatDate(notification.sentAt)}</small>
                </div>
                <button class="btn btn-sm" onclick="adminDashboard.markNotificationAsRead('${notification._id}')">
                    Mark Read
                </button>
            </div>
        `).join('');
    }

    getNotificationTitle(notification) {
        const types = {
            'admission': 'Admission Letter',
            'exam_reminder': 'Exam Reminder',
            'result': 'Exam Results',
            'general': 'Notification'
        };
        return types[notification.type] || 'Notification';
    }

    getNotificationMessage(notification) {
        switch (notification.type) {
            case 'admission': return 'Admission letter sent to student';
            case 'exam_reminder': return `Reminder for exam: ${notification.payload.examTitle}`;
            case 'result': return `Exam results available: ${notification.payload.score}/${notification.payload.maxScore}`;
            default: return notification.payload.message || 'New notification';
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            await ApiService.markNotificationAsRead(notificationId);
            this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
}

// ===============================
// 🚀 INITIALIZE BOTH DASHBOARDS
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tutorDashboard')) {
        window.tutorDashboard = new TutorDashboard();
    }
    if (document.getElementById('adminDashboard')) {
        window.adminDashboard = new AdminDashboard();
    }
});
