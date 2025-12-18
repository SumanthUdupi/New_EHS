import { getCurrentUser } from '../auth.js';
import { getComplianceRecords, addComplianceRecord } from '../store.js';

function renderComplianceModal(root) {
    const modalHTML = `
        <div id="compliance-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">New Compliance Obligation</h2>
                    <span id="close-modal-btn" class="close-btn">&times;</span>
                </div>
                <form id="compliance-form">
                    <div class="form-group">
                        <label for="compliance-title" class="form-label">Title</label>
                        <input type="text" id="compliance-title" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="compliance-jurisdiction" class="form-label">Jurisdiction</label>
                        <input type="text" id="compliance-jurisdiction" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="compliance-duedate" class="form-label">Due Date</label>
                        <input type="date" id="compliance-duedate" class="form-control" required>
                    </div>
                     <div class="form-group">
                        <label for="compliance-status" class="form-label">Status</label>
                        <select id="compliance-status" class="form-control">
                            <option>Due</option>
                            <option>Completed</option>
                            <option>Overdue</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Obligation</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('compliance-modal').remove();
    });

    document.getElementById('compliance-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = getCurrentUser();
        const newRecord = {
            title: document.getElementById('compliance-title').value,
            jurisdiction: document.getElementById('compliance-jurisdiction').value,
            dueDate: new Date(document.getElementById('compliance-duedate').value),
            status: document.getElementById('compliance-status').value,
            assignedTo: currentUser.id, // Assign to current user by default
        };
        addComplianceRecord(newRecord);
        document.getElementById('compliance-modal').remove();
        renderCompliance(root); 
    });
}

export function renderCompliance(root) {
    const currentUser = getCurrentUser();
    const complianceRecords = getComplianceRecords();

    const canAddRecord = currentUser.role === 'Admin' || currentUser.role === 'Manager';

    const getStatusClass = (status) => {
        switch (status) {
            case 'Due': return 'status-in-progress'; // Yellow/Blueish
            case 'Completed': return 'status-completed'; // Green
            case 'Overdue': return 'status-critical'; // Red
            default: return 'status-pending';
        }
    };

    const tableRows = complianceRecords.map(rec => `
        <tr>
            <td>${rec.title}</td>
            <td>${rec.jurisdiction}</td>
            <td>${new Date(rec.dueDate).toLocaleDateString()}</td>
            <td><span class="status-badge ${getStatusClass(rec.status)}">${rec.status}</span></td>
        </tr>
    `).join('');

    root.innerHTML = `
        <div class="page-header">
            ${canAddRecord ? '<button id="add-compliance-btn" class="btn btn-primary">New Compliance Obligation</button>' : ''}
        </div>
        <div class="card">
            <div class="card-header">Compliance Records</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Jurisdiction</th>
                        <th>Due Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    if (canAddRecord) {
        document.getElementById('add-compliance-btn').addEventListener('click', () => renderComplianceModal(root));
    }
}
