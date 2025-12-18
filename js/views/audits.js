import { getCurrentUser } from '../auth.js';
import { getAuditRecords, addAuditRecord } from '../store.js';

function renderAuditModal(root) {
    const modalHTML = `
        <div id="audit-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">New Audit</h2>
                    <span id="close-modal-btn" class="close-btn">&times;</span>
                </div>
                <form id="audit-form">
                    <div class="form-group">
                        <label for="audit-title" class="form-label">Title</label>
                        <input type="text" id="audit-title" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="audit-date" class="form-label">Date</label>
                        <input type="date" id="audit-date" class="form-control" required>
                    </div>
                     <div class="form-group">
                        <label for="audit-status" class="form-label">Status</label>
                        <select id="audit-status" class="form-control">
                            <option>Planned</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                            <option>Canceled</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="audit-findings" class="form-label">Number of Findings</label>
                        <input type="number" id="audit-findings" class="form-control" value="0" min="0">
                    </div>
                    <button type="submit" class="btn btn-primary">Create Audit</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('audit-modal').remove();
    });

    document.getElementById('audit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = getCurrentUser();
        const newRecord = {
            title: document.getElementById('audit-title').value,
            date: new Date(document.getElementById('audit-date').value),
            status: document.getElementById('audit-status').value,
            findings: parseInt(document.getElementById('audit-findings').value),
            auditorId: currentUser.id, // Assign to current user by default
        };
        addAuditRecord(newRecord);
        document.getElementById('audit-modal').remove();
        renderAudits(root); 
    });
}

export function renderAudits(root) {
    const currentUser = getCurrentUser();
    const auditRecords = getAuditRecords();

    const canAddRecord = currentUser.role === 'Admin' || currentUser.role === 'Manager';

    const getStatusClass = (status) => {
        switch (status) {
            case 'Planned': return 'status-pending';
            case 'In Progress': return 'status-in-progress';
            case 'Completed': return 'status-completed';
            case 'Canceled': return 'status-critical';
            default: return 'status-pending';
        }
    };

    const tableRows = auditRecords.map(rec => `
        <tr>
            <td>${rec.title}</td>
            <td>${new Date(rec.date).toLocaleDateString()}</td>
            <td><span class="status-badge ${getStatusClass(rec.status)}">${rec.status}</span></td>
            <td>${rec.findings}</td>
        </tr>
    `).join('');

    root.innerHTML = `
        <div class="page-header">
            ${canAddRecord ? '<button id="add-audit-btn" class="btn btn-primary">New Audit</button>' : ''}
        </div>
        <div class="card">
            <div class="card-header">Audit Records</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Findings</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    if (canAddRecord) {
        document.getElementById('add-audit-btn').addEventListener('click', () => renderAuditModal(root));
    }
}
