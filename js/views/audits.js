import {
    getAuditRecords,
    addAuditRecord,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

let unsubscribe;

export function renderAuditsView() {
    // Initial render
    setTimeout(() => renderAudits(document.getElementById('app-root')), 0);
    return '<div id="audits-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderAudits(container) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/audits')) {
             renderAudits(container);
        }
    });

    const audits = getAuditRecords();
    // Sort by date descending
    audits.sort((a, b) => new Date(b.date) - new Date(a.date));

    const html = `
        <div class="page-header">
            <h1 class="page-title">Audit Management</h1>
            <div class="page-actions">
                <button class="btn btn-secondary" id="export-btn">Export Report</button>
                <button class="btn btn-primary" id="create-audit-btn">Schedule Audit</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search audits...">
                <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>
        </div>

        <div class="row">
            <div class="col-8">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Audit Schedule & History</h2>
                    </div>
                    <div class="table-responsive">
                        <table class="table" id="audits-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Date</th>
                                    <th>Auditor</th>
                                    <th>Status</th>
                                    <th>Findings</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${audits.map(audit => `
                                    <tr data-id="${audit.id}">
                                        <td><strong>${audit.title}</strong></td>
                                        <td>${new Date(audit.date).toLocaleDateString()}</td>
                                        <td>${getAuditorName(audit.auditorId)}</td>
                                        <td><span class="badge badge-${getStatusBadgeClass(audit.status)}">${audit.status}</span></td>
                                        <td>${audit.findings}</td>
                                        <td>
                                            <button class="btn-icon view-btn" title="View Details" data-id="${audit.id}">👁️</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                     ${audits.length === 0 ? '<div class="empty-state"><p>No audits found.</p></div>' : ''}
                </div>
            </div>

            <div class="col-4">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Audit Statistics</h2>
                    </div>
                    <div class="card-body">
                        <div class="stat-row">
                            <span>Total Audits</span>
                            <strong>${audits.length}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Completed</span>
                            <strong>${audits.filter(a => a.status === 'Completed').length}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Open Findings</span>
                            <strong>${audits.reduce((acc, curr) => acc + curr.findings, 0)}</strong>
                        </div>
                         <div style="margin-top: 20px;">
                            <canvas id="audit-compliance-chart" width="100%" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Render simple chart
    renderComplianceChart();

    document.getElementById('create-audit-btn').addEventListener('click', showCreateAuditModal);
    document.getElementById('search-input').addEventListener('input', (e) => filterAudits(e.target.value));
    document.getElementById('filter-status').addEventListener('change', () => filterAudits());

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showAuditDetailModal(btn.dataset.id));
    });
}

function getAuditorName(id) {
    // Mock user lookup - in real app would come from store.users
    const auditors = {
        1: 'Alice Smith',
        2: 'Bob Johnson',
        3: 'Charlie Brown'
    };
    return auditors[id] || 'Unknown Auditor';
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Completed': return 'success';
        case 'In Progress': return 'warning';
        case 'Planned': return 'info';
        default: return 'secondary';
    }
}

function filterAudits(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;

    const rows = document.querySelectorAll('#audits-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const status = row.querySelector('td:nth-child(4)').innerText;

        const matchesSearch = text.includes(term);
        const matchesStatus = !statusFilter || status === statusFilter;

        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showCreateAuditModal() {
    const formHtml = `
        <form id="create-audit-form">
            <div class="form-group">
                <label for="audit-title">Audit Title *</label>
                <input type="text" id="audit-title" name="title" class="form-control" required>
            </div>
            <div class="row">
                <div class="col-6">
                    <div class="form-group">
                        <label for="audit-date">Date *</label>
                        <input type="date" id="audit-date" name="date" class="form-control" required>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="audit-auditor">Lead Auditor *</label>
                        <select id="audit-auditor" name="auditorId" class="form-control" required>
                            <option value="">Select Auditor</option>
                            <option value="1">Alice Smith</option>
                            <option value="2">Bob Johnson</option>
                            <option value="3">Charlie Brown</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="audit-desc">Description</label>
                <textarea id="audit-desc" name="description" class="form-control" rows="3"></textarea>
            </div>
             <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Schedule Audit</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Schedule New Audit' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('create-audit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);
            const newAudit = {
                title: formData.get('title'),
                date: new Date(formData.get('date')),
                auditorId: parseInt(formData.get('auditorId')),
                description: formData.get('description'),
                status: 'Planned',
                findings: 0
            };

            addAuditRecord(newAudit);
            Notification.show('Audit scheduled successfully', { type: 'success' });
            modal.close();
        }
    });
}

function showAuditDetailModal(id) {
    const audits = getAuditRecords();
    const audit = audits.find(a => a.id == id);
    if (!audit) return;

    const html = `
        <div class="audit-detail">
            <div class="detail-row">
                <label>Status:</label>
                <span class="badge badge-${getStatusBadgeClass(audit.status)}">${audit.status}</span>
            </div>
            <div class="detail-row">
                <label>Date:</label>
                <span>${new Date(audit.date).toLocaleDateString()}</span>
            </div>
             <div class="detail-row">
                <label>Lead Auditor:</label>
                <span>${getAuditorName(audit.auditorId)}</span>
            </div>
            <div class="detail-section">
                <h3>Description</h3>
                <p>${audit.description}</p>
            </div>
            <div class="detail-section">
                <h3>Findings (${audit.findings})</h3>
                <p class="text-muted">Detailed findings list would appear here.</p>
                <button class="btn btn-sm btn-outline">Add Finding</button>
            </div>
        </div>
        <div class="modal-footer text-right mt-4">
             <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `;

    const modal = Modal.show(html, { title: audit.title });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
}

function renderComplianceChart() {
    const ctx = document.getElementById('audit-compliance-chart');
    if (!ctx || !window.Chart) return;

    // Simple mock data for chart
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Compliant', 'Non-Compliant', 'Observations'],
            datasets: [{
                data: [75, 10, 15],
                backgroundColor: ['#2e7d32', '#d32f2f', '#f9a825'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
