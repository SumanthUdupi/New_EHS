import {
    getIncidents,
    addIncident,
    updateIncident,
    getIncidentById,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

// Subscribe to store changes to re-render the list if needed
let unsubscribe;

export function renderIncidents(params) {
    // Return a placeholder container
    setTimeout(() => {
        const container = document.getElementById('incidents-view-container');
        if (container) initializeIncidents(container, params);
    }, 0);
    return '<div id="incidents-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function initializeIncidents(container, params) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        // Only re-render if we are still on the incidents page
        if (window.location.hash.startsWith('#/incidents')) {
             // For simplicity in this prototype, we might want to just refresh the list part
             // But re-rendering the whole view is safer for consistency
             initializeIncidents(container, params);
        }
    });

    if (params.id) {
        renderIncidentDetail(container, params.id);
    } else {
        renderIncidentList(container);
    }
}

function renderIncidentList(container) {
    const incidents = getIncidents();

    // Sort incidents by date descending
    incidents.sort((a, b) => new Date(b.date) - new Date(a.date));

    const html = `
        <div class="page-header">
            <h1 class="page-title">Incident Management</h1>
            <div class="page-actions">
                <button class="btn btn-secondary" id="export-btn">Export</button>
                <button class="btn btn-primary" id="add-incident-btn">Report Incident</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search incidents...">
                <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="Reported">Reported</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Closed">Closed</option>
                </select>
                <select id="filter-severity" class="form-select">
                    <option value="">All Severities</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Medical Treatment">Medical Treatment</option>
                    <option value="Recordable">Recordable</option>
                    <option value="Fatality/Serious">Fatality/Serious</option>
                </select>
            </div>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table class="table" id="incidents-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Location</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${incidents.map(incident => `
                            <tr data-id="${incident.id}">
                                <td>#${incident.id}</td>
                                <td>${new Date(incident.date).toLocaleDateString()}</td>
                                <td>${incident.type}</td>
                                <td><a href="#/incidents/${incident.id}" class="text-primary font-weight-bold">${incident.title}</a></td>
                                <td>${incident.location}</td>
                                <td><span class="badge badge-${getSeverityBadgeClass(incident.severity)}">${incident.severity}</span></td>
                                <td><span class="badge badge-${getStatusBadgeClass(incident.status)}">${incident.status}</span></td>
                                <td>
                                    <button class="btn-icon" title="View" onclick="window.location.hash='#/incidents/${incident.id}'">👁️</button>
                                    <button class="btn-icon edit-btn" title="Edit" data-id="${incident.id}">✏️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${incidents.length === 0 ? '<div class="empty-state"><p>No incidents found.</p></div>' : ''}
        </div>
    `;

    container.innerHTML = html;

    // Attach Event Listeners
    document.getElementById('add-incident-btn').addEventListener('click', showAddIncidentModal);

    document.getElementById('search-input').addEventListener('input', (e) => filterIncidents(e.target.value));
    document.getElementById('filter-status').addEventListener('change', () => filterIncidents());
    document.getElementById('filter-severity').addEventListener('change', () => filterIncidents());

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditIncidentModal(btn.dataset.id);
        });
    });
}

function renderIncidentDetail(container, id) {
    const incident = getIncidentById(id);

    if (!incident) {
        container.innerHTML = `
            <div class="alert alert-error">Incident not found. <a href="#/incidents">Back to list</a></div>
        `;
        return;
    }

    const html = `
        <div class="page-header">
            <div class="breadcrumb">
                <a href="#/incidents">Incidents</a> &gt; <span>#${incident.id}</span>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="window.location.hash='#/incidents'">Back</button>
                <button class="btn btn-primary" id="edit-incident-btn">Edit Incident</button>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">${incident.title}</h2>
                        <span class="badge badge-${getStatusBadgeClass(incident.status)}">${incident.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="detail-row">
                            <label>Date & Time:</label>
                            <span>${new Date(incident.date).toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <label>Type:</label>
                            <span>${incident.type} ${incident.category ? ` - ${incident.category}` : ''}</span>
                        </div>
                        <div class="detail-row">
                            <label>Severity:</label>
                            <span class="badge badge-${getSeverityBadgeClass(incident.severity)}">${incident.severity}</span>
                        </div>
                        <div class="detail-row">
                            <label>Location:</label>
                            <span>${incident.location}</span>
                        </div>
                        <div class="detail-section">
                            <h3>Description</h3>
                            <p>${incident.description}</p>
                        </div>

                        <div class="detail-section">
                            <h3>Status Timeline</h3>
                            <ul class="timeline">
                                <li class="timeline-item ${['Reported', 'Under Investigation', 'Closed'].includes(incident.status) ? 'completed' : ''}">
                                    <span class="timeline-marker"></span>
                                    <div class="timeline-content">
                                        <div class="timeline-title">Reported</div>
                                        <div class="timeline-date">${new Date(incident.date).toLocaleDateString()}</div>
                                        <div class="timeline-description">Incident reported.</div>
                                    </div>
                                </li>
                                <li class="timeline-item ${['Under Investigation', 'Closed'].includes(incident.status) ? 'completed' : ''}">
                                    <span class="timeline-marker"></span>
                                    <div class="timeline-content">
                                        <div class="timeline-title">Under Investigation</div>
                                        <div class="timeline-date">${incident.status === 'Reported' ? 'Pending' : 'In Progress'}</div>
                                        <div class="timeline-description">Investigation initiated.</div>
                                    </div>
                                </li>
                                <li class="timeline-item ${['Closed'].includes(incident.status) ? 'completed' : ''}">
                                    <span class="timeline-marker"></span>
                                    <div class="timeline-content">
                                        <div class="timeline-title">Closed</div>
                                        <div class="timeline-date">${incident.status === 'Closed' ? 'Completed' : 'Pending'}</div>
                                        <div class="timeline-description">Incident closed and actions verified.</div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div class="detail-section">
                            <h3>Investigation Team</h3>
                             <ul>
                                ${incident.involvedNames && incident.involvedNames.length > 0 ?
                                    incident.involvedNames.map(name => `<li>${name}</li>`).join('') :
                                    '<li>Investigation pending assignment</li>'
                                }
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="card mt-4">
                    <div class="card-header">
                        <h3 class="card-title">Investigation & Root Cause Analysis</h3>
                    </div>
                    <div class="card-body">
                        ${incident.investigation ? `
                             <div class="detail-section">
                                <h4>Root Cause (5 Whys / Fishbone Analysis)</h4>
                                <div class="rca-box p-3 bg-light border rounded">
                                     <p>${incident.investigation.rootCause}</p>
                                </div>
                            </div>
                        ` : `
                            <div class="empty-state">
                                <p>No investigation data recorded.</p>
                                <button class="btn btn-sm btn-outline-primary">Start Investigation (Fishbone)</button>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <div class="col-span-1">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Corrective Actions (CAPA)</h3>
                    </div>
                    <div class="card-body">
                        ${incident.actions && incident.actions.length > 0 ? `
                            <ul class="action-list">
                                ${incident.actions.map(action => `
                                    <li class="action-item ${action.status.toLowerCase().replace(' ', '-')}">
                                        <div class="action-desc">${action.description}</div>
                                        <div class="action-meta">
                                            <span>Assigned: ${action.assigneeName}</span>
                                            <span class="badge badge-sm badge-${getStatusBadgeClass(action.status)}">${action.status}</span>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p class="text-muted">No actions assigned.</p>'}
                        <button class="btn btn-outline btn-sm btn-block mt-2" id="add-action-btn">Add Action</button>
                    </div>
                </div>

                 <div class="card mt-4">
                    <div class="card-header">
                        <h3 class="card-title">Attachments</h3>
                    </div>
                    <div class="card-body">
                         <div class="attachment-list">
                            ${incident.photos && incident.photos.length > 0 ?
                                incident.photos.map(photo => `
                                    <div class="attachment-item">
                                        <span class="file-icon">📷</span>
                                        <span class="file-name">${photo}</span>
                                    </div>
                                `).join('')
                            : `
                                <!-- Placeholder for attachments if none -->
                                <div class="attachment-item">
                                    <span class="file-icon">📷</span>
                                    <span class="file-name">scene_photo_01.jpg (Example)</span>
                                </div>
                            `}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    document.getElementById('edit-incident-btn').addEventListener('click', () => showEditIncidentModal(incident.id));
    // document.getElementById('add-action-btn').addEventListener('click', () => showAddActionModal(incident.id));
}

function showAddIncidentModal() {
    const formHtml = `
        <form id="add-incident-form">
            <div class="form-group">
                <label for="inc-title">Title *</label>
                <input type="text" id="inc-title" name="title" class="form-control" required>
            </div>
            <div class="row">
                <div class="col-6">
                    <div class="form-group">
                        <label for="inc-date">Date & Time *</label>
                        <input type="datetime-local" id="inc-date" name="date" class="form-control" required>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="inc-type">Type *</label>
                        <select id="inc-type" name="type" class="form-control" required>
                            <option value="">Select Type</option>
                            <option value="Incident">Incident</option>
                            <option value="Near Miss">Near Miss</option>
                            <option value="Observation">Observation</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row" id="inc-category-group" style="display: none;">
                <div class="col-12">
                    <div class="form-group">
                        <label for="inc-category">Category *</label>
                        <select id="inc-category" name="category" class="form-control">
                            <option value="">Select Category</option>
                            <option value="Slip/Trip/Fall">Slip/Trip/Fall</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Chemical">Chemical</option>
                            <option value="Ergonomic">Ergonomic</option>
                            <option value="Fire">Fire</option>
                            <option value="Vehicle">Vehicle</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-6">
                     <div class="form-group">
                        <label for="inc-severity">Severity *</label>
                        <select id="inc-severity" name="severity" class="form-control" required>
                            <option value="">Select Severity</option>
                            <option value="First Aid">First Aid</option>
                            <option value="Medical Treatment">Medical Treatment</option>
                            <option value="Recordable">Recordable</option>
                            <option value="Fatality/Serious">Fatality/Serious</option>
                            <option value="N/A">N/A (for Near Miss/Observation)</option>
                        </select>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="inc-location">Location *</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="inc-location" name="location" class="form-control" style="flex: 1;" required placeholder="GPS Coordinates or Address">
                            <button type="button" class="btn btn-secondary btn-sm" id="btn-get-location">Get Location</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="inc-photos">Photos / Media</label>
                <input type="file" id="inc-photos" name="photos" class="form-control" multiple accept="image/*,video/*">
                <small class="text-muted">Select photos to upload (Simulation only)</small>
            </div>
            <div class="form-group">
                <label for="inc-desc">Description *</label>
                <textarea id="inc-desc" name="description" class="form-control" rows="4" required></textarea>
            </div>
            <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Report Incident</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Report New Incident' });

    // Handle Type change to show/hide Category
    const typeSelect = document.getElementById('inc-type');
    const categoryGroup = document.getElementById('inc-category-group');
    const categorySelect = document.getElementById('inc-category');

    typeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Incident' || e.target.value === 'Near Miss') {
            categoryGroup.style.display = 'block';
            categorySelect.required = true;
        } else {
            categoryGroup.style.display = 'none';
            categorySelect.required = false;
        }
    });

    // AI-Powered Categorization (Simulation)
    const descInput = document.getElementById('inc-desc');
    descInput.addEventListener('blur', () => {
        const text = descInput.value.toLowerCase();
        if (text.length < 5) return;

        let suggestedType = '';
        let suggestedSeverity = '';
        let suggestedCategory = '';

        // Simple keyword matching rules
        if (text.includes('fall') || text.includes('slip') || text.includes('trip')) {
            suggestedCategory = 'Slip/Trip/Fall';
            suggestedType = 'Incident';
        } else if (text.includes('fire') || text.includes('smoke') || text.includes('burn')) {
            suggestedCategory = 'Fire';
            suggestedType = 'Incident';
        } else if (text.includes('chemical') || text.includes('spill') || text.includes('fume')) {
            suggestedCategory = 'Chemical';
        }

        if (text.includes('hospital') || text.includes('ambulance') || text.includes('broken') || text.includes('fracture')) {
            suggestedSeverity = 'Recordable';
        } else if (text.includes('death') || text.includes('fatal') || text.includes('died')) {
            suggestedSeverity = 'Fatality/Serious';
        } else if (text.includes('band-aid') || text.includes('cut') || text.includes('bruise')) {
            suggestedSeverity = 'First Aid';
        }

        // Apply suggestions if fields are empty
        if (suggestedType && typeSelect.value === '') {
            typeSelect.value = suggestedType;
            typeSelect.dispatchEvent(new Event('change'));
            Notification.show('AI Suggestion: Type set to ' + suggestedType, { type: 'info', duration: 3000 });
        }
        if (suggestedCategory && categorySelect.value === '') {
            categorySelect.value = suggestedCategory;
            Notification.show('AI Suggestion: Category set to ' + suggestedCategory, { type: 'info', duration: 3000 });
        }
        const severitySelect = document.getElementById('inc-severity');
        if (suggestedSeverity && severitySelect.value === '') {
            severitySelect.value = suggestedSeverity;
            Notification.show('AI Suggestion: Severity set to ' + suggestedSeverity, { type: 'info', duration: 3000 });
        }
    });

    // Handle Location Button
    document.getElementById('btn-get-location').addEventListener('click', () => {
        const locInput = document.getElementById('inc-location');
        locInput.value = "Fetching location...";

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    locInput.value = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
                },
                (error) => {
                    console.error("Error getting location:", error);
                    locInput.value = "Error: Could not retrieve location.";
                    Notification.show('Could not retrieve location. Ensure GPS is enabled.', { type: 'error' });
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            locInput.value = "Error: Geolocation not supported.";
        }
    });

    // Wire up close button manually since it's inside the form
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('add-incident-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);
            const photosInput = document.getElementById('inc-photos');
            const photoFiles = Array.from(photosInput.files).map(f => f.name);

            const newIncident = {
                title: formData.get('title'),
                date: new Date(formData.get('date')),
                type: formData.get('type'),
                category: formData.get('category') || '', // Capture category
                severity: formData.get('severity'),
                location: formData.get('location'),
                description: formData.get('description'),
                photos: photoFiles, // Store file names
                status: 'Reported',
                involved: [], // Todo: implement multi-select for users
                createdDate: new Date()
            };

            addIncident(newIncident);
            Notification.show('Incident reported successfully', { type: 'success' });
            modal.close();
            // The subscription will trigger a re-render
        }
    });
}

function showEditIncidentModal(id) {
    const incident = getIncidentById(id);
    if (!incident) return;

    // Convert date to datetime-local format (YYYY-MM-DDTHH:mm)
    const dateObj = new Date(incident.date);
    const dateStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000))
        .toISOString().slice(0, 16);

    const formHtml = `
        <form id="edit-incident-form">
            <input type="hidden" name="id" value="${incident.id}">
            <div class="form-group">
                <label for="edit-inc-title">Title *</label>
                <input type="text" id="edit-inc-title" name="title" class="form-control" value="${incident.title}" required>
            </div>
            <div class="row">
                <div class="col-6">
                    <div class="form-group">
                        <label for="edit-inc-date">Date & Time *</label>
                        <input type="datetime-local" id="edit-inc-date" name="date" class="form-control" value="${dateStr}" required>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="edit-inc-status">Status *</label>
                         <select id="edit-inc-status" name="status" class="form-control" required>
                            <option value="Reported" ${incident.status === 'Reported' ? 'selected' : ''}>Reported</option>
                            <option value="Under Investigation" ${incident.status === 'Under Investigation' ? 'selected' : ''}>Under Investigation</option>
                            <option value="Closed" ${incident.status === 'Closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="edit-inc-desc">Description *</label>
                <textarea id="edit-inc-desc" name="description" class="form-control" rows="4" required>${incident.description}</textarea>
            </div>
             <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: `Edit Incident #${incident.id}` });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('edit-incident-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);
            const updates = {
                title: formData.get('title'),
                date: new Date(formData.get('date')),
                status: formData.get('status'),
                description: formData.get('description'),
            };

            updateIncident(id, updates);
            Notification.show('Incident updated successfully', { type: 'success' });
            modal.close();
        }
    });
}

// Helpers
function getSeverityBadgeClass(severity) {
    switch (severity) {
        case 'Fatality/Serious': return 'danger';
        case 'Recordable': return 'warning';
        case 'Medical Treatment': return 'info';
        default: return 'success'; // First Aid / N/A
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Closed': return 'success';
        case 'Under Investigation': return 'warning';
        default: return 'secondary'; // Reported
    }
}

function filterIncidents(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const severityFilter = document.getElementById('filter-severity').value;

    const rows = document.querySelectorAll('#incidents-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const status = row.querySelector('td:nth-child(7)').innerText;
        const severity = row.querySelector('td:nth-child(6)').innerText;

        const matchesSearch = text.includes(term);
        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesSeverity = !severityFilter || severity === severityFilter;

        if (matchesSearch && matchesStatus && matchesSeverity) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
