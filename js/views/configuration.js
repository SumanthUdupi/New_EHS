import { getCurrentUser, login } from '../auth.js';
import { getState } from '../store.js';

export function renderConfiguration(root) {
    const currentUser = getCurrentUser();

    if (currentUser.role !== 'Admin') {
        root.innerHTML = `
            <div class="card">
                <h3>Access Denied</h3>
                <p>You do not have permission to view this page. Please contact an administrator.</p>
            </div>
        `;
        return;
    }

    const { users } = getState();

    const userOptions = users.map(u => 
        `<option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>${u.name} (${u.role})</option>`
    ).join('');

    const userRows = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
        </tr>
    `).join('');

    root.innerHTML = `
        <div class="card">
            <h3>Simulated Login</h3>
            <p>Select a user to simulate their experience. The page will reload.</p>
            <div class="form-group" style="max-width: 300px;">
                <label for="user-switcher" class="form-label">Current User</label>
                <select id="user-switcher" class="form-control">${userOptions}</select>
            </div>
        </div>
        <div class="card">
            <div class="card-header">User Management</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    ${userRows}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('user-switcher').addEventListener('change', (e) => {
        login(e.target.value);
    });
}
