import { getCurrentUser } from '../auth.js';
import { getInspections, addInspection } from '../store.js';

function renderInspectionModal(root) {
    const modalHTML = `
        <div id="inspection-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Start New Inspection</h2>
                    <span id="close-modal-btn" class="close-btn">&times;</span>
                </div>
                <form id="inspection-form">
                    <div class="form-group">
                        <label for="inspection-title" class="form-label">Title / Area</label>
                        <input type="text" id="inspection-title" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="inspection-status" class="form-label">Status</label>
                        <select id="inspection-status" class="form-control">
                            <option>In Progress</option>
                            <option>Completed</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Start Inspection</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('inspection-modal').remove();
    });

    document.getElementById('inspection-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = getCurrentUser();
        const newInspection = {
            title: document.getElementById('inspection-title').value,
            status: document.getElementById('inspection-status').value,
            inspectorId: currentUser.id,
            findings: 0, // Default to 0 findings initially
        };
        addInspection(newInspection);
        document.getElementById('inspection-modal').remove();
        renderInspections(root); 
    });
}

export function renderInspections(root) {
    const currentUser = getCurrentUser();
    const inspections = getInspections();

    const canCreateInspection = currentUser.role === 'Admin' || currentUser.role === 'Manager';

    const tableRows = inspections.map(i => `
        <tr>
            <td>${i.title}</td>
            <td>${i.inspectorName}</td>
            <td>${new Date(i.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-${i.status.toLowerCase().replace(' ', '-')}">${i.status}</span></td>
            <td>${i.findings}</td>
        </tr>
    `).join('');

    root.innerHTML = `
        <div class="page-header">
            ${canCreateInspection ? '<button id="add-inspection-btn" class="btn btn-primary">New Inspection</button>' : ''}
        </div>
        <div class="card">
            <div class="card-header">Inspections & Gemba Walks</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title / Area</th>
                        <th>Inspector</th>
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

    if (canCreateInspection) {
        document.getElementById('add-inspection-btn').addEventListener('click', () => renderInspectionModal(root));
    }
}
