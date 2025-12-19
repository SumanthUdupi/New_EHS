import {
    getIncidents,
    addIncident,
    updateIncident,
    updateIncidentInvestigation,
    getIncidentById,
    addCorrectiveAction,
    getState,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';
import { FishboneModal } from '../components/fishbone.js';
import { FiveWhysModal } from '../components/five_whys.js';

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
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
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
                            <th>Description</th>
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
                                <td><a href="#/incidents/${incident.id}" class="text-primary font-weight-bold">${incident.title || incident.description.substring(0, 50)}...</a></td>
                                <td>${incident.location}</td>
                                <td><span class="badge badge-${getSeverityBadgeClass(incident.severity)}">${incident.severity}</span></td>
                                <td><span class="badge badge-${getStatusBadgeClass(incident.status)}">${incident.status}</span></td>
                                <td>
                                    <button class="btn-icon" title="View" onclick="window.location.hash='#/incidents/${incident.id}'">👁️</button>
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
    document.getElementById('export-btn').addEventListener('click', exportIncidents);

    document.getElementById('search-input').addEventListener('input', (e) => filterIncidents(e.target.value));
    document.getElementById('filter-status').addEventListener('change', () => filterIncidents());
    document.getElementById('filter-severity').addEventListener('change', () => filterIncidents());
}

function renderIncidentDetail(container, id) {
    const incident = getIncidentById(id);

    if (!incident) {
        container.innerHTML = `
            <div class="alert alert-error">Incident not found. <a href="#/incidents">Back to list</a></div>
        `;
        return;
    }

    // Prepare configuration values
    const config = incident.configuration || {};
    const elements = config.elements || [];
    const investigationRequired = config.investigationRequired || false;

    const html = `
        <div class="page-header">
            <div class="breadcrumb">
                <a href="#/incidents">Incidents</a> &gt; <span>#${incident.id}</span>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="window.location.hash='#/incidents'">Back</button>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <!-- Card 1: Basic Details -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Basic Details</h2>
                </div>
                <div class="card-body">
                    <div class="detail-row"><label>Report ID:</label> <span>#${incident.id}</span></div>
                    <div class="detail-row"><label>Report Type:</label> <span>${incident.type}</span></div>
                    <div class="detail-row"><label>Date & Time:</label> <span>${new Date(incident.date).toLocaleString()}</span></div>
                    <div class="detail-row"><label>Reporting Person:</label> <span>${incident.reportingPerson || 'N/A'} (ID: ${incident.employeeId || 'N/A'}, Dept: ${incident.department || 'N/A'}, Contact: ${incident.contact || 'N/A'})</span></div>
                    <div class="detail-row"><label>Location:</label> <span>${incident.location}</span></div>
                    <div class="detail-row"><label>Category:</label> <span>${incident.category || 'N/A'}</span></div>
                    <div class="detail-row"><label>Severity:</label> <span class="badge badge-${getSeverityBadgeClass(incident.severity)}">${incident.severity}</span></div>
                    <div class="detail-row"><label>Description:</label> <p>${incident.description}</p></div>
                    <div class="detail-row"><label>Immediate Actions:</label> <p>${incident.immediateActions || 'N/A'}</p></div>
                    <div class="detail-row"><label>Witnesses:</label> <p>${incident.witnesses || 'None'}</p></div>
                    <div class="detail-row"><label>Assigned To:</label> <span>${getAssigneeName(incident.assignedTo)}</span></div>
                     <div class="detail-section">
                        <h4>Evidence/Attachments</h4>
                         <div class="attachment-list">
                            ${incident.photos && incident.photos.length > 0 ?
                                incident.photos.map(photo => `
                                    <div class="attachment-item">
                                        <span class="file-icon">📷</span>
                                        <span class="file-name">${photo}</span>
                                    </div>
                                `).join('')
                            : '<p class="text-muted">No attachments.</p>'}
                         </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Configuration -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Configuration</h2>
                </div>
                <div class="card-body">
                    <form id="config-form">
                        <div class="form-group">
                            <label>Incident Manager</label>
                            <input type="text" class="form-control" value="${config.incidentManager || getAssigneeName(incident.assignedTo)}" id="config-manager">
                            <small class="text-muted">Auto-populated from "Assigned To", can be modified.</small>
                        </div>
                        <div class="form-group">
                            <label>Incident Elements</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" name="elements" value="People" ${elements.includes('People') ? 'checked' : ''}> People</label>
                                <label><input type="checkbox" name="elements" value="Assets" ${elements.includes('Assets') ? 'checked' : ''}> Assets</label>
                                <label><input type="checkbox" name="elements" value="Material" ${elements.includes('Material') ? 'checked' : ''}> Material</label>
                                <label><input type="checkbox" name="elements" value="Violation" ${elements.includes('Violation') ? 'checked' : ''}> Policy Violation</label>
                                <label><input type="checkbox" name="elements" value="Finance" ${elements.includes('Finance') ? 'checked' : ''}> Financial Violation</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Target Submission Date</label>
                            <input type="date" class="form-control" id="config-target-date" value="${config.targetSubmissionDate ? new Date(config.targetSubmissionDate).toISOString().split('T')[0] : ''}">
                        </div>
                        <div class="form-group">
                            <label class="toggle-switch">
                                <input type="checkbox" id="config-investigation-req" ${investigationRequired ? 'checked' : ''}>
                                <span class="slider"></span>
                                Is Investigation Required?
                            </label>
                        </div>

                        <div id="investigation-details" style="display: ${investigationRequired ? 'block' : 'none'}; border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
                            <h5>Investigation Details</h5>
                            <div class="form-group">
                                <label>Investigation Lead</label>
                                <input type="text" class="form-control" id="config-inv-lead" value="${config.investigationLead || ''}" placeholder="Enter names">
                            </div>
                            <div class="form-group">
                                <label>Approver</label>
                                <input type="text" class="form-control" id="config-inv-approver" value="${config.investigationApprover || ''}" placeholder="Enter names">
                            </div>
                            <div class="form-group">
                                <label>Target Submission Date (Investigation)</label>
                                <input type="date" class="form-control" id="config-inv-target-date" value="${config.investigationTargetDate ? new Date(config.investigationTargetDate).toISOString().split('T')[0] : ''}">
                            </div>
                             <div class="form-group">
                                <label>Approval Date</label>
                                <input type="date" class="form-control" id="config-inv-approval-date" value="${config.investigationApprovalDate ? new Date(config.investigationApprovalDate).toISOString().split('T')[0] : ''}">
                            </div>
                        </div>

                        <div class="form-group mt-3">
                            <label>Attachment Drop Zone</label>
                            <div class="drop-zone border-dashed p-4 text-center">
                                <p>Drag & Drop files here or click to upload</p>
                                <input type="file" style="display: none;" id="config-files">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary mt-3">Save Configuration</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Card 3: Sequence of Events -->
        <div class="card mt-4">
             <div class="card-header">
                <h2 class="card-title">Sequence of Events</h2>
            </div>
            <div class="card-body">
                 <div class="form-group">
                    <label>Description of Sequence</label>
                    <textarea class="form-control" id="seq-description" rows="3">${incident.sequenceDescription || incident.description}</textarea>
                </div>
                <div class="sequence-list" id="sequence-list">
                    <!-- Dynamic sequence items -->
                    ${(incident.sequenceEvents || []).map((event, index) => `
                        <div class="sequence-item card mb-2 p-2" draggable="true" data-index="${index}">
                            <div class="d-flex justify-content-between">
                                <span>${event}</span>
                                <button class="btn btn-sm btn-danger remove-seq-btn" data-index="${index}">x</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                 <div class="input-group mt-2">
                    <input type="text" class="form-control" id="new-seq-event" placeholder="Add event...">
                    <button class="btn btn-secondary" id="add-seq-btn">Add</button>
                </div>
                 <button class="btn btn-primary mt-3" id="save-sequence-btn">Save Sequence</button>
            </div>
        </div>

        <!-- Conditional Cards -->
        <div id="conditional-cards-container">
            <!-- Rendered dynamically -->
        </div>
    `;

    container.innerHTML = html;

    // --- Configuration Logic ---
    const configForm = document.getElementById('config-form');
    const invToggle = document.getElementById('config-investigation-req');
    const invDetails = document.getElementById('investigation-details');

    invToggle.addEventListener('change', () => {
        invDetails.style.display = invToggle.checked ? 'block' : 'none';
    });

    configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(configForm); // Doesn't work well with checkboxes multiple values manually
        const checkedElements = Array.from(document.querySelectorAll('input[name="elements"]:checked')).map(cb => cb.value);

        const newConfig = {
            incidentManager: document.getElementById('config-manager').value,
            elements: checkedElements,
            targetSubmissionDate: document.getElementById('config-target-date').value,
            investigationRequired: invToggle.checked,
            investigationLead: document.getElementById('config-inv-lead').value,
            investigationApprover: document.getElementById('config-inv-approver').value,
            investigationTargetDate: document.getElementById('config-inv-target-date').value,
            investigationApprovalDate: document.getElementById('config-inv-approval-date').value
        };

        updateIncident(id, { configuration: newConfig });
        Notification.show('Configuration saved', { type: 'success' });
        renderConditionalCards(id); // Refresh conditional cards
    });

    // --- Sequence Logic ---
    const seqList = document.getElementById('sequence-list');
    document.getElementById('add-seq-btn').addEventListener('click', () => {
        const input = document.getElementById('new-seq-event');
        if (input.value.trim()) {
            const events = incident.sequenceEvents || [];
            events.push(input.value.trim());
            updateIncident(id, { sequenceEvents: events });
        }
    });

    // Use event delegation for remove buttons
    seqList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-seq-btn')) {
            const index = parseInt(e.target.dataset.index);
            const events = incident.sequenceEvents || [];
            events.splice(index, 1);
            updateIncident(id, { sequenceEvents: events });
        }
    });

    // Drag and Drop Logic
    let draggedItem = null;
    let draggedIndex = null;

    seqList.addEventListener('dragstart', (e) => {
        draggedItem = e.target.closest('.sequence-item');
        draggedIndex = parseInt(draggedItem.dataset.index);
        e.dataTransfer.effectAllowed = 'move';
        draggedItem.style.opacity = '0.5';
    });

    seqList.addEventListener('dragend', (e) => {
        if (draggedItem) draggedItem.style.opacity = '1';
        draggedItem = null;
        draggedIndex = null;
        document.querySelectorAll('.sequence-item').forEach(item => item.classList.remove('drag-over'));
    });

    seqList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const target = e.target.closest('.sequence-item');
        if (target && target !== draggedItem) {
            target.classList.add('drag-over');
        }
    });

    seqList.addEventListener('dragleave', (e) => {
        const target = e.target.closest('.sequence-item');
        if (target) target.classList.remove('drag-over');
    });

    seqList.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.sequence-item');
        if (target && target !== draggedItem) {
            const targetIndex = parseInt(target.dataset.index);
            const events = incident.sequenceEvents || [];

            // Move item
            const [movedItem] = events.splice(draggedIndex, 1);
            events.splice(targetIndex, 0, movedItem);

            updateIncident(id, { sequenceEvents: events });
        }
        document.querySelectorAll('.sequence-item').forEach(item => item.classList.remove('drag-over'));
    });

    document.getElementById('save-sequence-btn').addEventListener('click', () => {
        const desc = document.getElementById('seq-description').value;
        updateIncident(id, { sequenceDescription: desc });
        Notification.show('Sequence saved', { type: 'success' });
    });

    // Initial render of conditional cards
    renderConditionalCards(id);
}

function renderConditionalCards(id) {
    const incident = getIncidentById(id);
    const container = document.getElementById('conditional-cards-container');
    if (!container) return;

    container.innerHTML = '';
    const elements = incident.configuration?.elements || [];

    if (elements.includes('People')) {
        container.innerHTML += renderPeopleCard(incident);
    }
    if (elements.includes('Assets')) {
        container.innerHTML += renderAssetsCard(incident);
    }
    if (elements.includes('Material')) {
        container.innerHTML += renderMaterialCard(incident);
    }
    if (elements.includes('Violation')) {
        container.innerHTML += renderViolationCard(incident);
    }
    if (elements.includes('Finance')) {
        container.innerHTML += renderFinanceCard(incident);
    }

    // Attach listeners for dynamic forms inside these cards
    // NOTE: For a real app, this would be componentized. Here we attach global listeners or localized ones.
    // For simplicity, we will assume a "Save" button in each card that scrapes the data.

    if (elements.includes('People')) {
        document.getElementById('save-people-btn').addEventListener('click', () => savePeopleData(id));
        document.getElementById('add-person-btn').addEventListener('click', () => addPersonRow(id));
    }
    if (elements.includes('Assets')) {
        document.getElementById('save-assets-btn').addEventListener('click', () => saveAssetsData(id));
        document.getElementById('add-asset-btn').addEventListener('click', () => addAssetRow(id));
    }
    if (elements.includes('Material')) {
        const toggle = document.getElementById('cleanup-toggle');
        if(toggle) {
             toggle.addEventListener('change', () => {
                 const area = document.getElementById('cleanup-fields');
                 if(area) area.style.display = toggle.checked ? 'block' : 'none';
             });
        }
        document.getElementById('save-material-btn').addEventListener('click', () => saveMaterialData(id));
        document.getElementById('add-material-btn').addEventListener('click', () => addMaterialRow(id));
    }
    if (elements.includes('Violation')) {
        document.getElementById('save-violation-btn').addEventListener('click', () => saveViolationData(id));
    }
    if (elements.includes('Finance')) {
        document.getElementById('save-finance-btn').addEventListener('click', () => saveFinanceData(id));
    }
}

// --- Card Renderers ---

function renderPeopleCard(incident) {
    const people = incident.dataPeople || [];
    return `
        <div class="card mt-4">
            <div class="card-header"><h3 class="card-title">People Involved</h3></div>
            <div class="card-body">
                <div id="people-list">
                    ${people.map((p, i) => `
                        <div class="border p-3 mb-2 rounded person-entry">
                            <h5>Person ${i+1}</h5>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="form-group"><label>Name/Role</label><input type="text" class="form-control p-name" value="${p.name || ''}"></div>
                                <div class="form-group"><label>Nature of Injury</label><input type="text" class="form-control p-nature" value="${p.nature || ''}"></div>
                                <div class="form-group"><label>Severity</label><input type="text" class="form-control p-severity" value="${p.severity || ''}"></div>
                                <div class="form-group"><label>Contributing Factor</label><input type="text" class="form-control p-factor" value="${p.factor || ''}"></div>
                                <div class="form-group"><label>Hazard</label><input type="text" class="form-control p-hazard" value="${p.hazard || ''}"></div>
                                <div class="form-group"><label>Lost Time (Days)</label><input type="number" class="form-control p-lost-time" value="${p.lostTime || ''}"></div>
                                <div class="form-group"><label>Return Date</label><input type="date" class="form-control p-return-date" value="${p.returnDate || ''}"></div>
                                <div class="form-group"><label>First Aid Desc</label><input type="text" class="form-control p-first-aid" value="${p.firstAid || ''}"></div>
                                <div class="form-group"><label>Medical Treatment</label><input type="text" class="form-control p-medical" value="${p.medical || ''}"></div>
                                <div class="form-group"><label>Restrictions</label><input type="text" class="form-control p-restrictions" value="${p.restrictions || ''}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary" id="add-person-btn">Add Person</button>
                <button class="btn btn-primary" id="save-people-btn">Save People Data</button>
            </div>
        </div>
    `;
}

function renderAssetsCard(incident) {
    const assets = incident.dataAssets || [];
    return `
        <div class="card mt-4">
            <div class="card-header"><h3 class="card-title">Assets Involved</h3></div>
            <div class="card-body">
                 <div id="assets-list">
                    ${assets.map((a, i) => `
                        <div class="border p-3 mb-2 rounded asset-entry">
                            <h5>Asset ${i+1}</h5>
                             <div class="grid grid-cols-2 gap-2">
                                <div class="form-group"><label>Asset Name</label><input type="text" class="form-control a-name" value="${a.name || ''}"></div>
                                <div class="form-group"><label>Responsible User</label><input type="text" class="form-control a-user" value="${a.user || ''}"></div>
                                <div class="form-group"><label>Status</label><input type="text" class="form-control a-status" value="${a.status || ''}"></div>
                                <div class="form-group"><label>Failure</label><input type="text" class="form-control a-failure" value="${a.failure || ''}"></div>
                                <div class="form-group"><label>Extent of Damage</label><input type="text" class="form-control a-damage" value="${a.damage || ''}"></div>
                                <div class="form-group"><label>Contributing Factor</label><input type="text" class="form-control a-factor" value="${a.factor || ''}"></div>
                                <div class="form-group"><label>Operation Condition</label><input type="text" class="form-control a-condition" value="${a.condition || ''}"></div>
                                <div class="form-group"><label>Downtime (Days)</label><input type="number" class="form-control a-days" value="${a.days || ''}"></div>
                                <div class="form-group"><label>Downtime (Hours)</label><input type="number" class="form-control a-hours" value="${a.hours || ''}"></div>
                                <div class="form-group full-width"><label>Desc. of Damage</label><textarea class="form-control a-desc">${a.description || ''}</textarea></div>
                            </div>
                        </div>
                    `).join('')}
                 </div>
                 <button class="btn btn-secondary" id="add-asset-btn">Add Asset</button>
                 <button class="btn btn-primary" id="save-assets-btn">Save Assets Data</button>
            </div>
        </div>
    `;
}

function renderMaterialCard(incident) {
    const materials = incident.dataMaterials || []; // List of materials
    const common = incident.dataMaterialCommon || {}; // Common fields for the incident material aspect

    return `
        <div class="card mt-4">
            <div class="card-header"><h3 class="card-title">Material / Environmental</h3></div>
            <div class="card-body">
                <h4>Materials Involved</h4>
                <div id="material-list">
                    ${materials.map((m, i) => `
                        <div class="border p-3 mb-2 rounded material-entry">
                            <h5>Material ${i+1}</h5>
                             <div class="grid grid-cols-2 gap-2">
                                <div class="form-group"><label>Material Name</label><input type="text" class="form-control m-name" value="${m.name || ''}"></div>
                                <div class="form-group"><label>Impact</label><input type="text" class="form-control m-impact" value="${m.impact || ''}"></div>
                                <div class="form-group"><label>Amount Released</label><input type="number" class="form-control m-amount" value="${m.amount || ''}"></div>
                                <div class="form-group"><label>UOM</label><input type="text" class="form-control m-uom" value="${m.uom || ''}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary mb-3" id="add-material-btn">Add Material</button>

                <hr>
                <h4>Environmental Impact & Cleanup</h4>
                <form id="material-common-form">
                    <div class="grid grid-cols-2 gap-2">
                        <div class="form-group"><label>Contributing Factor</label><input type="text" class="form-control" id="mc-factor" value="${common.factor || ''}"></div>
                        <div class="form-group"><label>Release Mechanism</label><input type="text" class="form-control" id="mc-mechanism" value="${common.mechanism || ''}"></div>
                        <div class="form-group"><label>Duration (Hours)</label><input type="number" class="form-control" id="mc-duration" value="${common.duration || ''}"></div>
                        <div class="form-group"><label>Amount in Contact with Env.</label><input type="number" class="form-control" id="mc-contact-amount" value="${common.contactAmount || ''}"></div>
                        <div class="form-group"><label>Affected Env. Medium</label><input type="text" class="form-control" id="mc-medium" value="${common.medium || ''}"></div>
                        <div class="form-group"><label>Amount Containment</label><input type="number" class="form-control" id="mc-containment" value="${common.containment || ''}"></div>
                        <div class="form-group"><label>Containment Method</label><input type="text" class="form-control" id="mc-method" value="${common.method || ''}"></div>
                        <div class="form-group"><label>Containment Effectiveness *</label><input type="text" class="form-control" id="mc-effectiveness" value="${common.effectiveness || ''}"></div>
                        <div class="form-group full-width"><label>Description</label><textarea class="form-control" id="mc-desc">${common.description || ''}</textarea></div>
                    </div>

                    <div class="form-group mt-3">
                        <label class="toggle-switch">
                            <input type="checkbox" id="cleanup-toggle" ${common.cleanupResponse ? 'checked' : ''}>
                            <span class="slider"></span>
                            Cleanup Response Required
                        </label>
                    </div>

                    <div id="cleanup-fields" style="display: ${common.cleanupResponse ? 'block' : 'none'};" class="bg-light p-3 rounded">
                        <div class="grid grid-cols-2 gap-2">
                             <div class="form-group"><label>Start Date</label><input type="date" class="form-control" id="cl-start-date" value="${common.startDate || ''}"></div>
                             <div class="form-group"><label>Start Time</label><input type="time" class="form-control" id="cl-start-time" value="${common.startTime || ''}"></div>
                             <div class="form-group"><label>End Date</label><input type="date" class="form-control" id="cl-end-date" value="${common.endDate || ''}"></div>
                             <div class="form-group"><label>End Time</label><input type="time" class="form-control" id="cl-end-time" value="${common.endTime || ''}"></div>
                             <div class="form-group"><label>Clean Up Method</label><input type="text" class="form-control" id="cl-cleanup" value="${common.cleanup || ''}"></div>
                             <div class="form-group"><label>PPE Used</label><input type="text" class="form-control" id="cl-ppe" value="${common.ppe || ''}"></div>
                             <div class="form-group"><label>Amount Disposed</label><input type="number" class="form-control" id="cl-amount" value="${common.disposedAmount || ''}"></div>
                             <div class="form-group"><label>UOM</label><input type="text" class="form-control" id="cl-uom" value="${common.disposedUom || ''}"></div>
                             <div class="form-group"><label>Disposal Facility</label><input type="text" class="form-control" id="cl-facility" value="${common.facility || ''}"></div>
                             <div class="form-group full-width"><label>Waste Desc.</label><textarea class="form-control" id="cl-waste">${common.wasteDesc || ''}</textarea></div>
                             <div class="form-group full-width"><label>Decontamination Proc.</label><textarea class="form-control" id="cl-decon">${common.deconProc || ''}</textarea></div>
                        </div>
                    </div>
                </form>

                <button class="btn btn-primary mt-3" id="save-material-btn">Save Material Data</button>
            </div>
        </div>
    `;
}

function renderViolationCard(incident) {
     const violation = incident.dataViolation || {};
     return `
        <div class="card mt-4">
            <div class="card-header"><h3 class="card-title">Policy Violation</h3></div>
            <div class="card-body">
                <form id="violation-form">
                     <div class="form-group">
                        <label>Policy Name / Code</label>
                        <input type="text" class="form-control" id="pv-policy" value="${violation.policy || ''}">
                    </div>
                     <div class="form-group">
                        <label>Violation Details</label>
                        <textarea class="form-control" id="pv-details" rows="3">${violation.details || ''}</textarea>
                    </div>
                     <div class="form-group">
                        <label>Action Taken</label>
                         <textarea class="form-control" id="pv-action" rows="2">${violation.action || ''}</textarea>
                    </div>
                </form>
                <button class="btn btn-primary mt-3" id="save-violation-btn">Save Violation Data</button>
            </div>
        </div>
     `;
}

function renderFinanceCard(incident) {
    const finance = incident.dataFinance || {};
    return `
        <div class="card mt-4">
            <div class="card-header"><h3 class="card-title">Financial Impact</h3></div>
            <div class="card-body">
                 <form id="finance-form">
                     <div class="grid grid-cols-2 gap-2">
                        <div class="form-group"><label>Cost Type</label><input type="text" class="form-control" id="fin-type" value="${finance.type || ''}" placeholder="e.g. Property Damage, Medical"></div>
                        <div class="form-group"><label>Currency</label><input type="text" class="form-control" id="fin-currency" value="${finance.currency || 'USD'}"></div>
                        <div class="form-group"><label>Estimated Cost</label><input type="number" class="form-control" id="fin-est" value="${finance.estimated || ''}"></div>
                        <div class="form-group"><label>Actual Cost</label><input type="number" class="form-control" id="fin-actual" value="${finance.actual || ''}"></div>
                     </div>
                </form>
                <button class="btn btn-primary mt-3" id="save-finance-btn">Save Financial Data</button>
            </div>
        </div>
    `;
}

// --- Data Saving Helpers ---

function addPersonRow(id) {
    const incident = getIncidentById(id);
    const people = incident.dataPeople || [];
    people.push({});
    updateIncident(id, { dataPeople: people });
}

function savePeopleData(id) {
    const entries = document.querySelectorAll('.person-entry');
    const people = Array.from(entries).map(entry => ({
        name: entry.querySelector('.p-name').value,
        nature: entry.querySelector('.p-nature').value,
        severity: entry.querySelector('.p-severity').value,
        factor: entry.querySelector('.p-factor').value,
        hazard: entry.querySelector('.p-hazard').value,
        lostTime: entry.querySelector('.p-lost-time').value,
        returnDate: entry.querySelector('.p-return-date').value,
        firstAid: entry.querySelector('.p-first-aid').value,
        medical: entry.querySelector('.p-medical').value,
        restrictions: entry.querySelector('.p-restrictions').value
    }));
    updateIncident(id, { dataPeople: people });
    Notification.show('People data saved', { type: 'success' });
}

function addAssetRow(id) {
     const incident = getIncidentById(id);
    const assets = incident.dataAssets || [];
    assets.push({});
    updateIncident(id, { dataAssets: assets });
}

function saveAssetsData(id) {
    const entries = document.querySelectorAll('.asset-entry');
    const assets = Array.from(entries).map(entry => ({
        name: entry.querySelector('.a-name').value,
        user: entry.querySelector('.a-user').value,
        status: entry.querySelector('.a-status').value,
        failure: entry.querySelector('.a-failure').value,
        damage: entry.querySelector('.a-damage').value,
        factor: entry.querySelector('.a-factor').value,
        condition: entry.querySelector('.a-condition').value,
        days: entry.querySelector('.a-days').value,
        hours: entry.querySelector('.a-hours').value,
        description: entry.querySelector('.a-desc').value
    }));
    updateIncident(id, { dataAssets: assets });
    Notification.show('Assets data saved', { type: 'success' });
}

function addMaterialRow(id) {
     const incident = getIncidentById(id);
    const materials = incident.dataMaterials || [];
    materials.push({});
    updateIncident(id, { dataMaterials: materials });
}

function saveMaterialData(id) {
    // Save list of materials
    const entries = document.querySelectorAll('.material-entry');
    const materials = Array.from(entries).map(entry => ({
        name: entry.querySelector('.m-name').value,
        impact: entry.querySelector('.m-impact').value,
        amount: entry.querySelector('.m-amount').value,
        uom: entry.querySelector('.m-uom').value
    }));

    // Save common/cleanup data
    const common = {
        factor: document.getElementById('mc-factor').value,
        mechanism: document.getElementById('mc-mechanism').value,
        duration: document.getElementById('mc-duration').value,
        contactAmount: document.getElementById('mc-contact-amount').value,
        medium: document.getElementById('mc-medium').value,
        containment: document.getElementById('mc-containment').value,
        method: document.getElementById('mc-method').value,
        effectiveness: document.getElementById('mc-effectiveness').value,
        description: document.getElementById('mc-desc').value,
        cleanupResponse: document.getElementById('cleanup-toggle').checked,

        startDate: document.getElementById('cl-start-date').value,
        startTime: document.getElementById('cl-start-time').value,
        endDate: document.getElementById('cl-end-date').value,
        endTime: document.getElementById('cl-end-time').value,
        cleanup: document.getElementById('cl-cleanup').value,
        ppe: document.getElementById('cl-ppe').value,
        disposedAmount: document.getElementById('cl-amount').value,
        disposedUom: document.getElementById('cl-uom').value,
        facility: document.getElementById('cl-facility').value,
        wasteDesc: document.getElementById('cl-waste').value,
        deconProc: document.getElementById('cl-decon').value
    };

    updateIncident(id, { dataMaterials: materials, dataMaterialCommon: common });
    Notification.show('Material data saved', { type: 'success' });
}

function saveViolationData(id) {
    const data = {
        policy: document.getElementById('pv-policy').value,
        details: document.getElementById('pv-details').value,
        action: document.getElementById('pv-action').value
    };
    updateIncident(id, { dataViolation: data });
    Notification.show('Violation data saved', { type: 'success' });
}

function saveFinanceData(id) {
    const data = {
        type: document.getElementById('fin-type').value,
        currency: document.getElementById('fin-currency').value,
        estimated: document.getElementById('fin-est').value,
        actual: document.getElementById('fin-actual').value
    };
    updateIncident(id, { dataFinance: data });
    Notification.show('Financial data saved', { type: 'success' });
}


function showAddIncidentModal() {
    const state = getState();
    const users = state.users || [];

    const formHtml = `
        <form id="add-incident-form">
            <div class="row">
                 <div class="col-6">
                    <div class="form-group">
                        <label for="inc-type">Report Type *</label>
                        <select id="inc-type" name="type" class="form-control" required>
                            <option value="">Select Type</option>
                            <option value="Incident">Incident</option>
                            <option value="Near Miss">Near Miss</option>
                            <option value="Observation">Observation</option>
                        </select>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="inc-date">Report Date & Time *</label>
                        <input type="datetime-local" id="inc-date" name="date" class="form-control" required>
                    </div>
                </div>
            </div>

            <fieldset class="border p-2 mb-2 rounded">
                <legend class="w-auto px-2 text-sm">Reporting Person</legend>
                 <div class="row">
                     <div class="col-6"><input type="text" name="reportingPerson" class="form-control mb-2" placeholder="Name" required></div>
                     <div class="col-6"><input type="text" name="employeeId" class="form-control mb-2" placeholder="Employee ID"></div>
                     <div class="col-6"><input type="text" name="department" class="form-control mb-2" placeholder="Department"></div>
                     <div class="col-6"><input type="text" name="contact" class="form-control mb-2" placeholder="Contact"></div>
                 </div>
            </fieldset>

            <fieldset class="border p-2 mb-2 rounded">
                <legend class="w-auto px-2 text-sm">Location</legend>
                 <div class="row">
                     <div class="col-6"><input type="text" name="site" class="form-control mb-2" placeholder="Site"></div>
                     <div class="col-6"><input type="text" name="area" class="form-control mb-2" placeholder="Area"></div>
                     <div class="col-12">
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="inc-location" name="location" class="form-control" style="flex: 1;" required placeholder="Coordinates / Specific Location">
                            <button type="button" class="btn btn-secondary btn-sm" id="btn-get-location">Get GPS</button>
                        </div>
                     </div>
                 </div>
            </fieldset>

            <div class="row">
                <div class="col-6">
                    <div class="form-group">
                        <label for="inc-category">Category/Type</label>
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
                <div class="col-6">
                     <div class="form-group">
                        <label for="inc-severity">Severity Level *</label>
                        <select id="inc-severity" name="severity" class="form-control" required>
                            <option value="">Select Severity</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label for="inc-desc">Description *</label>
                <textarea id="inc-desc" name="description" class="form-control" rows="3" required></textarea>
            </div>

            <div class="form-group">
                <label>Immediate Actions Taken</label>
                <textarea name="immediateActions" class="form-control" rows="2"></textarea>
            </div>

             <div class="form-group">
                <label>Witness Names</label>
                <textarea name="witnesses" class="form-control" rows="1" placeholder="Enter names separated by comma"></textarea>
            </div>

            <div class="form-group">
                <label for="inc-photos">Evidence/Attachments</label>
                <input type="file" id="inc-photos" name="photos" class="form-control" multiple accept="image/*,video/*">
            </div>

            <div class="form-group">
                <label>Assigned To</label>
                 <select name="assignedTo" class="form-control">
                    <option value="">Select User</option>
                    ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                </select>
            </div>

            <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Report Incident</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Report New Incident / Observation' });

    // Handle Location Button
    document.getElementById('btn-get-location').addEventListener('click', () => {
        const locInput = document.getElementById('inc-location');
        locInput.value = "Fetching location...";
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    locInput.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                },
                () => { locInput.value = "Error fetching location"; }
            );
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
                title: `${formData.get('type')} - ${formData.get('category') || 'Uncategorized'}`,
                date: new Date(formData.get('date')),
                type: formData.get('type'),
                category: formData.get('category'),
                severity: formData.get('severity'),
                location: formData.get('location'), // Keep single location string for compatibility but could store site/area separate
                site: formData.get('site'),
                area: formData.get('area'),
                description: formData.get('description'),
                immediateActions: formData.get('immediateActions'),
                reportingPerson: formData.get('reportingPerson'),
                employeeId: formData.get('employeeId'),
                department: formData.get('department'),
                contact: formData.get('contact'),
                witnesses: formData.get('witnesses'),
                assignedTo: parseInt(formData.get('assignedTo')) || null,
                photos: photoFiles,
                status: 'Reported',
                createdDate: new Date()
            };

            addIncident(newIncident);
            Notification.show('Report submitted successfully', { type: 'success' });
            modal.close();
        }
    });
}

function getAssigneeName(userId) {
    if (!userId) return 'Unassigned';
    const state = getState();
    const user = state.users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
}

function exportIncidents() {
    const incidents = getIncidents();
    const csvContent = "data:text/csv;charset=utf-8,"
        + "ID,Date,Type,Title,Status,Severity,Location,Description\n"
        + incidents.map(e => {
            const row = [
                e.id,
                new Date(e.date).toISOString().split('T')[0],
                `"${e.type}"`,
                `"${e.title ? e.title.replace(/"/g, '""') : ''}"`,
                e.status,
                e.severity,
                `"${e.location ? e.location.replace(/"/g, '""') : ''}"`,
                `"${e.description ? e.description.replace(/"/g, '""') : ''}"`
            ];
            return row.join(",");
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "incidents_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helpers
function getSeverityBadgeClass(severity) {
    switch (severity) {
        case 'Critical': return 'danger';
        case 'High': return 'warning';
        case 'Medium': return 'info';
        case 'Low': return 'success';
        default: return 'secondary';
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
