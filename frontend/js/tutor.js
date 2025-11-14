// class TutorDashboard {
//     constructor() {
//         this.exams = [];
//         this.students = [];
//         this.currentExam = null;
//         this.currentQuestions = [];
//         // Don't call init() here - wait for DOMContentLoaded
//     }

//     async init() {
//         // Show loading state immediately
//         this.showLoadingState();

//         // Check authentication first
//         const isAuthenticated = await AuthService.checkAuthAndRedirect();
//         if (!isAuthenticated) {
//             return;
//         }

//         const user = AuthService.getUser();
//         if (user.role !== 'tutor') {
//             window.location.href = 'index.html';
//             return;
//         }

//         // Hide loading and show content
//         this.hideLoadingState();

//         // Set user info
//         document.querySelector('.user-name').textContent = user.name;
//         document.querySelector('.user-info').textContent = user.name;
//         document.querySelector('.user-role').textContent = user.role;
//         document.getElementById('examDepartment').value = user.department;
//         document.getElementById('departmentName').textContent = user.department;
//         document.getElementById('tutorProfileName').value = user.name;
//         document.getElementById('tutorProfileEmail').value = user.email;
//         document.getElementById('tutorProfileDept').value = user.department;

//         await this.loadDashboardData();
//         this.setupEventListeners();
//     }

//     showLoadingState() {
//         // Hide main content, show loading
//         const mainContent = document.querySelector('.main');
//         const loadingHTML = `
//             <div class="loading-overlay" style="
//                 position: fixed;
//                 top: 0;
//                 left: 0;
//                 width: 100%;
//                 height: 100%;
//                 background: var(--bg);
//                 display: flex;
//                 align-items: center;
//                 justify-content: center;
//                 z-index: 9999;
//             ">
//                 <div class="loading-spinner" style="
//                     text-align: center;
//                     color: var(--accent);
//                 ">
//                     <div style="
//                         width: 40px;
//                         height: 40px;
//                         border: 4px solid #f3f3f3;
//                         border-top: 4px solid var(--accent);
//                         border-radius: 50%;
//                         animation: spin 1s linear infinite;
//                         margin: 0 auto 16px;
//                     "></div>
//                     <p>Loading Tutor Dashboard...</p>
//                 </div>
//             </div>
//         `;

//         if (mainContent) {
//             mainContent.style.opacity = '0.3';
//         }
//         document.body.insertAdjacentHTML('beforeend', loadingHTML);
//     }

//     hideLoadingState() {
//         // Remove loading overlay, show content
//         const loadingOverlay = document.querySelector('.loading-overlay');
//         const mainContent = document.querySelector('.main');

//         if (loadingOverlay) {
//             loadingOverlay.remove();
//         }
//         if (mainContent) {
//             mainContent.style.opacity = '1';
//         }
//     }

//     async loadDashboardData() {
//         try {
//             console.log('Loading dashboard data...');

//             // Only load exams and students, skip notifications for now
//             const [exams, students] = await Promise.all([
//                 ApiService.getTutorExams().catch(error => {
//                     console.warn('Failed to load exams:', error);
//                     return []; // Return empty array if fails
//                 }),
//                 ApiService.getTutorStudents().catch(error => {
//                     console.warn('Failed to load students:', error);
//                     return []; // Return empty array if fails
//                 })
//             ]);

//             console.log('Loaded exams:', exams);
//             console.log('Loaded students:', students);

//             this.exams = exams;
//             this.students = students;

//             this.updateDashboardStats();
//             this.renderRecentExams();
//             this.renderRecentSubmissions();

//             // Load notifications separately since it might not exist
//             try {
//                 const notifications = await ApiService.getNotifications();
//                 this.renderNotifications(notifications);
//             } catch (error) {
//                 console.warn('Notifications not available:', error);
//                 this.renderNotifications([]);
//             }

//         } catch (error) {
//             console.error('Error loading dashboard data:', error);
//             this.showError('Failed to load dashboard data: ' + error.message);
//         }
//     }

//     updateDashboardStats() {
//         const activeExams = this.exams.filter(exam => exam.isActive).length;
//         const pendingSubmissions = this.exams.reduce((total, exam) => total + (exam.submissionCount || 0), 0);

//         document.getElementById('stat-active-exams').textContent = activeExams;
//         document.getElementById('stat-students').textContent = this.students.length;
//         document.getElementById('stat-pending').textContent = pendingSubmissions;
//         document.getElementById('deptTotalStudents').textContent = this.students.length;
//         document.getElementById('deptActiveExams').textContent = activeExams;
//     }

//     renderRecentExams() {
//         const container = document.getElementById('recent-exams-list');
//         const recentExams = this.exams.slice(0, 5);

//         if (recentExams.length === 0) {
//             container.innerHTML = '<div class="empty-state">No exams created yet</div>';
//             return;
//         }

//         container.innerHTML = recentExams.map(exam => `
//             <div class="exam-preview">
//                 <div style="display:flex;justify-content:space-between;align-items:start">
//                     <div>
//                         <strong>${UIHelpers.escapeHtml(exam.title)}</strong>
//                         <div style="font-size:12px;color:var(--muted);margin-top:4px">
//                             ${UIHelpers.escapeHtml(exam.description || 'No description')}
//                         </div>
//                     </div>
//                     <span class="tag ${exam.isActive ? 'success' : 'warning'}">
//                         ${exam.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                 </div>
//                 <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;color:var(--muted)">
//                     <span>${exam.questions?.length || 0} questions</span>
//                     <span>${exam.timeLimitMinutes} mins</span>
//                     <span>${exam.submissionCount || 0} submissions</span>
//                 </div>
//                 <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap">
//                     <button class="btn small" onclick="tutorDashboard.viewExam('${exam._id}')">
//                         Manage Questions
//                     </button>
//                     <button class="btn small secondary" onclick="tutorDashboard.toggleExamStatus('${exam._id}')">
//                         ${exam.isActive ? 'Deactivate' : 'Activate'}
//                     </button>
//                     <button class="btn small danger" onclick="tutorDashboard.deleteExam('${exam._id}')">
//                         Delete
//                     </button>
//                 </div>
//             </div>
//         `).join('');
//     }

//     renderRecentSubmissions() {
//         const container = document.getElementById('recent-submissions-list');
//         const countElement = document.getElementById('recent-submissions-count');

//         container.innerHTML = '<div class="empty-state">No submissions yet</div>';
//         countElement.textContent = '0';
//     }

//     renderNotifications(notifications) {
//         const container = document.getElementById('notificationsList');
//         const unreadNotifications = notifications.filter(n => !n.read).slice(0, 5);

//         if (unreadNotifications.length === 0) {
//             container.innerHTML = '<div class="activity-item">No new notifications</div>';
//             return;
//         }

//         container.innerHTML = unreadNotifications.map(notification => `
//             <div class="activity-item ${!notification.read ? 'unread' : ''}">
//                 <div style="font-weight:600">${this.getNotificationTitle(notification)}</div>
//                 <div style="color:var(--muted);font-size:12px">
//                     ${this.getNotificationMessage(notification)}
//                 </div>
//                 <div style="color:var(--muted);font-size:11px">
//                     ${UIHelpers.formatDate(notification.sentAt)}
//                 </div>
//             </div>
//         `).join('');
//     }

//     getNotificationTitle(notification) {
//         const types = {
//             'admission': '🎓 Admission',
//             'exam_reminder': '📝 Exam Reminder',
//             'result': '📊 Results Ready',
//             'submission': '📨 New Submission',
//             'general': '💬 Notification'
//         };
//         return types[notification.type] || '💬 Notification';
//     }

//     getNotificationMessage(notification) {
//         switch (notification.type) {
//             case 'exam_reminder':
//                 return `Reminder: ${notification.payload.examTitle}`;
//             case 'result':
//                 return `Results available: ${notification.payload.score}/${notification.payload.maxScore}`;
//             case 'submission':
//                 return `New submission from student`;
//             default:
//                 return notification.payload.message || 'New notification';
//         }
//     }

//     async createExam() {
//         const title = document.getElementById('examTitle').value.trim();
//         const description = document.getElementById('examDescription').value.trim();
//         const timeLimitMinutes = document.getElementById('examTimeLimit').value;
//         const department = document.getElementById('examDepartment').value;

//         if (!title || !timeLimitMinutes) {
//             this.showMessage('Please fill in all required fields', 'error');
//             return;
//         }

//         try {
//             // Show loading state
//             const createBtn = document.getElementById('btnCreateExam');
//             const originalText = createBtn.textContent;
//             createBtn.textContent = 'Creating...';
//             createBtn.disabled = true;

//             const examData = {
//                 title,
//                 description,
//                 timeLimitMinutes: parseInt(timeLimitMinutes),
//                 department,
//                 questions: []
//             };

//             console.log('Creating exam with data:', examData);

//             const result = await ApiService.createExam(examData);

//             console.log('Exam creation response:', result);

//             this.showMessage('Exam created successfully! Now add questions.', 'success');

//             // Clear form
//             document.getElementById('examTitle').value = '';
//             document.getElementById('examDescription').value = '';
//             document.getElementById('examTimeLimit').value = '60';

//             // Reload dashboard data to get the updated exams list
//             await this.loadDashboardData();

//             // Find the newly created exam - handle different response formats
//             let newExam;
//             if (result.exam) {
//                 // If response has exam object
//                 newExam = result.exam;
//             } else if (result._id) {
//                 // If response is the exam itself
//                 newExam = result;
//             } else {
//                 // Fallback: find by title in the loaded exams
//                 newExam = this.exams.find(exam => exam.title === title);
//             }

//             if (newExam && newExam._id) {
//                 console.log('Found new exam:', newExam);
//                 // Open questions modal for the new exam after a short delay
//                 setTimeout(() => {
//                     this.openQuestionsModal(newExam._id);
//                 }, 1500);
//             } else {
//                 console.warn('New exam not found in response or local data');
//                 this.showMessage('Exam created! Please refresh the page and click "Manage Questions" to add questions.', 'success');
//             }

//         } catch (error) {
//             console.error('Exam creation error:', error);
//             this.showMessage('Error creating exam: ' + error.message, 'error');
//         } finally {
//             // Reset button state
//             const createBtn = document.getElementById('btnCreateExam');
//             createBtn.textContent = 'Create Exam';
//             createBtn.disabled = false;
//         }
//     }

//     async viewExam(examId) {
//         this.openQuestionsModal(examId);
//     }

//     async openQuestionsModal(examId) {
//         console.log('Opening questions modal for exam:', examId);

//         const modal = document.getElementById('questionsModal');

//         try {
//             // Always try to fetch from API first
//             let exam;
//             try {
//                 exam = await ApiService.getExamById(examId);
//             } catch (error) {
//                 console.warn('Could not fetch exam by ID, trying local data:', error);
//                 exam = this.exams.find(e => e._id === examId);
//             }

//             if (!exam) {
//                 this.showMessage('Exam not found. The exam was created but may need a page refresh.', 'error');
//                 return;
//             }

//             this.currentExam = exam;
//             this.currentQuestions = exam.questions || [];

//             document.querySelector('#questionsModal h3').textContent = `Manage Questions: ${exam.title}`;

//             this.renderQuestions(this.currentQuestions);
//             this.setupQuestionFormHandlers(examId);

//             modal.style.display = 'block';

//         } catch (error) {
//             console.error('Error opening questions modal:', error);
//             this.showMessage('Error loading exam. Please refresh the page and try again.', 'error');
//         }
//     }

//     renderQuestions(questions) {
//         const container = document.getElementById('questionsContainer');

//         if (questions.length === 0) {
//             container.innerHTML = '<div class="empty-state">No questions added yet. Add your first question below.</div>';
//             return;
//         }

//         container.innerHTML = questions.map((question, index) => `
//             <div class="question-item" style="margin-bottom:15px;padding:15px;border:1px solid #e6d9b4;border-radius:8px;background:white;">
//                 <div style="display:flex;justify-content:space-between;align-items:start">
//                     <div style="flex:1">
//                         <strong>Q${index + 1}:</strong> ${UIHelpers.escapeHtml(question.text)}
//                         <div style="font-size:12px;color:var(--muted);margin-top:4px">
//                             Type: ${question.questionType} | Score: ${question.score}
//                         </div>
//                         ${question.questionType === 'multiple_choice' ? `
//                             <div style="font-size:11px;margin-top:4px">
//                                 Options: 
//                                 ${question.options.map((opt, i) => `
//                                     <span style="color: ${i === question.correctIndex ? '#2fa46a' : '#666'}">
//                                         ${String.fromCharCode(65 + i)}. ${UIHelpers.escapeHtml(opt)}
//                                         ${i === question.correctIndex ? ' ✓' : ''}
//                                     </span>
//                                 `).join(', ')}
//                             </div>
//                         ` : ''}
//                         ${question.questionType === 'true_false' ? `
//                             <div style="font-size:11px;margin-top:4px">
//                                 Correct Answer: ${question.correctIndex === 1 ? 'True' : 'False'}
//                             </div>
//                         ` : ''}
//                         ${question.questionType === 'short_answer' ? `
//                             <div style="font-size:11px;margin-top:4px">
//                                 Correct Answer: ${UIHelpers.escapeHtml(question.correctAnswer)}
//                             </div>
//                         ` : ''}
//                     </div>
//                     <div style="display:flex;gap:4px">
//                         <button class="btn small secondary" onclick="tutorDashboard.editQuestion(${index})">Edit</button>
//                         <button class="btn small danger" onclick="tutorDashboard.deleteQuestion(${index})">Delete</button>
//                     </div>
//                 </div>
//             </div>
//         `).join('');
//     }

//     setupQuestionFormHandlers(examId) {
//         const questionTypeSelect = document.getElementById('newQuestionType');
//         const addQuestionBtn = document.getElementById('addQuestion');
//         const addOptionBtn = document.getElementById('addOption');
//         const saveAllBtn = document.getElementById('saveAllQuestions');

//         // Show/hide options based on question type
//         questionTypeSelect.addEventListener('change', function () {
//             const type = this.value;
//             document.getElementById('multipleChoiceOptions').style.display =
//                 type === 'multiple_choice' ? 'block' : 'none';
//             document.getElementById('shortAnswerOption').style.display =
//                 type === 'short_answer' ? 'block' : 'none';
//             document.getElementById('trueFalseOptions').style.display =
//                 type === 'true_false' ? 'block' : 'none';
//         });

//         // Add option for multiple choice
//         addOptionBtn.addEventListener('click', () => {
//             this.addOptionField();
//         });

//         // Add question
//         addQuestionBtn.addEventListener('click', () => {
//             this.addQuestionToExam();
//         });

//         // Save all questions
//         saveAllBtn.addEventListener('click', () => {
//             this.saveAllQuestions(examId);
//         });

//         // Initialize option selection handlers
//         this.setupOptionSelectionHandlers();

//         // Initialize with multiple choice visible
//         document.getElementById('multipleChoiceOptions').style.display = 'block';
//     }

//     setupOptionSelectionHandlers() {
//         const optionsContainer = document.getElementById('optionsContainer');

//         // Delegate click events for option selection
//         optionsContainer.addEventListener('click', (e) => {
//             // Handle checkbox click
//             if (e.target.classList.contains('option-checkbox')) {
//                 this.selectCorrectOption(e.target.closest('.option-item'));
//             }

//             // Handle remove button click
//             if (e.target.classList.contains('remove-option')) {
//                 this.removeOptionField(e.target.closest('.option-item'));
//             }
//         });

//         // Handle option item click (for better UX)
//         optionsContainer.addEventListener('click', (e) => {
//             if (e.target.classList.contains('option-item') ||
//                 e.target.classList.contains('option-input')) {
//                 const optionItem = e.target.classList.contains('option-item')
//                     ? e.target
//                     : e.target.closest('.option-item');
//                 this.selectCorrectOption(optionItem);
//             }
//         });
//     }

//     addOptionField() {
//         const container = document.getElementById('optionsContainer');
//         const optionCount = container.children.length;

//         if (optionCount >= 6) {
//             this.showMessage('Maximum 6 options allowed', 'error');
//             return;
//         }

//         const optionItem = document.createElement('div');
//         optionItem.className = 'option-item';
//         optionItem.setAttribute('data-index', optionCount);

//         const letter = String.fromCharCode(65 + optionCount);
//         optionItem.innerHTML = `
//             <div class="option-checkbox"></div>
//             <input type="text" class="input option-input" placeholder="Option ${letter}" value="">
//             <div class="option-actions">
//                 <button type="button" class="remove-option">×</button>
//             </div>
//         `;

//         container.appendChild(optionItem);
//     }

//     selectCorrectOption(selectedOption) {
//         const optionsContainer = document.getElementById('optionsContainer');
//         const allOptions = optionsContainer.querySelectorAll('.option-item');

//         // Remove correct class from all options
//         allOptions.forEach(option => {
//             option.classList.remove('correct');
//         });

//         // Add correct class to selected option
//         selectedOption.classList.add('correct');

//         // Show visual feedback
//         this.showCorrectSelectionMessage();
//     }

//     showCorrectSelectionMessage() {
//         // Remove existing message
//         const existingMessage = document.querySelector('.correct-selection-message');
//         if (existingMessage) {
//             existingMessage.remove();
//         }

//         // Add new message
//         const messageDiv = document.createElement('div');
//         messageDiv.className = 'correct-selection-message';
//         messageDiv.innerHTML = '✅ Correct answer selected!';

//         const optionsContainer = document.getElementById('optionsContainer');
//         optionsContainer.parentNode.insertBefore(messageDiv, optionsContainer.nextSibling);

//         // Auto-remove message after 3 seconds
//         setTimeout(() => {
//             if (messageDiv.parentNode) {
//                 messageDiv.remove();
//             }
//         }, 3000);
//     }

//     removeOptionField(optionToRemove) {
//         const container = document.getElementById('optionsContainer');
//         const options = container.querySelectorAll('.option-item');

//         if (options.length <= 2) {
//             this.showMessage('Minimum 2 options required', 'error');
//             return;
//         }

//         // Remove the option
//         container.removeChild(optionToRemove);

//         // Re-index remaining options
//         this.reindexOptions();
//     }

//     reindexOptions() {
//         const container = document.getElementById('optionsContainer');
//         const options = container.querySelectorAll('.option-item');

//         options.forEach((option, index) => {
//             option.setAttribute('data-index', index);
//             const input = option.querySelector('.option-input');
//             const letter = String.fromCharCode(65 + index);
//             input.placeholder = `Option ${letter}`;
//         });
//     }

//     addQuestionToExam() {
//         const type = document.getElementById('newQuestionType').value;
//         const text = document.getElementById('newQuestionText').value.trim();
//         const score = document.getElementById('newQuestionScore').value;

//         if (!text) {
//             this.showMessage('Please enter question text', 'error');
//             return;
//         }

//         const questionData = {
//             text,
//             questionType: type,
//             score: parseInt(score) || 1
//         };

//         try {
//             if (type === 'multiple_choice') {
//                 const options = Array.from(document.querySelectorAll('.option-input'))
//                     .map(input => input.value.trim())
//                     .filter(value => value);

//                 if (options.length < 2) {
//                     this.showMessage('Please add at least 2 options', 'error');
//                     return;
//                 }

//                 // Find correct answer (using checkbox selection)
//                 const correctOption = document.querySelector('.option-item.correct');
//                 if (!correctOption) {
//                     throw new Error('Please select the correct answer by clicking on an option');
//                 }

//                 const correctIndex = parseInt(correctOption.getAttribute('data-index'));

//                 questionData.options = options;
//                 questionData.correctIndex = correctIndex;

//             } else if (type === 'true_false') {
//                 questionData.correctIndex = parseInt(document.getElementById('trueFalseAnswer').value);
//                 questionData.options = ['True', 'False'];

//             } else if (type === 'short_answer') {
//                 const correctAnswer = document.getElementById('correctAnswer').value.trim();
//                 if (!correctAnswer) {
//                     this.showMessage('Please enter the correct answer', 'error');
//                     return;
//                 }
//                 questionData.correctAnswer = correctAnswer;
//             }

//             // Add to current questions
//             this.currentQuestions.push(questionData);

//             // Clear form
//             this.clearQuestionForm();

//             // Re-render questions
//             this.renderQuestions(this.currentQuestions);

//             this.showMessage('Question added successfully!', 'success');

//         } catch (error) {
//             this.showMessage('Error adding question: ' + error.message, 'error');
//         }
//     }

//     clearQuestionForm() {
//         document.getElementById('newQuestionText').value = '';
//         document.getElementById('correctAnswer').value = '';
//         document.getElementById('newQuestionScore').value = '1';

//         // Reset options container
//         const optionsContainer = document.getElementById('optionsContainer');
//         optionsContainer.innerHTML = `
//             <div class="option-item" data-index="0">
//                 <div class="option-checkbox"></div>
//                 <input type="text" class="input option-input" placeholder="Option A" value="">
//                 <div class="option-actions">
//                     <button type="button" class="remove-option">×</button>
//                 </div>
//             </div>
//             <div class="option-item" data-index="1">
//                 <div class="option-checkbox"></div>
//                 <input type="text" class="input option-input" placeholder="Option B" value="">
//                 <div class="option-actions">
//                     <button type="button" class="remove-option">×</button>
//                 </div>
//             </div>
//         `;

//         // Re-attach event handlers
//         this.setupOptionSelectionHandlers();
//     }

//     async saveAllQuestions(examId) {
//         if (this.currentQuestions.length === 0) {
//             this.showMessage('No questions to save', 'error');
//             return;
//         }

//         try {
//             // Show loading
//             const saveBtn = document.getElementById('saveAllQuestions');
//             const originalText = saveBtn.textContent;
//             saveBtn.textContent = 'Saving...';
//             saveBtn.disabled = true;

//             console.log('Saving questions for exam:', examId);
//             console.log('Questions to save:', this.currentQuestions);

//             // Call API to save questions
//             let result;
//             try {
//                 result = await ApiService.addQuestionsToExam(examId, this.currentQuestions);
//                 this.showMessage(`✅ Saved ${this.currentQuestions.length} questions successfully!`, 'success');
//             } catch (error) {
//                 if (error.message.includes('Not Found')) {
//                     // If backend endpoint doesn't exist, save locally
//                     this.showMessage(`✅ Saved ${this.currentQuestions.length} questions locally!`, 'success');
//                     result = { success: true, local: true };
//                 } else {
//                     throw error;
//                 }
//             }

//             // Update the exam in local data
//             const examIndex = this.exams.findIndex(e => e._id === examId);
//             if (examIndex !== -1) {
//                 this.exams[examIndex].questions = [...this.currentQuestions];
//             }

//             // Reload dashboard to reflect changes
//             await this.loadDashboardData();

//             // Close modal after 2 seconds
//             setTimeout(() => {
//                 document.getElementById('questionsModal').style.display = 'none';
//                 this.renderRecentExams(); // Refresh the exam list

//                 // Show success message on dashboard
//                 const message = result.local
//                     ? `Exam "${this.currentExam.title}" updated with ${this.currentQuestions.length} questions (saved locally)!`
//                     : `Exam "${this.currentExam.title}" updated with ${this.currentQuestions.length} questions!`;
//                 this.showMessage(message, 'success');
//             }, 2000);

//         } catch (error) {
//             console.error('Error saving questions:', error);
//             this.showMessage('Error saving questions: ' + error.message, 'error');
//         } finally {
//             // Reset button
//             const saveBtn = document.getElementById('saveAllQuestions');
//             saveBtn.textContent = 'Save All Questions';
//             saveBtn.disabled = false;
//         }
//     }

//     editQuestion(index) {
//         const question = this.currentQuestions[index];

//         // Populate form with question data
//         document.getElementById('newQuestionType').value = question.questionType;
//         document.getElementById('newQuestionText').value = question.text;
//         document.getElementById('newQuestionScore').value = question.score;

//         // Trigger change event to show correct fields
//         document.getElementById('newQuestionType').dispatchEvent(new Event('change'));

//         if (question.questionType === 'multiple_choice') {
//             // Clear and repopulate options
//             const optionsContainer = document.getElementById('optionsContainer');
//             optionsContainer.innerHTML = '';

//             question.options.forEach((option, i) => {
//                 const optionItem = document.createElement('div');
//                 optionItem.className = 'option-item';
//                 optionItem.setAttribute('data-index', i);

//                 const isCorrect = i === question.correctIndex;
//                 if (isCorrect) {
//                     optionItem.classList.add('correct');
//                 }

//                 const letter = String.fromCharCode(65 + i);
//                 optionItem.innerHTML = `
//                     <div class="option-checkbox"></div>
//                     <input type="text" class="input option-input" placeholder="Option ${letter}" value="${option}">
//                     <div class="option-actions">
//                         <button type="button" class="remove-option">×</button>
//                     </div>
//                 `;
//                 optionsContainer.appendChild(optionItem);
//             });

//             // Re-attach event listeners
//             this.setupOptionSelectionHandlers();

//         } else if (question.questionType === 'true_false') {
//             document.getElementById('trueFalseAnswer').value = question.correctIndex.toString();
//         } else if (question.questionType === 'short_answer') {
//             document.getElementById('correctAnswer').value = question.correctAnswer || '';
//         }

//         // Remove the old question
//         this.currentQuestions.splice(index, 1);

//         // Re-render questions
//         this.renderQuestions(this.currentQuestions);

//         this.showMessage('Question loaded for editing. Make changes and click "Add Question".', 'info');
//     }

//     deleteQuestion(index) {
//         if (confirm('Are you sure you want to delete this question?')) {
//             this.currentQuestions.splice(index, 1);
//             this.renderQuestions(this.currentQuestions);
//             this.showMessage('Question deleted', 'success');
//         }
//     }

//     async deleteExam(examId) {
//         if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
//             return;
//         }

//         try {
//             const exam = this.exams.find(e => e._id === examId);
//             if (!exam) {
//                 this.showMessage('Exam not found', 'error');
//                 return;
//             }

//             // Show loading
//             this.showMessage('Deleting exam...', 'info');

//             // Call API to delete exam
//             await ApiService.deleteExam(examId);

//             // Remove from local data
//             this.exams = this.exams.filter(e => e._id !== examId);

//             // Update UI
//             this.updateDashboardStats();
//             this.renderRecentExams();
//             this.renderExamsView();

//             this.showMessage('Exam deleted successfully!', 'success');

//         } catch (error) {
//             console.error('Error deleting exam:', error);

//             if (error.message.includes('Not Found')) {
//                 // Fallback: Delete locally if backend endpoint not available
//                 this.exams = this.exams.filter(e => e._id !== examId);
//                 this.updateDashboardStats();
//                 this.renderRecentExams();
//                 this.renderExamsView();
//                 this.showMessage('Exam deleted locally. Backend endpoint not configured.', 'info');
//             } else {
//                 this.showMessage('Error deleting exam: ' + error.message, 'error');
//             }
//         }
//     }

//     async toggleExamStatus(examId) {
//         // Implementation for activating/deactivating exams
//         this.showMessage('Exam status toggle functionality coming soon', 'info');
//     }

//     // NAVIGATION METHODS
//     setupNavigation() {
//         const sidebarItems = document.querySelectorAll("#sidebarMenu .item");
//         const views = {
//             'dashboard': document.getElementById('view-dashboard'),
//             'exams': document.getElementById('view-exams'),
//             'students': document.getElementById('view-students'),
//             'grading': document.getElementById('view-grading'),
//             'reports': document.getElementById('view-reports'),
//             'settings': document.getElementById('view-settings')
//         };

//         sidebarItems.forEach((item) => {
//             item.addEventListener("click", () => {
//                 const view = item.dataset.view;
//                 this.setActiveView(view);
//             });
//         });

//         // Also handle the hamburger menu toggle
//         const hamburger = document.querySelector('.hamburger');
//         if (hamburger) {
//             hamburger.addEventListener('click', () => {
//                 this.toggleSidebar();
//             });
//         }
//     }

//     setActiveView(viewKey) {
//         // Reset active class
//         document.querySelectorAll('#sidebarMenu .item').forEach(it => {
//             it.classList.toggle('active', it.dataset.view === viewKey);
//         });

//         // Define views
//         const views = {
//             'dashboard': document.getElementById('view-dashboard'),
//             'exams': document.getElementById('view-exams'),
//             'students': document.getElementById('view-students'),
//             'grading': document.getElementById('view-grading'),
//             'reports': document.getElementById('view-reports'),
//             'settings': document.getElementById('view-settings')
//         };

//         // Show/hide views
//         Object.keys(views).forEach(k => {
//             if (views[k]) {
//                 views[k].style.display = (k === viewKey) ? '' : 'none';
//             }
//         });

//         // Load view-specific data
//         this.loadViewData(viewKey);
//     }

//     toggleSidebar() {
//         const sidebar = document.querySelector('.sidebar');
//         const main = document.querySelector('.main');

//         if (sidebar.style.display === 'none') {
//             sidebar.style.display = 'block';
//             main.style.marginLeft = '0';
//         } else {
//             sidebar.style.display = 'none';
//             main.style.marginLeft = '0';
//         }
//     }

//     async loadViewData(view) {
//         switch (view) {
//             case 'exams':
//                 await this.loadExamsView();
//                 break;
//             case 'students':
//                 await this.loadStudentsView();
//                 break;
//             case 'grading':
//                 await this.loadGradingView();
//                 break;
//             case 'reports':
//                 await this.loadReportsView();
//                 break;
//             case 'settings':
//                 await this.loadSettingsView();
//                 break;
//             default:
//                 // Dashboard view is already loaded
//                 break;
//         }
//     }

//     async loadExamsView() {
//         console.log('Loading exams view...');
//         this.renderExamsView();
//     }

//     renderExamsView() {
//         const container = document.getElementById('exams-table').querySelector('tbody');

//         if (this.exams.length === 0) {
//             container.innerHTML = `
//                 <tr>
//                     <td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">
//                         No exams created yet. Click "Create New Exam" to get started.
//                     </td>
//                 </tr>
//             `;
//             return;
//         }

//         container.innerHTML = this.exams.map(exam => `
//             <tr>
//                 <td><strong>${UIHelpers.escapeHtml(exam.title)}</strong></td>
//                 <td>${UIHelpers.escapeHtml(exam.description || 'No description')}</td>
//                 <td>${exam.questions?.length || 0}</td>
//                 <td>${exam.timeLimitMinutes} mins</td>
//                 <td>
//                     <span class="tag ${exam.isActive ? 'success' : 'warning'}">
//                         ${exam.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                 </td>
//                 <td>${exam.submissionCount || 0}</td>
//                 <td>
//                     <div style="display:flex;gap:4px;flex-wrap:wrap">
//                         <button class="btn small" onclick="tutorDashboard.viewExam('${exam._id}')">
//                             Questions
//                         </button>
//                         <button class="btn small secondary" onclick="tutorDashboard.toggleExamStatus('${exam._id}')">
//                             ${exam.isActive ? 'Deactivate' : 'Activate'}
//                         </button>
//                         <button class="btn small danger" onclick="tutorDashboard.deleteExam('${exam._id}')">
//                             Delete
//                         </button>
//                     </div>
//                 </td>
//             </tr>
//         `).join('');
//     }

//     async loadStudentsView() {
//         console.log('Loading students view...');
//         const container = document.getElementById('students-table').querySelector('tbody');

//         if (this.students.length === 0) {
//             container.innerHTML = `
//                 <tr>
//                     <td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
//                         No students found in your department.
//                     </td>
//                 </tr>
//             `;
//             return;
//         }

//         container.innerHTML = this.students.map(student => `
//             <tr>
//                 <td><strong>${UIHelpers.escapeHtml(student.name)}</strong></td>
//                 <td>${UIHelpers.escapeHtml(student.email)}</td>
//                 <td>${student.overallScore || 'N/A'}%</td>
//                 <td>${student.attendance || 'N/A'}%</td>
//                 <td>${student.lastActivity ? UIHelpers.formatDate(student.lastActivity) : 'Never'}</td>
//                 <td>
//                     <button class="btn small" onclick="tutorDashboard.viewStudentProfile('${student._id}')">
//                         View Profile
//                     </button>
//                 </td>
//             </tr>
//         `).join('');
//     }

//     async loadGradingView() {
//         console.log('Loading grading view...');
//         const selectExam = document.getElementById('selectExamForGrading');

//         // Populate exam dropdown
//         selectExam.innerHTML = '<option value="">Select Exam to Grade</option>' +
//             this.exams.map(exam => `
//                 <option value="${exam._id}">${UIHelpers.escapeHtml(exam.title)}</option>
//             `).join('');

//         // Add event listener for exam selection
//         selectExam.addEventListener('change', (e) => {
//             const examId = e.target.value;
//             if (examId) {
//                 this.loadExamSubmissions(examId);
//             } else {
//                 document.getElementById('noSubmissionsMessage').style.display = 'block';
//                 document.getElementById('submissionsList').style.display = 'none';
//             }
//         });
//     }

//     async loadReportsView() {
//         console.log('Loading reports view...');
//         const reportExam = document.getElementById('reportExam');

//         // Populate report exam dropdown
//         reportExam.innerHTML = '<option value="">Select Exam</option>' +
//             this.exams.map(exam => `
//                 <option value="${exam._id}">${UIHelpers.escapeHtml(exam.title)}</option>
//             `).join('');

//         // Add event listeners for report generation
//         document.getElementById('btnGenerateTutorReport').addEventListener('click', () => {
//             this.generateReport();
//         });

//         document.getElementById('btnExportTutorReport').addEventListener('click', () => {
//             this.exportReport();
//         });
//     }

//     async loadSettingsView() {
//         console.log('Loading settings view...');
//         // Settings are already populated in init()

//         // Add event listener for save preferences
//         document.querySelector('#view-settings .btn.small').addEventListener('click', () => {
//             this.savePreferences();
//         });
//     }

//     // Placeholder methods for other functionality
//     viewStudentProfile(studentId) {
//         this.showMessage('Student profile view coming soon', 'info');
//     }

//     loadExamSubmissions(examId) {
//         this.showMessage('Loading submissions for exam...', 'info');
//         // Implementation for loading submissions would go here
//     }

//     generateReport() {
//         const examId = document.getElementById('reportExam').value;
//         const reportType = document.getElementById('reportType').value;

//         if (!examId) {
//             this.showMessage('Please select an exam', 'error');
//             return;
//         }

//         this.showMessage(`Generating ${reportType} report...`, 'info');
//         // Implementation for report generation would go here
//     }

//     exportReport() {
//         this.showMessage('Export feature coming soon', 'info');
//     }

//     savePreferences() {
//         const notifyExamSubmissions = document.getElementById('notifyExamSubmissions').checked;
//         const notifyReminders = document.getElementById('notifyReminders').checked;
//         const notifySystemUpdates = document.getElementById('notifySystemUpdates').checked;

//         this.showMessage('Preferences saved successfully!', 'success');
//         // Implementation for saving preferences would go here
//     }

//     setupEventListeners() {
//         // Navigation
//         this.setupNavigation();

//         // Create exam buttons
//         document.getElementById('btnCreateExam').addEventListener('click', () => this.createExam());
//         document.getElementById('createExamBtn').addEventListener('click', () => this.createExam());
//         document.getElementById('quickCreateExam').addEventListener('click', () => this.createExam());
//         document.getElementById('createExamMain').addEventListener('click', () => this.createExam());

//         // Quick action buttons
//         document.getElementById('quickViewSubmissions').addEventListener('click', () => {
//             this.setActiveView('grading');
//         });

//         document.getElementById('quickGradePapers').addEventListener('click', () => {
//             this.setActiveView('grading');
//         });

//         // Modal close buttons
//         document.querySelectorAll('.close-modal').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 const modal = e.target.closest('.modal');
//                 if (modal) modal.style.display = 'none';
//             });
//         });

//         // Close modal when clicking outside
//         window.addEventListener('click', (e) => {
//             if (e.target.classList.contains('modal')) {
//                 e.target.style.display = 'none';
//             }
//         });

//         // Logout
//         document.querySelector('.logout-btn').addEventListener('click', () => AuthService.logout());

//         // Refresh buttons
//         document.getElementById('refreshExams').addEventListener('click', () => {
//             this.loadDashboardData().then(() => this.renderExamsView());
//         });

//         document.getElementById('refreshStudents').addEventListener('click', () => {
//             this.loadDashboardData().then(() => this.loadStudentsView());
//         });

//         document.getElementById('refreshSubmissions').addEventListener('click', () => {
//             const examId = document.getElementById('selectExamForGrading').value;
//             if (examId) {
//                 this.loadExamSubmissions(examId);
//             }
//         });
//     }

//     showMessage(message, type) {
//         const messageDiv = document.createElement('div');
//         messageDiv.textContent = message;
//         messageDiv.style.cssText = `
//             position: fixed;
//             top: 20px;
//             right: 20px;
//             padding: 12px 16px;
//             border-radius: 8px;
//             color: white;
//             font-weight: 600;
//             z-index: 10000;
//             background: ${type === 'error' ? '#e05b5b' : type === 'success' ? '#2fa46a' : '#4a90e2'};
//         `;

//         document.body.appendChild(messageDiv);

//         setTimeout(() => {
//             if (document.body.contains(messageDiv)) {
//                 document.body.removeChild(messageDiv);
//             }
//         }, 5000);
//     }

//     showError(message) {
//         this.showMessage(message, 'error');
//     }
// }

// // Initialize tutor dashboard with proper authentication check
// let tutorDashboard;
// document.addEventListener('DOMContentLoaded', async () => {
//     // Show loading immediately
//     const loadingElement = document.getElementById('initialLoading');
//     if (loadingElement) {
//         loadingElement.style.display = 'flex';
//     }

//     tutorDashboard = new TutorDashboard();
//     await tutorDashboard.init();

//     // Hide loading after init
//     if (loadingElement) {
//         loadingElement.style.display = 'none';
//     }
// });


class TutorDashboard {
    constructor() {
        this.exams = [];
        this.students = [];
        this.currentExam = null;
        this.currentQuestions = [];
        // Don't call init() here - wait for DOMContentLoaded
    }

    async init() {
        // Show loading state immediately
        this.showLoadingState();

        // Check authentication first
        const isAuthenticated = await AuthService.checkAuthAndRedirect();
        if (!isAuthenticated) {
            return;
        }

        const user = AuthService.getUser();
        if (user.role !== 'tutor') {
            window.location.href = 'index.html';
            return;
        }

        // Hide loading and show content
        this.hideLoadingState();

        // Set user info
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-info').textContent = user.name;
        document.querySelector('.user-role').textContent = user.role;
        document.getElementById('examDepartment').value = user.department;
        document.getElementById('departmentName').textContent = user.department;
        document.getElementById('tutorProfileName').value = user.name;
        document.getElementById('tutorProfileEmail').value = user.email;
        document.getElementById('tutorProfileDept').value = user.department;

        await this.loadDashboardData();
        this.setupEventListeners();
    }

    showLoadingState() {
        // Hide main content, show loading
        const mainContent = document.querySelector('.main');
        const loadingHTML = `
            <div class="loading-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--bg);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div class="loading-spinner" style="
                    text-align: center;
                    color: var(--accent);
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid var(--accent);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px;
                    "></div>
                    <p>Loading Tutor Dashboard...</p>
                </div>
            </div>
        `;

        if (mainContent) {
            mainContent.style.opacity = '0.3';
        }
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    hideLoadingState() {
        // Remove loading overlay, show content
        const loadingOverlay = document.querySelector('.loading-overlay');
        const mainContent = document.querySelector('.main');

        if (loadingOverlay) {
            loadingOverlay.remove();
        }
        if (mainContent) {
            mainContent.style.opacity = '1';
        }
    }

    async loadDashboardData() {
        try {
            console.log('Loading dashboard data...');

            // Only load exams and students, skip notifications for now
            const [exams, students] = await Promise.all([
                ApiService.getTutorExams().catch(error => {
                    console.warn('Failed to load exams:', error);
                    return []; // Return empty array if fails
                }),
                ApiService.getTutorStudents().catch(error => {
                    console.warn('Failed to load students:', error);
                    return []; // Return empty array if fails
                })
            ]);

            console.log('Loaded exams:', exams);
            console.log('Loaded students:', students);

            this.exams = exams;
            this.students = students;

            this.updateDashboardStats();
            this.renderRecentExams();
            this.renderRecentSubmissions();

            // Load notifications separately since it might not exist
            try {
                const notifications = await ApiService.getNotifications();
                this.renderNotifications(notifications);
            } catch (error) {
                console.warn('Notifications not available:', error);
                this.renderNotifications([]);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data: ' + error.message);
        }
    }

    updateDashboardStats() {
        const activeExams = this.exams.filter(exam => exam.isActive).length;
        const pendingSubmissions = this.exams.reduce((total, exam) => total + (exam.submissionCount || 0), 0);

        document.getElementById('stat-active-exams').textContent = activeExams;
        document.getElementById('stat-students').textContent = this.students.length;
        document.getElementById('stat-pending').textContent = pendingSubmissions;
        document.getElementById('deptTotalStudents').textContent = this.students.length;
        document.getElementById('deptActiveExams').textContent = activeExams;
    }

    renderRecentExams() {
        const container = document.getElementById('recent-exams-list');
        const recentExams = this.exams.slice(0, 5);

        if (recentExams.length === 0) {
            container.innerHTML = '<div class="empty-state">No exams created yet</div>';
            return;
        }

        container.innerHTML = recentExams.map(exam => `
            <div class="exam-preview">
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div>
                        <strong>${UIHelpers.escapeHtml(exam.title)}</strong>
                        <div style="font-size:12px;color:var(--muted);margin-top:4px">
                            ${UIHelpers.escapeHtml(exam.description || 'No description')}
                        </div>
                    </div>
                    <span class="tag ${exam.isActive ? 'success' : 'warning'}">
                        ${exam.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;color:var(--muted)">
                    <span>${exam.questions?.length || 0} questions</span>
                    <span>${exam.timeLimitMinutes} mins</span>
                    <span>${exam.submissionCount || 0} submissions</span>
                </div>
                <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap">
                    <button class="btn small" onclick="tutorDashboard.viewExam('${exam._id}')">
                        Manage Questions
                    </button>
                    <button class="btn small secondary" onclick="tutorDashboard.toggleExamStatus('${exam._id}')">
                        ${exam.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn small danger" onclick="tutorDashboard.deleteExam('${exam._id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderRecentSubmissions() {
        const container = document.getElementById('recent-submissions-list');
        const countElement = document.getElementById('recent-submissions-count');

        container.innerHTML = '<div class="empty-state">No submissions yet</div>';
        countElement.textContent = '0';
    }

    renderNotifications(notifications) {
        const container = document.getElementById('notificationsList');
        const unreadNotifications = notifications.filter(n => !n.read).slice(0, 5);

        if (unreadNotifications.length === 0) {
            container.innerHTML = '<div class="activity-item">No new notifications</div>';
            return;
        }

        container.innerHTML = unreadNotifications.map(notification => `
            <div class="activity-item ${!notification.read ? 'unread' : ''}">
                <div style="font-weight:600">${this.getNotificationTitle(notification)}</div>
                <div style="color:var(--muted);font-size:12px">
                    ${this.getNotificationMessage(notification)}
                </div>
                <div style="color:var(--muted);font-size:11px">
                    ${UIHelpers.formatDate(notification.sentAt)}
                </div>
            </div>
        `).join('');
    }

    getNotificationTitle(notification) {
        const types = {
            'admission': '🎓 Admission',
            'exam_reminder': '📝 Exam Reminder',
            'result': '📊 Results Ready',
            'submission': '📨 New Submission',
            'general': '💬 Notification'
        };
        return types[notification.type] || '💬 Notification';
    }

    getNotificationMessage(notification) {
        switch (notification.type) {
            case 'exam_reminder':
                return `Reminder: ${notification.payload.examTitle}`;
            case 'result':
                return `Results available: ${notification.payload.score}/${notification.payload.maxScore}`;
            case 'submission':
                return `New submission from student`;
            default:
                return notification.payload.message || 'New notification';
        }
    }

    async createExam() {
        const title = document.getElementById('examTitle').value.trim();
        const description = document.getElementById('examDescription').value.trim();
        const timeLimitMinutes = document.getElementById('examTimeLimit').value;
        const department = document.getElementById('examDepartment').value;

        if (!title || !timeLimitMinutes) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Show loading state
            const createBtn = document.getElementById('btnCreateExam');
            const originalText = createBtn.textContent;
            createBtn.textContent = 'Creating...';
            createBtn.disabled = true;

            const examData = {
                title,
                description,
                timeLimitMinutes: parseInt(timeLimitMinutes),
                department,
                questions: []
            };

            console.log('Creating exam with data:', examData);

            const result = await ApiService.createExam(examData);

            console.log('Exam creation response:', result);

            this.showMessage('Exam created successfully! Now add questions.', 'success');

            // Clear form
            document.getElementById('examTitle').value = '';
            document.getElementById('examDescription').value = '';
            document.getElementById('examTimeLimit').value = '60';

            // Reload dashboard data to get the updated exams list
            await this.loadDashboardData();

            // Find the newly created exam - handle different response formats
            let newExam;
            if (result.exam) {
                // If response has exam object
                newExam = result.exam;
            } else if (result._id) {
                // If response is the exam itself
                newExam = result;
            } else {
                // Fallback: find by title in the loaded exams
                newExam = this.exams.find(exam => exam.title === title);
            }

            if (newExam && newExam._id) {
                console.log('Found new exam:', newExam);
                // Open questions modal for the new exam after a short delay
                setTimeout(() => {
                    this.openQuestionsModal(newExam._id);
                }, 1500);
            } else {
                console.warn('New exam not found in response or local data');
                this.showMessage('Exam created! Please refresh the page and click "Manage Questions" to add questions.', 'success');
            }

        } catch (error) {
            console.error('Exam creation error:', error);
            this.showMessage('Error creating exam: ' + error.message, 'error');
        } finally {
            // Reset button state
            const createBtn = document.getElementById('btnCreateExam');
            createBtn.textContent = 'Create Exam';
            createBtn.disabled = false;
        }
    }

    async viewExam(examId) {
        this.openQuestionsModal(examId);
    }

    async openQuestionsModal(examId) {
        console.log('Opening questions modal for exam:', examId);

        const modal = document.getElementById('questionsModal');

        try {
            // Always try to fetch from API first
            let exam;
            try {
                exam = await ApiService.getExamById(examId);
            } catch (error) {
                console.warn('Could not fetch exam by ID, trying local data:', error);
                exam = this.exams.find(e => e._id === examId);
            }

            if (!exam) {
                this.showMessage('Exam not found. The exam was created but may need a page refresh.', 'error');
                return;
            }

            this.currentExam = exam;
            this.currentQuestions = exam.questions || [];

            document.querySelector('#questionsModal h3').textContent = `Manage Questions: ${exam.title}`;

            this.renderQuestions(this.currentQuestions);
            this.setupQuestionFormHandlers(examId);

            modal.style.display = 'block';

        } catch (error) {
            console.error('Error opening questions modal:', error);
            this.showMessage('Error loading exam. Please refresh the page and try again.', 'error');
        }
    }

    renderQuestions(questions) {
        const container = document.getElementById('questionsContainer');

        if (questions.length === 0) {
            container.innerHTML = '<div class="empty-state">No questions added yet. Add your first question below.</div>';
            return;
        }

        container.innerHTML = questions.map((question, index) => `
            <div class="question-item" style="margin-bottom:15px;padding:15px;border:1px solid #e6d9b4;border-radius:8px;background:white;">
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div style="flex:1">
                        <strong>Q${index + 1}:</strong> ${UIHelpers.escapeHtml(question.text)}
                        <div style="font-size:12px;color:var(--muted);margin-top:4px">
                            Type: ${question.questionType} | Score: ${question.score}
                        </div>
                        ${question.questionType === 'multiple_choice' ? `
                            <div style="font-size:11px;margin-top:4px">
                                Options: 
                                ${question.options.map((opt, i) => `
                                    <span style="color: ${i === question.correctIndex ? '#2fa46a' : '#666'}">
                                        ${String.fromCharCode(65 + i)}. ${UIHelpers.escapeHtml(opt)}
                                        ${i === question.correctIndex ? ' ✓' : ''}
                                    </span>
                                `).join(', ')}
                            </div>
                        ` : ''}
                        ${question.questionType === 'true_false' ? `
                            <div style="font-size:11px;margin-top:4px">
                                Correct Answer: ${question.correctIndex === 1 ? 'True' : 'False'}
                            </div>
                        ` : ''}
                        ${question.questionType === 'short_answer' ? `
                            <div style="font-size:11px;margin-top:4px">
                                Correct Answer: ${UIHelpers.escapeHtml(question.correctAnswer)}
                            </div>
                        ` : ''}
                    </div>
                    <div style="display:flex;gap:4px">
                        <button class="btn small secondary" onclick="tutorDashboard.editQuestion(${index})">Edit</button>
                        <button class="btn small danger" onclick="tutorDashboard.deleteQuestion(${index})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupQuestionFormHandlers(examId) {
        const questionTypeSelect = document.getElementById('newQuestionType');
        const addQuestionBtn = document.getElementById('addQuestion');
        const addOptionBtn = document.getElementById('addOption');
        const saveAllBtn = document.getElementById('saveAllQuestions');

        // Show/hide options based on question type
        questionTypeSelect.addEventListener('change', function () {
            const type = this.value;
            document.getElementById('multipleChoiceOptions').style.display =
                type === 'multiple_choice' ? 'block' : 'none';
            document.getElementById('shortAnswerOption').style.display =
                type === 'short_answer' ? 'block' : 'none';
            document.getElementById('trueFalseOptions').style.display =
                type === 'true_false' ? 'block' : 'none';
        });

        // Add option for multiple choice
        addOptionBtn.addEventListener('click', () => {
            this.addOptionField();
        });

        // Add question
        addQuestionBtn.addEventListener('click', () => {
            this.addQuestionToExam();
        });

        // Save all questions
        saveAllBtn.addEventListener('click', () => {
            this.saveAllQuestions(examId);
        });

        // Initialize option selection handlers
        this.setupOptionSelectionHandlers();

        // Initialize with multiple choice visible
        document.getElementById('multipleChoiceOptions').style.display = 'block';
    }

    setupOptionSelectionHandlers() {
        const optionsContainer = document.getElementById('optionsContainer');

        // Delegate click events for option selection
        optionsContainer.addEventListener('click', (e) => {
            // Handle checkbox click
            if (e.target.classList.contains('option-checkbox')) {
                this.selectCorrectOption(e.target.closest('.option-item'));
            }

            // Handle remove button click
            if (e.target.classList.contains('remove-option')) {
                this.removeOptionField(e.target.closest('.option-item'));
            }
        });

        // Handle option item click (for better UX)
        optionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-item') ||
                e.target.classList.contains('option-input')) {
                const optionItem = e.target.classList.contains('option-item')
                    ? e.target
                    : e.target.closest('.option-item');
                this.selectCorrectOption(optionItem);
            }
        });
    }

    addOptionField() {
        const container = document.getElementById('optionsContainer');
        const optionCount = container.children.length;

        if (optionCount >= 6) {
            this.showMessage('Maximum 6 options allowed', 'error');
            return;
        }

        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        optionItem.setAttribute('data-index', optionCount);

        const letter = String.fromCharCode(65 + optionCount);
        optionItem.innerHTML = `
            <div class="option-checkbox"></div>
            <input type="text" class="input option-input" placeholder="Option ${letter}" value="">
            <div class="option-actions">
                <button type="button" class="remove-option">×</button>
            </div>
        `;

        container.appendChild(optionItem);
    }

    selectCorrectOption(selectedOption) {
        const optionsContainer = document.getElementById('optionsContainer');
        const allOptions = optionsContainer.querySelectorAll('.option-item');

        // Remove correct class from all options
        allOptions.forEach(option => {
            option.classList.remove('correct');
        });

        // Add correct class to selected option
        selectedOption.classList.add('correct');

        // Show visual feedback
        this.showCorrectSelectionMessage();
    }

    showCorrectSelectionMessage() {
        // Remove existing message
        const existingMessage = document.querySelector('.correct-selection-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Add new message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'correct-selection-message';
        messageDiv.innerHTML = '✅ Correct answer selected!';

        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.parentNode.insertBefore(messageDiv, optionsContainer.nextSibling);

        // Auto-remove message after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    removeOptionField(optionToRemove) {
        const container = document.getElementById('optionsContainer');
        const options = container.querySelectorAll('.option-item');

        if (options.length <= 2) {
            this.showMessage('Minimum 2 options required', 'error');
            return;
        }

        // Remove the option
        container.removeChild(optionToRemove);

        // Re-index remaining options
        this.reindexOptions();
    }

    reindexOptions() {
        const container = document.getElementById('optionsContainer');
        const options = container.querySelectorAll('.option-item');

        options.forEach((option, index) => {
            option.setAttribute('data-index', index);
            const input = option.querySelector('.option-input');
            const letter = String.fromCharCode(65 + index);
            input.placeholder = `Option ${letter}`;
        });
    }

    addQuestionToExam() {
        const type = document.getElementById('newQuestionType').value;
        const text = document.getElementById('newQuestionText').value.trim();
        const score = document.getElementById('newQuestionScore').value;

        if (!text) {
            this.showMessage('Please enter question text', 'error');
            return;
        }

        const questionData = {
            text,
            questionType: type,
            score: parseInt(score) || 1
        };

        try {
            if (type === 'multiple_choice') {
                const options = Array.from(document.querySelectorAll('.option-input'))
                    .map(input => input.value.trim())
                    .filter(value => value);

                if (options.length < 2) {
                    this.showMessage('Please add at least 2 options', 'error');
                    return;
                }

                // Find correct answer (using checkbox selection)
                const correctOption = document.querySelector('.option-item.correct');
                if (!correctOption) {
                    throw new Error('Please select the correct answer by clicking on an option');
                }

                const correctIndex = parseInt(correctOption.getAttribute('data-index'));

                questionData.options = options;
                questionData.correctIndex = correctIndex;

            } else if (type === 'true_false') {
                questionData.correctIndex = parseInt(document.getElementById('trueFalseAnswer').value);
                questionData.options = ['True', 'False'];

            } else if (type === 'short_answer') {
                const correctAnswer = document.getElementById('correctAnswer').value.trim();
                if (!correctAnswer) {
                    this.showMessage('Please enter the correct answer', 'error');
                    return;
                }
                questionData.correctAnswer = correctAnswer;
            }

            // Add to current questions
            this.currentQuestions.push(questionData);

            // Clear form
            this.clearQuestionForm();

            // Re-render questions
            this.renderQuestions(this.currentQuestions);

            this.showMessage('Question added successfully!', 'success');

        } catch (error) {
            this.showMessage('Error adding question: ' + error.message, 'error');
        }
    }

    clearQuestionForm() {
        document.getElementById('newQuestionText').value = '';
        document.getElementById('correctAnswer').value = '';
        document.getElementById('newQuestionScore').value = '1';

        // Reset options container
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = `
            <div class="option-item" data-index="0">
                <div class="option-checkbox"></div>
                <input type="text" class="input option-input" placeholder="Option A" value="">
                <div class="option-actions">
                    <button type="button" class="remove-option">×</button>
                </div>
            </div>
            <div class="option-item" data-index="1">
                <div class="option-checkbox"></div>
                <input type="text" class="input option-input" placeholder="Option B" value="">
                <div class="option-actions">
                    <button type="button" class="remove-option">×</button>
                </div>
            </div>
        `;

        // Re-attach event handlers
        this.setupOptionSelectionHandlers();
    }

    async saveAllQuestions(examId) {
        if (this.currentQuestions.length === 0) {
            this.showMessage('No questions to save', 'error');
            return;
        }

        try {
            // Show loading
            const saveBtn = document.getElementById('saveAllQuestions');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            console.log('Saving questions for exam:', examId);
            console.log('Questions to save:', this.currentQuestions);

            // Call API to save questions
            let result;
            try {
                result = await ApiService.addQuestionsToExam(examId, this.currentQuestions);
                this.showMessage(`✅ Saved ${this.currentQuestions.length} questions successfully!`, 'success');
            } catch (error) {
                if (error.message.includes('Not Found')) {
                    // If backend endpoint doesn't exist, save locally
                    this.showMessage(`✅ Saved ${this.currentQuestions.length} questions locally!`, 'success');
                    result = { success: true, local: true };
                } else {
                    throw error;
                }
            }

            // Update the exam in local data
            const examIndex = this.exams.findIndex(e => e._id === examId);
            if (examIndex !== -1) {
                this.exams[examIndex].questions = [...this.currentQuestions];
            }

            // Reload dashboard to reflect changes
            await this.loadDashboardData();

            // Close modal after 2 seconds
            setTimeout(() => {
                document.getElementById('questionsModal').style.display = 'none';
                this.renderRecentExams(); // Refresh the exam list

                // Show success message on dashboard
                const message = result.local
                    ? `Exam "${this.currentExam.title}" updated with ${this.currentQuestions.length} questions (saved locally)!`
                    : `Exam "${this.currentExam.title}" updated with ${this.currentQuestions.length} questions!`;
                this.showMessage(message, 'success');
            }, 2000);

        } catch (error) {
            console.error('Error saving questions:', error);
            this.showMessage('Error saving questions: ' + error.message, 'error');
        } finally {
            // Reset button
            const saveBtn = document.getElementById('saveAllQuestions');
            saveBtn.textContent = 'Save All Questions';
            saveBtn.disabled = false;
        }
    }

    editQuestion(index) {
        const question = this.currentQuestions[index];

        // Populate form with question data
        document.getElementById('newQuestionType').value = question.questionType;
        document.getElementById('newQuestionText').value = question.text;
        document.getElementById('newQuestionScore').value = question.score;

        // Trigger change event to show correct fields
        document.getElementById('newQuestionType').dispatchEvent(new Event('change'));

        if (question.questionType === 'multiple_choice') {
            // Clear and repopulate options
            const optionsContainer = document.getElementById('optionsContainer');
            optionsContainer.innerHTML = '';

            question.options.forEach((option, i) => {
                const optionItem = document.createElement('div');
                optionItem.className = 'option-item';
                optionItem.setAttribute('data-index', i);

                const isCorrect = i === question.correctIndex;
                if (isCorrect) {
                    optionItem.classList.add('correct');
                }

                const letter = String.fromCharCode(65 + i);
                optionItem.innerHTML = `
                    <div class="option-checkbox"></div>
                    <input type="text" class="input option-input" placeholder="Option ${letter}" value="${option}">
                    <div class="option-actions">
                        <button type="button" class="remove-option">×</button>
                    </div>
                `;
                optionsContainer.appendChild(optionItem);
            });

            // Re-attach event listeners
            this.setupOptionSelectionHandlers();

        } else if (question.questionType === 'true_false') {
            document.getElementById('trueFalseAnswer').value = question.correctIndex.toString();
        } else if (question.questionType === 'short_answer') {
            document.getElementById('correctAnswer').value = question.correctAnswer || '';
        }

        // Remove the old question
        this.currentQuestions.splice(index, 1);

        // Re-render questions
        this.renderQuestions(this.currentQuestions);

        this.showMessage('Question loaded for editing. Make changes and click "Add Question".', 'info');
    }

    deleteQuestion(index) {
        if (confirm('Are you sure you want to delete this question?')) {
            this.currentQuestions.splice(index, 1);
            this.renderQuestions(this.currentQuestions);
            this.showMessage('Question deleted', 'success');
        }
    }

    async deleteExam(examId) {
        if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
            return;
        }

        try {
            const exam = this.exams.find(e => e._id === examId);
            if (!exam) {
                this.showMessage('Exam not found', 'error');
                return;
            }

            // Show loading
            this.showMessage('Deleting exam...', 'info');

            // Call API to delete exam
            await ApiService.deleteExam(examId);

            // Remove from local data
            this.exams = this.exams.filter(e => e._id !== examId);

            // Update UI
            this.updateDashboardStats();
            this.renderRecentExams();
            this.renderExamsView();

            this.showMessage('Exam deleted successfully!', 'success');

        } catch (error) {
            console.error('Error deleting exam:', error);

            if (error.message.includes('Not Found')) {
                // Fallback: Delete locally if backend endpoint not available
                this.exams = this.exams.filter(e => e._id !== examId);
                this.updateDashboardStats();
                this.renderRecentExams();
                this.renderExamsView();
                this.showMessage('Exam deleted locally. Backend endpoint not configured.', 'info');
            } else {
                this.showMessage('Error deleting exam: ' + error.message, 'error');
            }
        }
    }

    // Show modal for updating student scores
    async showStudentScoresModal(studentId) {
        try {
            const student = this.students.find(s => s._id === studentId);
            if (!student) {
                this.showMessage('Student not found', 'error');
                return;
            }

            // Get current grade details
            const gradeDetails = await ApiService.getStudentGradeDetails(studentId);

            // Create modal
            let modal = document.getElementById('studentScoresModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'studentScoresModal';
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
                        margin: 5% auto;
                        padding: 25px;
                        border-radius: 10px;
                        width: 500px;
                        max-width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                    ">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                            <h3 style="margin:0;color:#2b3949;">Update Student Scores</h3>
                            <span class="close-modal" style="font-size:24px;cursor:pointer;color:#666">&times;</span>
                        </div>
                        <div id="studentScoresContent"></div>
                    </div>
                `;
                document.body.appendChild(modal);

                // Add close event
                modal.querySelector('.close-modal').addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }

            // Populate modal content
            const content = document.getElementById('studentScoresContent');
            content.innerHTML = `
                <div style="margin-bottom:20px;">
                    <strong>Student:</strong> ${UIHelpers.escapeHtml(student.name)}
                </div>
                
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;">Attendance Score (%)</label>
                    <input type="number" id="attendanceScoreInput" min="0" max="100" value="${gradeDetails.attendanceScore || 0}" 
                        style="width:100%;padding:10px;border:1px solid #ddd;border-radius:5px;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;">Project Score (%)</label>
                    <input type="number" id="projectScoreInput" min="0" max="100" value="${gradeDetails.projectScore || 0}" 
                        style="width:100%;padding:10px;border:1px solid #ddd;border-radius:5px;">
                </div>
                
                <div style="background:#f8f9fa;padding:15px;border-radius:5px;margin-bottom:20px;">
                    <strong>Current Overall Score: ${gradeDetails.overallScore?.toFixed(1) || 0}%</strong>
                </div>
                
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button class="btn secondary" onclick="document.getElementById('studentScoresModal').style.display='none'">
                        Cancel
                    </button>
                    <button class="btn" onclick="tutorDashboard.updateStudentScores('${studentId}')">
                        Update Scores
                    </button>
                </div>
            `;

            modal.style.display = 'block';

        } catch (error) {
            console.error('Error loading student scores:', error);
            this.showMessage('Error loading student scores: ' + error.message, 'error');
        }
    }

    // Update student scores
    async updateStudentScores(studentId) {
        try {
            const attendanceScore = parseFloat(document.getElementById('attendanceScoreInput').value);
            const projectScore = parseFloat(document.getElementById('projectScoreInput').value);

            if (isNaN(attendanceScore) || isNaN(projectScore)) {
                this.showMessage('Please enter valid scores', 'error');
                return;
            }

            if (attendanceScore < 0 || attendanceScore > 100 || projectScore < 0 || projectScore > 100) {
                this.showMessage('Scores must be between 0 and 100', 'error');
                return;
            }

            // Update both scores
            await Promise.all([
                ApiService.updateStudentAttendance(studentId, attendanceScore),
                ApiService.updateStudentProjectScore(studentId, projectScore)
            ]);

            this.showMessage('Student scores updated successfully!', 'success');
            document.getElementById('studentScoresModal').style.display = 'none';

            // Refresh students data
            await this.loadDashboardData();

        } catch (error) {
            console.error('Error updating student scores:', error);
            this.showMessage('Error updating scores: ' + error.message, 'error');
        }
    }

    // toggleExamStatus function
    async toggleExamStatus(examId) {
        try {
            const exam = this.exams.find(e => e._id === examId);
            if (!exam) {
                this.showMessage('Exam not found', 'error');
                return;
            }

            const newStatus = !exam.isActive;

            console.log(`Toggling exam ${examId} to ${newStatus ? 'active' : 'inactive'}`);

            // Call API to toggle status
            const result = await ApiService.toggleExamStatus(examId, newStatus);

            // Update local data with the exam from response
            const updatedExam = result.exam;
            const examIndex = this.exams.findIndex(e => e._id === examId);
            if (examIndex !== -1) {
                this.exams[examIndex] = updatedExam;
            }

            // Update UI
            this.updateDashboardStats();
            this.renderRecentExams();
            this.renderExamsView();

            this.showMessage(`Exam ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');

        } catch (error) {
            console.error('Error toggling exam status:', error);

            // Fallback: Update locally if API fails
            if (error.message.includes('Not Found') || error.message.includes('Failed to update')) {
                const exam = this.exams.find(e => e._id === examId);
                if (exam) {
                    exam.isActive = !exam.isActive;
                    this.updateDashboardStats();
                    this.renderRecentExams();
                    this.renderExamsView();
                    this.showMessage(`Exam ${exam.isActive ? 'activated' : 'deactivated'} locally! (Backend not configured)`, 'info');
                }
            } else {
                this.showMessage('Error updating exam status: ' + error.message, 'error');
            }
        }
    }

    // NAVIGATION METHODS
    setupNavigation() {
        const sidebarItems = document.querySelectorAll("#sidebarMenu .item");
        const views = {
            'dashboard': document.getElementById('view-dashboard'),
            'exams': document.getElementById('view-exams'),
            'students': document.getElementById('view-students'),
            'grading': document.getElementById('view-grading'),
            'reports': document.getElementById('view-reports'),
            'settings': document.getElementById('view-settings')
        };

        sidebarItems.forEach((item) => {
            item.addEventListener("click", () => {
                const view = item.dataset.view;
                this.setActiveView(view);
            });
        });

        // Also handle the hamburger menu toggle
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    }

    setActiveView(viewKey) {
        // Reset active class
        document.querySelectorAll('#sidebarMenu .item').forEach(it => {
            it.classList.toggle('active', it.dataset.view === viewKey);
        });

        // Define views
        const views = {
            'dashboard': document.getElementById('view-dashboard'),
            'exams': document.getElementById('view-exams'),
            'students': document.getElementById('view-students'),
            'grading': document.getElementById('view-grading'),
            'reports': document.getElementById('view-reports'),
            'settings': document.getElementById('view-settings')
        };

        // Show/hide views
        Object.keys(views).forEach(k => {
            if (views[k]) {
                views[k].style.display = (k === viewKey) ? '' : 'none';
            }
        });

        // Load view-specific data
        this.loadViewData(viewKey);
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const main = document.querySelector('.main');

        if (sidebar.style.display === 'none') {
            sidebar.style.display = 'block';
            main.style.marginLeft = '0';
        } else {
            sidebar.style.display = 'none';
            main.style.marginLeft = '0';
        }
    }

    async loadViewData(view) {
        switch (view) {
            case 'exams':
                await this.loadExamsView();
                break;
            case 'students':
                await this.loadStudentsView();
                break;
            case 'grading':
                await this.loadGradingView();
                break;
            case 'reports':
                await this.loadReportsView();
                break;
            case 'settings':
                await this.loadSettingsView();
                break;
            default:
                // Dashboard view is already loaded
                break;
        }
    }

    async loadExamsView() {
        console.log('Loading exams view...');
        this.renderExamsView();
    }

    renderExamsView() {
        const container = document.getElementById('exams-table').querySelector('tbody');

        if (this.exams.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">
                        No exams created yet. Click "Create New Exam" to get started.
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = this.exams.map(exam => `
            <tr>
                <td><strong>${UIHelpers.escapeHtml(exam.title)}</strong></td>
                <td>${UIHelpers.escapeHtml(exam.description || 'No description')}</td>
                <td>${exam.questions?.length || 0}</td>
                <td>${exam.timeLimitMinutes} mins</td>
                <td>
                    <span class="tag ${exam.isActive ? 'success' : 'warning'}">
                        ${exam.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${exam.submissionCount || 0}</td>
                <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                        <button class="btn small" onclick="tutorDashboard.viewExam('${exam._id}')">
                            Questions
                        </button>
                        <button class="btn small secondary" onclick="tutorDashboard.toggleExamStatus('${exam._id}')">
                            ${exam.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn small danger" onclick="tutorDashboard.deleteExam('${exam._id}')">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadStudentsView() {
        console.log('Loading students view...');
        const container = document.getElementById('students-table').querySelector('tbody');

        if (this.students.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">
                        No students found in your department.
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = this.students.map(student => `
            <tr>
                <td><strong>${UIHelpers.escapeHtml(student.name)}</strong></td>
                <td>${UIHelpers.escapeHtml(student.email)}</td>
                <td>${student.overallScore || 'N/A'}%</td>
                <td>${student.attendance || 'N/A'}%</td>
                <td>${student.lastActivity ? UIHelpers.formatDate(student.lastActivity) : 'Never'}</td>
                <td>
                    <div style="display:flex;gap:4px">
                        <button class="btn small" onclick="tutorDashboard.showStudentScoresModal('${student._id}')">
                            Edit Scores
                        </button>
                        <button class="btn small secondary" onclick="tutorDashboard.viewStudentProfile('${student._id}')">
                            Profile
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadGradingView() {
        console.log('Loading grading view...');
        const selectExam = document.getElementById('selectExamForGrading');

        // Populate exam dropdown
        selectExam.innerHTML = '<option value="">Select Exam to Grade</option>' +
            this.exams.map(exam => `
                <option value="${exam._id}">${UIHelpers.escapeHtml(exam.title)}</option>
            `).join('');

        // Add event listener for exam selection
        selectExam.addEventListener('change', (e) => {
            const examId = e.target.value;
            if (examId) {
                this.loadExamSubmissions(examId);
            } else {
                document.getElementById('noSubmissionsMessage').style.display = 'block';
                document.getElementById('submissionsList').style.display = 'none';
            }
        });
    }

    async loadReportsView() {
        console.log('Loading reports view...');
        const reportExam = document.getElementById('reportExam');

        // Populate report exam dropdown
        reportExam.innerHTML = '<option value="">Select Exam</option>' +
            this.exams.map(exam => `
                <option value="${exam._id}">${UIHelpers.escapeHtml(exam.title)}</option>
            `).join('');

        // Add event listeners for report generation
        document.getElementById('btnGenerateTutorReport').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('btnExportTutorReport').addEventListener('click', () => {
            this.exportReport();
        });
    }

    async loadSettingsView() {
        console.log('Loading settings view...');
        // Settings are already populated in init()

        // Add event listener for save preferences
        document.querySelector('#view-settings .btn.small').addEventListener('click', () => {
            this.savePreferences();
        });
    }

    // Placeholder methods for other functionality
    viewStudentProfile(studentId) {
        this.showMessage('Student profile view coming soon', 'info');
    }

    loadExamSubmissions(examId) {
        this.showMessage('Loading submissions for exam...', 'info');
        // Implementation for loading submissions would go here
    }

    generateReport() {
        const examId = document.getElementById('reportExam').value;
        const reportType = document.getElementById('reportType').value;

        if (!examId) {
            this.showMessage('Please select an exam', 'error');
            return;
        }

        this.showMessage(`Generating ${reportType} report...`, 'info');
        // Implementation for report generation would go here
    }

    exportReport() {
        this.showMessage('Export feature coming soon', 'info');
    }

    savePreferences() {
        const notifyExamSubmissions = document.getElementById('notifyExamSubmissions').checked;
        const notifyReminders = document.getElementById('notifyReminders').checked;
        const notifySystemUpdates = document.getElementById('notifySystemUpdates').checked;

        this.showMessage('Preferences saved successfully!', 'success');
        // Implementation for saving preferences would go here
    }

    setupEventListeners() {
        // Navigation
        this.setupNavigation();

        // Create exam buttons
        document.getElementById('btnCreateExam').addEventListener('click', () => this.createExam());
        document.getElementById('createExamBtn').addEventListener('click', () => this.createExam());
        document.getElementById('quickCreateExam').addEventListener('click', () => this.createExam());
        document.getElementById('createExamMain').addEventListener('click', () => this.createExam());

        // Quick action buttons
        document.getElementById('quickViewSubmissions').addEventListener('click', () => {
            this.setActiveView('grading');
        });

        document.getElementById('quickGradePapers').addEventListener('click', () => {
            this.setActiveView('grading');
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Logout
        document.querySelector('.logout-btn').addEventListener('click', () => AuthService.logout());

        // Refresh buttons
        document.getElementById('refreshExams').addEventListener('click', () => {
            this.loadDashboardData().then(() => this.renderExamsView());
        });

        document.getElementById('refreshStudents').addEventListener('click', () => {
            this.loadDashboardData().then(() => this.loadStudentsView());
        });

        document.getElementById('refreshSubmissions').addEventListener('click', () => {
            const examId = document.getElementById('selectExamForGrading').value;
            if (examId) {
                this.loadExamSubmissions(examId);
            }
        });
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            background: ${type === 'error' ? '#e05b5b' : type === 'success' ? '#2fa46a' : '#4a90e2'};
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 5000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize tutor dashboard with proper authentication check
let tutorDashboard;
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading immediately
    const loadingElement = document.getElementById('initialLoading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }

    tutorDashboard = new TutorDashboard();
    await tutorDashboard.init();

    // Hide loading after init
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
});