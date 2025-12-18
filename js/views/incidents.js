import { getState, addIncident, getIncidentById, updateIncident, addCorrectiveAction } from '../store.js';

function renderInvestigationModal(root, incident) {
    const { users } = getState();
    const userOptions = users.map(user => `<option value="${user.id}">${user.name} (${user.role})</option>`).join('');

    const modalHTML = `
        <div id="investigation-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Start Investigation</h2>
                    <span id="close-investigation-modal-btn" class="close-btn" aria-label="Close">&times;</span>
                </div>
                <form id="investigation-form">
                    <div class="form-group">
                        <label for="investigation-team" class="form-label">Assign Investigation Team</label>
                        <select id="investigation-team" class="form-control" multiple required>
                            ${userOptions}
                        </select>
                        <small class="form-text">Hold Ctrl (Cmd on Mac) to select multiple</small>
                    </div>
                    <button type="submit" class="btn btn-primary">Start Investigation</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('close-investigation-modal-btn').addEventListener('click', () => {
        document.getElementById('investigation-modal').remove();
    });

    document.getElementById('investigation-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const teamSelect = document.getElementById('investigation-team');
        const team = Array.from(teamSelect.selectedOptions).map(option => parseInt(option.value));

        updateIncident(incident.id, {
            status: 'Under Investigation',
            investigation: {
                team,
                startedDate: new Date(),
                rootCause: '',
                method: ''
            }
        });
        document.getElementById('investigation-modal').remove();
        renderIncidentDetail(root, { id: incident.id });
    });
}

function renderRCAModal(root, incident) {
    const modalHTML = `
        <div id="rca-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Root Cause Analysis</h2>
                    <span id="close-rca-modal-btn" class="close-btn" aria-label="Close">&times;</span>
                </div>
                <form id="rca-form">
                    <div class="form-group">
                        <label for="rca-method" class="form-label">RCA Method</label>
                        <select id="rca-method" class="form-control">
                            <option value="Fishbone Diagram">Fishbone Diagram</option>
                            <option value="5 Whys">5 Whys</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="root-cause" class="form-label">Root Cause</label>
                        <textarea id="root-cause" class="form-control" rows="4" required>${incident.investigation?.rootCause || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Update RCA</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('close-rca-modal-btn').addEventListener('click', () => {
        document.getElementById('rca-modal').remove();
    });

    document.getElementById('rca-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const method = document.getElementById('rca-method').value;
        const rootCause = document.getElementById('root-cause').value;

        updateIncident(incident.id, {
            investigation: {
                ...incident.investigation,
                method,
                rootCause
            }
        });
        document.getElementById('rca-modal').remove();
        renderIncidentDetail(root, { id: incident.id });
    });
}

function renderCAPAModal(root, incident) {
    const { users } = getState();
    const userOptions = users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');

    const modalHTML = `
        <div id="capa-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Generate Corrective Action Plan (CAPA)</h2>
                    <span id="close-capa-modal-btn" class="close-btn" aria-label="Close">&times;</span>
                </div>
                <form id="capa-form">
                    <div class="form-group">
                        <label for="capa-description" class="form-label">Action Description</label>
                        <textarea id="capa-description" class="form-control" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="capa-assignee" class="form-label">Assignee</label>
                        <select id="capa-assignee" class="form-control" required>
                            <option value="">Select Assignee</option>
                            ${userOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="capa-due-date" class="form-label">Due Date</label>
                        <input type="date" id="capa-due-date" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Add CAPA</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Set default due date to 2 weeks from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    document.getElementById('capa-due-date').value = dueDate.toISOString().split('T')[0];

    document.getElementById('close-capa-modal-btn').addEventListener('click', () => {
        document.getElementById('capa-modal').remove();
    });

    document.getElementById('capa-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const description = document.getElementById('capa-description').value;
        const assignee = parseInt(document.getElementById('capa-assignee').value);
        const dueDate = new Date(document.getElementById('capa-due-date').value);

        addCorrectiveAction({
            incidentId: incident.id,
            description,
            assignee,
            dueDate,
            status: 'Pending'
        });

        // Re-fetch incident to get updated actions
        const updatedIncident = getIncidentById(incident.id);
        updateIncident(incident.id, { actions: updatedIncident.actions });

        document.getElementById('capa-modal').remove();
        renderIncidentDetail(root, { id: incident.id });
    });
}

function renderIncidentModal(root) {
    const { users } = getState();
    const userOptions = users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');

    const modalHTML = `
        <div id="incident-modal" class="modal" style="display:block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Report New Incident</h2>
                    <span id="close-modal-btn" class="close-btn" aria-label="Close">&times;</span>
                </div>
                <form id="incident-form">
                    <div class="form-group">
                        <label for="incident-title" class="form-label">Title *</label>
                        <input type="text" id="incident-title" class="form-control" required aria-describedby="title-error">
                        <div id="title-error" class="error-message" role="alert"></div>
                    </div>
                    <div class="form-group">
                        <label for="incident-type" class="form-label">Type *</label>
                        <select id="incident-type" class="form-control" required>
                            <option value="">Select Type</option>
                            <option value="Incident">Incident</option>
                            <option value="Near Miss">Near Miss</option>
                            <option value="Observation">Observation</option>
                            <option value="Gemba Walk">Gemba Walk</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="incident-severity" class="form-label">Severity</label>
                        <select id="incident-severity" class="form-control">
                            <option value="N/A">N/A</option>
                            <option value="First Aid">First Aid</option>
                            <option value="Medical Treatment">Medical Treatment</option>
                            <option value="Recordable">Recordable</option>
                            <option value="Fatality/Serious">Fatality/Serious</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="incident-description" class="form-label">Description *</label>
                        <textarea id="incident-description" class="form-control" rows="4" required aria-describedby="description-error"></textarea>
                        <div id="description-error" class="error-message" role="alert"></div>
                    </div>
                    <div class="form-group">
                        <label for="incident-location" class="form-label">Location *</label>
                        <input type="text" id="incident-location" class="form-control" required aria-describedby="location-error">
                        <div id="location-error" class="error-message" role="alert"></div>
                    </div>
                    <div class="form-group">
                        <label for="incident-date" class="form-label">Date *</label>
                        <input type="date" id="incident-date" class="form-control" required aria-describedby="date-error">
                        <div id="date-error" class="error-message" role="alert"></div>
                    </div>
                    <div class="form-group">
                        <label for="incident-witnesses" class="form-label">Witnesses</label>
                        <select id="incident-witnesses" class="form-control" multiple>
                            ${userOptions}
                        </select>
                        <small class="form-text">Hold Ctrl (Cmd on Mac) to select multiple</small>
                    </div>
                    <div class="form-group">
                        <label for="incident-photos" class="form-label">Photos</label>
                        <input type="file" id="incident-photos" class="form-control" accept="image/*" multiple>
                        <small class="form-text">Select one or more image files</small>
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Report</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('incident-date').value = today;

    // Auto-set severity to N/A for Near Miss
    document.getElementById('incident-type').addEventListener('change', (e) => {
        const severitySelect = document.getElementById('incident-severity');
        if (e.target.value === 'Near Miss') {
            severitySelect.value = 'N/A';
            severitySelect.disabled = true;
        } else {
            severitySelect.disabled = false;
        }
    });

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('incident-modal').remove();
    });

    document.getElementById('incident-form').addEventListener('submit', (e) => {
        e.preventDefault();

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        let isValid = true;

        const title = document.getElementById('incident-title').value.trim();
        if (!title) {
            document.getElementById('title-error').textContent = 'Title is required.';
            isValid = false;
        }

        const description = document.getElementById('incident-description').value.trim();
        if (!description) {
            document.getElementById('description-error').textContent = 'Description is required.';
            isValid = false;
        }

        const location = document.getElementById('incident-location').value.trim();
        if (!location) {
            document.getElementById('location-error').textContent = 'Location is required.';
            isValid = false;
        }

        const date = document.getElementById('incident-date').value;
        if (!date) {
            document.getElementById('date-error').textContent = 'Date is required.';
            isValid = false;
        }

        if (!isValid) return;

        const witnessesSelect = document.getElementById('incident-witnesses');
        const witnesses = Array.from(witnessesSelect.selectedOptions).map(option => parseInt(option.value));

        const photosInput = document.getElementById('incident-photos');
        const photos = Array.from(photosInput.files).map(file => file.name); // For simplicity, store filenames

        const newIncident = {
            title,
            type: document.getElementById('incident-type').value,
            severity: document.getElementById('incident-severity').value,
            description,
            location,
            date: new Date(date),
            status: 'Reported',
            involved: witnesses,
            photos,
            investigation: null,
        };
        addIncident(newIncident);
        document.getElementById('incident-modal').remove();
        renderIncidents(root);
    });
}


export function renderIncidentDetail(root, params) {
    const incident = getIncidentById(params.id);

    if (!incident) {
        root.innerHTML = '<h2>Incident not found</h2><a href="#/incidents">Back to list</a>';
        return;
    }

    const actionsHTML = incident.actions ? incident.actions.map(action => `
        <tr>
            <td>${action.description}</td>
            <td>${action.assigneeName}</td>
            <td>${new Date(action.dueDate).toLocaleDateString()}</td>
            <td><span class="status-badge status-${action.status.toLowerCase().replace(/\\s+/g, '-')}">${action.status}</span></td>
        </tr>
    `).join('') : '';

    const photosHTML = incident.photos && incident.photos.length ? incident.photos.map(photo => `<img src="${photo}" alt="Incident photo" style="max-width: 200px; margin: 5px;">`).join('') : 'No photos uploaded.';

    root.innerHTML = `
        <style>
            .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-lg); }
            .detail-card { background-color: var(--surface-color); border-radius: var(--border-radius-lg); padding: var(--space-lg); box-shadow: var(--shadow-sm); margin-bottom: var(--space-lg); }
            .detail-card h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm); }
            .detail-item { display: flex; margin-bottom: var(--space-sm); }
            .detail-item strong { color: var(--text-color-light); width: 120px; flex-shrink: 0; }
            .workflow-buttons { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
            @media (max-width: 768px) {
                .detail-grid { grid-template-columns: 1fr; }
                .detail-item { flex-direction: column; }
                .detail-item strong { width: auto; margin-bottom: var(--space-xs); }
                .workflow-buttons { flex-direction: column; }
            }
        </style>
        <div class="page-header">
            <a href="#/incidents" class="btn btn-secondary">&larr; Back to Incident List</a>
        </div>

        <div class="detail-grid">
            <div>
                <div class="detail-card">
                    <h3>Incident Details</h3>
                    <div class="detail-item"><strong>ID:</strong> INC-${String(incident.id).padStart(4, '0')}</div>
                    <div class="detail-item"><strong>Title:</strong> ${incident.title}</div>
                    <div class="detail-item"><strong>Description:</strong> ${incident.description}</div>
                    <div class="detail-item"><strong>Involved:</strong> ${incident.involvedNames.join(', ')}</div>
                    <div class="detail-item"><strong>Photos:</strong> <div>${photosHTML}</div></div>
                </div>
                <div class="detail-card">
                    <h3>Investigation & Corrective Actions</h3>
                    <div class="workflow-buttons">
                        ${incident.status === 'Reported' ? '<button id="start-investigation-btn" class="btn btn-primary">Start Investigation</button>' : ''}
                        ${incident.investigation ? '<button id="update-rca-btn" class="btn btn-secondary">Update RCA</button>' : ''}
                        <button id="generate-capa-btn" class="btn btn-secondary">Generate CAPA</button>
                    </div>
                    ${incident.investigation ? `
                        <div class="detail-item"><strong>Root Cause:</strong> ${incident.investigation.rootCause}</div>
                        <div class="detail-item"><strong>RCA Method:</strong> ${incident.investigation.method || 'Not specified'}</div>
                        <h4>Corrective Actions:</h4>
                        <table class="data-table">
                            <thead><tr><th>Description</th><th>Assignee</th><th>Due Date</th><th>Status</th></tr></thead>
                            <tbody>${actionsHTML}</tbody>
                        </table>
                    ` : '<p>No investigation details recorded.</p>'}
                </div>
            </div>
            <div class="detail-card">
                <h3>Status & Severity</h3>
                <div class="detail-item"><strong>Status:</strong> <span class="status-badge status-${incident.status.toLowerCase().replace(/\\s+/g, '-')}">${incident.status}</span></div>
                <div class="detail-item"><strong>Severity:</strong> ${incident.severity}</div>
                <div class="detail-item"><strong>Date:</strong> ${new Date(incident.date).toLocaleDateString()}</div>
                <div class="detail-item"><strong>Location:</strong> ${incident.location}</div>
            </div>
        </div>
    `;

    // Event listeners for workflow buttons
    if (document.getElementById('start-investigation-btn')) {
        document.getElementById('start-investigation-btn').addEventListener('click', () => renderInvestigationModal(root, incident));
    }

    if (document.getElementById('update-rca-btn')) {
        document.getElementById('update-rca-btn').addEventListener('click', () => renderRCAModal(root, incident));
    }

    document.getElementById('generate-capa-btn').addEventListener('click', () => renderCAPAModal(root, incident));
}

export function renderIncidents(root, params) {
    if (params && params.id) {
        renderIncidentDetail(root, params);
        return;
    }

    const { incidents } = getState();

    // Filter and sort state
    let filteredIncidents = [...incidents];
    let searchTerm = '';
    let typeFilter = '';
    let statusFilter = '';
    let sortBy = 'date';
    let sortOrder = 'desc';

    function applyFiltersAndSort() {
        filteredIncidents = incidents.filter(incident => {
            const matchesSearch = !searchTerm ||
                incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                incident.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = !typeFilter || incident.type === typeFilter;
            const matchesStatus = !statusFilter || incident.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });

        filteredIncidents.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'title':
                    aVal = a.title.toLowerCase();
                    bVal = b.title.toLowerCase();
                    break;
                case 'type':
                    aVal = a.type;
                    bVal = b.type;
                    break;
                case 'status':
                    aVal = a.status;
                    bVal = b.status;
                    break;
                case 'date':
                default:
                    aVal = new Date(a.date);
                    bVal = new Date(b.date);
                    break;
            }
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    applyFiltersAndSort();

    const tableRows = filteredIncidents.map(incident => `
        <tr data-id="${incident.id}" class="clickable-row">
            <td>INC-${String(incident.id).padStart(4, '0')}</td>
            <td>${incident.title}</td>
            <td>${incident.type}</td>
            <td><span class="status-badge status-${incident.status.toLowerCase().replace(/\\s+/g, '-')}">${incident.status}</span></td>
            <td>${new Date(incident.date).toLocaleDateString()}</td>
        </tr>
    `).join('');

    root.innerHTML = `
        <div class="page-header">
            <button id="report-incident-btn" class="btn btn-primary">Report New Incident</button>
        </div>
        <div class="filters-section" style="margin-bottom: var(--space-lg); display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: center;">
            <style>
                @media (max-width: 768px) {
                    .filters-section { flex-direction: column; align-items: stretch; }
                    .filter-group { width: 100%; }
                }
            </style>
            <div class="filter-group">
                <label for="search-input" class="form-label">Search:</label>
                <input type="text" id="search-input" class="form-control" placeholder="Search incidents..." value="${searchTerm}">
            </div>
            <div class="filter-group">
                <label for="type-filter" class="form-label">Type:</label>
                <select id="type-filter" class="form-control">
                    <option value="">All Types</option>
                    <option value="Incident">Incident</option>
                    <option value="Near Miss">Near Miss</option>
                    <option value="Observation">Observation</option>
                    <option value="Gemba Walk">Gemba Walk</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="status-filter" class="form-label">Status:</label>
                <select id="status-filter" class="form-control">
                    <option value="">All Statuses</option>
                    <option value="Reported">Reported</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Closed">Closed</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="sort-by" class="form-label">Sort by:</label>
                <select id="sort-by" class="form-control">
                    <option value="date">Date</option>
                    <option value="title">Title</option>
                    <option value="type">Type</option>
                    <option value="status">Status</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="sort-order" class="form-label">Order:</label>
                <select id="sort-order" class="form-control">
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>
        </div>
        <div class="card">
            <div class="card-header">Incidents List (${filteredIncidents.length})</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    // Event listeners for filters
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchTerm = e.target.value;
        applyFiltersAndSort();
        renderIncidents(root, params); // Re-render
    });

    document.getElementById('type-filter').addEventListener('change', (e) => {
        typeFilter = e.target.value;
        applyFiltersAndSort();
        renderIncidents(root, params);
    });

    document.getElementById('status-filter').addEventListener('change', (e) => {
        statusFilter = e.target.value;
        applyFiltersAndSort();
        renderIncidents(root, params);
    });

    document.getElementById('sort-by').addEventListener('change', (e) => {
        sortBy = e.target.value;
        applyFiltersAndSort();
        renderIncidents(root, params);
    });

    document.getElementById('sort-order').addEventListener('change', (e) => {
        sortOrder = e.target.value;
        applyFiltersAndSort();
        renderIncidents(root, params);
    });

    document.getElementById('report-incident-btn').addEventListener('click', () => renderIncidentModal(root));

    document.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', () => {
            window.location.hash = `#/incidents/${row.dataset.id}`;
        });
    });
}