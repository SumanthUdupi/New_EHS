import { getRiskAssessments, getRiskAssessmentById, addRiskAssessment, updateRiskAssessment, getState } from '../store.js';
import { getCurrentUser } from '../auth.js';

const LIKELIHOOD_LABELS = ['Very Unlikely', 'Unlikely', 'Possible', 'Likely', 'Very Likely'];
const SEVERITY_LABELS = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

const RISK_TEMPLATES = {
    'hazard-assessment': {
        name: 'Hazard Assessment',
        fields: [
            { name: 'hazard', label: 'Hazard Description', type: 'textarea', required: true },
            { name: 'category', label: 'Category', type: 'select', options: ['Physical', 'Chemical', 'Biological', 'Ergonomic', 'Psychosocial'], required: true },
            { name: 'location', label: 'Location', type: 'text', required: true },
            { name: 'initialLikelihood', label: 'Initial Likelihood', type: 'select', options: LIKELIHOOD_LABELS.map((l, i) => ({ value: i + 1, label: l })), required: true },
            { name: 'initialSeverity', label: 'Initial Severity', type: 'select', options: SEVERITY_LABELS.map((s, i) => ({ value: i + 1, label: s })), required: true },
            { name: 'controls', label: 'Existing Controls', type: 'textarea', required: true },
            { name: 'residualLikelihood', label: 'Residual Likelihood', type: 'select', options: LIKELIHOOD_LABELS.map((l, i) => ({ value: i + 1, label: l })), required: true },
            { name: 'residualSeverity', label: 'Residual Severity', type: 'select', options: SEVERITY_LABELS.map((s, i) => ({ value: i + 1, label: s })), required: true }
        ]
    },
    'workplace-safety': {
        name: 'Workplace Safety Assessment',
        fields: [
            { name: 'hazard', label: 'Safety Hazard', type: 'textarea', required: true },
            { name: 'category', label: 'Category', type: 'select', options: ['Physical', 'Chemical', 'Biological', 'Ergonomic', 'Psychosocial'], required: true },
            { name: 'location', label: 'Work Area', type: 'text', required: true },
            { name: 'initialLikelihood', label: 'Initial Likelihood', type: 'select', options: LIKELIHOOD_LABELS.map((l, i) => ({ value: i + 1, label: l })), required: true },
            { name: 'initialSeverity', label: 'Initial Severity', type: 'select', options: SEVERITY_LABELS.map((s, i) => ({ value: i + 1, label: s })), required: true },
            { name: 'controls', label: 'Safety Measures', type: 'textarea', required: true },
            { name: 'residualLikelihood', label: 'Residual Likelihood', type: 'select', options: LIKELIHOOD_LABELS.map((l, i) => ({ value: i + 1, label: l })), required: true },
            { name: 'residualSeverity', label: 'Residual Severity', type: 'select', options: SEVERITY_LABELS.map((s, i) => ({ value: i + 1, label: s })), required: true }
        ]
    }
};

function calculateRiskScore(likelihood, severity) {
    return likelihood * severity;
}

function getRiskLevel(score) {
    if (score <= 4) return { level: 'Low', color: 'green' };
    if (score <= 9) return { level: 'Medium', color: 'yellow' };
    if (score <= 15) return { level: 'High', color: 'orange' };
    return { level: 'Critical', color: 'red' };
}

function renderAssessmentModal(root, assessment = null, template = null) {
    const isEdit = !!assessment;
    const selectedTemplate = template || (assessment ? 'hazard-assessment' : null);

    const modalHTML = `
        <div id="assessment-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? 'Edit Risk Assessment' : 'Create New Risk Assessment'}</h2>
                    <span id="close-assessment-modal-btn" class="close-btn" aria-label="Close">&times;</span>
                </div>
                <form id="assessment-form">
                    ${!isEdit ? `
                        <div class="form-group">
                            <label for="template-select" class="form-label">Template *</label>
                            <select id="template-select" class="form-control" required>
                                <option value="">Select Template</option>
                                <option value="hazard-assessment">Hazard Assessment</option>
                                <option value="workplace-safety">Workplace Safety Assessment</option>
                            </select>
                        </div>
                        <div id="template-fields"></div>
                    ` : `
                        <div id="template-fields">${renderTemplateFields(selectedTemplate, assessment)}</div>
                    `}
                    <div class="form-group">
                        <label for="assessment-status" class="form-label">Status</label>
                        <select id="assessment-status" class="form-control">
                            <option value="Adequate">Adequate</option>
                            <option value="Needs Improvement">Needs Improvement</option>
                            <option value="Inadequate">Inadequate</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update Assessment' : 'Create Assessment'}</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    if (!isEdit) {
        document.getElementById('template-select').addEventListener('change', (e) => {
            const templateKey = e.target.value;
            const fieldsContainer = document.getElementById('template-fields');
            fieldsContainer.innerHTML = templateKey ? renderTemplateFields(templateKey) : '';
        });
    }

    if (isEdit && assessment) {
        document.getElementById('assessment-status').value = assessment.status;
    }

    document.getElementById('close-assessment-modal-btn').addEventListener('click', () => {
        document.getElementById('assessment-modal').remove();
    });

    document.getElementById('assessment-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const templateKey = isEdit ? selectedTemplate : document.getElementById('template-select').value;
        if (!templateKey) return;

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Calculate scores
        const initialLikelihood = parseInt(data.initialLikelihood);
        const initialSeverity = parseInt(data.initialSeverity);
        const residualLikelihood = parseInt(data.residualLikelihood);
        const residualSeverity = parseInt(data.residualSeverity);

        const assessmentData = {
            hazard: data.hazard,
            category: data.category,
            location: data.location,
            initialLikelihood,
            initialSeverity,
            initialScore: calculateRiskScore(initialLikelihood, initialSeverity),
            controls: data.controls,
            residualLikelihood,
            residualSeverity,
            residualScore: calculateRiskScore(residualLikelihood, residualSeverity),
            status: data['assessment-status'] || 'Adequate'
        };

        if (isEdit) {
            updateRiskAssessment(assessment.id, assessmentData);
        } else {
            addRiskAssessment(assessmentData);
        }

        document.getElementById('assessment-modal').remove();
        renderRisks(root);
    });
}

function renderTemplateFields(templateKey, assessment = {}) {
    const template = RISK_TEMPLATES[templateKey];
    if (!template) return '';

    return template.fields.map(field => {
        const value = assessment[field.name] || '';
        let inputHTML = '';

        switch (field.type) {
            case 'textarea':
                inputHTML = `<textarea id="${field.name}" name="${field.name}" class="form-control" rows="3" ${field.required ? 'required' : ''}>${value}</textarea>`;
                break;
            case 'select':
                const options = field.options.map(opt =>
                    typeof opt === 'string'
                        ? `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                        : `<option value="${opt.value}" ${value == opt.value ? 'selected' : ''}>${opt.label}</option>`
                ).join('');
                inputHTML = `<select id="${field.name}" name="${field.name}" class="form-control" ${field.required ? 'required' : ''}>${options}</select>`;
                break;
            default:
                inputHTML = `<input type="${field.type}" id="${field.name}" name="${field.name}" class="form-control" value="${value}" ${field.required ? 'required' : ''}>`;
        }

        return `
            <div class="form-group">
                <label for="${field.name}" class="form-label">${field.label} ${field.required ? '*' : ''}</label>
                ${inputHTML}
            </div>
        `;
    }).join('');
}

function renderApprovalModal(root, assessment) {
    const modalHTML = `
        <div id="approval-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Approve Risk Assessment</h2>
                    <span id="close-approval-modal-btn" class="close-btn" aria-label="Close">&times;</span>
                </div>
                <form id="approval-form">
                    <div class="form-group">
                        <label for="approval-comments" class="form-label">Comments</label>
                        <textarea id="approval-comments" name="comments" class="form-control" rows="3" placeholder="Optional comments..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Decision</label>
                        <div>
                            <label><input type="radio" name="decision" value="approved" required> Approve</label>
                            <label><input type="radio" name="decision" value="rejected"> Reject</label>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Decision</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('close-approval-modal-btn').addEventListener('click', () => {
        document.getElementById('approval-modal').remove();
    });

    document.getElementById('approval-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const decision = formData.get('decision');
        const comments = formData.get('comments');

        const updates = {
            status: decision === 'approved' ? 'Approved' : 'Rejected',
            approvalComments: comments,
            approvedBy: getCurrentUser().id,
            approvedDate: new Date()
        };

        updateRiskAssessment(assessment.id, updates);
        document.getElementById('approval-modal').remove();
        renderRiskDetail(root, { id: assessment.id });
    });
}

export function renderRiskDetail(root, params) {
    const assessment = getRiskAssessmentById(params.id);
    const currentUser = getCurrentUser();

    if (!assessment) {
        root.innerHTML = '<h2>Assessment not found</h2><a href="#/risks">Back to list</a>';
        return;
    }

    const initialRisk = getRiskLevel(assessment.initialScore);
    const residualRisk = getRiskLevel(assessment.residualScore);

    const canApprove = currentUser.role === 'Manager' && assessment.status !== 'Approved' && assessment.status !== 'Rejected';

    root.innerHTML = `
        <style>
            .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-lg); }
            .detail-card { background-color: var(--surface-color); border-radius: var(--border-radius-lg); padding: var(--space-lg); box-shadow: var(--shadow-sm); margin-bottom: var(--space-lg); }
            .detail-card h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm); }
            .detail-item { display: flex; margin-bottom: var(--space-sm); }
            .detail-item strong { color: var(--text-color-light); width: 140px; flex-shrink: 0; }
            .risk-score { display: inline-block; padding: var(--space-xs) var(--space-sm); border-radius: var(--border-radius-sm); color: white; font-weight: bold; }
            .risk-low { background-color: #28a745; }
            .risk-medium { background-color: #ffc107; color: black; }
            .risk-high { background-color: #fd7e14; }
            .risk-critical { background-color: #dc3545; }
            .workflow-buttons { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
            @media (max-width: 768px) {
                .detail-grid { grid-template-columns: 1fr; }
                .detail-item { flex-direction: column; }
                .detail-item strong { width: auto; margin-bottom: var(--space-xs); }
                .workflow-buttons { flex-direction: column; }
            }
        </style>
        <div class="page-header">
            <a href="#/risks" class="btn btn-secondary">&larr; Back to Risk Register</a>
            ${currentUser.role === 'Admin' || currentUser.role === 'Manager' ? '<button id="edit-assessment-btn" class="btn btn-primary">Edit Assessment</button>' : ''}
        </div>

        <div class="detail-grid">
            <div>
                <div class="detail-card">
                    <h3>Risk Assessment Details</h3>
                    <div class="detail-item"><strong>ID:</strong> RA-${String(assessment.id).padStart(4, '0')}</div>
                    <div class="detail-item"><strong>Hazard:</strong> ${assessment.hazard}</div>
                    <div class="detail-item"><strong>Category:</strong> ${assessment.category}</div>
                    <div class="detail-item"><strong>Location:</strong> ${assessment.location || 'N/A'}</div>
                    <div class="detail-item"><strong>Controls:</strong> ${assessment.controls}</div>
                    <div class="detail-item"><strong>Assessment Date:</strong> ${new Date(assessment.assessmentDate).toLocaleDateString()}</div>
                </div>
                <div class="detail-card">
                    <h3>Risk Matrix</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Risk Level</th>
                                <th>Likelihood</th>
                                <th>Severity</th>
                                <th>Score</th>
                                <th>Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Initial</td>
                                <td>${LIKELIHOOD_LABELS[assessment.initialLikelihood - 1]}</td>
                                <td>${SEVERITY_LABELS[assessment.initialSeverity - 1]}</td>
                                <td>${assessment.initialScore}</td>
                                <td><span class="risk-score risk-${initialRisk.color}">${initialRisk.level}</span></td>
                            </tr>
                            <tr>
                                <td>Residual</td>
                                <td>${LIKELIHOOD_LABELS[assessment.residualLikelihood - 1]}</td>
                                <td>${SEVERITY_LABELS[assessment.residualSeverity - 1]}</td>
                                <td>${assessment.residualScore}</td>
                                <td><span class="risk-score risk-${residualRisk.color}">${residualRisk.level}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="detail-card">
                <h3>Status & Approval</h3>
                <div class="detail-item"><strong>Status:</strong> <span class="status-badge status-${assessment.status.toLowerCase().replace(/\\s+/g, '-')}">${assessment.status}</span></div>
                ${assessment.approvedBy ? `
                    <div class="detail-item"><strong>Approved By:</strong> ${getState().users.find(u => u.id === assessment.approvedBy)?.name || 'Unknown'}</div>
                    <div class="detail-item"><strong>Approved Date:</strong> ${new Date(assessment.approvedDate).toLocaleDateString()}</div>
                    ${assessment.approvalComments ? `<div class="detail-item"><strong>Comments:</strong> ${assessment.approvalComments}</div>` : ''}
                ` : ''}
                ${canApprove ? `
                    <div class="workflow-buttons">
                        <button id="approve-assessment-btn" class="btn btn-success">Approve/Reject</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    if (document.getElementById('edit-assessment-btn')) {
        document.getElementById('edit-assessment-btn').addEventListener('click', () => renderAssessmentModal(root, assessment, 'hazard-assessment'));
    }

    if (document.getElementById('approve-assessment-btn')) {
        document.getElementById('approve-assessment-btn').addEventListener('click', () => renderApprovalModal(root, assessment));
    }
}

export function renderRisks(root, params) {
    if (params && params.id) {
        renderRiskDetail(root, params);
        return;
    }

    const currentUser = getCurrentUser();
    const assessments = getRiskAssessments();

    // Filter and sort state
    let filteredAssessments = [...assessments];
    let searchTerm = '';
    let categoryFilter = '';
    let statusFilter = '';
    let riskLevelFilter = '';
    let sortBy = 'assessmentDate';
    let sortOrder = 'desc';

    function applyFiltersAndSort() {
        filteredAssessments = assessments.filter(assessment => {
            const matchesSearch = !searchTerm ||
                assessment.hazard.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assessment.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !categoryFilter || assessment.category === categoryFilter;
            const matchesStatus = !statusFilter || assessment.status === statusFilter;
            const residualRisk = getRiskLevel(assessment.residualScore);
            const matchesRiskLevel = !riskLevelFilter || residualRisk.level === riskLevelFilter;
            return matchesSearch && matchesCategory && matchesStatus && matchesRiskLevel;
        });

        filteredAssessments.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'hazard':
                    aVal = a.hazard.toLowerCase();
                    bVal = b.hazard.toLowerCase();
                    break;
                case 'category':
                    aVal = a.category;
                    bVal = b.category;
                    break;
                case 'status':
                    aVal = a.status;
                    bVal = b.status;
                    break;
                case 'residualScore':
                    aVal = a.residualScore;
                    bVal = b.residualScore;
                    break;
                case 'assessmentDate':
                default:
                    aVal = new Date(a.assessmentDate);
                    bVal = new Date(b.assessmentDate);
                    break;
            }
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    applyFiltersAndSort();

    const tableRows = filteredAssessments.map(assessment => {
        const residualRisk = getRiskLevel(assessment.residualScore);
        return `
            <tr data-id="${assessment.id}" class="clickable-row">
                <td>RA-${String(assessment.id).padStart(4, '0')}</td>
                <td>${assessment.hazard.substring(0, 50)}${assessment.hazard.length > 50 ? '...' : ''}</td>
                <td>${assessment.category}</td>
                <td><span class="risk-score risk-${residualRisk.color}">${residualRisk.level}</span></td>
                <td><span class="status-badge status-${assessment.status.toLowerCase().replace(/\\s+/g, '-')}">${assessment.status}</span></td>
                <td>${new Date(assessment.assessmentDate).toLocaleDateString()}</td>
            </tr>
        `;
    }).join('');

    const canCreateAssessment = currentUser.role === 'Admin' || currentUser.role === 'Manager';

    root.innerHTML = `
        <div class="page-header">
            ${canCreateAssessment ? '<button id="new-assessment-btn" class="btn btn-primary">New Assessment</button>' : ''}
        </div>
        <div class="filters-section" style="margin-bottom: var(--space-lg); display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: center;">
            <style>
                @media (max-width: 768px) {
                    .filters-section { flex-direction: column; align-items: stretch; }
                    .filter-group { width: 100%; }
                }
            </style>
            <div class="filter-group">
                <label for="search-input" class="form-label">Search:</label>
                <input type="text" id="search-input" class="form-control" placeholder="Search assessments..." value="${searchTerm}">
            </div>
            <div class="filter-group">
                <label for="category-filter" class="form-label">Category:</label>
                <select id="category-filter" class="form-control">
                    <option value="">All Categories</option>
                    <option value="Physical">Physical</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Biological">Biological</option>
                    <option value="Ergonomic">Ergonomic</option>
                    <option value="Psychosocial">Psychosocial</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="status-filter" class="form-label">Status:</label>
                <select id="status-filter" class="form-control">
                    <option value="">All Statuses</option>
                    <option value="Adequate">Adequate</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                    <option value="Inadequate">Inadequate</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="risk-level-filter" class="form-label">Risk Level:</label>
                <select id="risk-level-filter" class="form-control">
                    <option value="">All Levels</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="sort-by" class="form-label">Sort by:</label>
                <select id="sort-by" class="form-control">
                    <option value="assessmentDate">Date</option>
                    <option value="hazard">Hazard</option>
                    <option value="category">Category</option>
                    <option value="residualScore">Risk Score</option>
                    <option value="status">Status</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="sort-order" class="form-label">Order:</label>
                <select id="sort-order" class="form-control">
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>
        </div>
        <div class="card">
            <div class="card-header">Risk Register (${filteredAssessments.length})</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Hazard</th>
                        <th>Category</th>
                        <th>Risk Level</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    // Event listeners for filters
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchTerm = e.target.value;
        applyFiltersAndSort();
        renderRisks(root, params);
    });

    document.getElementById('category-filter').addEventListener('change', (e) => {
        categoryFilter = e.target.value;
        applyFiltersAndSort();
        renderRisks(root, params);
    });

    document.getElementById('status-filter').addEventListener('change', (e) => {
        statusFilter = e.target.value;
        applyFiltersAndSort();
        renderRisks(root, params);
    });

    document.getElementById('risk-level-filter').addEventListener('change', (e) => {
        riskLevelFilter = e.target.value;
        applyFiltersAndSort();
        renderRisks(root, params);
    });

    document.getElementById('sort-by').addEventListener('change', (e) => {
        sortBy = e.target.value;
        applyFiltersAndSort();
        renderRisks(root, params);
    });

    document.getElementById('sort-order').addEventListener('change', (e) => {
        sortOrder = e.target.value;
        applyFiltersAndSort();
        renderRisks(root, params);
    });

    if (document.getElementById('new-assessment-btn')) {
        document.getElementById('new-assessment-btn').addEventListener('click', () => renderAssessmentModal(root));
    }

    document.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', () => {
            window.location.hash = `#/risks/${row.dataset.id}`;
        });
    });
}
