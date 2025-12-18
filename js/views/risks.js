import {
    getRiskAssessments,
    addRiskAssessment,
    updateRiskAssessment,
    getRiskAssessmentById,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

let unsubscribe;

export function renderRisks(params) {
    // Return a placeholder container
    setTimeout(() => {
        const container = document.getElementById('app-root');
        if (container) initializeRisks(container, params);
    }, 0);
    return '<div id="risks-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function initializeRisks(container, params) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/risks')) {
             initializeRisks(container, params);
        }
    });

    if (params.id) {
        renderRiskDetail(container, params.id);
    } else {
        renderRiskList(container);
    }
}

function renderRiskList(container) {
    const risks = getRiskAssessments();
    // Sort by date descending
    risks.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

    const html = `
        <div class="page-header">
            <h1 class="page-title">Risk Assessment</h1>
            <div class="page-actions">
                <button class="btn btn-secondary" id="export-btn">Export</button>
                <button class="btn btn-primary" id="add-risk-btn">New Assessment</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search risks...">
                <select id="filter-category" class="form-select">
                    <option value="">All Categories</option>
                    <option value="Physical">Physical</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Biological">Biological</option>
                    <option value="Ergonomic">Ergonomic</option>
                    <option value="Psychosocial">Psychosocial</option>
                </select>
                <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="Adequate">Adequate</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                    <option value="Inadequate">Inadequate</option>
                </select>
            </div>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table class="table" id="risks-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Hazard</th>
                            <th>Category</th>
                            <th>Initial Score</th>
                            <th>Residual Score</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${risks.map(risk => `
                            <tr data-id="${risk.id}">
                                <td>#${risk.id}</td>
                                <td>${new Date(risk.assessmentDate).toLocaleDateString()}</td>
                                <td><a href="#/risks/${risk.id}" class="text-primary font-weight-bold">${risk.hazard}</a></td>
                                <td>${risk.category}</td>
                                <td><span class="badge badge-${getRiskScoreClass(risk.initialScore)}">${risk.initialScore}</span></td>
                                <td><span class="badge badge-${getRiskScoreClass(risk.residualScore)}">${risk.residualScore}</span></td>
                                <td><span class="badge badge-${getStatusBadgeClass(risk.status)}">${risk.status}</span></td>
                                <td>
                                    <button class="btn-icon" title="View" onclick="window.location.hash='#/risks/${risk.id}'">👁️</button>
                                    <button class="btn-icon edit-btn" title="Edit" data-id="${risk.id}">✏️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${risks.length === 0 ? '<div class="empty-state"><p>No risk assessments found.</p></div>' : ''}
        </div>
    `;

    container.innerHTML = html;

    document.getElementById('add-risk-btn').addEventListener('click', showAddRiskModal);

    document.getElementById('search-input').addEventListener('input', (e) => filterRisks(e.target.value));
    document.getElementById('filter-category').addEventListener('change', () => filterRisks());
    document.getElementById('filter-status').addEventListener('change', () => filterRisks());

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditRiskModal(btn.dataset.id);
        });
    });
}

function renderRiskDetail(container, id) {
    const risk = getRiskAssessmentById(id);

    if (!risk) {
        container.innerHTML = `
            <div class="alert alert-error">Risk assessment not found. <a href="#/risks">Back to list</a></div>
        `;
        return;
    }

    const html = `
        <div class="page-header">
            <div class="breadcrumb">
                <a href="#/risks">Risk Assessments</a> &gt; <span>#${risk.id}</span>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="window.location.hash='#/risks'">Back</button>
                <button class="btn btn-primary" id="edit-risk-btn">Edit Assessment</button>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="col-span-1">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Hazard Details</h2>
                        <span class="badge badge-${getStatusBadgeClass(risk.status)}">${risk.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="detail-row">
                            <label>Date:</label>
                            <span>${new Date(risk.assessmentDate).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-row">
                            <label>Hazard:</label>
                            <span>${risk.hazard}</span>
                        </div>
                        <div class="detail-row">
                            <label>Category:</label>
                            <span>${risk.category}</span>
                        </div>
                         <div class="detail-section">
                            <h3>Controls</h3>
                            <p>${risk.controls}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-1">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Risk Scoring</h2>
                    </div>
                    <div class="card-body">
                         <div class="risk-matrix-summary">
                            <div class="score-box">
                                <h4>Initial Risk</h4>
                                <div class="risk-score ${getRiskScoreClass(risk.initialScore)}">
                                    <span class="score-value">${risk.initialScore}</span>
                                    <span class="score-label">Likelihood: ${risk.initialLikelihood} × Severity: ${risk.initialSeverity}</span>
                                </div>
                            </div>
                            <div class="score-arrow">➡</div>
                            <div class="score-box">
                                <h4>Residual Risk</h4>
                                <div class="risk-score ${getRiskScoreClass(risk.residualScore)}">
                                    <span class="score-value">${risk.residualScore}</span>
                                    <span class="score-label">Likelihood: ${risk.residualLikelihood} × Severity: ${risk.residualSeverity}</span>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
    document.getElementById('edit-risk-btn').addEventListener('click', () => showEditRiskModal(risk.id));
}

function showAddRiskModal() {
    const formHtml = `
        <form id="add-risk-form">
            <div class="form-group">
                <label for="risk-hazard">Hazard Description *</label>
                <input type="text" id="risk-hazard" name="hazard" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="risk-category">Category *</label>
                <select id="risk-category" name="category" class="form-control" required>
                    <option value="">Select Category</option>
                    <option value="Physical">Physical</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Biological">Biological</option>
                    <option value="Ergonomic">Ergonomic</option>
                    <option value="Psychosocial">Psychosocial</option>
                </select>
            </div>

            <fieldset class="form-section">
                <legend>Initial Risk Assessment</legend>
                <div class="row">
                    <div class="col-6">
                         <div class="form-group">
                            <label for="init-likelihood">Likelihood (1-5) *</label>
                            <input type="number" id="init-likelihood" name="initialLikelihood" class="form-control" min="1" max="5" required>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label for="init-severity">Severity (1-5) *</label>
                            <input type="number" id="init-severity" name="initialSeverity" class="form-control" min="1" max="5" required>
                        </div>
                    </div>
                </div>
            </fieldset>

            <div class="form-group">
                <label for="risk-controls">Control Measures *</label>
                <textarea id="risk-controls" name="controls" class="form-control" rows="3" required></textarea>
            </div>

            <fieldset class="form-section">
                <legend>Residual Risk Assessment</legend>
                 <div class="row">
                    <div class="col-6">
                         <div class="form-group">
                            <label for="res-likelihood">Likelihood (1-5) *</label>
                            <input type="number" id="res-likelihood" name="residualLikelihood" class="form-control" min="1" max="5" required>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label for="res-severity">Severity (1-5) *</label>
                            <input type="number" id="res-severity" name="residualSeverity" class="form-control" min="1" max="5" required>
                        </div>
                    </div>
                </div>
            </fieldset>

             <div class="form-group">
                <label for="risk-status">Status *</label>
                <select id="risk-status" name="status" class="form-control" required>
                    <option value="Adequate">Adequate</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                    <option value="Inadequate">Inadequate</option>
                </select>
            </div>

            <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Assessment</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'New Risk Assessment' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('add-risk-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);

            const initL = parseInt(formData.get('initialLikelihood'));
            const initS = parseInt(formData.get('initialSeverity'));
            const resL = parseInt(formData.get('residualLikelihood'));
            const resS = parseInt(formData.get('residualSeverity'));

            const newRisk = {
                hazard: formData.get('hazard'),
                category: formData.get('category'),
                initialLikelihood: initL,
                initialSeverity: initS,
                initialScore: initL * initS,
                controls: formData.get('controls'),
                residualLikelihood: resL,
                residualSeverity: resS,
                residualScore: resL * resS,
                status: formData.get('status'),
                assessmentDate: new Date()
            };

            addRiskAssessment(newRisk);
            Notification.show('Risk Assessment created successfully', { type: 'success' });
            modal.close();
        }
    });
}

function showEditRiskModal(id) {
    const risk = getRiskAssessmentById(id);
    if (!risk) return;

    const formHtml = `
        <form id="edit-risk-form">
            <div class="form-group">
                <label for="edit-hazard">Hazard Description *</label>
                <input type="text" id="edit-hazard" name="hazard" class="form-control" value="${risk.hazard}" required>
            </div>

            <fieldset class="form-section">
                <legend>Initial Risk Assessment</legend>
                <div class="row">
                    <div class="col-6">
                         <div class="form-group">
                            <label for="edit-init-likelihood">Likelihood (1-5) *</label>
                            <input type="number" id="edit-init-likelihood" name="initialLikelihood" class="form-control" min="1" max="5" value="${risk.initialLikelihood}" required>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label for="edit-init-severity">Severity (1-5) *</label>
                            <input type="number" id="edit-init-severity" name="initialSeverity" class="form-control" min="1" max="5" value="${risk.initialSeverity}" required>
                        </div>
                    </div>
                </div>
            </fieldset>

            <div class="form-group">
                <label for="edit-controls">Control Measures *</label>
                <textarea id="edit-controls" name="controls" class="form-control" rows="3" required>${risk.controls}</textarea>
            </div>

            <fieldset class="form-section">
                <legend>Residual Risk Assessment</legend>
                 <div class="row">
                    <div class="col-6">
                         <div class="form-group">
                            <label for="edit-res-likelihood">Likelihood (1-5) *</label>
                            <input type="number" id="edit-res-likelihood" name="residualLikelihood" class="form-control" min="1" max="5" value="${risk.residualLikelihood}" required>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label for="edit-res-severity">Severity (1-5) *</label>
                            <input type="number" id="edit-res-severity" name="residualSeverity" class="form-control" min="1" max="5" value="${risk.residualSeverity}" required>
                        </div>
                    </div>
                </div>
            </fieldset>

             <div class="form-group">
                <label for="edit-status">Status *</label>
                <select id="edit-status" name="status" class="form-control" required>
                    <option value="Adequate" ${risk.status === 'Adequate' ? 'selected' : ''}>Adequate</option>
                    <option value="Needs Improvement" ${risk.status === 'Needs Improvement' ? 'selected' : ''}>Needs Improvement</option>
                    <option value="Inadequate" ${risk.status === 'Inadequate' ? 'selected' : ''}>Inadequate</option>
                </select>
            </div>

            <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: `Edit Risk Assessment #${risk.id}` });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('edit-risk-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);

            const initL = parseInt(formData.get('initialLikelihood'));
            const initS = parseInt(formData.get('initialSeverity'));
            const resL = parseInt(formData.get('residualLikelihood'));
            const resS = parseInt(formData.get('residualSeverity'));

            const updates = {
                hazard: formData.get('hazard'),
                initialLikelihood: initL,
                initialSeverity: initS,
                initialScore: initL * initS,
                controls: formData.get('controls'),
                residualLikelihood: resL,
                residualSeverity: resS,
                residualScore: resL * resS,
                status: formData.get('status'),
            };

            updateRiskAssessment(id, updates);
            Notification.show('Risk Assessment updated successfully', { type: 'success' });
            modal.close();
        }
    });
}

function getRiskScoreClass(score) {
    if (score >= 15) return 'danger'; // High
    if (score >= 8) return 'warning';  // Medium
    return 'success';                  // Low
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Adequate': return 'success';
        case 'Needs Improvement': return 'warning';
        case 'Inadequate': return 'danger';
        default: return 'secondary';
    }
}

function filterRisks(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    const statusFilter = document.getElementById('filter-status').value;

    const rows = document.querySelectorAll('#risks-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const category = row.querySelector('td:nth-child(4)').innerText;
        const status = row.querySelector('td:nth-child(7)').innerText;

        const matchesSearch = text.includes(term);
        const matchesCategory = !categoryFilter || category === categoryFilter;
        const matchesStatus = !statusFilter || status === statusFilter;

        if (matchesSearch && matchesCategory && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
