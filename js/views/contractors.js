import { getCurrentUser } from '../auth.js';
import { getContractors, addContractor } from '../store.js';

function renderContractorModal(root) {
    const modalHTML = `
        <div id="contractor-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Add New Contractor</h2>
                    <span id="close-modal-btn" class="close-btn">&times;</span>
                </div>
                <form id="contractor-form">
                    <div class="form-group">
                        <label for="contractor-name" class="form-label">Company Name</label>
                        <input type="text" id="contractor-name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="contractor-trade" class="form-label">Trade</label>
                        <input type="text" id="contractor-trade" class="form-control" required>
                    </div>
                     <div class="form-group">
                        <label for="contractor-status" class="form-label">Status</label>
                        <select id="contractor-status" class="form-control">
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Contractor</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('contractor-modal').remove();
    });

    document.getElementById('contractor-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newContractor = {
            name: document.getElementById('contractor-name').value,
            trade: document.getElementById('contractor-trade').value,
            status: document.getElementById('contractor-status').value,
        };
        addContractor(newContractor);
        document.getElementById('contractor-modal').remove();
        renderContractors(root); 
    });
}

export function renderContractors(root) {
    const currentUser = getCurrentUser();
    const contractors = getContractors();

    const canAddContractor = currentUser.role === 'Admin' || currentUser.role === 'Manager';

    const tableRows = contractors.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.trade}</td>
            <td><span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span></td>
            <td>${new Date(c.joinedDate).toLocaleDateString()}</td>
        </tr>
    `).join('');

    root.innerHTML = `
        <div class="page-header">
            ${canAddContractor ? '<button id="add-contractor-btn" class="btn btn-primary">New Contractor</button>' : ''}
        </div>
        <div class="card">
            <div class="card-header">Contractor Directory</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Trade</th>
                        <th>Status</th>
                        <th>Since</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    if (canAddContractor) {
        document.getElementById('add-contractor-btn').addEventListener('click', () => renderContractorModal(root));
    }
}
