import {
    getContractors,
    addContractor,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

let unsubscribe;

export function renderContractorsView() {
    setTimeout(() => renderContractors(document.getElementById('app-root')), 0);
    return '<div id="contractors-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderContractors(container) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/contractors')) {
             renderContractors(container);
        }
    });

    const contractors = getContractors();
    contractors.sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate));

    const html = `
        <div class="page-header">
            <h1 class="page-title">Contractor Management</h1>
            <div class="page-actions">
                <button class="btn btn-secondary" id="portal-btn">Contractor Portal</button>
                <button class="btn btn-primary" id="add-contractor-btn">Register Contractor</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search contractors...">
                <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                </select>
                <select id="filter-trade" class="form-select">
                    <option value="">All Trades</option>
                    <option value="Construction">Construction</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Janitorial">Janitorial</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="HVAC">HVAC</option>
                </select>
            </div>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table class="table" id="contractors-table">
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>Trade</th>
                            <th>Status</th>
                            <th>Date Joined</th>
                            <th>Safety Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contractors.map(c => `
                            <tr data-id="${c.id}">
                                <td><strong>${c.name}</strong></td>
                                <td>${c.trade}</td>
                                <td><span class="badge badge-${getStatusBadgeClass(c.status)}">${c.status}</span></td>
                                <td>${new Date(c.joinedDate).toLocaleDateString()}</td>
                                <td>${getSafetyScoreBadge(c.status)}</td>
                                <td>
                                    <button class="btn-icon view-btn" title="View Profile" data-id="${c.id}">👁️</button>
                                    <button class="btn-icon edit-btn" title="Edit" data-id="${c.id}">✏️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
             ${contractors.length === 0 ? '<div class="empty-state"><p>No contractors found.</p></div>' : ''}
        </div>
    `;

    container.innerHTML = html;

    document.getElementById('add-contractor-btn').addEventListener('click', showAddContractorModal);
    document.getElementById('search-input').addEventListener('input', (e) => filterContractors(e.target.value));
    document.getElementById('filter-status').addEventListener('change', () => filterContractors());
    document.getElementById('filter-trade').addEventListener('change', () => filterContractors());

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showContractorDetailModal(btn.dataset.id));
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Approved': return 'success';
        case 'Pending': return 'warning';
        case 'Suspended': return 'danger';
        default: return 'secondary';
    }
}

function getSafetyScoreBadge(status) {
    // Mock score based on status
    if (status === 'Approved') return '<span class="text-success font-weight-bold">95%</span>';
    if (status === 'Pending') return '<span class="text-muted">-</span>';
    return '<span class="text-danger font-weight-bold">65%</span>';
}

function filterContractors(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const tradeFilter = document.getElementById('filter-trade').value;

    const rows = document.querySelectorAll('#contractors-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const status = row.querySelector('td:nth-child(3)').innerText;
        const trade = row.querySelector('td:nth-child(2)').innerText;

        const matchesSearch = text.includes(term);
        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesTrade = !tradeFilter || trade === tradeFilter;

        if (matchesSearch && matchesStatus && matchesTrade) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showAddContractorModal() {
    const formHtml = `
        <form id="add-contractor-form">
            <div class="form-group">
                <label for="cont-name">Company Name *</label>
                <input type="text" id="cont-name" name="name" class="form-control" required>
            </div>
             <div class="row">
                <div class="col-6">
                    <div class="form-group">
                        <label for="cont-trade">Trade/Specialty *</label>
                         <select id="cont-trade" name="trade" class="form-control" required>
                            <option value="">Select Trade</option>
                            <option value="Construction">Construction</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Janitorial">Janitorial</option>
                            <option value="Plumbing">Plumbing</option>
                            <option value="HVAC">HVAC</option>
                             <option value="General">General</option>
                        </select>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="cont-contact">Contact Email *</label>
                        <input type="email" id="cont-contact" name="email" class="form-control" required>
                    </div>
                </div>
            </div>
             <div class="form-group">
                <label for="cont-status">Initial Status</label>
                 <select id="cont-status" name="status" class="form-control">
                    <option value="Pending">Pending Pre-Qualification</option>
                    <option value="Approved">Approved</option>
                </select>
            </div>
             <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Register</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Register New Contractor' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('add-contractor-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);
            const newContractor = {
                name: formData.get('name'),
                trade: formData.get('trade'),
                email: formData.get('email'),
                status: formData.get('status'),
            };

            addContractor(newContractor);
            Notification.show('Contractor registered successfully', { type: 'success' });
            modal.close();
        }
    });
}

function showContractorDetailModal(id) {
    const contractors = getContractors();
    const c = contractors.find(cont => cont.id == id);
    if (!c) return;

    const html = `
        <div class="contractor-detail">
            <div class="detail-header mb-4">
                <h2 class="h3">${c.name}</h2>
                <span class="badge badge-${getStatusBadgeClass(c.status)}">${c.status}</span>
            </div>

            <div class="row">
                <div class="col-6">
                    <div class="detail-row">
                        <label>Trade:</label>
                        <span>${c.trade}</span>
                    </div>
                    <div class="detail-row">
                        <label>Joined:</label>
                        <span>${new Date(c.joinedDate).toLocaleDateString()}</span>
                    </div>
                </div>
                 <div class="col-6">
                    <div class="detail-row">
                        <label>Contact:</label>
                         <a href="mailto:${c.email || ''}">${c.email || 'N/A'}</a>
                    </div>
                </div>
            </div>

            <hr>

            <ul class="nav nav-tabs" style="margin-bottom: 1rem;">
                <li class="nav-item"><a class="nav-link active" href="#">Documents</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Workers</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Performance</a></li>
            </ul>

            <div class="tab-content">
                <div class="document-list">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h4>Required Documents</h4>
                        <button class="btn btn-sm btn-outline">Upload</button>
                    </div>
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Status</th>
                                <th>Expiry</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Insurance Certificate</td>
                                <td><span class="badge badge-success badge-sm">Valid</span></td>
                                <td>2024-12-31</td>
                            </tr>
                             <tr>
                                <td>Safety Manual</td>
                                <td><span class="badge badge-warning badge-sm">Review Pending</span></td>
                                <td>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="modal-footer text-right mt-4">
             <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `;

    const modal = Modal.show(html, { title: 'Contractor Details' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
}
