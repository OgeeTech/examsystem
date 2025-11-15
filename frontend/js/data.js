
class ApiService {
    static BASE_URL = 'https://examsystem-ujhm.onrender.com/api';

    static async request(endpoint, options = {}) {
        const token = AuthService.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            console.log(`Making API request to: ${this.BASE_URL}${endpoint}`);
            const response = await fetch(`${this.BASE_URL}${endpoint}`, config);

            // Check if response is OK before trying to parse JSON
            if (!response.ok) {
                if (response.status === 401) {
                    AuthService.logout();
                    throw new Error('Session expired. Please login again.');
                }

                // Try to get error message from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Parse JSON only for successful responses
            const data = await response.json();
            console.log(`API response from ${endpoint}:`, data);
            return data;

        } catch (error) {
            console.error(`API request to ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Tutor APIs
    static async createExam(examData) {
        return this.request('/tutor/exams', {
            method: 'POST',
            body: examData
        });
    }

    static async getTutorExams() {
        return this.request('/tutor/exams');
    }

    static async getExamById(examId) {
        return this.request(`/tutor/exams/${examId}`);
    }

    static async addQuestionsToExam(examId, questions) {
        try {
            // First try the specific endpoint
            return await this.request(`/tutor/exams/${examId}/questions`, {
                method: 'POST',
                body: { questions }
            });
        } catch (error) {
            console.warn('Specific questions endpoint failed, trying update exam:', error);

            // Fallback: Update the entire exam
            const exam = await this.getExamById(examId);
            const updatedExam = {
                ...exam,
                questions: questions
            };

            return await this.request(`/tutor/exams/${examId}`, {
                method: 'PUT',
                body: updatedExam
            });
        }
    }

    static async deleteExam(examId) {
        return this.request(`/tutor/exams/${examId}`, {
            method: 'DELETE'
        });
    }

    static async getTutorStudents() {
        return this.request('/tutor/students');
    }

    // ADD THIS METHOD - Exam Status Toggle
    static async toggleExamStatus(examId, isActive) {
        return this.request(`/tutor/exams/${examId}/status`, {
            method: 'PUT',
            body: { isActive }
        });
    }

    // Student APIs
    static async getStudentExams() {
        try {
            const exams = await this.request('/student/exams');
            console.log('Student exams loaded from API:', exams);
            return exams;
        } catch (error) {
            console.error('Error loading student exams:', error);
            throw error;
        }
    }

    static async startExam(examId) {
        return this.request(`/student/exams/${examId}/start`, {
            method: 'POST'
        });
    }

    static async submitExam(examId, answers) {
        return this.request(`/student/exams/${examId}/submit`, {
            method: 'POST',
            body: { answers }
        });
    }

    static async getStudentGrades() {
        try {
            const grades = await this.request('/student/grades');
            console.log('Student grades loaded:', grades);
            return grades;
        } catch (error) {
            console.error('Error loading student grades:', error);
            throw error;
        }
    }

    static async getStudentSubmissions() {
        try {
            const submissions = await this.request('/student/submissions');
            console.log('Student submissions loaded:', submissions);
            return submissions;
        } catch (error) {
            console.error('Error loading student submissions:', error);
            throw error;
        }
    }

    static async getSubmission(submissionId) {
        try {
            const submission = await this.request(`/student/submissions/${submissionId}`);
            console.log('Submission details loaded:', submission);
            return submission;
        } catch (error) {
            console.error('Error loading submission:', error);
            throw error;
        }
    }

    static async getFullExam(examId) {
        try {
            const exam = await this.request(`/student/exams/${examId}/full`);
            console.log('Full exam loaded:', exam);
            return exam;
        } catch (error) {
            console.error('Error loading full exam:', error);
            throw error;
        }
    }
    // Tutor Grade Management APIs
    static async updateStudentAttendance(studentId, attendanceScore) {
        return this.request(`/tutor/students/${studentId}/attendance`, {
            method: 'PUT',
            body: { attendanceScore }
        });
    }

    static async updateStudentProjectScore(studentId, projectScore) {
        return this.request(`/tutor/students/${studentId}/project-score`, {
            method: 'PUT',
            body: { projectScore }
        });
    }

    static async getStudentGradeDetails(studentId) {
        return this.request(`/tutor/students/${studentId}/grades`);
    }


    // Admin APIs
    static async getDepartments() {
        return this.request('/admin/departments');
    }

    // Notifications
    static async getNotifications() {
        try {
            const notifications = await this.request('/notifications');
            console.log('Notifications loaded:', notifications);
            return notifications;
        } catch (error) {
            console.log('Notifications not available, returning empty array');
            return [];
        }
    }

    // File Upload
    static async uploadProjectSubmission(formData) {
        try {
            const token = AuthService.getToken();
            const response = await fetch(`${this.BASE_URL}/student/submissions/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading files:', error);
            throw error;
        }
    }
}

// UI Helpers
class UIHelpers {
    static showLoading(element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }

    static showError(element, message) {
        element.innerHTML = `<div class="error-message">${message}</div>`;
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    static escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }
}