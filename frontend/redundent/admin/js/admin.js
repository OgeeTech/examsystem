class AdminDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.departments = [];
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        this.setupEventListeners();
        this.loadNotifications();

        // Load initial data
        this.renderTutors();
        this.renderStudents();
    }

    async loadDashboardData() {
        try {
            const [tutors, students, notifications, departments] = await Promise.all([
                ApiService.getTutors(),
                ApiService.getStudents(),
                ApiService.getNotifications(),
                this.fetchDepartments()
            ]);

            this.departments = departments;
            this.renderStats(tutors, students);
            this.renderTutorsTable(tutors);
            this.renderStudentsTable(students);
            this.renderNotifications(notifications);

            // Load charts if on dashboard view
            if (this.currentView === 'dashboard') {
                await this.loadDepartmentCharts();
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async fetchDepartments() {
        try {
            // This would typically come from an API endpoint
            // For now, we'll extract from existing data or use defaults
            const students = await ApiService.getStudents();
            const departments = [...new Set(students.map(s => s.department))];
            return departments.length > 0 ? departments : ['Computer Science', 'Mathematics', 'Physics'];
        } catch (error) {
            console.error('Error fetching departments:', error);
            return ['Computer Science', 'Mathematics', 'Physics'];
        }
    }

    renderStats(tutors, students) {
        const statsElement = document.getElementById('stats');
        if (!statsElement) return;

        statsElement.innerHTML = `
            <div class="stat-card">
                <h3>Total Tutors</h3>
                <div class="stat-number">${tutors.length}</div>
            </div>
            <div class="stat-card">
                <h3>Total Students</h3>
                <div class="stat-number">${students.length}</div>
            </div>
            <div class="stat-card">
                <h3>Departments</h3>
                <div class="stat-number">${this.departments.length}</div>
            </div>
            <div class="stat-card">
                <h3>Active Exams</h3>
                <div class="stat-number">${this.getActiveExamsCount(students)}</div>
            </div>
        `;
    }

    getActiveExamsCount(students) {
        // This would typically come from an API
        // For now, return a placeholder
        return students.length > 0 ? Math.floor(students.length / 10) : 0;
    }

    // Handle navigation between sections
    setupNavigation() {
        const sidebarItems = document.querySelectorAll(".sidebar ul li");
        const sections = document.querySelectorAll(".section");

        sidebarItems.forEach((item) => {
            item.addEventListener("click", () => {
                sidebarItems.forEach((el) => el.classList.remove("active"));
                item.classList.add("active");

                const sectionToShow = item.getAttribute("data-section");
                sections.forEach((sec) => {
                    sec.classList.toggle("active", sec.id === sectionToShow);
                });

                this.currentView = sectionToShow.replace('View', '');
                this.loadViewData(this.currentView);
            });
        });
    }

    async loadViewData(view) {
        switch (view) {
            case 'dashboard':
                await this.loadDepartmentCharts();
                break;
            case 'tutors':
                await this.loadTutorsView();
                break;
            case 'students':
                await this.loadStudentsView();
                break;
            case 'admissions':
                await this.loadAdmissionsView();
                break;
            case 'analytics':
                await this.loadAnalyticsView();
                break;
        }
    }

    // Department Performance Charts
    async loadDepartmentCharts() {
        try {
            const chartContainer = document.getElementById('chartsContainer');
            if (!chartContainer) return;

            chartContainer.innerHTML = '<div class="loading">Loading charts...</div>';

            // Load data for each department
            const chartPromises = this.departments.map(dept =>
                this.fetchDepartmentData(dept)
            );

            const departmentsData = await Promise.all(chartPromises);

            chartContainer.innerHTML = '';

            departmentsData.forEach((data, index) => {
                if (data) {
                    this.renderDepartmentChart(this.departments[index], data);
                }
            });

            if (chartContainer.children.length === 0) {
                chartContainer.innerHTML = '<div class="empty-state">No chart data available</div>';
            }

        } catch (error) {
            console.error('Error loading charts:', error);
            const chartContainer = document.getElementById('chartsContainer');
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="error-message">Failed to load charts</div>';
            }
        }
    }

    async fetchDepartmentData(dept) {
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

    renderDepartmentChart(dept, data) {
        if (!data) return;

        const chartContainer = document.getElementById('chartsContainer');
        const chartCard = document.createElement('div');
        chartCard.className = 'chart-card';

        chartCard.innerHTML = `
            <div class="chart-header">
                <h3>${dept} Department</h3>
                <div class="chart-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.exportDepartmentReport('${dept}')">
                        Export
                    </button>
                </div>
            </div>
            <div class="chart-stats">
                <div class="stat-item">
                    <span class="stat-label">Students:</span>
                    <span class="stat-value">${data.totalStudents}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Score:</span>
                    <span class="stat-value">${data.avgExamScore}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Attendance:</span>
                    <span class="stat-value">${data.avgAttendance}%</span>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="chart-${dept.replace(/\s+/g, '-')}"></canvas>
            </div>
            ${data.topStudents && data.topStudents.length > 0 ? `
                <div class="top-students">
                    <h4>Top Performers</h4>
                    ${data.topStudents.map(student => `
                        <div class="top-student">
                            <span class="student-name">${student.name}</span>
                            <span class="student-score">${student.overallScore}%</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        chartContainer.appendChild(chartCard);

        // Render Chart.js chart after a brief delay to ensure DOM is ready
        setTimeout(() => {
            const ctx = document.getElementById(`chart-${dept.replace(/\s+/g, '-')}`).getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(data.examDistribution),
                        datasets: [{
                            label: 'Number of Students',
                            data: Object.values(data.examDistribution),
                            backgroundColor: [
                                '#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4'
                            ],
                            borderColor: [
                                '#ff5252', '#ffc107', '#4caf50', '#00bcd4'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Exam Score Distribution',
                                font: {
                                    size: 14
                                }
                            },
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Students'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Score Ranges'
                                }
                            }
                        }
                    }
                });
            }
        }, 100);
    }

    async exportDepartmentReport(dept) {
        try {
            const response = await fetch(`/api/admin/reports/export?dept=${encodeURIComponent(dept)}&type=excel`, {
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${dept}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export report');
        }
    }

    // Tutors Management
    async renderTutors() {
        try {
            const tutors = await ApiService.getTutors();
            this.renderTutorsTable(tutors);
        } catch (error) {
            console.error('Error loading tutors:', error);
            this.showError('Failed to load tutors');
        }
    }

    renderTutorsTable(tutors) {
        const tutorList = document.getElementById('tutorList');
        if (!tutorList) return;

        if (tutors.length === 0) {
            tutorList.innerHTML = '<tr><td colspan="5" class="text-center">No tutors found</td></tr>';
            return;
        }

        tutorList.innerHTML = tutors.map((tutor, index) => `
            <tr>
                <td>${tutor.name}</td>
                <td>${tutor.email}</td>
                <td>${tutor.department}</td>
                <td>${new Date(tutor.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.sendAdmissionToTutorStudents('${tutor.department}')">
                        Send Admissions
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.removeTutor('${tutor._id}')">
                        Remove
                    </button>
                </td>
            </tr>
        `).join('');

        // Update total tutors count
        const totalTutorsElement = document.getElementById('totalTutors');
        if (totalTutorsElement) {
            totalTutorsElement.textContent = tutors.length;
        }
    }

    async removeTutor(tutorId) {
        if (!confirm('Are you sure you want to remove this tutor?')) return;

        try {
            // This would typically call an API endpoint like:
            // await ApiService.deleteTutor(tutorId);
            // For now, we'll show a message
            alert('Tutor removal functionality would be implemented here');
            // Refresh the tutors list
            await this.renderTutors();
        } catch (error) {
            console.error('Error removing tutor:', error);
            this.showError('Failed to remove tutor');
        }
    }

    // Students Management
    async renderStudents() {
        try {
            const students = await ApiService.getStudents();
            this.renderStudentsTable(students);
        } catch (error) {
            console.error('Error loading students:', error);
            this.showError('Failed to load students');
        }
    }

    renderStudentsTable(students) {
        const studentsTableBody = document.getElementById('studentsTableBody');
        if (!studentsTableBody) return;

        if (students.length === 0) {
            studentsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No students found</td></tr>';
            return;
        }

        studentsTableBody.innerHTML = students.map(student => `
            <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.department}</td>
                <td>${student.assignedTutorId?.name || 'Not assigned'}</td>
                <td>${new Date(student.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.sendAdmissionLetter('${student._id}')">
                        Send Admission
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewStudentProgress('${student._id}')">
                        View Progress
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Add Tutor Form Handler
    setupAddTutorForm() {
        const addTutorForm = document.getElementById('addTutorForm');
        if (addTutorForm) {
            addTutorForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = {
                    name: document.getElementById('tutorName').value.trim(),
                    email: document.getElementById('tutorEmail').value.trim(),
                    department: document.getElementById('tutorDept').value.trim(),
                    password: document.getElementById('tutorPassword').value.trim(),
                    role: 'tutor'
                };

                if (!formData.name || !formData.email || !formData.department || !formData.password) {
                    this.showError('All fields are required!');
                    return;
                }

                try {
                    await ApiService.assignTutor(formData.email, formData.department);
                    addTutorForm.reset();
                    await this.renderTutors();
                    this.showSuccess('Tutor added successfully!');
                } catch (error) {
                    this.showError('Error adding tutor: ' + error.message);
                }
            });
        }
    }

    // Admission Management
    async sendAdmissionLetter(studentId) {
        if (!confirm('Send admission letter to this student?')) return;

        try {
            const result = await ApiService.sendAdmissionLetters([studentId]);
            this.showSuccess('Admission letter sent successfully!');
            this.loadDashboardData(); // Refresh data
        } catch (error) {
            this.showError('Error sending admission letter: ' + error.message);
        }
    }

    async sendAdmissionToTutorStudents(department) {
        if (!confirm(`Send admission letters to all students in ${department}?`)) return;

        try {
            const students = await ApiService.getStudents(department);
            const studentIds = students.map(s => s._id);

            const result = await ApiService.sendAdmissionLetters(studentIds);
            this.showSuccess(`Admission letters sent to ${result.results.filter(r => r.success).length} students successfully!`);
            this.loadDashboardData(); // Refresh data
        } catch (error) {
            this.showError('Error sending admission letters: ' + error.message);
        }
    }

    // Notifications
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

        const unreadNotifications = notifications.filter(n => !n.read);

        if (unreadNotifications.length === 0) {
            notificationsList.innerHTML = '<div class="notification-item">No new notifications</div>';
            return;
        }

        notificationsList.innerHTML = unreadNotifications.map(notification => `
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
            case 'admission':
                return 'Admission letter sent to student';
            case 'exam_reminder':
                return `Reminder for exam: ${notification.payload.examTitle}`;
            case 'result':
                return `Exam results available: ${notification.payload.score}/${notification.payload.maxScore}`;
            default:
                return notification.payload.message || 'New notification';
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

    // Utility Methods
    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Create or use existing message container
        let messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
        messageDiv.textContent = message;
        messageDiv.style.marginBottom = '10px';

        messageContainer.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    setupEventListeners() {
        this.setupNavigation();
        this.setupAddTutorForm();

        // Department filter
        const departmentFilter = document.getElementById('departmentFilter');
        if (departmentFilter) {
            departmentFilter.addEventListener('change', (e) => {
                this.filterByDepartment(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }
    }

    async filterByDepartment(department) {
        try {
            const students = await ApiService.getStudents(department);
            this.renderStudentsTable(students);
        } catch (error) {
            this.showError('Failed to filter students');
        }
    }

    async loadTutorsView() {
        await this.renderTutors();
    }

    async loadStudentsView() {
        await this.renderStudents();
    }

    async loadAdmissionsView() {
        // Implementation for admissions management view
        console.log('Loading admissions view...');
    }

    async loadAnalyticsView() {
        await this.loadDepartmentCharts();
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});