

// class StudentDashboard {
//     constructor() {
//         this.currentExam = null;
//         this.timer = null;
//         this.exams = [];
//         this.grades = [];
//         this.submissions = [];
//         this.department = '';
//         this.departments = [];
//         this.init();
//     }

//     async init() {
//         await this.loadDepartments();

//         // Set user info
//         const user = AuthService.getUser();
//         this.department = user.department;
//         document.getElementById('studentDepartment').textContent = this.department;
//         document.getElementById('profileDepartment').value = this.department;
//         document.getElementById('profileName').value = user.name;
//         document.getElementById('profileEmail').value = user.email;
//         document.getElementById('profileStudentId').value = user._id;

//         await this.loadDashboardData();
//         this.setupEventListeners();
//         this.loadNotifications();
//     }

//     async loadDepartments() {
//         try {
//             this.departments = await ApiService.getDepartments();
//         } catch (error) {
//             console.error('Error loading departments:', error);
//             this.departments = ['Frontend', 'Backend', 'Fullstack', 'Cybersecurity', 'Dispatch'];
//         }
//     }

//     async loadDashboardData() {
//         try {
//             console.log('Loading student dashboard data...');

//             const [exams, grades, notifications] = await Promise.all([
//                 ApiService.getStudentExams().catch(error => {
//                     console.error('Failed to load exams:', error);
//                     this.showError('Failed to load exams: ' + error.message);
//                     return [];
//                 }),
//                 ApiService.getStudentGrades().catch(error => {
//                     console.error('Failed to load grades:', error);
//                     this.showError('Failed to load grades: ' + error.message);
//                     return { submissions: [], overallGrade: {} };
//                 }),
//                 ApiService.getNotifications().catch(error => {
//                     console.error('Failed to load notifications:', error);
//                     return [];
//                 })
//             ]);

//             console.log('Loaded exams:', exams);

//             // Ensure questionCount is set for each exam
//             this.exams = exams.map(exam => ({
//                 ...exam,
//                 questionCount: exam.questions?.length || exam.questionCount || 0
//             }));

//             this.grades = grades;
//             this.updateDashboardStats(grades);
//             this.renderUpcomingExams(this.exams);
//             this.renderRecentResults(grades);
//             this.renderPerformanceChart(grades);
//             this.renderNotifications(notifications);
//             this.populateAvailableExams(this.exams);
//             this.updateAcademicSummary(grades);

//         } catch (error) {
//             console.error('Error loading dashboard data:', error);
//             this.showError('Failed to load dashboard data: ' + error.message);
//         }
//     }

//     updateDashboardStats(grades) {
//         const overallScore = grades.overallGrade?.overallScore || 0;
//         const examsTaken = grades.submissions?.length || 0;
//         const pendingExams = this.exams.filter(exam =>
//             exam.submissionStatus === 'not_started' || exam.submissionStatus === 'in_progress'
//         ).length;

//         document.getElementById('stat-overall-score').textContent = overallScore.toFixed(1) + '%';
//         document.getElementById('stat-exams-taken').textContent = examsTaken;
//         document.getElementById('stat-pending-exams').textContent = pendingExams;
//     }

//     renderUpcomingExams(exams) {
//         const upcomingList = document.getElementById('upcoming-exams-list');
//         const countElement = document.getElementById('upcoming-exams-count');

//         if (!upcomingList) return;

//         const upcomingExams = exams.filter(exam =>
//             exam.submissionStatus === 'not_started' || exam.submissionStatus === 'in_progress'
//         ).slice(0, 5);

//         if (upcomingExams.length === 0) {
//             upcomingList.innerHTML = '<div class="empty-state">No upcoming exams</div>';
//             countElement.textContent = '0';
//             return;
//         }

//         countElement.textContent = upcomingExams.length;
//         upcomingList.innerHTML = upcomingExams.map(exam => `
//             <div class="exam-preview">
//                 <div style="display:flex;justify-content:space-between;align-items:start">
//                     <div>
//                         <strong>${this.escapeHtml(exam.title)}</strong>
//                         <div style="font-size:12px;color:var(--muted);margin-top:4px">
//                             ${this.escapeHtml(exam.description || 'No description')}
//                         </div>
//                     </div>
//                     <span class="tag ${exam.submissionStatus === 'in_progress' ? 'warning' : 'info'}">
//                         ${exam.submissionStatus === 'in_progress' ? 'In Progress' : 'Available'}
//                     </span>
//                 </div>
//                 <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;color:var(--muted)">
//                     <span>${exam.questionCount || 0} questions</span>
//                     <span>${exam.timeLimitMinutes} mins</span>
//                 </div>
//                 <div style="margin-top:8px;display:flex;gap:4px">
//                     <button class="btn small" onclick="studentDashboard.startExam('${exam._id}')">
//                         ${exam.submissionStatus === 'in_progress' ? 'Continue' : 'Start'}
//                     </button>
//                     <button class="btn small secondary" onclick="studentDashboard.showExamDetailsModal('${exam._id}')">
//                         Details
//                     </button>
//                 </div>
//             </div>
//         `).join('');
//     }

//     // MODAL FOR EXAM DETAILS - REPLACES ALERT
//     showExamDetailsModal(examId) {
//         const exam = this.exams.find(e => e._id === examId);
//         if (!exam) return;

//         // Create modal if it doesn't exist
//         let modal = document.getElementById('examDetailsModal');
//         if (!modal) {
//             modal = document.createElement('div');
//             modal.id = 'examDetailsModal';
//             modal.className = 'modal';
//             modal.style.cssText = `
//                 display: none;
//                 position: fixed;
//                 z-index: 1000;
//                 left: 0;
//                 top: 0;
//                 width: 100%;
//                 height: 100%;
//                 background-color: rgba(0,0,0,0.5);
//             `;

//             modal.innerHTML = `
//                 <div class="modal-content" style="
//                     background-color: white;
//                     margin: 10% auto;
//                     padding: 25px;
//                     border-radius: 10px;
//                     width: 500px;
//                     max-width: 90%;
//                     max-height: 80vh;
//                     overflow-y: auto;
//                 ">
//                     <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
//                         <h3 style="margin:0;color:#2b3949;">Exam Details</h3>
//                         <span class="close-modal" style="font-size:24px;cursor:pointer;color:#666">&times;</span>
//                     </div>
//                     <div id="examDetailsContent" style="line-height:1.6;"></div>
//                     <div style="margin-top:25px;text-align:center;">
//                         <button class="btn" onclick="document.getElementById('examDetailsModal').style.display='none'">Close</button>
//                     </div>
//                 </div>
//             `;
//             document.body.appendChild(modal);

//             // Add close event
//             modal.querySelector('.close-modal').addEventListener('click', () => {
//                 modal.style.display = 'none';
//             });
//         }

//         // Populate modal content
//         const content = document.getElementById('examDetailsContent');
//         content.innerHTML = `
//             <div style="margin-bottom:15px;">
//                 <strong style="color:#2b3949;">Title:</strong>
//                 <div style="margin-top:5px;padding:10px;background:#f8f9fa;border-radius:5px;">
//                     ${this.escapeHtml(exam.title)}
//                 </div>
//             </div>

//             <div style="margin-bottom:15px;">
//                 <strong style="color:#2b3949;">Description:</strong>
//                 <div style="margin-top:5px;padding:10px;background:#f8f9fa;border-radius:5px;">
//                     ${this.escapeHtml(exam.description || 'No description provided')}
//                 </div>
//             </div>

//             <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;">
//                 <div>
//                     <strong style="color:#2b3949;">Time Limit:</strong>
//                     <div style="margin-top:5px;padding:8px;background:#f8f9fa;border-radius:5px;text-align:center;">
//                         ${exam.timeLimitMinutes} minutes
//                     </div>
//                 </div>
//                 <div>
//                     <strong style="color:#2b3949;">Questions:</strong>
//                     <div style="margin-top:5px;padding:8px;background:#f8f9fa;border-radius:5px;text-align:center;">
//                         ${exam.questionCount || 0}
//                     </div>
//                 </div>
//             </div>

//             <div style="margin-bottom:15px;">
//                 <strong style="color:#2b3949;">Department:</strong>
//                 <div style="margin-top:5px;padding:8px;background:#f8f9fa;border-radius:5px;">
//                     ${this.escapeHtml(exam.department || 'Not specified')}
//                 </div>
//             </div>

//             <div style="margin-bottom:15px;">
//                 <strong style="color:#2b3949;">Tutor:</strong>
//                 <div style="margin-top:5px;padding:8px;background:#f8f9fa;border-radius:5px;">
//                     ${exam.tutorId?.name || 'Not assigned'}
//                 </div>
//             </div>

//             <div style="margin-top:20px;padding:12px;background:#e8f4fd;border-radius:5px;border-left:4px solid #4a90e2;">
//                 <strong>Status:</strong> 
//                 <span class="tag ${exam.submissionStatus === 'in_progress' ? 'warning' : 'info'}">
//                     ${exam.submissionStatus === 'in_progress' ? 'In Progress' :
//                 exam.submissionStatus === 'submitted' ? 'Submitted' : 'Available'}
//                 </span>
//             </div>
//         `;

//         modal.style.display = 'block';
//     }

//     // ADD MODAL MESSAGE FUNCTION
//     showModalMessage(title, message, type = 'info') {
//         // Create modal if it doesn't exist
//         let modal = document.getElementById('messageModal');
//         if (!modal) {
//             modal = document.createElement('div');
//             modal.id = 'messageModal';
//             modal.className = 'modal';
//             modal.style.cssText = `
//                 display: none;
//                 position: fixed;
//                 z-index: 1000;
//                 left: 0;
//                 top: 0;
//                 width: 100%;
//                 height: 100%;
//                 background-color: rgba(0,0,0,0.5);
//             `;

//             modal.innerHTML = `
//                 <div class="modal-content" style="
//                     background-color: white;
//                     margin: 15% auto;
//                     padding: 20px;
//                     border-radius: 8px;
//                     width: 400px;
//                     max-width: 90%;
//                     text-align: center;
//                 ">
//                     <h3 style="margin: 0 0 15px 0; color: #2b3949;"></h3>
//                     <p style="margin: 0 0 20px 0; color: #666; white-space: pre-line;"></p>
//                     <button class="btn" onclick="document.getElementById('messageModal').style.display='none'">
//                         OK
//                     </button>
//                 </div>
//             `;
//             document.body.appendChild(modal);
//         }

//         // Update modal content
//         const modalContent = modal.querySelector('.modal-content');
//         modalContent.querySelector('h3').textContent = title;
//         modalContent.querySelector('p').textContent = message;

//         // Set color based on type
//         const button = modalContent.querySelector('.btn');
//         if (type === 'error') {
//             button.style.backgroundColor = '#e05b5b';
//         } else if (type === 'success') {
//             button.style.backgroundColor = '#2fa46a';
//         } else {
//             button.style.backgroundColor = '#4a90e2';
//         }

//         modal.style.display = 'block';
//     }

//     // START EXAM FUNCTION
//     async startExam(examId) {
//         try {
//             // Check if exam is already submitted
//             const exam = this.exams.find(e => e._id === examId);
//             if (!exam) {
//                 this.showError('Exam not found');
//                 return;
//             }

//             // Prevent starting already submitted exams
//             if (exam.submissionStatus === 'submitted' || exam.submissionStatus === 'graded') {
//                 this.showModalMessage(
//                     'Exam Already Submitted',
//                     'You have already submitted this exam and cannot take it again.',
//                     'info'
//                 );
//                 return;
//             }

//             const result = await ApiService.startExam(examId);
//             this.currentExam = examId;
//             this.showExamInterface(examId);
//         } catch (error) {
//             if (error.message.includes('already submitted')) {
//                 this.showModalMessage(
//                     'Exam Already Submitted',
//                     'You have already submitted this exam and cannot take it again.',
//                     'info'
//                 );
//                 // Refresh dashboard to update exam status
//                 await this.loadDashboardData();
//             } else {
//                 this.showError('Error starting exam: ' + error.message);
//             }
//         }
//     }

//     // FIXED AUTO SUBMIT EXAM - REPLACED ALERT
//     async autoSubmitExam() {
//         if (!this.currentExam) return;

//         const answers = this.collectAnswers();

//         try {
//             await ApiService.submitExam(this.currentExam, answers);
//             this.showModalMessage(
//                 'Exam Auto-Submitted',
//                 'Your exam has been automatically submitted due to time limit!',
//                 'info'
//             );
//             this.closeModal('examModal');
//             await this.loadDashboardData();
//         } catch (error) {
//             this.showError('Error auto-submitting exam: ' + error.message);
//         }
//     }

//     // FIXED SUBMIT EXAM - REPLACED CONFIRM WITH MODAL
//     async submitExam() {
//         if (!this.currentExam) return;

//         // Replace confirm with modal confirmation
//         this.showConfirmationModal(
//             'Submit Exam',
//             'Are you sure you want to submit your exam? This action cannot be undone.',
//             () => this.confirmSubmitExam()
//         );
//     }

//     async confirmSubmitExam() {
//         const answers = this.collectAnswers();

//         try {
//             await ApiService.submitExam(this.currentExam, answers);
//             clearInterval(this.timer);
//             this.closeModal('examModal');
//             this.closeModal('confirmationModal');
//             this.showSuccess('Exam submitted successfully!');
//             await this.loadDashboardData();
//         } catch (error) {
//             this.showError('Error submitting exam: ' + error.message);
//         }
//     }

//     // ADD CONFIRMATION MODAL FUNCTION
//     showConfirmationModal(title, message, onConfirm) {
//         let modal = document.getElementById('confirmationModal');
//         if (!modal) {
//             modal = document.createElement('div');
//             modal.id = 'confirmationModal';
//             modal.className = 'modal';
//             modal.style.cssText = `
//                 display: none;
//                 position: fixed;
//                 z-index: 1000;
//                 left: 0;
//                 top: 0;
//                 width: 100%;
//                 height: 100%;
//                 background-color: rgba(0,0,0,0.5);
//             `;

//             modal.innerHTML = `
//                 <div class="modal-content" style="
//                     background-color: white;
//                     margin: 15% auto;
//                     padding: 20px;
//                     border-radius: 8px;
//                     width: 400px;
//                     max-width: 90%;
//                     text-align: center;
//                 ">
//                     <h3 style="margin: 0 0 15px 0; color: #2b3949;"></h3>
//                     <p style="margin: 0 0 20px 0; color: #666;"></p>
//                     <div style="display: flex; gap: 10px; justify-content: center;">
//                         <button id="confirmYes" class="btn" style="background: #2fa46a;">Yes</button>
//                         <button id="confirmNo" class="btn secondary">No</button>
//                     </div>
//                 </div>
//             `;
//             document.body.appendChild(modal);

//             // Add event listeners
//             document.getElementById('confirmNo').addEventListener('click', () => {
//                 modal.style.display = 'none';
//             });
//         }

//         // Update modal content
//         const modalContent = modal.querySelector('.modal-content');
//         modalContent.querySelector('h3').textContent = title;
//         modalContent.querySelector('p').textContent = message;

//         // Update confirm button
//         const confirmBtn = document.getElementById('confirmYes');
//         confirmBtn.onclick = onConfirm;

//         modal.style.display = 'block';
//     }

//     // FIXED DOWNLOAD FUNCTIONS - REPLACED ALERTS
//     async downloadResults(submissionId) {
//         this.showModalMessage(
//             'Download Feature',
//             'Download feature would be implemented here',
//             'info'
//         );
//     }

//     async downloadAllResults() {
//         this.showModalMessage(
//             'Bulk Download',
//             'Bulk download feature would be implemented here',
//             'info'
//         );
//     }

//     // KEEP ALL OTHER FUNCTIONS THE SAME (renderRecentResults, renderPerformanceChart, etc.)
//     renderRecentResults(grades) {
//         const recentList = document.getElementById('recent-results-list');
//         const countElement = document.getElementById('recent-results-count');

//         if (!recentList) return;

//         const recentSubmissions = (grades.submissions || []).slice(0, 5);

//         if (recentSubmissions.length === 0) {
//             recentList.innerHTML = '<div class="empty-state">No results yet</div>';
//             countElement.textContent = '0';
//             return;
//         }

//         countElement.textContent = recentSubmissions.length;
//         recentList.innerHTML = recentSubmissions.map(submission => `
//             <div class="result-preview">
//                 <div style="display:flex;justify-content:space-between;align-items:center">
//                     <div>
//                         <strong>${this.escapeHtml(submission.examId?.title || 'Unknown Exam')}</strong>
//                         <div style="font-size:12px;color:var(--muted);margin-top:2px">
//                             ${new Date(submission.submittedAt).toLocaleDateString()}
//                         </div>
//                     </div>
//                     <span class="tag ${this.getScoreClass(submission.percentage)}">
//                         ${submission.percentage?.toFixed(1) || 0}%
//                     </span>
//                 </div>
//                 <div style="margin-top:6px;display:flex;gap:4px">
//                     <button class="btn small" onclick="studentDashboard.viewSubmissionDetails('${submission._id}')">
//                         View Details
//                     </button>
//                     <button class="btn small secondary" onclick="studentDashboard.downloadResults('${submission._id}')">
//                         Download
//                     </button>
//                 </div>
//             </div>
//         `).join('');
//     }

//     renderPerformanceChart(grades) {
//         const ctx = document.getElementById('performanceChart');
//         if (!ctx) return;

//         const submissions = (grades.submissions || []).slice(-6);
//         const labels = submissions.map((_, index) => `Exam ${index + 1}`);
//         const scores = submissions.map(sub => sub.percentage || 0);

//         if (typeof Chart === 'undefined') {
//             console.warn('Chart.js not loaded');
//             return;
//         }

//         new Chart(ctx, {
//             type: 'line',
//             data: {
//                 labels: labels,
//                 datasets: [{
//                     label: 'Exam Scores',
//                     data: scores,
//                     borderColor: '#6c63ff',
//                     backgroundColor: 'rgba(108, 99, 255, 0.1)',
//                     tension: 0.3,
//                     fill: true,
//                     pointBackgroundColor: '#6c63ff',
//                     pointBorderColor: '#ffffff',
//                     pointBorderWidth: 2,
//                     pointRadius: 4
//                 }]
//             },
//             options: {
//                 responsive: true,
//                 plugins: {
//                     legend: { display: false },
//                     title: {
//                         display: true,
//                         text: 'Recent Exam Performance',
//                         font: { size: 14 }
//                     }
//                 },
//                 scales: {
//                     y: {
//                         beginAtZero: true,
//                         max: 100,
//                         ticks: {
//                             callback: function (value) {
//                                 return value + '%';
//                             }
//                         }
//                     }
//                 }
//             }
//         });
//     }

//     renderNotifications(notifications) {
//         const notificationsList = document.getElementById('notificationsList');
//         if (!notificationsList) return;

//         const unreadNotifications = notifications.filter(n => !n.read).slice(0, 5);

//         if (unreadNotifications.length === 0) {
//             notificationsList.innerHTML = '<div class="activity-item">No new notifications</div>';
//             return;
//         }

//         notificationsList.innerHTML = unreadNotifications.map(notification => `
//             <div class="activity-item ${!notification.read ? 'unread' : ''}">
//                 <div style="font-weight:600">${this.getNotificationTitle(notification)}</div>
//                 <div style="color:var(--muted);font-size:12px">
//                     ${this.getNotificationMessage(notification)}
//                 </div>
//                 <div style="color:var(--muted);font-size:11px">
//                     ${new Date(notification.sentAt).toLocaleDateString()}
//                 </div>
//             </div>
//         `).join('');
//     }

//     getNotificationTitle(notification) {
//         const types = {
//             'admission': '🎓 Admission',
//             'exam_reminder': '📝 Exam Reminder',
//             'result': '📊 Results Ready',
//             'general': '💬 Notification'
//         };
//         return types[notification.type] || '💬 Notification';
//     }

//     getNotificationMessage(notification) {
//         switch (notification.type) {
//             case 'admission':
//                 return 'Your admission letter is available';
//             case 'exam_reminder':
//                 return `Reminder: ${notification.payload.examTitle}`;
//             case 'result':
//                 return `Results available: ${notification.payload.score}/${notification.payload.maxScore}`;
//             default:
//                 return notification.payload.message || 'New notification';
//         }
//     }

//     populateAvailableExams(exams) {
//         const availableExamsSelect = document.getElementById('availableExams');
//         const submissionExamSelect = document.getElementById('submissionExam');

//         if (!availableExamsSelect || !submissionExamSelect) return;

//         const availableExams = exams.filter(exam =>
//             exam.submissionStatus === 'not_started' || exam.submissionStatus === 'in_progress'
//         );

//         availableExamsSelect.innerHTML = '<option value="">Select an exam...</option>';
//         submissionExamSelect.innerHTML = '<option value="">Select exam...</option>';

//         availableExams.forEach(exam => {
//             const option = document.createElement('option');
//             option.value = exam._id;
//             option.textContent = exam.title;
//             availableExamsSelect.appendChild(option);

//             const option2 = option.cloneNode(true);
//             submissionExamSelect.appendChild(option2);
//         });
//     }

//     updateAcademicSummary(grades) {
//         const overallGrade = grades.overallGrade;
//         const gradeBreakdown = grades.gradeBreakdown || {
//             examScore: 0,
//             attendanceScore: 0,
//             projectScore: 0,
//             assignmentScore: 0,
//             overallScore: 0
//         };

//         // Update GPA and basic info
//         document.getElementById('profileGPA').textContent = overallGrade?.overallScore ?
//             (overallGrade.overallScore / 20).toFixed(2) : '-';
//         document.getElementById('profileCredits').textContent = overallGrade?.examScores?.length || 0;

//         // ✅ FIXED: Update attendance with proper score (out of 10 points)
//         document.getElementById('profileAttendance').textContent =
//             `${gradeBreakdown.attendanceScore.toFixed(1)}/10`;
//         document.getElementById('attendanceScore').textContent =
//             `${gradeBreakdown.attendanceScore.toFixed(1)}/10`;

//         // ✅ FIXED: Update assignment score display (out of 10 points)
//         document.getElementById('assignmentsCompleted').textContent =
//             `${gradeBreakdown.assignmentScore.toFixed(1)}/10`;

//         // Update the detailed grade breakdown in dashboard stats
//         this.updateGradeBreakdown(gradeBreakdown);
//     }

//     // ✅ ENHANCED GRADE BREAKDOWN DISPLAY WITH BETTER STYLING
//     updateGradeBreakdown(gradeBreakdown) {
//         // Create or update grade breakdown display
//         let breakdownContainer = document.getElementById('gradeBreakdown');
//         if (!breakdownContainer) {
//             breakdownContainer = document.createElement('div');
//             breakdownContainer.id = 'gradeBreakdown';
//             breakdownContainer.className = 'grade-breakdown-container';

//             // Insert after the academic summary card
//             const academicSummary = document.querySelector('.card:has(#studentDepartment)');
//             if (academicSummary) {
//                 academicSummary.parentNode.insertBefore(breakdownContainer, academicSummary.nextSibling);
//             }
//         }

//         // Calculate percentages for progress bars
//         const examPercentage = (gradeBreakdown.examScore / 30) * 100;
//         const projectPercentage = (gradeBreakdown.projectScore / 50) * 100;
//         const assignmentPercentage = (gradeBreakdown.assignmentScore / 10) * 100;
//         const attendancePercentage = (gradeBreakdown.attendanceScore / 10) * 100;

//         breakdownContainer.innerHTML = `
//         <h4 class="grade-breakdown-header">Grade Breakdown</h4>
//         <div class="grade-breakdown-grid">
//             <div class="grade-breakdown-item exam">
//                 <div class="grade-breakdown-label">Exam Score</div>
//                 <div class="grade-breakdown-score">${gradeBreakdown.examScore.toFixed(1)}/30</div>
//                 <div class="grade-breakdown-percentage">${examPercentage.toFixed(1)}%</div>
//                 <div class="grade-progress-container">
//                     <div class="grade-progress-bar" style="width: ${examPercentage}%"></div>
//                 </div>
//             </div>

//             <div class="grade-breakdown-item project">
//                 <div class="grade-breakdown-label">Project Score</div>
//                 <div class="grade-breakdown-score">${gradeBreakdown.projectScore.toFixed(1)}/50</div>
//                 <div class="grade-breakdown-percentage">${projectPercentage.toFixed(1)}%</div>
//                 <div class="grade-progress-container">
//                     <div class="grade-progress-bar" style="width: ${projectPercentage}%"></div>
//                 </div>
//             </div>

//             <div class="grade-breakdown-item assignment">
//                 <div class="grade-breakdown-label">Assignment Score</div>
//                 <div class="grade-breakdown-score">${gradeBreakdown.assignmentScore.toFixed(1)}/10</div>
//                 <div class="grade-breakdown-percentage">${assignmentPercentage.toFixed(1)}%</div>
//                 <div class="grade-progress-container">
//                     <div class="grade-progress-bar" style="width: ${assignmentPercentage}%"></div>
//                 </div>
//             </div>

//             <div class="grade-breakdown-item attendance">
//                 <div class="grade-breakdown-label">Attendance</div>
//                 <div class="grade-breakdown-score">${gradeBreakdown.attendanceScore.toFixed(1)}/10</div>
//                 <div class="grade-breakdown-percentage">${attendancePercentage.toFixed(1)}%</div>
//                 <div class="grade-progress-container">
//                     <div class="grade-progress-bar" style="width: ${attendancePercentage}%"></div>
//                 </div>
//             </div>
//         </div>

//         <div class="grade-breakdown-total">
//             <div class="total-label">Total Overall Score</div>
//             <div class="total-score">${gradeBreakdown.overallScore.toFixed(1)}/100</div>
//             <div class="total-percentage">${gradeBreakdown.overallScore.toFixed(1)}%</div>
//         </div>
//     `;
//     }

//     // ✅ ENHANCED GRADES TABLE WITH TUTOR-INPUT GRADES
//     renderGradesTable(grades) {
//         const tbody = document.querySelector('#grades-table tbody');
//         if (!tbody) return;

//         const submissions = grades.submissions || [];
//         const gradeBreakdown = grades.gradeBreakdown || {};

//         // Clear existing content
//         tbody.innerHTML = '';

//         // ✅ ADD TUTOR-INPUT GRADES TO THE TABLE
//         const tutorGrades = [
//             {
//                 _id: 'attendance-grade',
//                 name: 'Attendance Score',
//                 type: 'attendance',
//                 score: gradeBreakdown.attendanceScore || 0,
//                 maxScore: 10,
//                 percentage: ((gradeBreakdown.attendanceScore || 0) / 10) * 100,
//                 date: grades.overallGrade?.lastUpdated || new Date(),
//                 status: 'completed'
//             },
//             {
//                 _id: 'project-grade',
//                 name: 'Project Score',
//                 type: 'project',
//                 score: gradeBreakdown.projectScore || 0,
//                 maxScore: 50,
//                 percentage: ((gradeBreakdown.projectScore || 0) / 50) * 100,
//                 date: grades.overallGrade?.lastUpdated || new Date(),
//                 status: 'completed'
//             },
//             {
//                 _id: 'assignment-grade',
//                 name: 'Assignment Score',
//                 type: 'assignment',
//                 score: gradeBreakdown.assignmentScore || 0,
//                 maxScore: 10,
//                 percentage: ((gradeBreakdown.assignmentScore || 0) / 10) * 100,
//                 date: grades.overallGrade?.lastUpdated || new Date(),
//                 status: 'completed'
//             }
//         ];

//         // Add tutor-input grades to table
//         tutorGrades.forEach(grade => {
//             if (grade.score > 0) {
//                 const row = document.createElement('tr');
//                 // In the renderGradesTable function, update the tag generation:
//                 row.innerHTML = `
//     <td><strong>${this.escapeHtml(grade.name)}</strong></td>
//     <td>
//         <span class="tag ${grade.type}">
//             ${grade.type.charAt(0).toUpperCase() + grade.type.slice(1)}
//         </span>
//     </td>
//     <td><strong>${grade.score.toFixed(1)}/${grade.maxScore}</strong></td>
//     <td>
//         <span class="tag ${this.getScoreClass(grade.percentage)}">
//             ${grade.percentage.toFixed(1)}%
//         </span>
//     </td>
//     <td>${new Date(grade.date).toLocaleDateString()}</td>
//     <td>
//         <span class="tag success">Completed</span>
//     </td>
//     <td>-</td>
// `;
//                 tbody.appendChild(row);
//             }
//         });

//         // Add exam submissions to table
//         submissions.forEach(submission => {
//             const row = document.createElement('tr');
//             row.innerHTML = `
//                 <td><strong>${this.escapeHtml(submission.examId?.title || 'Unknown Exam')}</strong></td>
//                 <td><span class="tag" style="background: #fff3e0; color: #ef6c00;">Exam</span></td>
//                 <td>${submission.totalScore || 0}/${submission.maxScore || 1}</td>
//                 <td>
//                     <span class="tag ${this.getScoreClass(submission.percentage)}">
//                         ${(submission.percentage || 0).toFixed(1)}%
//                     </span>
//                 </td>
//                 <td>${new Date(submission.submittedAt).toLocaleDateString()}</td>
//                 <td>
//                     <span class="tag ${submission.status === 'graded' ? 'success' : 'warning'}">
//                         ${submission.status || 'submitted'}
//                     </span>
//                 </td>
//                 <td>
//                     <button class="btn small" onclick="studentDashboard.viewSubmissionDetails('${submission._id}')">
//                         Details
//                     </button>
//                 </td>
//             `;
//             tbody.appendChild(row);
//         });

//         if (tbody.children.length === 0) {
//             tbody.innerHTML = '<tr><td colspan="7" class="text-center">No grades available yet</td></tr>';
//         }

//         // Update grade summary
//         this.updateGradeSummary(submissions, tutorGrades);
//     }

//     // ✅ UPDATED GRADE SUMMARY CALCULATION
//     updateGradeSummary(submissions, tutorGrades = []) {
//         if (submissions.length === 0 && tutorGrades.length === 0) return;

//         // Calculate average from both exams and tutor grades
//         const allGrades = [
//             ...submissions.map(sub => sub.percentage || 0),
//             ...tutorGrades.map(grade => grade.percentage || 0)
//         ];

//         const average = allGrades.length > 0 ?
//             allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length : 0;

//         const highest = allGrades.length > 0 ? Math.max(...allGrades) : 0;

//         document.getElementById('grade-average').textContent = average.toFixed(1) + '%';
//         document.getElementById('grade-highest').textContent = highest.toFixed(1) + '%';
//         document.getElementById('grade-improvement').textContent = '+0%';
//     }

//     // ============ MISSING FUNCTIONS ADDED BACK ============

//     async showExamInterface(examId) {
//         const exam = this.exams.find(e => e._id === examId);
//         if (!exam) return;

//         try {
//             // Load full exam with questions
//             const fullExam = await this.loadFullExam(examId);

//             const modal = document.getElementById('examModal');
//             const examContent = document.getElementById('examContent');
//             const examTitle = document.getElementById('examModalTitle');

//             if (modal && examContent && examTitle) {
//                 examTitle.textContent = fullExam.title;
//                 examContent.innerHTML = this.generateExamForm(fullExam);

//                 modal.style.display = 'block';
//                 this.startTimer(fullExam.timeLimitMinutes);

//                 // Re-attach event listeners for the new buttons
//                 document.getElementById('btnSubmitExam')?.addEventListener('click', () => this.submitExam());
//                 document.getElementById('btnCancelExam')?.addEventListener('click', () => this.closeModal('examModal'));
//             }
//         } catch (error) {
//             this.showError('Error loading exam: ' + error.message);
//         }
//     }

//     async loadFullExam(examId) {
//         try {
//             const response = await fetch(`${ApiService.BASE_URL}/student/exams/${examId}/full`, {
//                 headers: AuthService.getAuthHeaders()
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to load exam details');
//             }

//             return await response.json();
//         } catch (error) {
//             throw error;
//         }
//     }

//     generateExamForm(exam) {
//         if (!exam.questions || exam.questions.length === 0) {
//             return '<p>No questions available for this exam.</p>';
//         }

//         return `
//             <div class="exam-instructions" style="background:#f9f7f1;padding:15px;border-radius:8px;margin-bottom:20px;">
//                 <p><strong>Instructions:</strong></p>
//                 <ul style="margin:10px 0;padding-left:20px;">
//                     <li>You have ${exam.timeLimitMinutes} minutes to complete this exam</li>
//                     <li>Answer all questions before submitting</li>
//                     <li>Timer will auto-submit when time expires</li>
//                     <li>Each question is worth ${exam.questions[0]?.score || 1} point(s)</li>
//                 </ul>
//             </div>

//             <div class="questions-list">
//                 ${exam.questions.map((question, index) => `
//                     <div class="question-item" style="margin-bottom:25px;padding:20px;border:2px solid #e6d9b4;border-radius:10px;background:white;">
//                         <div style="font-weight:600;margin-bottom:15px;font-size:16px;color:#2b3949;">
//                             <span style="background:#512da8;color:white;padding:4px 8px;border-radius:4px;margin-right:8px;">
//                                 Q${index + 1}
//                             </span>
//                             ${this.escapeHtml(question.text)}
//                             <span style="float:right;font-size:12px;color:var(--muted);">
//                                 ${question.score} point(s)
//                             </span>
//                         </div>

//                         <div class="options-list">
//                             ${question.questionType === 'multiple_choice' ? `
//                                 ${question.options.map((option, optIndex) => `
//                                     <label style="display:block;margin-bottom:12px;padding:12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;transition:all 0.3s;">
//                                         <input type="radio" name="question_${question._id}" value="${optIndex}" style="margin-right:12px;">
//                                         <strong>${String.fromCharCode(65 + optIndex)}.</strong> ${this.escapeHtml(option)}
//                                     </label>
//                                 `).join('')}
//                             ` : ''}

//                             ${question.questionType === 'true_false' ? `
//                                 <label style="display:block;margin-bottom:12px;padding:12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;">
//                                     <input type="radio" name="question_${question._id}" value="1" style="margin-right:12px;">
//                                     True
//                                 </label>
//                                 <label style="display:block;margin-bottom:12px;padding:12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;">
//                                     <input type="radio" name="question_${question._id}" value="0" style="margin-right:12px;">
//                                     False
//                                 </label>
//                             ` : ''}

//                             ${question.questionType === 'short_answer' ? `
//                                 <textarea name="question_${question._id}" 
//                                     style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-family:inherit;"
//                                     rows="3" 
//                                     placeholder="Type your answer here..."></textarea>
//                             ` : ''}
//                         </div>
//                     </div>
//                 `).join('')}
//             </div>

//             <div style="position:sticky;bottom:0;background:white;padding:20px;border-top:2px solid #e6d9b4;margin-top:30px;">
//                 <div style="display:flex;justify-content:space-between;align-items:center;">
//                     <div style="font-weight:600;color:#2b3949;">
//                         ${exam.questions.length} Questions • ${this.calculateTotalPoints(exam.questions)} Total Points
//                     </div>
//                     <div style="display:flex;gap:12px;">
//                         <button id="btnSubmitExam" class="btn" style="padding:12px 30px;">
//                             Submit Exam
//                         </button>
//                         <button id="btnCancelExam" class="btn secondary" style="padding:12px 24px;">
//                             Cancel
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         `;
//     }

//     calculateTotalPoints(questions) {
//         return questions.reduce((total, question) => total + (question.score || 1), 0);
//     }

//     startTimer(minutes) {
//         let timeLeft = minutes * 60;
//         const timerElement = document.getElementById('examTimer');

//         // Clear any existing timer
//         if (this.timer) {
//             clearInterval(this.timer);
//         }

//         this.timer = setInterval(() => {
//             if (timeLeft <= 0) {
//                 clearInterval(this.timer);
//                 this.autoSubmitExam();
//                 return;
//             }

//             const mins = Math.floor(timeLeft / 60);
//             const secs = timeLeft % 60;

//             if (timerElement) {
//                 timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//             }

//             timeLeft--;
//         }, 1000);
//     }

//     collectAnswers() {
//         const answers = [];

//         // Collect multiple choice and true/false answers
//         const radioInputs = document.querySelectorAll('input[type="radio"]:checked');
//         radioInputs.forEach(input => {
//             const questionId = input.name.replace('question_', '');
//             const selectedIndex = parseInt(input.value);

//             answers.push({
//                 questionId: questionId,
//                 selectedIndex: selectedIndex
//             });
//         });

//         // Collect short answer responses
//         const textAreas = document.querySelectorAll('textarea[name^="question_"]');
//         textAreas.forEach(textarea => {
//             const questionId = textarea.name.replace('question_', '');
//             const textAnswer = textarea.value.trim();

//             if (textAnswer) {
//                 answers.push({
//                     questionId: questionId,
//                     textAnswer: textAnswer
//                 });
//             }
//         });

//         return answers;
//     }

//     async viewSubmissionDetails(submissionId) {
//         try {
//             const submission = await ApiService.getSubmission(submissionId);
//             this.showResultsModal(submission);
//         } catch (error) {
//             this.showError('Failed to load submission details');
//         }
//     }

//     showResultsModal(submission) {
//         const modal = document.getElementById('resultsModal');
//         const content = document.getElementById('resultsContent');

//         if (!modal || !content) return;

//         content.innerHTML = `
//             <div style="text-align:center;margin-bottom:20px;">
//                 <h3 style="color:#2b3949;margin-bottom:8px;">${submission.examId?.title || 'Exam Results'}</h3>
//                 <div class="stat-big" style="color:#6c63ff;">
//                     ${submission.totalScore}/${submission.maxScore}
//                 </div>
//                 <div style="font-size:18px;font-weight:600;color:#2b3949;">
//                     ${((submission.totalScore / submission.maxScore) * 100).toFixed(1)}%
//                 </div>
//             </div>
//             <div style="margin-top:20px;">
//                 <h4 style="margin-bottom:12px;">Detailed Results</h4>
//                 ${submission.answers.map((answer, index) => `
//                     <div style="padding:12px;border-left:4px solid ${answer.isCorrect ? '#4ecdc4' : '#ff6b6b'};background:#f8f9fa;margin-bottom:8px;border-radius:4px;">
//                         <div style="font-weight:600;">Question ${index + 1}:</div>
//                         <div style="font-size:14px;color:#666;margin:4px 0;">${answer.questionId.text}</div>
//                         <div style="font-size:13px;">
//                             <span style="color:${answer.isCorrect ? '#2fa46a' : '#e05b5b'};">
//                                 ${answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
//                             </span>
//                             <span style="margin-left:12px;color:#666;">
//                                 Score: ${answer.score}/${answer.questionId.score}
//                             </span>
//                         </div>
//                     </div>
//                 `).join('')}
//             </div>
//         `;

//         modal.style.display = 'block';
//     }

//     async uploadProjectSubmission() {
//         const examId = document.getElementById('submissionExam').value;
//         const description = document.getElementById('submissionDescription').value;
//         const files = document.getElementById('projectFiles').files;

//         if (!examId) {
//             this.showUploadStatus('Please select an exam', 'error');
//             return;
//         }

//         if (!files || files.length === 0) {
//             this.showUploadStatus('Please select files to upload', 'error');
//             return;
//         }

//         const formData = new FormData();
//         for (let i = 0; i < files.length; i++) {
//             formData.append('files', files[i]);
//         }
//         formData.append('examId', examId);
//         formData.append('description', description);

//         const submitBtn = document.getElementById('btnUploadSubmission');
//         const statusDiv = document.getElementById('uploadStatus');

//         try {
//             submitBtn.disabled = true;
//             submitBtn.textContent = 'Uploading...';
//             statusDiv.style.display = 'none';

//             const result = await ApiService.uploadProjectSubmission(formData);

//             this.showUploadStatus('Files uploaded successfully!', 'success');

//             // Clear form
//             document.getElementById('submissionDescription').value = '';
//             document.getElementById('projectFiles').value = '';
//             document.getElementById('submissionExam').value = '';

//             setTimeout(() => {
//                 this.loadDashboardData();
//             }, 2000);

//         } catch (error) {
//             this.showUploadStatus('Upload failed: ' + error.message, 'error');
//         } finally {
//             submitBtn.disabled = false;
//             submitBtn.textContent = 'Upload Submission';
//         }
//     }

//     showUploadStatus(message, type) {
//         const statusDiv = document.getElementById('uploadStatus');
//         statusDiv.textContent = message;
//         statusDiv.className = type === 'error' ? 'error-message' : 'success-message';
//         statusDiv.style.display = 'block';
//     }

//     getScoreClass(percentage) {
//         if (percentage >= 80) return 'excellent';
//         if (percentage >= 60) return 'good';
//         if (percentage >= 40) return 'average';
//         return 'poor';
//     }

//     closeModal(modalId) {
//         const modal = document.getElementById(modalId);
//         if (modal) {
//             modal.style.display = 'none';
//         }
//         if (this.timer) {
//             clearInterval(this.timer);
//             this.timer = null;
//         }
//     }

//     showError(message) {
//         this.showMessage(message, 'error');
//     }

//     showSuccess(message) {
//         this.showMessage(message, 'success');
//     }

//     showMessage(message, type) {
//         let messageContainer = document.getElementById('messageContainer');
//         if (!messageContainer) {
//             messageContainer = document.createElement('div');
//             messageContainer.id = 'messageContainer';
//             messageContainer.style.cssText = `
//                 position: fixed;
//                 top: 20px;
//                 right: 20px;
//                 z-index: 1000;
//                 max-width: 400px;
//             `;
//             document.body.appendChild(messageContainer);
//         }

//         const messageDiv = document.createElement('div');
//         messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
//         messageDiv.textContent = message;
//         messageDiv.style.marginBottom = '10px';
//         messageDiv.style.padding = '12px';
//         messageDiv.style.borderRadius = '8px';

//         messageContainer.appendChild(messageDiv);

//         setTimeout(() => {
//             if (messageDiv.parentNode) {
//                 messageDiv.parentNode.removeChild(messageDiv);
//             }
//         }, 5000);
//     }

//     escapeHtml(str) {
//         return String(str || '').replace(/[&<>"']/g, function (m) {
//             return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]);
//         });
//     }

//     setupEventListeners() {
//         this.setupNavigation();

//         // Quick actions
//         document.getElementById('quickViewExams')?.addEventListener('click', () => this.setActiveView('exams'));
//         document.getElementById('quickViewGrades')?.addEventListener('click', () => this.setActiveView('grades'));
//         document.getElementById('quickDownloadResults')?.addEventListener('click', () => this.downloadAllResults());

//         // Exam actions
//         document.getElementById('btnStartExam')?.addEventListener('click', () => {
//             const examId = document.getElementById('availableExams').value;
//             if (examId) {
//                 this.startExam(examId);
//             } else {
//                 this.showError('Please select an exam');
//             }
//         });

//         // File upload
//         document.getElementById('btnUploadSubmission')?.addEventListener('click', () => this.uploadProjectSubmission());

//         // Modal close buttons
//         document.querySelectorAll('.close-modal').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 const modal = e.target.closest('.modal');
//                 if (modal) {
//                     this.closeModal(modal.id);
//                 }
//             });
//         });

//         // Refresh buttons
//         document.getElementById('refreshExams')?.addEventListener('click', () => this.loadDashboardData());
//         document.getElementById('refreshSubmissions')?.addEventListener('click', () => this.loadDashboardData());

//         // LOGOUT FIX - ADD THIS
//         const logoutBtn = document.querySelector('.logout-btn');
//         if (logoutBtn) {
//             logoutBtn.addEventListener('click', (e) => {
//                 e.preventDefault();
//                 console.log('Logout initiated from student dashboard');
//                 AuthService.logout();
//             });
//         } else {
//             console.error('Logout button not found!');
//         }
//     }

//     setupNavigation() {
//         const sidebarItems = document.querySelectorAll("#sidebarMenu .item");
//         const views = {
//             'dashboard': document.getElementById('view-dashboard'),
//             'exams': document.getElementById('view-exams'),
//             'grades': document.getElementById('view-grades'),
//             'submissions': document.getElementById('view-submissions'),
//             'resources': document.getElementById('view-resources'),
//             'profile': document.getElementById('view-profile')
//         };

//         sidebarItems.forEach((item) => {
//             item.addEventListener("click", () => {
//                 const view = item.dataset.view;
//                 this.setActiveView(view);
//             });
//         });
//     }

//     setActiveView(viewKey) {
//         // Reset active class
//         document.querySelectorAll('#sidebarMenu .item').forEach(it => {
//             it.classList.toggle('active', it.dataset.view === viewKey);
//         });

//         // Show/hide views
//         const views = {
//             'dashboard': document.getElementById('view-dashboard'),
//             'exams': document.getElementById('view-exams'),
//             'grades': document.getElementById('view-grades'),
//             'submissions': document.getElementById('view-submissions'),
//             'resources': document.getElementById('view-resources'),
//             'profile': document.getElementById('view-profile')
//         };

//         Object.keys(views).forEach(k => {
//             if (views[k]) {
//                 views[k].style.display = (k === viewKey) ? '' : 'none';
//             }
//         });

//         // Load view-specific data
//         this.loadViewData(viewKey);
//     }

//     async loadViewData(view) {
//         switch (view) {
//             case 'exams':
//                 await this.loadExamsView();
//                 break;
//             case 'grades':
//                 await this.loadGradesView();
//                 break;
//             case 'submissions':
//                 await this.loadSubmissionsView();
//                 break;
//         }
//     }

//     async loadExamsView() {
//         try {
//             const exams = await ApiService.getStudentExams();
//             this.renderExamsGrid(exams);
//         } catch (error) {
//             this.showError('Failed to load exams');
//         }
//     }

//     async loadGradesView() {
//         try {
//             const grades = await ApiService.getStudentGrades();
//             this.renderGradesTable(grades);
//         } catch (error) {
//             this.showError('Failed to load grades');
//         }
//     }

//     async loadSubmissionsView() {
//         try {
//             const submissions = await ApiService.getStudentSubmissions();
//             this.renderSubmissionsView(submissions);
//         } catch (error) {
//             this.showError('Failed to load submissions');
//         }
//     }

//     renderExamsGrid(exams) {
//         const examsGrid = document.getElementById('examsGrid');
//         if (!examsGrid) return;

//         if (exams.length === 0) {
//             examsGrid.innerHTML = '<div class="empty-state">No exams available</div>';
//             return;
//         }

//         examsGrid.innerHTML = exams.map(exam => `
//             <div class="card">
//                 <div class="exam-header">
//                     <h3>${this.escapeHtml(exam.title)}</h3>
//                     <span class="exam-status ${exam.submissionStatus}">
//                         ${this.getStatusText(exam.submissionStatus)}
//                     </span>
//                 </div>
//                 <p class="exam-description">${this.escapeHtml(exam.description || 'No description')}</p>
//                 <div class="exam-details">
//                     <span>Tutor: ${exam.tutorId?.name || 'Not assigned'}</span>
//                     <span>Questions: ${exam.questionCount || 0}</span>
//                     <span>Time: ${exam.timeLimitMinutes} mins</span>
//                 </div>
//                 <div class="exam-actions">
//                     ${this.getExamActionButton(exam)}
//                 </div>
//             </div>
//         `).join('');
//     }

//     getStatusText(status) {
//         const statusMap = {
//             'not_started': 'Not Started',
//             'in_progress': 'In Progress',
//             'submitted': 'Submitted',
//             'graded': 'Graded'
//         };
//         return statusMap[status] || status;
//     }

//     getExamActionButton(exam) {
//         switch (exam.submissionStatus) {
//             case 'not_started':
//                 return `<button class="btn btn-primary" onclick="studentDashboard.startExam('${exam._id}')">
//                     Start Exam
//                 </button>`;
//             case 'in_progress':
//                 return `<button class="btn btn-warning" onclick="studentDashboard.startExam('${exam._id}')">
//                     Continue Exam
//                 </button>`;
//             case 'submitted':
//             case 'graded':
//                 return `<button class="btn btn-outline" onclick="studentDashboard.viewResults('${exam._id}')">
//                     View Results
//                 </button>`;
//             default:
//                 return '';
//         }
//     }

//     async loadNotifications() {
//         try {
//             const notifications = await ApiService.getNotifications();
//             this.renderNotifications(notifications);
//         } catch (error) {
//             console.error('Error loading notifications:', error);
//         }
//     }

//     async viewResults(examId) {
//         const submission = this.grades.submissions?.find(s => s.examId._id === examId);
//         if (submission) {
//             this.showResultsModal(submission);
//         } else {
//             this.showError('No results available for this exam');
//         }
//     }
// }

// // Initialize student dashboard when DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//     window.studentDashboard = new StudentDashboard();
// });

class StudentDashboard {
    constructor() {
        this.currentExam = null;
        this.timer = null;
        this.exams = [];
        this.grades = [];
        this.submissions = [];
        this.department = '';
        this.departments = [];
        this.performanceChart = null;
        this.init();
    }

    async init() {
        await this.loadDepartments();

        // Set user info
        const user = AuthService.getUser();
        this.department = user.department;
        document.getElementById('studentDepartment').textContent = this.department;
        document.getElementById('profileDepartment').value = this.department;
        document.getElementById('profileName').value = user.name;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileStudentId').value = user._id;

        await this.loadDashboardData();
        this.setupEventListeners();
        this.loadNotifications();
    }

    async loadDepartments() {
        try {
            this.departments = await ApiService.getDepartments();
        } catch (error) {
            console.error('Error loading departments:', error);
            this.departments = ['Frontend', 'Backend', 'Fullstack', 'Cybersecurity', 'Dispatch'];
        }
    }

    async loadDashboardData() {
        try {
            console.log('Loading student dashboard data...');

            const [exams, grades, notifications] = await Promise.all([
                ApiService.getStudentExams().catch(error => {
                    console.error('Failed to load exams:', error);
                    this.showError('Failed to load exams: ' + error.message);
                    return [];
                }),
                ApiService.getStudentGrades().catch(error => {
                    console.error('Failed to load grades:', error);
                    this.showError('Failed to load grades: ' + error.message);
                    return { submissions: [], overallGrade: {} };
                }),
                ApiService.getNotifications().catch(error => {
                    console.error('Failed to load notifications:', error);
                    return [];
                })
            ]);

            console.log('Loaded exams:', exams);

            // Ensure questionCount is set for each exam
            this.exams = exams.map(exam => ({
                ...exam,
                questionCount: exam.questions?.length || exam.questionCount || 0
            }));

            this.grades = grades;
            this.updateDashboardStats(grades);
            this.renderUpcomingExams(this.exams);
            this.renderRecentResults(grades);
            this.renderPerformanceChart(grades);
            this.renderNotifications(notifications);
            this.populateAvailableExams(this.exams);
            this.updateAcademicSummary(grades);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data: ' + error.message);
        }
    }

    updateDashboardStats(grades) {
        const overallScore = grades.overallGrade?.overallScore || 0;
        const examsTaken = grades.submissions?.length || 0;
        const allExams = this.exams.filter(exam =>
            exam.submissionStatus === 'submitted' || exam.submissionStatus === 'graded'
        ).length;

        document.getElementById('stat-overall-score').textContent = overallScore.toFixed(1) + '%';
        document.getElementById('stat-exams-taken').textContent = examsTaken;
        document.getElementById('stat-pending-exams').textContent = allExams;
    }

    renderUpcomingExams(exams) {
        const upcomingList = document.getElementById('upcoming-exams-list');
        const countElement = document.getElementById('upcoming-exams-count');

        if (!upcomingList) return;

        // ✅ FIX: Show all exams, not just upcoming ones
        const allExams = exams.slice(0, 5);

        if (allExams.length === 0) {
            upcomingList.innerHTML = '<div class="empty-state">No exams available</div>';
            countElement.textContent = '0';
            return;
        }

        countElement.textContent = allExams.length;
        upcomingList.innerHTML = allExams.map(exam => `
            <div class="exam-preview">
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div>
                        <strong>${this.escapeHtml(exam.title)}</strong>
                        <div style="font-size:12px;color:var(--muted);margin-top:4px">
                            ${this.escapeHtml(exam.description || 'No description')}
                        </div>
                    </div>
                    <span class="tag ${this.getExamStatusClass(exam.submissionStatus)}">
                        ${this.getExamStatusText(exam.submissionStatus)}
                    </span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;color:var(--muted)">
                    <span>${exam.questionCount || 0} questions</span>
                    <span>${exam.timeLimitMinutes} mins</span>
                </div>
                <div style="margin-top:8px;display:flex;gap:4px">
                    ${this.getExamActionButtons(exam)}
                </div>
            </div>
        `).join('');
    }

    // ✅ ADD HELPER FUNCTIONS FOR EXAM STATUS AND ACTIONS
    getExamStatusClass(status) {
        const statusClasses = {
            'not_started': 'info',
            'in_progress': 'warning',
            'submitted': 'success',
            'graded': 'success'
        };
        return statusClasses[status] || 'info';
    }

    getExamStatusText(status) {
        const statusText = {
            'not_started': 'Available',
            'in_progress': 'In Progress',
            'submitted': 'Submitted',
            'graded': 'Graded'
        };
        return statusText[status] || 'Available';
    }

    getExamActionButtons(exam) {
        switch (exam.submissionStatus) {
            case 'not_started':
                return `
                    <button class="btn small" onclick="studentDashboard.startExam('${exam._id}')">
                        Start Exam
                    </button>
                    <button class="btn small secondary" onclick="studentDashboard.showExamDetailsModal('${exam._id}')">
                        Details
                    </button>
                `;
            case 'in_progress':
                return `
                    <button class="btn small" onclick="studentDashboard.startExam('${exam._id}')">
                        Continue
                    </button>
                    <button class="btn small secondary" onclick="studentDashboard.showExamDetailsModal('${exam._id}')">
                        Details
                    </button>
                `;
            case 'submitted':
            case 'graded':
                return `
                    <button class="btn small" onclick="studentDashboard.viewExamResults('${exam._id}')">
                        View Results
                    </button>
                    <button class="btn small secondary" onclick="studentDashboard.showExamDetailsModal('${exam._id}')">
                        Details
                    </button>
                `;
            default:
                return '';
        }
    }

    // ✅ ADD METHOD TO VIEW EXAM RESULTS
    async viewExamResults(examId) {
        try {
            // Find the submission for this exam
            const submission = this.grades.submissions?.find(s => s.examId._id === examId);
            if (submission) {
                this.showResultsModal(submission);
            } else {
                // If no submission found, try to fetch it
                const submissions = await ApiService.getStudentSubmissions();
                const examSubmission = submissions.find(s => s.examId._id === examId);
                if (examSubmission) {
                    this.showResultsModal(examSubmission);
                } else {
                    this.showModalMessage(
                        'Results Not Available',
                        'Results for this exam are not available yet. Please check back later.',
                        'info'
                    );
                }
            }
        } catch (error) {
            this.showError('Failed to load exam results: ' + error.message);
        }
    }

    // MODAL FOR EXAM DETAILS
    showExamDetailsModal(examId) {
        const exam = this.exams.find(e => e._id === examId);
        if (!exam) return;

        // Create modal if it doesn't exist
        let modal = document.getElementById('examDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'examDetailsModal';
            modal.className = 'modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background-color: white;
                    margin: 10% auto;
                    padding: 25px;
                    border-radius: 10px;
                    width: 500px;
                    max-width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                        <h3 style="margin:0;color:#2b3949;">Exam Details</h3>
                        <span class="close-modal" style="font-size:24px;cursor:pointer;color:#666">&times;</span>
                    </div>
                    <div id="examDetailsContent" style="line-height:1.6;"></div>
                    <div style="margin-top:25px;text-align:center;">
                        <button class="btn" onclick="document.getElementById('examDetailsModal').style.display='none'">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add close event
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Populate modal content
        const content = document.getElementById('examDetailsContent');
        content.innerHTML = `
            <div style="margin-bottom:15px;">
                <strong style="color:#2b3949;">Title:</strong>
                <div style="margin-top:5px;padding:10px;background:#f8f9fa;border-radius:5px;">
                    ${this.escapeHtml(exam.title)}
                </div>
            </div>
            
            <div style="margin-bottom:15px;">
                <strong style="color:#2b3949;">Description:</strong>
                <div style="margin-top:5px;padding:10px;background:#f8f9fa;border-radius:5px;">
                    ${this.escapeHtml(exam.description || 'No description provided')}
                </div>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;">
                <div>
                    <strong style="color:#2b3949;">Time Limit:</strong>
                    <div style="margin-top:5px;padding:8px;background:#f8f9fa;border-radius:5px;text-align:center;">
                        ${exam.timeLimitMinutes} minutes
                    </div>
                </div>
                <div>
                    <strong style="color:#2b3949;">Questions:</strong>
                    <div style="margin-top:5px;padding:8px;background:#f8f9fa;border-radius:5px;text-align:center;">
                        ${exam.questionCount || 0}
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom:15px;">
                <strong style="color:#2b3949;">Department:</strong>
                <div style="margin-top:5px;padding:8px;background:#f8f9fa;border-radius:5px;">
                    ${this.escapeHtml(exam.department || 'Not specified')}
                </div>
            </div>
            
            <div style="margin-bottom:15px;">
                <strong style="color:#2b3949;">Tutor:</strong>
                <div style="margin-top:5px;padding:8px;background:#f8f9fa;border-radius:5px;">
                    ${exam.tutorId?.name || 'Not assigned'}
                </div>
            </div>
            
            <div style="margin-top:20px;padding:12px;background:#e8f4fd;border-radius:5px;border-left:4px solid #4a90e2;">
                <strong>Status:</strong> 
                <span class="tag ${this.getExamStatusClass(exam.submissionStatus)}">
                    ${this.getExamStatusText(exam.submissionStatus)}
                </span>
            </div>
        `;

        modal.style.display = 'block';
    }

    // ADD MODAL MESSAGE FUNCTION
    showModalMessage(title, message, type = 'info') {
        let modal = document.getElementById('messageModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'messageModal';
            modal.className = 'modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background-color: white;
                    margin: 15% auto;
                    padding: 20px;
                    border-radius: 8px;
                    width: 400px;
                    max-width: 90%;
                    text-align: center;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #2b3949;"></h3>
                    <p style="margin: 0 0 20px 0; color: #666; white-space: pre-line;"></p>
                    <button class="btn" onclick="document.getElementById('messageModal').style.display='none'">
                        OK
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Update modal content
        const modalContent = modal.querySelector('.modal-content');
        modalContent.querySelector('h3').textContent = title;
        modalContent.querySelector('p').textContent = message;

        // Set color based on type
        const button = modalContent.querySelector('.btn');
        if (type === 'error') {
            button.style.backgroundColor = '#e05b5b';
        } else if (type === 'success') {
            button.style.backgroundColor = '#2fa46a';
        } else {
            button.style.backgroundColor = '#4a90e2';
        }

        modal.style.display = 'block';
    }

    // START EXAM FUNCTION
    async startExam(examId) {
        try {
            // Check if exam is already submitted
            const exam = this.exams.find(e => e._id === examId);
            if (!exam) {
                this.showError('Exam not found');
                return;
            }

            // Prevent starting already submitted exams
            if (exam.submissionStatus === 'submitted' || exam.submissionStatus === 'graded') {
                this.showModalMessage(
                    'Exam Already Submitted',
                    'You have already submitted this exam and cannot take it again.',
                    'info'
                );
                return;
            }

            const result = await ApiService.startExam(examId);
            this.currentExam = examId;
            this.showExamInterface(examId);
        } catch (error) {
            if (error.message.includes('already submitted')) {
                this.showModalMessage(
                    'Exam Already Submitted',
                    'You have already submitted this exam and cannot take it again.',
                    'info'
                );
                // Refresh dashboard to update exam status
                await this.loadDashboardData();
            } else {
                this.showError('Error starting exam: ' + error.message);
            }
        }
    }

    // FIXED AUTO SUBMIT EXAM
    async autoSubmitExam() {
        if (!this.currentExam) return;

        const answers = this.collectAnswers();

        try {
            await ApiService.submitExam(this.currentExam, answers);
            this.showModalMessage(
                'Exam Auto-Submitted',
                'Your exam has been automatically submitted due to time limit!',
                'info'
            );
            this.closeModal('examModal');
            await this.loadDashboardData();
        } catch (error) {
            this.showError('Error auto-submitting exam: ' + error.message);
        }
    }

    // FIXED SUBMIT EXAM - REPLACED CONFIRM WITH MODAL
    async submitExam() {
        if (!this.currentExam) return;

        // Replace confirm with modal confirmation
        this.showConfirmationModal(
            'Submit Exam',
            'Are you sure you want to submit your exam? This action cannot be undone.',
            () => this.confirmSubmitExam()
        );
    }

    async confirmSubmitExam() {
        const answers = this.collectAnswers();

        try {
            await ApiService.submitExam(this.currentExam, answers);
            clearInterval(this.timer);
            this.closeModal('examModal');
            this.closeModal('confirmationModal');
            this.showSuccess('Exam submitted successfully!');
            await this.loadDashboardData();
        } catch (error) {
            this.showError('Error submitting exam: ' + error.message);
        }
    }

    // ADD CONFIRMATION MODAL FUNCTION
    showConfirmationModal(title, message, onConfirm) {
        let modal = document.getElementById('confirmationModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'confirmationModal';
            modal.className = 'modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background-color: white;
                    margin: 15% auto;
                    padding: 20px;
                    border-radius: 8px;
                    width: 400px;
                    max-width: 90%;
                    text-align: center;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #2b3949;"></h3>
                    <p style="margin: 0 0 20px 0; color: #666;"></p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="confirmYes" class="btn" style="background: #2fa46a;">Yes</button>
                        <button id="confirmNo" class="btn secondary">No</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add event listeners
            document.getElementById('confirmNo').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Update modal content
        const modalContent = modal.querySelector('.modal-content');
        modalContent.querySelector('h3').textContent = title;
        modalContent.querySelector('p').textContent = message;

        // Update confirm button
        const confirmBtn = document.getElementById('confirmYes');
        confirmBtn.onclick = onConfirm;

        modal.style.display = 'block';
    }

    // FIXED DOWNLOAD FUNCTIONS
    async downloadResults(submissionId) {
        this.showModalMessage(
            'Download Feature',
            'Download feature would be implemented here',
            'info'
        );
    }

    async downloadAllResults() {
        this.showModalMessage(
            'Bulk Download',
            'Bulk download feature would be implemented here',
            'info'
        );
    }

    renderRecentResults(grades) {
        const recentList = document.getElementById('recent-results-list');
        const countElement = document.getElementById('recent-results-count');

        if (!recentList) return;

        const recentSubmissions = (grades.submissions || []).slice(0, 5);

        if (recentSubmissions.length === 0) {
            recentList.innerHTML = '<div class="empty-state">No results yet</div>';
            countElement.textContent = '0';
            return;
        }

        countElement.textContent = recentSubmissions.length;
        recentList.innerHTML = recentSubmissions.map(submission => `
            <div class="result-preview">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <strong>${this.escapeHtml(submission.examId?.title || 'Unknown Exam')}</strong>
                        <div style="font-size:12px;color:var(--muted);margin-top:2px">
                            ${new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                    </div>
                    <span class="tag ${this.getScoreClass(submission.percentage)}">
                        ${submission.percentage?.toFixed(1) || 0}%
                    </span>
                </div>
                <div style="margin-top:6px;display:flex;gap:4px">
                    <button class="btn small" onclick="studentDashboard.viewSubmissionDetails('${submission._id}')">
                        View Details
                    </button>
                    <button class="btn small secondary" onclick="studentDashboard.downloadResults('${submission._id}')">
                        Download
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPerformanceChart(grades) {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        // ✅ FIX: Destroy existing chart before creating new one
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        const submissions = (grades.submissions || []).slice(-6);
        const labels = submissions.map((_, index) => `Exam ${index + 1}`);
        const scores = submissions.map(sub => sub.percentage || 0);

        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        // ✅ FIX: Store chart instance
        this.performanceChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Exam Scores',
                    data: scores,
                    borderColor: '#6c63ff',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#6c63ff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Recent Exam Performance',
                        font: { size: 14 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    renderNotifications(notifications) {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;

        const unreadNotifications = notifications.filter(n => !n.read).slice(0, 5);

        if (unreadNotifications.length === 0) {
            notificationsList.innerHTML = '<div class="activity-item">No new notifications</div>';
            return;
        }

        notificationsList.innerHTML = unreadNotifications.map(notification => `
            <div class="activity-item ${!notification.read ? 'unread' : ''}">
                <div style="font-weight:600">${this.getNotificationTitle(notification)}</div>
                <div style="color:var(--muted);font-size:12px">
                    ${this.getNotificationMessage(notification)}
                </div>
                <div style="color:var(--muted);font-size:11px">
                    ${new Date(notification.sentAt).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    }

    getNotificationTitle(notification) {
        const types = {
            'admission': '🎓 Admission',
            'exam_reminder': '📝 Exam Reminder',
            'result': '📊 Results Ready',
            'general': '💬 Notification'
        };
        return types[notification.type] || '💬 Notification';
    }

    getNotificationMessage(notification) {
        switch (notification.type) {
            case 'admission':
                return 'Your admission letter is available';
            case 'exam_reminder':
                return `Reminder: ${notification.payload.examTitle}`;
            case 'result':
                return `Results available: ${notification.payload.score}/${notification.payload.maxScore}`;
            default:
                return notification.payload.message || 'New notification';
        }
    }

    populateAvailableExams(exams) {
        const availableExamsSelect = document.getElementById('availableExams');
        const submissionExamSelect = document.getElementById('submissionExam');

        if (!availableExamsSelect || !submissionExamSelect) return;

        // ✅ ENHANCED: Show ALL exams but indicate status
        availableExamsSelect.innerHTML = '<option value="">Select an exam...</option>';
        submissionExamSelect.innerHTML = '<option value="">Select exam...</option>';

        exams.forEach(exam => {
            const statusText = this.getExamStatusText(exam.submissionStatus);
            const isDisabled = exam.submissionStatus === 'submitted' || exam.submissionStatus === 'graded';

            const option = document.createElement('option');
            option.value = exam._id;
            option.textContent = `${exam.title} (${statusText})`;
            option.disabled = isDisabled;
            if (isDisabled) {
                option.title = 'This exam has already been submitted';
            }
            availableExamsSelect.appendChild(option);

            const option2 = option.cloneNode(true);
            submissionExamSelect.appendChild(option2);
        });

        // ✅ If no exams at all, show message
        if (exams.length === 0) {
            availableExamsSelect.innerHTML = '<option value="">No exams available</option>';
            submissionExamSelect.innerHTML = '<option value="">No exams available</option>';
        }
    }
    updateAcademicSummary(grades) {
        const overallGrade = grades.overallGrade;
        const gradeBreakdown = grades.gradeBreakdown || {
            examScore: 0,
            attendanceScore: 0,
            projectScore: 0,
            assignmentScore: 0,
            overallScore: 0
        };

        // Update GPA and basic info
        document.getElementById('profileGPA').textContent = overallGrade?.overallScore ?
            (overallGrade.overallScore / 20).toFixed(2) : '-';
        document.getElementById('profileCredits').textContent = overallGrade?.examScores?.length || 0;

        // Update attendance with proper score (out of 10 points)
        document.getElementById('profileAttendance').textContent =
            `${gradeBreakdown.attendanceScore.toFixed(1)}/10`;
        document.getElementById('attendanceScore').textContent =
            `${gradeBreakdown.attendanceScore.toFixed(1)}/10`;

        // Update assignment score display (out of 10 points)
        document.getElementById('assignmentsCompleted').textContent =
            `${gradeBreakdown.assignmentScore.toFixed(1)}/10`;

        // Update the detailed grade breakdown in dashboard stats
        this.updateGradeBreakdown(gradeBreakdown);
    }

    updateGradeBreakdown(gradeBreakdown) {
        let breakdownContainer = document.getElementById('gradeBreakdown');
        if (!breakdownContainer) {
            breakdownContainer = document.createElement('div');
            breakdownContainer.id = 'gradeBreakdown';
            breakdownContainer.className = 'grade-breakdown-container';

            // Insert after the academic summary card
            const academicSummary = document.querySelector('.card:has(#studentDepartment)');
            if (academicSummary) {
                academicSummary.parentNode.insertBefore(breakdownContainer, academicSummary.nextSibling);
            }
        }

        // Calculate percentages for progress bars
        const examPercentage = (gradeBreakdown.examScore / 30) * 100;
        const projectPercentage = (gradeBreakdown.projectScore / 50) * 100;
        const assignmentPercentage = (gradeBreakdown.assignmentScore / 10) * 100;
        const attendancePercentage = (gradeBreakdown.attendanceScore / 10) * 100;

        breakdownContainer.innerHTML = `
        <h4 class="grade-breakdown-header">Grade Breakdown</h4>
        <div class="grade-breakdown-grid">
            <div class="grade-breakdown-item exam">
                <div class="grade-breakdown-label">Exam Score</div>
                <div class="grade-breakdown-score">${gradeBreakdown.examScore.toFixed(1)}/30</div>
                <div class="grade-breakdown-percentage">${examPercentage.toFixed(1)}%</div>
                <div class="grade-progress-container">
                    <div class="grade-progress-bar" style="width: ${examPercentage}%"></div>
                </div>
            </div>
            
            <div class="grade-breakdown-item project">
                <div class="grade-breakdown-label">Project Score</div>
                <div class="grade-breakdown-score">${gradeBreakdown.projectScore.toFixed(1)}/50</div>
                <div class="grade-breakdown-percentage">${projectPercentage.toFixed(1)}%</div>
                <div class="grade-progress-container">
                    <div class="grade-progress-bar" style="width: ${projectPercentage}%"></div>
                </div>
            </div>
            
            <div class="grade-breakdown-item assignment">
                <div class="grade-breakdown-label">Assignment Score</div>
                <div class="grade-breakdown-score">${gradeBreakdown.assignmentScore.toFixed(1)}/10</div>
                <div class="grade-breakdown-percentage">${assignmentPercentage.toFixed(1)}%</div>
                <div class="grade-progress-container">
                    <div class="grade-progress-bar" style="width: ${assignmentPercentage}%"></div>
                </div>
            </div>
            
            <div class="grade-breakdown-item attendance">
                <div class="grade-breakdown-label">Attendance</div>
                <div class="grade-breakdown-score">${gradeBreakdown.attendanceScore.toFixed(1)}/10</div>
                <div class="grade-breakdown-percentage">${attendancePercentage.toFixed(1)}%</div>
                <div class="grade-progress-container">
                    <div class="grade-progress-bar" style="width: ${attendancePercentage}%"></div>
                </div>
            </div>
        </div>
        
        <div class="grade-breakdown-total">
            <div class="total-label">Total Overall Score</div>
            <div class="total-score">${gradeBreakdown.overallScore.toFixed(1)}/100</div>
            <div class="total-percentage">${gradeBreakdown.overallScore.toFixed(1)}%</div>
        </div>
    `;
    }

    renderGradesTable(grades) {
        const tbody = document.querySelector('#grades-table tbody');
        if (!tbody) return;

        const submissions = grades.submissions || [];
        const gradeBreakdown = grades.gradeBreakdown || {};

        // Clear existing content
        tbody.innerHTML = '';

        // ADD TUTOR-INPUT GRADES TO THE TABLE
        const tutorGrades = [
            {
                _id: 'attendance-grade',
                name: 'Attendance Score',
                type: 'attendance',
                score: gradeBreakdown.attendanceScore || 0,
                maxScore: 10,
                percentage: ((gradeBreakdown.attendanceScore || 0) / 10) * 100,
                date: grades.overallGrade?.lastUpdated || new Date(),
                status: 'completed'
            },
            {
                _id: 'project-grade',
                name: 'Project Score',
                type: 'project',
                score: gradeBreakdown.projectScore || 0,
                maxScore: 50,
                percentage: ((gradeBreakdown.projectScore || 0) / 50) * 100,
                date: grades.overallGrade?.lastUpdated || new Date(),
                status: 'completed'
            },
            {
                _id: 'assignment-grade',
                name: 'Assignment Score',
                type: 'assignment',
                score: gradeBreakdown.assignmentScore || 0,
                maxScore: 10,
                percentage: ((gradeBreakdown.assignmentScore || 0) / 10) * 100,
                date: grades.overallGrade?.lastUpdated || new Date(),
                status: 'completed'
            }
        ];

        // Add tutor-input grades to table
        tutorGrades.forEach(grade => {
            if (grade.score > 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
    <td><strong>${this.escapeHtml(grade.name)}</strong></td>
    <td>
        <span class="tag ${grade.type}">
            ${grade.type.charAt(0).toUpperCase() + grade.type.slice(1)}
        </span>
    </td>
    <td><strong>${grade.score.toFixed(1)}/${grade.maxScore}</strong></td>
    <td>
        <span class="tag ${this.getScoreClass(grade.percentage)}">
            ${grade.percentage.toFixed(1)}%
        </span>
    </td>
    <td>${new Date(grade.date).toLocaleDateString()}</td>
    <td>
        <span class="tag success">Completed</span>
    </td>
    <td>-</td>
`;
                tbody.appendChild(row);
            }
        });

        // Add exam submissions to table
        submissions.forEach(submission => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${this.escapeHtml(submission.examId?.title || 'Unknown Exam')}</strong></td>
                <td><span class="tag" style="background: #fff3e0; color: #ef6c00;">Exam</span></td>
                <td>${submission.totalScore || 0}/${submission.maxScore || 1}</td>
                <td>
                    <span class="tag ${this.getScoreClass(submission.percentage)}">
                        ${(submission.percentage || 0).toFixed(1)}%
                    </span>
                </td>
                <td>${new Date(submission.submittedAt).toLocaleDateString()}</td>
                <td>
                    <span class="tag ${submission.status === 'graded' ? 'success' : 'warning'}">
                        ${submission.status || 'submitted'}
                    </span>
                </td>
                <td>
                    <button class="btn small" onclick="studentDashboard.viewSubmissionDetails('${submission._id}')">
                        Details
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        if (tbody.children.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No grades available yet</td></tr>';
        }

        // Update grade summary
        this.updateGradeSummary(submissions, tutorGrades);
    }

    updateGradeSummary(submissions, tutorGrades = []) {
        if (submissions.length === 0 && tutorGrades.length === 0) return;

        // Calculate average from both exams and tutor grades
        const allGrades = [
            ...submissions.map(sub => sub.percentage || 0),
            ...tutorGrades.map(grade => grade.percentage || 0)
        ];

        const average = allGrades.length > 0 ?
            allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length : 0;

        const highest = allGrades.length > 0 ? Math.max(...allGrades) : 0;

        document.getElementById('grade-average').textContent = average.toFixed(1) + '%';
        document.getElementById('grade-highest').textContent = highest.toFixed(1) + '%';
        document.getElementById('grade-improvement').textContent = '+0%';
    }

    async showExamInterface(examId) {
        const exam = this.exams.find(e => e._id === examId);
        if (!exam) return;

        try {
            // Load full exam with questions
            const fullExam = await this.loadFullExam(examId);

            const modal = document.getElementById('examModal');
            const examContent = document.getElementById('examContent');
            const examTitle = document.getElementById('examModalTitle');

            if (modal && examContent && examTitle) {
                examTitle.textContent = fullExam.title;
                examContent.innerHTML = this.generateExamForm(fullExam);

                modal.style.display = 'block';
                this.startTimer(fullExam.timeLimitMinutes);

                // ✅ FIX: Remove duplicate event listeners - use onclick instead
                // The buttons now use onclick attributes in generateExamForm
            }
        } catch (error) {
            this.showError('Error loading exam: ' + error.message);
        }
    }

    async loadFullExam(examId) {
        try {
            const response = await fetch(`${ApiService.BASE_URL}/student/exams/${examId}/full`, {
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load exam details');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    generateExamForm(exam) {
        if (!exam.questions || exam.questions.length === 0) {
            return '<p>No questions available for this exam.</p>';
        }

        return `
            <div class="exam-instructions" style="background:#f9f7f1;padding:15px;border-radius:8px;margin-bottom:20px;">
                <p><strong>Instructions:</strong></p>
                <ul style="margin:10px 0;padding-left:20px;">
                    <li>You have ${exam.timeLimitMinutes} minutes to complete this exam</li>
                    <li>Answer all questions before submitting</li>
                    <li>Timer will auto-submit when time expires</li>
                    <li>Each question is worth ${exam.questions[0]?.score || 1} point(s)</li>
                </ul>
            </div>
            
            <div class="questions-list">
                ${exam.questions.map((question, index) => `
                    <div class="question-item" style="margin-bottom:25px;padding:20px;border:2px solid #e6d9b4;border-radius:10px;background:white;">
                        <div style="font-weight:600;margin-bottom:15px;font-size:16px;color:#2b3949;">
                            <span style="background:#512da8;color:white;padding:4px 8px;border-radius:4px;margin-right:8px;">
                                Q${index + 1}
                            </span>
                            ${this.escapeHtml(question.text)}
                            <span style="float:right;font-size:12px;color:var(--muted);">
                                ${question.score} point(s)
                            </span>
                        </div>
                        
                        <div class="options-list">
                            ${question.questionType === 'multiple_choice' ? `
                                ${question.options.map((option, optIndex) => `
                                    <label style="display:block;margin-bottom:12px;padding:12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;transition:all 0.3s;">
                                        <input type="radio" name="question_${question._id}" value="${optIndex}" style="margin-right:12px;">
                                        <strong>${String.fromCharCode(65 + optIndex)}.</strong> ${this.escapeHtml(option)}
                                    </label>
                                `).join('')}
                            ` : ''}
                            
                            ${question.questionType === 'true_false' ? `
                                <label style="display:block;margin-bottom:12px;padding:12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;">
                                    <input type="radio" name="question_${question._id}" value="1" style="margin-right:12px;">
                                    True
                                </label>
                                <label style="display:block;margin-bottom:12px;padding:12px;border:1px solid #ddd;border-radius:6px;cursor:pointer;">
                                    <input type="radio" name="question_${question._id}" value="0" style="margin-right:12px;">
                                    False
                                </label>
                            ` : ''}
                            
                            ${question.questionType === 'short_answer' ? `
                                <textarea name="question_${question._id}" 
                                    style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-family:inherit;"
                                    rows="3" 
                                    placeholder="Type your answer here..."></textarea>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="position:sticky;bottom:0;background:white;padding:20px;border-top:2px solid #e6d9b4;margin-top:30px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:600;color:#2b3949;">
                        ${exam.questions.length} Questions • ${this.calculateTotalPoints(exam.questions)} Total Points
                    </div>
                    <div style="display:flex;gap:12px;">
                        <button class="btn" onclick="studentDashboard.submitExam()" style="padding:12px 30px;">
                            Submit Exam
                        </button>
                        <button class="btn secondary" onclick="studentDashboard.closeModal('examModal')" style="padding:12px 24px;">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    calculateTotalPoints(questions) {
        return questions.reduce((total, question) => total + (question.score || 1), 0);
    }

    startTimer(minutes) {
        let timeLeft = minutes * 60;
        const timerElement = document.getElementById('examTimer');

        // Clear any existing timer
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(this.timer);
                this.autoSubmitExam();
                return;
            }

            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;

            if (timerElement) {
                timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }

            timeLeft--;
        }, 1000);
    }

    collectAnswers() {
        const answers = [];

        // Collect multiple choice and true/false answers
        const radioInputs = document.querySelectorAll('input[type="radio"]:checked');
        radioInputs.forEach(input => {
            const questionId = input.name.replace('question_', '');
            const selectedIndex = parseInt(input.value);

            answers.push({
                questionId: questionId,
                selectedIndex: selectedIndex
            });
        });

        // Collect short answer responses
        const textAreas = document.querySelectorAll('textarea[name^="question_"]');
        textAreas.forEach(textarea => {
            const questionId = textarea.name.replace('question_', '');
            const textAnswer = textarea.value.trim();

            if (textAnswer) {
                answers.push({
                    questionId: questionId,
                    textAnswer: textAnswer
                });
            }
        });

        return answers;
    }

    async viewSubmissionDetails(submissionId) {
        try {
            const submission = await ApiService.getSubmission(submissionId);
            this.showResultsModal(submission);
        } catch (error) {
            this.showError('Failed to load submission details');
        }
    }

    showResultsModal(submission) {
        const modal = document.getElementById('resultsModal');
        const content = document.getElementById('resultsContent');

        if (!modal || !content) return;

        content.innerHTML = `
            <div style="text-align:center;margin-bottom:20px;">
                <h3 style="color:#2b3949;margin-bottom:8px;">${submission.examId?.title || 'Exam Results'}</h3>
                <div class="stat-big" style="color:#6c63ff;">
                    ${submission.totalScore}/${submission.maxScore}
                </div>
                <div style="font-size:18px;font-weight:600;color:#2b3949;">
                    ${((submission.totalScore / submission.maxScore) * 100).toFixed(1)}%
                </div>
            </div>
            <div style="margin-top:20px;">
                <h4 style="margin-bottom:12px;">Detailed Results</h4>
                ${submission.answers.map((answer, index) => `
                    <div style="padding:12px;border-left:4px solid ${answer.isCorrect ? '#4ecdc4' : '#ff6b6b'};background:#f8f9fa;margin-bottom:8px;border-radius:4px;">
                        <div style="font-weight:600;">Question ${index + 1}:</div>
                        <div style="font-size:14px;color:#666;margin:4px 0;">${answer.questionId.text}</div>
                        <div style="font-size:13px;">
                            <span style="color:${answer.isCorrect ? '#2fa46a' : '#e05b5b'};">
                                ${answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                            <span style="margin-left:12px;color:#666;">
                                Score: ${answer.score}/${answer.questionId.score}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        modal.style.display = 'block';
    }

    async uploadProjectSubmission() {
        const examId = document.getElementById('submissionExam').value;
        const description = document.getElementById('submissionDescription').value;
        const files = document.getElementById('projectFiles').files;

        if (!examId) {
            this.showUploadStatus('Please select an exam', 'error');
            return;
        }

        if (!files || files.length === 0) {
            this.showUploadStatus('Please select files to upload', 'error');
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        formData.append('examId', examId);
        formData.append('description', description);

        const submitBtn = document.getElementById('btnUploadSubmission');
        const statusDiv = document.getElementById('uploadStatus');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';
            statusDiv.style.display = 'none';

            const result = await ApiService.uploadProjectSubmission(formData);

            this.showUploadStatus('Files uploaded successfully!', 'success');

            // Clear form
            document.getElementById('submissionDescription').value = '';
            document.getElementById('projectFiles').value = '';
            document.getElementById('submissionExam').value = '';

            setTimeout(() => {
                this.loadDashboardData();
            }, 2000);

        } catch (error) {
            this.showUploadStatus('Upload failed: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload Submission';
        }
    }

    showUploadStatus(message, type) {
        const statusDiv = document.getElementById('uploadStatus');
        statusDiv.textContent = message;
        statusDiv.className = type === 'error' ? 'error-message' : 'success-message';
        statusDiv.style.display = 'block';
    }

    getScoreClass(percentage) {
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        if (percentage >= 40) return 'average';
        return 'poor';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
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
        messageDiv.style.padding = '12px';
        messageDiv.style.borderRadius = '8px';

        messageContainer.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function (m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]);
        });
    }

    setupEventListeners() {
        this.setupNavigation();

        // Quick actions
        document.getElementById('quickViewExams')?.addEventListener('click', () => this.setActiveView('exams'));
        document.getElementById('quickViewGrades')?.addEventListener('click', () => this.setActiveView('grades'));
        document.getElementById('quickDownloadResults')?.addEventListener('click', () => this.downloadAllResults());

        // Exam actions
        document.getElementById('btnStartExam')?.addEventListener('click', () => {
            const examId = document.getElementById('availableExams').value;
            if (examId) {
                this.startExam(examId);
            } else {
                this.showError('Please select an exam');
            }
        });

        // File upload
        document.getElementById('btnUploadSubmission')?.addEventListener('click', () => this.uploadProjectSubmission());

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Refresh buttons
        document.getElementById('refreshExams')?.addEventListener('click', () => this.loadDashboardData());
        document.getElementById('refreshSubmissions')?.addEventListener('click', () => this.loadDashboardData());

        // LOGOUT FIX
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Logout initiated from student dashboard');
                AuthService.logout();
            });
        } else {
            console.error('Logout button not found!');
        }
    }

    setupNavigation() {
        const sidebarItems = document.querySelectorAll("#sidebarMenu .item");
        const views = {
            'dashboard': document.getElementById('view-dashboard'),
            'exams': document.getElementById('view-exams'),
            'grades': document.getElementById('view-grades'),
            'submissions': document.getElementById('view-submissions'),
            'resources': document.getElementById('view-resources'),
            'profile': document.getElementById('view-profile')
        };

        sidebarItems.forEach((item) => {
            item.addEventListener("click", () => {
                const view = item.dataset.view;
                this.setActiveView(view);
            });
        });
    }

    setActiveView(viewKey) {
        // Reset active class
        document.querySelectorAll('#sidebarMenu .item').forEach(it => {
            it.classList.toggle('active', it.dataset.view === viewKey);
        });

        // Show/hide views
        const views = {
            'dashboard': document.getElementById('view-dashboard'),
            'exams': document.getElementById('view-exams'),
            'grades': document.getElementById('view-grades'),
            'submissions': document.getElementById('view-submissions'),
            'resources': document.getElementById('view-resources'),
            'profile': document.getElementById('view-profile')
        };

        Object.keys(views).forEach(k => {
            if (views[k]) {
                views[k].style.display = (k === viewKey) ? '' : 'none';
            }
        });

        // Load view-specific data
        this.loadViewData(viewKey);
    }

    async loadViewData(view) {
        switch (view) {
            case 'exams':
                await this.loadExamsView();
                break;
            case 'grades':
                await this.loadGradesView();
                break;
            case 'submissions':
                await this.loadSubmissionsView();
                break;
        }
    }

    async loadExamsView() {
        try {
            const exams = await ApiService.getStudentExams();
            this.renderExamsGrid(exams);
        } catch (error) {
            this.showError('Failed to load exams');
        }
    }

    async loadGradesView() {
        try {
            const grades = await ApiService.getStudentGrades();
            this.renderGradesTable(grades);
        } catch (error) {
            this.showError('Failed to load grades');
        }
    }

    async loadSubmissionsView() {
        try {
            const submissions = await ApiService.getStudentSubmissions();
            this.renderSubmissionsView(submissions);
        } catch (error) {
            this.showError('Failed to load submissions');
        }
    }

    renderExamsGrid(exams) {
        const examsGrid = document.getElementById('examsGrid');
        if (!examsGrid) return;

        if (exams.length === 0) {
            examsGrid.innerHTML = '<div class="empty-state">No exams available</div>';
            return;
        }

        examsGrid.innerHTML = exams.map(exam => `
            <div class="card">
                <div class="exam-header">
                    <h3>${this.escapeHtml(exam.title)}</h3>
                    <span class="exam-status ${this.getExamStatusClass(exam.submissionStatus)}">
                        ${this.getExamStatusText(exam.submissionStatus)}
                    </span>
                </div>
                <p class="exam-description">${this.escapeHtml(exam.description || 'No description')}</p>
                <div class="exam-details">
                    <span>Tutor: ${exam.tutorId?.name || 'Not assigned'}</span>
                    <span>Questions: ${exam.questionCount || 0}</span>
                    <span>Time: ${exam.timeLimitMinutes} mins</span>
                </div>
                <div class="exam-actions">
                    ${this.getExamGridActionButton(exam)}
                </div>
            </div>
        `).join('');
    }

    // ✅ ADD THIS METHOD FOR GRID ACTIONS
    getExamGridActionButton(exam) {
        switch (exam.submissionStatus) {
            case 'not_started':
                return `<button class="btn btn-primary" onclick="studentDashboard.startExam('${exam._id}')">
                    Start Exam
                </button>`;
            case 'in_progress':
                return `<button class="btn btn-warning" onclick="studentDashboard.startExam('${exam._id}')">
                    Continue Exam
                </button>`;
            case 'submitted':
            case 'graded':
                return `<button class="btn btn-outline" onclick="studentDashboard.viewExamResults('${exam._id}')">
                    View Results
                </button>`;
            default:
                return '';
        }
    }

    async loadNotifications() {
        try {
            const notifications = await ApiService.getNotifications();
            this.renderNotifications(notifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async viewResults(examId) {
        const submission = this.grades.submissions?.find(s => s.examId._id === examId);
        if (submission) {
            this.showResultsModal(submission);
        } else {
            this.showError('No results available for this exam');
        }
    }
}

// Initialize student dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentDashboard = new StudentDashboard();
});