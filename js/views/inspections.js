import {
    getInspections,
    addInspection,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

let unsubscribe;

export function renderInspectionsView() {
    // Initial render
    setTimeout(() => renderInspections(document.getElementById('app-root')), 0);
    return '<div id="inspections-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderInspections(container) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/inspections')) {
             renderInspections(container);
        }
    });

    const inspections = getInspections();
    // Sort by date descending
    inspections.sort((a, b) => new Date(b.date) - new Date(a.date));

    const html = `
        <div class="page-header">
            <h1 class="page-title">Inspections / Gemba Walks</h1>
            <div class="page-actions">
                <button class="btn btn-primary" id="create-inspection-btn">New Inspection</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search inspections...">
                <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Scheduled">Scheduled</option>
                </select>
            </div>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table class="table" id="inspections-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Inspector</th>
                            <th>Findings</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inspections.map(insp => `
                            <tr data-id="${insp.id}">
                                <td><strong>${insp.title}</strong></td>
                                <td>${new Date(insp.date).toLocaleDateString()}</td>
                                <td>${insp.inspectorName}</td>
                                <td>${insp.findings} Issues</td>
                                <td><span class="badge badge-${getStatusBadgeClass(insp.status)}">${insp.status}</span></td>
                                <td>
                                    <button class="btn-icon view-btn" title="View" data-id="${insp.id}">👁️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
             ${inspections.length === 0 ? '<div class="empty-state"><p>No inspections found.</p></div>' : ''}
        </div>
    `;

    container.innerHTML = html;

    document.getElementById('create-inspection-btn').addEventListener('click', showCreateInspectionModal);
    document.getElementById('search-input').addEventListener('input', (e) => filterInspections(e.target.value));
    document.getElementById('filter-status').addEventListener('change', () => filterInspections());

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showInspectionDetailModal(btn.dataset.id));
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Completed': return 'success';
        case 'In Progress': return 'warning';
        case 'Scheduled': return 'info';
        default: return 'secondary';
    }
}

function filterInspections(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;

    const rows = document.querySelectorAll('#inspections-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const status = row.querySelector('td:nth-child(5)').innerText;

        const matchesSearch = text.includes(term);
        const matchesStatus = !statusFilter || status === statusFilter;

        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showCreateInspectionModal() {
    const formHtml = `
        <form id="create-inspection-form">
            <div class="form-group">
                <label for="insp-title">Title *</label>
                <input type="text" id="insp-title" name="title" class="form-control" required placeholder="e.g., Weekly Safety Walk">
            </div>
            <div class="form-group">
                <label for="insp-inspector">Inspector *</label>
                <select id="insp-inspector" name="inspectorId" class="form-control" required>
                    <option value="">Select Inspector</option>
                    <option value="2">Bob Johnson</option>
                    <option value="1">Alice Smith</option>
                </select>
            </div>
            <div class="form-group">
                <label for="insp-desc">Description</label>
                <textarea id="insp-desc" name="description" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Start Inspection</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Start New Inspection' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('create-inspection-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);
            const newInsp = {
                title: formData.get('title'),
                inspectorId: parseInt(formData.get('inspectorId')),
                description: formData.get('description'), // Note: demo data doesn't assume description but good to have
                status: 'In Progress',
                findings: 0
            };

            addInspection(newInsp);
            Notification.show('Inspection started', { type: 'success' });
            modal.close();
        }
    });
}

function showInspectionDetailModal(id) {
    const inspections = getInspections();
    const insp = inspections.find(i => i.id == id);
    if (!insp) return;

    const html = `
        <div class="inspection-detail">
            <div class="detail-row">
                <label>Status:</label>
                <span class="badge badge-${getStatusBadgeClass(insp.status)}">${insp.status}</span>
            </div>
            <div class="detail-row">
                <label>Date:</label>
                <span>${new Date(insp.date).toLocaleDateString()}</span>
            </div>
             <div class="detail-row">
                <label>Inspector:</label>
                <span>${insp.inspectorName}</span>
            </div>

            <hr>

            <h3>Findings</h3>
            ${insp.findings > 0 ? `<p>${insp.findings} issues identified during this walk.</p>` : '<p>No issues found.</p>'}

            <div class="mock-checklist">
                <h4>Checklist Items</h4>
                <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 5px;">✅ Emergency exits clear</li>
                    <li style="margin-bottom: 5px;">✅ Fire extinguishers charged</li>
                    <li style="margin-bottom: 5px;">${insp.findings > 0 ? '❌ Walkways clear of debris' : '✅ Walkways clear of debris'}</li>
                </ul>
            </div>
        </div>
        <div class="modal-footer text-right mt-4">
             <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `;

    const modal = Modal.show(html, { title: insp.title });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
}
