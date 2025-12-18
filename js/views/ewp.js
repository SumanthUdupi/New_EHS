import {
    getWorkPermits,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

let unsubscribe;

export function renderEWPView() {
    setTimeout(() => renderEWP(document.getElementById('app-root')), 0);
    return '<div id="ewp-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderEWP(container) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/ewp')) {
             renderEWP(container);
        }
    });

    const permits = getWorkPermits();
    permits.sort((a, b) => new Date(b.validFrom) - new Date(a.validFrom));

    const html = `
        <div class="page-header">
            <h1 class="page-title">Electronic Work Permits (e-PTW)</h1>
            <div class="page-actions">
                <button class="btn btn-primary" id="create-permit-btn">Create Permit</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search permits...">
                <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="Completed">Completed</option>
                    <option value="Expired/Cancelled">Expired/Cancelled</option>
                </select>
                <select id="filter-type" class="form-select">
                    <option value="">All Types</option>
                    <option value="Hot Work">Hot Work</option>
                    <option value="Confined Space">Confined Space</option>
                    <option value="LOTO">LOTO</option>
                    <option value="General">General</option>
                </select>
            </div>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table class="table" id="permits-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>Valid From</th>
                            <th>Valid To</th>
                            <th>Applicant</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${permits.map(p => `
                            <tr data-id="${p.id}">
                                <td>#${p.id}</td>
                                <td><strong>${p.type}</strong></td>
                                <td>${p.location}</td>
                                <td>${new Date(p.validFrom).toLocaleString()}</td>
                                <td>${new Date(p.validTo).toLocaleString()}</td>
                                <td>${p.applicantName}</td>
                                <td><span class="badge badge-${getStatusBadgeClass(p.status)}">${p.status}</span></td>
                                <td>
                                    <button class="btn-icon view-btn" title="View" data-id="${p.id}">👁️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
             ${permits.length === 0 ? '<div class="empty-state"><p>No work permits found.</p></div>' : ''}
        </div>
    `;

    container.innerHTML = html;

    document.getElementById('create-permit-btn').addEventListener('click', showCreatePermitModal);
    document.getElementById('search-input').addEventListener('input', (e) => filterPermits(e.target.value));
    document.getElementById('filter-status').addEventListener('change', () => filterPermits());
    document.getElementById('filter-type').addEventListener('change', () => filterPermits());

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showPermitDetailModal(btn.dataset.id));
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Active': return 'success';
        case 'Completed': return 'info';
        case 'Expired/Cancelled': return 'secondary';
        case 'Pending': return 'warning';
        default: return 'secondary';
    }
}

function filterPermits(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const typeFilter = document.getElementById('filter-type').value;

    const rows = document.querySelectorAll('#permits-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const status = row.querySelector('td:nth-child(7)').innerText;
        const type = row.querySelector('td:nth-child(2)').innerText;

        const matchesSearch = text.includes(term);
        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesType = !typeFilter || type === typeFilter;

        if (matchesSearch && matchesStatus && matchesType) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showCreatePermitModal() {
    // Note: In a real app, this would be a multi-step wizard
    const formHtml = `
        <form id="create-permit-form">
            <div class="row">
                <div class="col-6">
                     <div class="form-group">
                        <label for="permit-type">Permit Type *</label>
                         <select id="permit-type" name="type" class="form-control" required>
                            <option value="">Select Type</option>
                            <option value="Hot Work">Hot Work</option>
                            <option value="Confined Space">Confined Space</option>
                            <option value="LOTO">LOTO (Lock Out Tag Out)</option>
                            <option value="Height Work">Work at Height</option>
                            <option value="General">General</option>
                        </select>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="permit-location">Location *</label>
                        <input type="text" id="permit-location" name="location" class="form-control" required>
                    </div>
                </div>
            </div>

            <fieldset class="form-section">
                <legend>Validity Period</legend>
                <div class="row">
                    <div class="col-6">
                         <div class="form-group">
                            <label for="permit-from">From *</label>
                            <input type="datetime-local" id="permit-from" name="validFrom" class="form-control" required>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label for="permit-to">To *</label>
                            <input type="datetime-local" id="permit-to" name="validTo" class="form-control" required>
                        </div>
                    </div>
                </div>
            </fieldset>

            <div class="form-group">
                <label for="permit-hazards">Identify Hazards</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" name="hazards" value="Fire"> Fire/Explosion</label>
                    <label><input type="checkbox" name="hazards" value="Toxic Gas"> Toxic Gas</label>
                    <label><input type="checkbox" name="hazards" value="Electrical"> Electrical Shock</label>
                    <label><input type="checkbox" name="hazards" value="Falling"> Falling Objects</label>
                </div>
            </div>

             <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Request Permit</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Create Work Permit' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('create-permit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // In this prototype, we won't actually implement the full logic, just close
        Notification.show('Permit request simulated (Prototype)', { type: 'info' });
        modal.close();
    });
}

function showPermitDetailModal(id) {
    const permits = getWorkPermits();
    const p = permits.find(perm => perm.id == id);
    if (!p) return;

    const html = `
        <div class="permit-detail">
             <div class="detail-header mb-4">
                <h2 class="h3">Permit #${p.id}: ${p.type}</h2>
                <span class="badge badge-${getStatusBadgeClass(p.status)}">${p.status}</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                     <div class="detail-row">
                        <label>Location:</label>
                        <span>${p.location}</span>
                    </div>
                     <div class="detail-row">
                        <label>Applicant:</label>
                        <span>${p.applicantName}</span>
                    </div>
                </div>
                <div>
                    <div class="detail-row">
                        <label>Valid From:</label>
                        <span>${new Date(p.validFrom).toLocaleString()}</span>
                    </div>
                     <div class="detail-row">
                        <label>Valid To:</label>
                        <span>${new Date(p.validTo).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <hr>

            <div class="permit-workflow">
                <h3>Approval Workflow</h3>
                <div class="steps">
                    <div class="step completed">
                        <div class="step-icon">✓</div>
                        <div class="step-content">
                            <h4>Request Submitted</h4>
                            <p>${new Date(p.validFrom).toLocaleDateString()}</p>
                        </div>
                    </div>
                     <div class="step completed">
                        <div class="step-icon">✓</div>
                        <div class="step-content">
                            <h4>Risk Assessment</h4>
                            <p>Auto-approved (Low Risk)</p>
                        </div>
                    </div>
                    <div class="step ${p.status === 'Active' ? 'active' : ''}">
                         <div class="step-icon">${p.status === 'Active' ? '●' : '○'}</div>
                        <div class="step-content">
                            <h4>Supervisor Approval</h4>
                            <p>${p.status === 'Active' ? 'Approved by Supervisor' : 'Pending'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer text-right mt-4">
             <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `;

    const modal = Modal.show(html, { title: 'Work Permit Details' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
}
