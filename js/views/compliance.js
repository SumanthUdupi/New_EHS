import {
    getComplianceRecords,
    addComplianceRecord,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

let unsubscribe;

export function renderComplianceView() {
    setTimeout(() => renderCompliance(document.getElementById('app-root')), 0);
    return '<div id="compliance-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderCompliance(container) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/compliance')) {
             renderCompliance(container);
        }
    });

    const records = getComplianceRecords();
    records.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const html = `
        <div class="page-header">
            <h1 class="page-title">Compliance Management</h1>
            <div class="page-actions">
                <button class="btn btn-secondary" id="calendar-view-btn">Calendar View</button>
                <button class="btn btn-primary" id="add-record-btn">Add Obligation</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search obligations...">
                <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="Due">Due</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Completed">Completed</option>
                </select>
                <select id="filter-jurisdiction" class="form-select">
                    <option value="">All Jurisdictions</option>
                    <option value="Federal OSHA">Federal OSHA</option>
                    <option value="State EPA">State EPA</option>
                    <option value="Local Fire Dept">Local Fire Dept</option>
                    <option value="Internal Policy">Internal Policy</option>
                </select>
            </div>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table class="table" id="compliance-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Jurisdiction</th>
                            <th>Due Date</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(rec => `
                            <tr data-id="${rec.id}">
                                <td><strong>${rec.title}</strong></td>
                                <td>${rec.jurisdiction}</td>
                                <td><span class="${isOverdue(rec.dueDate, rec.status) ? 'text-danger font-weight-bold' : ''}">${new Date(rec.dueDate).toLocaleDateString()}</span></td>
                                <td>${getUserName(rec.assignedTo)}</td>
                                <td><span class="badge badge-${getStatusBadgeClass(rec.status)}">${rec.status}</span></td>
                                <td>
                                    <button class="btn-icon view-btn" title="View" data-id="${rec.id}">👁️</button>
                                    <button class="btn-icon complete-btn" title="Mark Complete" data-id="${rec.id}">✓</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
             ${records.length === 0 ? '<div class="empty-state"><p>No compliance records found.</p></div>' : ''}
        </div>
    `;

    container.innerHTML = html;

    document.getElementById('add-record-btn').addEventListener('click', showAddRecordModal);
    document.getElementById('search-input').addEventListener('input', (e) => filterCompliance(e.target.value));
    document.getElementById('filter-status').addEventListener('change', () => filterCompliance());
    document.getElementById('filter-jurisdiction').addEventListener('change', () => filterCompliance());

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showRecordDetailModal(btn.dataset.id));
    });
}

function getUserName(id) {
    const users = {
        1: 'Alice Smith',
        2: 'Bob Johnson',
        3: 'Charlie Brown',
        4: 'Diana Prince',
        5: 'Ethan Hunt'
    };
    return users[id] || 'Unknown User';
}

function isOverdue(date, status) {
    if (status === 'Completed') return false;
    return new Date(date) < new Date();
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Completed': return 'success';
        case 'Overdue': return 'danger';
        case 'Due': return 'warning';
        default: return 'secondary';
    }
}

function filterCompliance(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const jurFilter = document.getElementById('filter-jurisdiction').value;

    const rows = document.querySelectorAll('#compliance-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const status = row.querySelector('td:nth-child(5)').innerText;
        const jurisdiction = row.querySelector('td:nth-child(2)').innerText;

        const matchesSearch = text.includes(term);
        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesJur = !jurFilter || jurisdiction === jurFilter;

        if (matchesSearch && matchesStatus && matchesJur) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showAddRecordModal() {
    const formHtml = `
        <form id="add-compliance-form">
            <div class="form-group">
                <label for="comp-title">Obligation Title *</label>
                <input type="text" id="comp-title" name="title" class="form-control" required>
            </div>
             <div class="row">
                <div class="col-6">
                    <div class="form-group">
                        <label for="comp-jur">Jurisdiction *</label>
                         <select id="comp-jur" name="jurisdiction" class="form-control" required>
                            <option value="">Select Jurisdiction</option>
                            <option value="Federal OSHA">Federal OSHA</option>
                            <option value="State EPA">State EPA</option>
                            <option value="State Environmental">State Environmental</option>
                            <option value="Local Fire Dept">Local Fire Dept</option>
                            <option value="Internal Policy">Internal Policy</option>
                        </select>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="comp-date">Due Date *</label>
                        <input type="date" id="comp-date" name="dueDate" class="form-control" required>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="comp-assignee">Assigned To *</label>
                 <select id="comp-assignee" name="assignedTo" class="form-control" required>
                    <option value="">Select User</option>
                    <option value="1">Alice Smith</option>
                    <option value="2">Bob Johnson</option>
                    <option value="3">Charlie Brown</option>
                </select>
            </div>
            <div class="form-group">
                <label for="comp-desc">Description</label>
                <textarea id="comp-desc" name="description" class="form-control" rows="3"></textarea>
            </div>
             <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Obligation</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Add Compliance Obligation' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('add-compliance-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);
            const newRecord = {
                title: formData.get('title'),
                jurisdiction: formData.get('jurisdiction'),
                dueDate: new Date(formData.get('dueDate')),
                assignedTo: parseInt(formData.get('assignedTo')),
                description: formData.get('description'),
                status: 'Due'
            };

            addComplianceRecord(newRecord);
            Notification.show('Compliance record added', { type: 'success' });
            modal.close();
        }
    });
}

function showRecordDetailModal(id) {
    const records = getComplianceRecords();
    const rec = records.find(r => r.id == id);
    if (!rec) return;

    const html = `
        <div class="compliance-detail">
            <div class="detail-row">
                <label>Status:</label>
                <span class="badge badge-${getStatusBadgeClass(rec.status)}">${rec.status}</span>
            </div>
            <div class="detail-row">
                <label>Due Date:</label>
                <span class="${isOverdue(rec.dueDate, rec.status) ? 'text-danger' : ''}">${new Date(rec.dueDate).toLocaleDateString()}</span>
            </div>
             <div class="detail-row">
                <label>Assigned To:</label>
                <span>${getUserName(rec.assignedTo)}</span>
            </div>
             <div class="detail-row">
                <label>Jurisdiction:</label>
                <span>${rec.jurisdiction}</span>
            </div>

            <hr>

            <div class="detail-section">
                <h3>Description</h3>
                <p>${rec.description}</p>
            </div>

            <div class="detail-section">
                <h3>Evidence</h3>
                <p class="text-muted">No evidence uploaded yet.</p>
                <button class="btn btn-sm btn-outline">Upload Evidence</button>
            </div>
        </div>
        <div class="modal-footer text-right mt-4">
             <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `;

    const modal = Modal.show(html, { title: rec.title });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
}
