import {
    getTrainingRecords,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

let unsubscribe;

export function renderTrainingView() {
    setTimeout(() => renderTraining(document.getElementById('app-root')), 0);
    return '<div id="training-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderTraining(container) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/training')) {
             renderTraining(container);
        }
    });

    const records = getTrainingRecords();
    records.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    const html = `
        <div class="page-header">
            <h1 class="page-title">Training & Competency</h1>
            <div class="page-actions">
                <button class="btn btn-secondary" id="catalog-btn">Course Catalog</button>
                <button class="btn btn-primary" id="schedule-training-btn">Schedule Training</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search records...">
                <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                </select>
            </div>
        </div>

        <div class="row">
            <div class="col-8">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Employee Certifications</h2>
                    </div>
                    <div class="table-responsive">
                        <table class="table" id="training-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Course</th>
                                    <th>Completion Date</th>
                                    <th>Expiry Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${records.map(rec => `
                                    <tr data-id="${rec.id}">
                                        <td><strong>${rec.userName}</strong></td>
                                        <td>${rec.courseName}</td>
                                        <td>${new Date(rec.completionDate).toLocaleDateString()}</td>
                                        <td>${new Date(rec.expiryDate).toLocaleDateString()}</td>
                                        <td><span class="badge badge-${getStatusBadgeClass(rec.status)}">${rec.status}</span></td>
                                        <td>
                                            <button class="btn-icon view-btn" title="View Certificate" data-id="${rec.id}">📜</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                     ${records.length === 0 ? '<div class="empty-state"><p>No training records found.</p></div>' : ''}
                </div>
            </div>
            <div class="col-4">
                <div class="card">
                     <div class="card-header">
                        <h2 class="card-title">Training Compliance</h2>
                    </div>
                    <div class="card-body">
                         <div style="height: 250px;">
                            <canvas id="training-chart"></canvas>
                        </div>
                        <div class="mt-4">
                            <h4>Needs Attention</h4>
                            <ul class="list-group">
                                ${records.filter(r => r.status === 'Expired').slice(0, 3).map(r => `
                                    <li class="list-group-item text-danger">
                                        ${r.userName} - ${r.courseName} (Expired)
                                    </li>
                                `).join('')}
                                 ${records.filter(r => r.status === 'Expiring Soon').slice(0, 3).map(r => `
                                    <li class="list-group-item text-warning">
                                        ${r.userName} - ${r.courseName} (Expiring)
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    renderChart(records);

    document.getElementById('schedule-training-btn').addEventListener('click', showScheduleTrainingModal);
    document.getElementById('search-input').addEventListener('input', (e) => filterRecords(e.target.value));
    document.getElementById('filter-status').addEventListener('change', () => filterRecords());

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showCertificateModal(btn.dataset.id));
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Active': return 'success';
        case 'Expiring Soon': return 'warning';
        case 'Expired': return 'danger';
        default: return 'secondary';
    }
}

function filterRecords(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;

    const rows = document.querySelectorAll('#training-table tbody tr');

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

function renderChart(records) {
    const ctx = document.getElementById('training-chart');
    if (!ctx || !window.Chart) return;

    const active = records.filter(r => r.status === 'Active').length;
    const expiring = records.filter(r => r.status === 'Expiring Soon').length;
    const expired = records.filter(r => r.status === 'Expired').length;

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Active', 'Expiring Soon', 'Expired'],
            datasets: [{
                data: [active, expiring, expired],
                backgroundColor: ['#2e7d32', '#f9a825', '#d32f2f'],
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

function showScheduleTrainingModal() {
    const formHtml = `
        <form id="schedule-training-form">
            <div class="form-group">
                <label for="tr-course">Course *</label>
                 <select id="tr-course" name="course" class="form-control" required>
                    <option value="">Select Course</option>
                    <option value="Safety Orientation">Safety Orientation</option>
                    <option value="Equipment-specific: Forklift">Equipment: Forklift</option>
                    <option value="Regulatory: COSHH">Regulatory: COSHH</option>
                    <option value="Emergency Response">Emergency Response</option>
                    <option value="Fire Safety">Fire Safety</option>
                </select>
            </div>
             <div class="row">
                <div class="col-6">
                    <div class="form-group">
                        <label for="tr-date">Date & Time *</label>
                        <input type="datetime-local" id="tr-date" name="date" class="form-control" required>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="tr-trainer">Trainer *</label>
                        <input type="text" id="tr-trainer" name="trainer" class="form-control" required placeholder="Internal or External">
                    </div>
                </div>
            </div>
             <div class="form-group">
                <label for="tr-attendees">Attendees (Select Users)</label>
                 <select id="tr-attendees" name="attendees" class="form-control" multiple>
                    <option value="1">Alice Smith</option>
                    <option value="2">Bob Johnson</option>
                    <option value="3">Charlie Brown</option>
                     <option value="4">Diana Prince</option>
                </select>
                <small class="text-muted">Hold Ctrl/Cmd to select multiple.</small>
            </div>
             <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Schedule Session</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Schedule Training Session' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('schedule-training-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // Prototype simulation
        Notification.show('Training session scheduled', { type: 'success' });
        modal.close();
    });
}

function showCertificateModal(id) {
    const records = getTrainingRecords();
    const rec = records.find(r => r.id == id);
    if (!rec) return;

    const html = `
        <div class="certificate-preview" style="text-align: center; padding: 20px; border: 5px double #333; margin-bottom: 20px;">
            <h2>Certificate of Completion</h2>
            <p>This certifies that</p>
            <h3>${rec.userName}</h3>
            <p>has successfully completed the course</p>
            <h3>${rec.courseName}</h3>
            <p>on ${new Date(rec.completionDate).toLocaleDateString()}</p>
            <br>
            <p class="text-muted text-sm">Valid until: ${new Date(rec.expiryDate).toLocaleDateString()}</p>
        </div>
        <div class="modal-footer text-right">
             <button class="btn btn-secondary">Download PDF</button>
             <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `;

    const modal = Modal.show(html, { title: 'Certificate View' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
}
