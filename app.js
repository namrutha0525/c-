// Application Data and State Management
class DocumentSystem {
    constructor() {
        this.documents = [];
        this.queries = [];
        this.currentQuery = null;
        this.fileTypes = {
            "PDF": { icon: "📄", color: "#dc2626", extensions: [".pdf"] },
            "DOCX": { icon: "📝", color: "#2563eb", extensions: [".docx", ".doc"] }
        };
        this.statusColors = {
            "ready": "#10b981",
            "processing": "#f59e0b", 
            "error": "#ef4444",
            "uploaded": "#6b7280"
        };
        
        this.init();
    }

    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.renderDocuments();
        this.renderQueries();
        this.populateDocumentSelectors();
        this.renderRecentQuestions();
    }

    loadSampleData() {
        // Load sample documents
        this.documents = [
            {
                id: "doc_001",
                name: "Employment_Contract_2024.pdf",
                size: "2.3 MB",
                type: "PDF",
                uploadDate: "2024-08-01T10:30:00Z",
                status: "ready",
                clauses: 45,
                pages: 12
            },
            {
                id: "doc_002", 
                name: "Privacy_Policy_Update.docx",
                size: "1.8 MB",
                type: "DOCX",
                uploadDate: "2024-07-30T14:15:00Z",
                status: "processing",
                clauses: 32,
                pages: 8
            },
            {
                id: "doc_003",
                name: "Service_Agreement_Draft.pdf", 
                size: "3.1 MB",
                type: "PDF", 
                uploadDate: "2024-07-28T09:45:00Z",
                status: "ready",
                clauses: 67,
                pages: 18
            }
        ];

        // Load sample queries
        this.queries = [
            {
                id: "query_001",
                documentId: "doc_001",
                documentName: "Employment_Contract_2024.pdf",
                question: "What are the termination conditions in this contract?",
                timestamp: "2024-08-01T11:00:00Z",
                status: "completed",
                answer: "The contract can be terminated under three conditions: (1) By either party with 30 days written notice, (2) Immediately for cause including breach of confidentiality or misconduct, (3) Upon mutual agreement of both parties.",
                sourceClauses: [
                    {
                        text: "Either party may terminate this agreement by providing thirty (30) days written notice to the other party.",
                        page: 8,
                        similarity: 0.94,
                        clauseId: "cl_term_001"
                    },
                    {
                        text: "This agreement may be terminated immediately by the Company in case of Employee's material breach of duties or confidentiality obligations.",
                        page: 8, 
                        similarity: 0.89,
                        clauseId: "cl_term_002"
                    }
                ],
                confidence: 0.92
            },
            {
                id: "query_002",
                documentId: "doc_003",
                documentName: "Service_Agreement_Draft.pdf",
                question: "What are the payment terms and late fees?",
                timestamp: "2024-07-29T16:20:00Z",
                status: "completed",
                answer: "Payment is due within 30 days of invoice date. Late payments incur a 1.5% monthly fee on the outstanding balance. Services may be suspended after 60 days of non-payment.",
                sourceClauses: [
                    {
                        text: "Client shall pay all invoices within thirty (30) days from the invoice date. Late payments shall incur a service charge of 1.5% per month.",
                        page: 5,
                        similarity: 0.96,
                        clauseId: "cl_pay_001"
                    },
                    {
                        text: "Provider reserves the right to suspend services if payment is not received within sixty (60) days of the due date.",
                        page: 5,
                        similarity: 0.88,
                        clauseId: "cl_pay_002"
                    }
                ],
                confidence: 0.94
            },
            {
                id: "query_003",
                documentId: "doc_001", 
                documentName: "Employment_Contract_2024.pdf",
                question: "What are the vacation and leave policies?",
                timestamp: "2024-07-28T13:45:00Z",
                status: "completed",
                answer: "Employees are entitled to 20 vacation days annually, accrued monthly. Sick leave is 10 days per year. Additional unpaid leave may be granted with manager approval.",
                sourceClauses: [
                    {
                        text: "Employee shall be entitled to twenty (20) vacation days per calendar year, accrued at a rate of 1.67 days per month.",
                        page: 6,
                        similarity: 0.93,
                        clauseId: "cl_leave_001"
                    },
                    {
                        text: "Employee is entitled to ten (10) sick leave days per year. Additional unpaid personal leave may be granted at management discretion.",
                        page: 6,
                        similarity: 0.87,
                        clauseId: "cl_leave_002"
                    }
                ],
                confidence: 0.90
            }
        ];
    }

    setupEventListeners() {
        // Tab navigation - Fixed to properly handle tab switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // File upload
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const browseBtn = document.getElementById('browse-btn');

        // Fixed browse button functionality
        browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));

        // Fixed drag and drop event handling
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only remove dragover if we're leaving the upload zone entirely
            if (!uploadZone.contains(e.relatedTarget)) {
                uploadZone.classList.remove('dragover');
            }
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        // Click handler for upload zone
        uploadZone.addEventListener('click', (e) => {
            // Only trigger file input if clicking on the zone itself or the browse button
            if (e.target === uploadZone || e.target.closest('.upload-content')) {
                if (e.target !== browseBtn && !e.target.closest('#browse-btn')) {
                    fileInput.click();
                }
            }
        });

        // Question form
        const documentSelect = document.getElementById('document-select');
        const questionInput = document.getElementById('question-input');
        const submitBtn = document.getElementById('submit-question');

        if (documentSelect) documentSelect.addEventListener('change', this.updateSubmitButton.bind(this));
        if (questionInput) questionInput.addEventListener('input', this.updateSubmitButton.bind(this));
        if (submitBtn) submitBtn.addEventListener('click', this.submitQuestion.bind(this));

        // Export buttons
        const exportResultBtn = document.getElementById('export-result');
        const exportHistoryBtn = document.getElementById('export-history');
        
        if (exportResultBtn) exportResultBtn.addEventListener('click', this.exportResult.bind(this));
        if (exportHistoryBtn) exportHistoryBtn.addEventListener('click', this.exportHistory.bind(this));

        // History search and filter
        const historySearch = document.getElementById('history-search');
        const documentFilter = document.getElementById('document-filter');
        
        if (historySearch) historySearch.addEventListener('input', this.filterHistory.bind(this));
        if (documentFilter) documentFilter.addEventListener('change', this.filterHistory.bind(this));

        // Modal
        const modalClose = document.getElementById('modal-close');
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (modalClose) modalClose.addEventListener('click', this.closeModal.bind(this));
        if (modalOverlay) modalOverlay.addEventListener('click', this.closeModal.bind(this));
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update tab content - Fixed to properly show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // Refresh data when switching to history
        if (tabName === 'history') {
            this.renderQueries();
        }
        
        // Update document selectors when switching to questions
        if (tabName === 'questions') {
            this.populateDocumentSelectors();
            this.updateSubmitButton();
        }
    }

    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.simulateUpload(file);
            }
        });
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['.pdf', '.docx', '.doc'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (file.size > maxSize) {
            this.showToast('error', 'File too large', `${file.name} exceeds 10MB limit`);
            return false;
        }

        if (!allowedTypes.includes(fileExtension)) {
            this.showToast('error', 'Invalid file type', 'Only PDF and DOCX files are supported');
            return false;
        }

        return true;
    }

    simulateUpload(file) {
        const progressEl = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        if (progressEl && progressFill && progressText) {
            progressEl.classList.remove('hidden');
            progressText.textContent = `Uploading ${file.name}...`;

            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    this.completeUpload(file);
                }
                progressFill.style.width = `${progress}%`;
            }, 200);
        }
    }

    completeUpload(file) {
        const newDoc = {
            id: `doc_${Date.now()}`,
            name: file.name,
            size: this.formatFileSize(file.size),
            type: file.name.endsWith('.pdf') ? 'PDF' : 'DOCX',
            uploadDate: new Date().toISOString(),
            status: 'processing',
            clauses: Math.floor(Math.random() * 50) + 20,
            pages: Math.floor(Math.random() * 15) + 5
        };

        this.documents.unshift(newDoc);
        
        setTimeout(() => {
            const progressEl = document.getElementById('upload-progress');
            if (progressEl) progressEl.classList.add('hidden');
            
            this.renderDocuments();
            this.populateDocumentSelectors();
            this.showToast('success', 'Upload complete', `${file.name} has been uploaded successfully`);
            
            // Simulate processing completion
            setTimeout(() => {
                newDoc.status = 'ready';
                this.renderDocuments();
                this.populateDocumentSelectors();
                this.showToast('info', 'Processing complete', `${file.name} is ready for queries`);
            }, 3000);
        }, 500);
    }

    renderDocuments() {
        const grid = document.getElementById('documents-grid');
        const countEl = document.getElementById('document-count');
        
        if (!grid || !countEl) return;
        
        countEl.textContent = `${this.documents.length} documents`;

        grid.innerHTML = this.documents.map(doc => `
            <div class="document-card fade-in">
                <div class="document-header">
                    <div class="document-info">
                        <div class="file-type-icon" style="color: ${this.fileTypes[doc.type].color}">
                            ${this.fileTypes[doc.type].icon}
                        </div>
                        <div class="document-name">${doc.name}</div>
                        <div class="document-meta">${doc.size} • ${this.formatDate(doc.uploadDate)}</div>
                    </div>
                    <div class="document-actions">
                        <button class="action-btn" title="View details" onclick="documentSystem.viewDocument('${doc.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete" title="Delete document" onclick="documentSystem.deleteDocument('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="document-stats">
                    <span>${doc.clauses} clauses</span>
                    <span>${doc.pages} pages</span>
                </div>
                <div class="status-badge ${doc.status}">
                    ${doc.status === 'processing' ? '<i class="fas fa-spinner fa-spin"></i>' : ''}
                    ${doc.status}
                </div>
            </div>
        `).join('');
    }

    deleteDocument(docId) {
        if (confirm('Are you sure you want to delete this document?')) {
            this.documents = this.documents.filter(doc => doc.id !== docId);
            this.queries = this.queries.filter(query => query.documentId !== docId);
            this.renderDocuments();
            this.populateDocumentSelectors();
            this.showToast('success', 'Document deleted', 'Document and related queries have been removed');
        }
    }

    viewDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = 'Document Details';
        
        modalBody.innerHTML = `
            <div class="document-details">
                <div class="detail-section">
                    <h4>Document Information</h4>
                    <p><strong>Name:</strong> ${doc.name}</p>
                    <p><strong>Type:</strong> ${doc.type}</p>
                    <p><strong>Size:</strong> ${doc.size}</p>
                    <p><strong>Uploaded:</strong> ${this.formatDate(doc.uploadDate)}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${doc.status}">${doc.status}</span></p>
                </div>
                
                <div class="detail-section">
                    <h4>Content Analysis</h4>
                    <p><strong>Pages:</strong> ${doc.pages}</p>
                    <p><strong>Clauses:</strong> ${doc.clauses}</p>
                </div>
            </div>
        `;

        this.showModal();
    }

    populateDocumentSelectors() {
        const selectors = ['document-select', 'document-filter'];
        const readyDocs = this.documents.filter(doc => doc.status === 'ready');

        selectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (!select) return;

            const currentValue = select.value;
            select.innerHTML = selectorId === 'document-filter' 
                ? '<option value="">All Documents</option>' 
                : '<option value="">Choose a document...</option>';

            readyDocs.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.name;
                select.appendChild(option);
            });

            select.value = currentValue;
        });
    }

    updateSubmitButton() {
        const documentSelect = document.getElementById('document-select');
        const questionInput = document.getElementById('question-input');
        const submitBtn = document.getElementById('submit-question');

        if (!documentSelect || !questionInput || !submitBtn) return;

        const hasDocument = documentSelect.value;
        const hasQuestion = questionInput.value.trim().length > 0;

        submitBtn.disabled = !(hasDocument && hasQuestion);
    }

    async submitQuestion() {
        const documentSelect = document.getElementById('document-select');
        const questionInput = document.getElementById('question-input');
        const submitBtn = document.getElementById('submit-question');
        const loadingIcon = document.getElementById('question-loading');
        const btnText = submitBtn.querySelector('.btn-text');

        if (!documentSelect || !questionInput || !submitBtn) return;

        // Show loading state
        submitBtn.disabled = true;
        if (loadingIcon) loadingIcon.classList.remove('hidden');
        if (btnText) btnText.textContent = 'Processing...';

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

        // Generate mock response
        const selectedDoc = this.documents.find(doc => doc.id === documentSelect.value);
        const question = questionInput.value.trim();

        if (!selectedDoc) return;

        const mockAnswer = this.generateMockAnswer(question, selectedDoc);
        
        // Create new query
        const newQuery = {
            id: `query_${Date.now()}`,
            documentId: selectedDoc.id,
            documentName: selectedDoc.name,
            question: question,
            timestamp: new Date().toISOString(),
            status: 'completed',
            ...mockAnswer
        };

        this.queries.unshift(newQuery);
        this.currentQuery = newQuery;

        // Show results
        this.displayResults(newQuery);
        this.renderRecentQuestions();

        // Reset form
        questionInput.value = '';
        this.updateSubmitButton();

        // Reset button state
        submitBtn.disabled = false;
        if (loadingIcon) loadingIcon.classList.add('hidden');
        if (btnText) btnText.textContent = 'Ask Question';

        this.showToast('success', 'Query processed', 'Your question has been analyzed successfully');
    }

    generateMockAnswer(question, document) {
        const mockAnswers = [
            {
                answer: "Based on the document analysis, this clause specifies clear conditions and requirements that must be met according to the outlined terms and provisions.",
                confidence: 0.85 + Math.random() * 0.1,
                sourceClauses: [
                    {
                        text: "The relevant clause states the specific terms and conditions that apply to this situation as outlined in the document provisions.",
                        page: Math.floor(Math.random() * document.pages) + 1,
                        similarity: 0.88 + Math.random() * 0.1,
                        clauseId: `cl_${Date.now()}_001`
                    },
                    {
                        text: "Additional supporting information can be found in the supplementary clauses which provide further context and clarification.",
                        page: Math.floor(Math.random() * document.pages) + 1,
                        similarity: 0.82 + Math.random() * 0.1,
                        clauseId: `cl_${Date.now()}_002`
                    }
                ]
            }
        ];

        return mockAnswers[0];
    }

    displayResults(query) {
        const resultsSection = document.getElementById('results-section');
        const answerContent = document.getElementById('answer-content');
        const confidenceFill = document.getElementById('confidence-fill');
        const confidenceValue = document.getElementById('confidence-value');
        const sourcesList = document.getElementById('sources-list');

        if (!resultsSection || !answerContent || !confidenceFill || !confidenceValue || !sourcesList) return;

        // Show results section
        resultsSection.classList.remove('hidden');

        // Display answer
        answerContent.textContent = query.answer;

        // Display confidence
        const confidencePercent = Math.round(query.confidence * 100);
        confidenceFill.style.width = `${confidencePercent}%`;
        confidenceValue.textContent = `${confidencePercent}%`;

        // Display source clauses
        sourcesList.innerHTML = query.sourceClauses.map(clause => `
            <div class="source-clause">
                <div class="source-header">
                    <div class="source-meta">
                        <span>Page ${clause.page}</span>
                        <span class="similarity-score">${Math.round(clause.similarity * 100)}% match</span>
                    </div>
                </div>
                <div class="source-text">"${clause.text}"</div>
            </div>
        `).join('');

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderRecentQuestions() {
        const recentQuestions = document.getElementById('recent-questions');
        if (!recentQuestions) return;
        
        const recentQueriesList = this.queries.slice(0, 5);

        recentQuestions.innerHTML = recentQueriesList.map(query => `
            <div class="question-item" onclick="documentSystem.viewQuery('${query.id}')">
                <div class="question-text">${query.question}</div>
                <div class="question-meta">
                    ${query.documentName} • ${this.formatDate(query.timestamp)}
                </div>
            </div>
        `).join('');
    }

    renderQueries() {
        const tbody = document.getElementById('history-tbody');
        if (!tbody) return;
        
        const filteredQueries = this.getFilteredQueries();

        tbody.innerHTML = filteredQueries.map(query => `
            <tr>
                <td>${this.formatDate(query.timestamp)}</td>
                <td>${query.documentName}</td>
                <td>
                    <div class="question-preview" title="${query.question}">
                        ${query.question}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${query.status}">${query.status}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="documentSystem.viewQuery('${query.id}')" title="View details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete" onclick="documentSystem.deleteQuery('${query.id}')" title="Delete query">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getFilteredQueries() {
        const searchTerm = document.getElementById('history-search')?.value.toLowerCase() || '';
        const documentFilter = document.getElementById('document-filter')?.value || '';

        return this.queries.filter(query => {
            const matchesSearch = query.question.toLowerCase().includes(searchTerm) ||
                                query.documentName.toLowerCase().includes(searchTerm);
            const matchesDocument = !documentFilter || query.documentId === documentFilter;
            
            return matchesSearch && matchesDocument;
        });
    }

    filterHistory() {
        this.renderQueries();
    }

    viewQuery(queryId) {
        const query = this.queries.find(q => q.id === queryId);
        if (!query) return;

        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = 'Query Details';
        
        modalBody.innerHTML = `
            <div class="query-details">
                <div class="detail-section">
                    <h4>Question</h4>
                    <p>${query.question}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Document</h4>
                    <p>${query.documentName}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Answer</h4>
                    <div class="answer-card">
                        <div class="answer-content">${query.answer}</div>
                        <div class="confidence-indicator">
                            <span class="confidence-label">Confidence:</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${Math.round(query.confidence * 100)}%"></div>
                            </div>
                            <span class="confidence-value">${Math.round(query.confidence * 100)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Source Clauses</h4>
                    <div class="sources-list">
                        ${query.sourceClauses.map(clause => `
                            <div class="source-clause">
                                <div class="source-header">
                                    <div class="source-meta">
                                        <span>Page ${clause.page}</span>
                                        <span class="similarity-score">${Math.round(clause.similarity * 100)}% match</span>
                                    </div>
                                </div>
                                <div class="source-text">"${clause.text}"</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Query Information</h4>
                    <p><strong>Submitted:</strong> ${this.formatDate(query.timestamp)}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${query.status}">${query.status}</span></p>
                </div>
            </div>
        `;

        this.showModal();
    }

    deleteQuery(queryId) {
        if (confirm('Are you sure you want to delete this query?')) {
            this.queries = this.queries.filter(query => query.id !== queryId);
            this.renderQueries();
            this.renderRecentQuestions();
            this.showToast('success', 'Query deleted', 'Query has been removed from history');
        }
    }

    showModal() {
        const modal = document.getElementById('query-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeModal() {
        const modal = document.getElementById('query-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    exportResult() {
        if (!this.currentQuery) return;
        
        const data = {
            question: this.currentQuery.question,
            document: this.currentQuery.documentName,
            answer: this.currentQuery.answer,
            confidence: this.currentQuery.confidence,
            sourceClauses: this.currentQuery.sourceClauses,
            timestamp: this.currentQuery.timestamp
        };
        
        this.downloadJSON(data, `query_result_${Date.now()}.json`);
        this.showToast('success', 'Export complete', 'Query result has been downloaded');
    }

    exportHistory() {
        const data = {
            queries: this.getFilteredQueries(),
            exportDate: new Date().toISOString(),
            totalQueries: this.getFilteredQueries().length
        };
        
        this.downloadJSON(data, `query_history_${Date.now()}.json`);
        this.showToast('success', 'Export complete', 'Query history has been downloaded');
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showToast(type, title, message) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toastId = `toast_${Date.now()}`;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${iconMap[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="documentSystem.closeToast('${toastId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.closeToast(toastId);
        }, 5000);
    }

    closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Add slide out animation for toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.documentSystem = new DocumentSystem();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!window.documentSystem) return;
    
    // Escape key to close modal
    if (e.key === 'Escape') {
        window.documentSystem.closeModal();
    }
    
    // Ctrl/Cmd + Enter to submit question
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitBtn = document.getElementById('submit-question');
        if (submitBtn && !submitBtn.disabled) {
            window.documentSystem.submitQuestion();
        }
    }
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    // Update any responsive elements if needed
    const modal = document.getElementById('query-modal');
    if (modal && !modal.classList.contains('hidden')) {
        // Ensure modal stays centered
        modal.style.display = 'flex';
    }
});