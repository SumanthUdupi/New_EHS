import {
    subscribe
} from '../store.js';
import { Modal, Notification } from '../utils/util.js';

let unsubscribe;

export function renderConfigurationView() {
    setTimeout(() => renderConfiguration(document.getElementById('app-root')), 0);
    return '<div id="configuration-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderConfiguration(container) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/configuration')) {
             renderConfiguration(container);
        }
    });

    const html = `
        <div class="page-header">
            <h1 class="page-title">System Configuration</h1>
        </div>

        <div class="row">
            <div class="col-3">
                <div class="card p-0">
                    <div class="list-group list-group-flush" id="config-nav">
                        <button class="list-group-item list-group-item-action active" data-section="general">General Settings</button>
                        <button class="list-group-item list-group-item-action" data-section="users">User Management</button>
                        <button class="list-group-item list-group-item-action" data-section="workflows">Approval Workflows</button>
                        <button class="list-group-item list-group-item-action" data-section="notifications">Notifications</button>
                        <button class="list-group-item list-group-item-action" data-section="integrations">Integrations</button>
                    </div>
                </div>
            </div>

            <div class="col-9">
                <div class="card">
                    <div class="card-body" id="config-content">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Default load
    loadSection('general');

    document.querySelectorAll('#config-nav button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#config-nav button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadSection(e.target.dataset.section);
        });
    });
}

function loadSection(section) {
    const container = document.getElementById('config-content');

    switch(section) {
        case 'general':
            container.innerHTML = `
                <h3>General Settings</h3>
                <form id="general-settings-form">
                    <div class="form-group">
                        <label>Organization Name</label>
                        <input type="text" class="form-control" value="Acme Corp Global EHS">
                    </div>
                    <div class="form-group">
                        <label>Timezone</label>
                        <select class="form-control">
                            <option>UTC-05:00 Eastern Time</option>
                            <option>UTC-08:00 Pacific Time</option>
                            <option>UTC+00:00 GMT</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Language</label>
                         <select class="form-control">
                            <option>English (US)</option>
                            <option>Spanish</option>
                            <option>French</option>
                        </select>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" id="dark-mode-toggle">
                        <label for="dark-mode-toggle">Enable Dark Mode (Beta)</label>
                    </div>
                    <button type="submit" class="btn btn-primary mt-3">Save Changes</button>
                </form>
            `;
            break;

        case 'users':
            container.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3>User Management</h3>
                    <button class="btn btn-sm btn-primary">Add User</button>
                </div>
                <table class="table">
                    <thead>
                        <tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Alice Smith</td><td>Admin</td><td>alice@example.com</td><td>Active</td></tr>
                        <tr><td>Bob Johnson</td><td>Manager</td><td>bob@example.com</td><td>Active</td></tr>
                        <tr><td>Charlie Brown</td><td>Employee</td><td>charlie@example.com</td><td>Active</td></tr>
                    </tbody>
                </table>
            `;
            break;

        case 'workflows':
            container.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3>Approval Workflows</h3>
                    <button class="btn btn-sm btn-primary">Create Workflow</button>
                </div>
                <div class="workflow-item card mb-3">
                    <div class="card-body">
                        <h5>Incident Investigation Approval</h5>
                        <p class="text-muted">Applied to: Incidents (Severity > Medical Treatment)</p>
                        <div class="steps-viz d-flex align-items-center">
                            <span class="badge badge-secondary">EHS Officer</span>
                            <span class="mx-2">→</span>
                            <span class="badge badge-secondary">Site Manager</span>
                            <span class="mx-2">→</span>
                            <span class="badge badge-secondary">Regional Director</span>
                        </div>
                    </div>
                </div>
                 <div class="workflow-item card mb-3">
                    <div class="card-body">
                        <h5>Work Permit Authorization</h5>
                        <p class="text-muted">Applied to: Hot Work Permits</p>
                         <div class="steps-viz d-flex align-items-center">
                            <span class="badge badge-secondary">Supervisor</span>
                            <span class="mx-2">→</span>
                            <span class="badge badge-secondary">Safety Manager</span>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'integrations':
             container.innerHTML = `
                <h3>Integrations</h3>
                <div class="list-group">
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h5>HR System (Workday)</h5>
                            <p class="text-muted mb-0">Sync employee profiles and roles</p>
                        </div>
                        <button class="btn btn-outline btn-sm">Configure</button>
                    </div>
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h5>IoT Sensors (AWS IoT)</h5>
                            <p class="text-muted mb-0">Real-time hazard monitoring</p>
                        </div>
                        <button class="btn btn-outline btn-sm">Configure</button>
                    </div>
                </div>
            `;
            break;

        default:
            container.innerHTML = '<p>Select a section to configure.</p>';
    }

    const form = document.getElementById('general-settings-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Notification.show('Settings saved successfully', { type: 'success' });
        });
    }
}
