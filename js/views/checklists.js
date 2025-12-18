import {
    getChecklists,
    addChecklist,
    subscribe
} from '../store.js';
import { Modal, Notification, validateForm } from '../utils/util.js';

let unsubscribe;

export function renderChecklistsView() {
    setTimeout(() => renderChecklists(document.getElementById('app-root')), 0);
    return '<div id="checklists-view-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderChecklists(container) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash.startsWith('#/checklists')) {
             renderChecklists(container);
        }
    });

    const checklists = getChecklists();

    const html = `
        <div class="page-header">
            <h1 class="page-title">Checklist Management</h1>
            <div class="page-actions">
                <button class="btn btn-secondary" id="library-btn">Template Library</button>
                <button class="btn btn-primary" id="create-checklist-btn">Create Checklist</button>
            </div>
        </div>

        <div class="filter-bar card">
            <div class="filter-group">
                <input type="text" id="search-input" class="form-control" placeholder="Search checklists...">
                <select id="filter-category" class="form-select">
                    <option value="">All Categories</option>
                    <option value="Pre-Use">Pre-Use</option>
                    <option value="Safety Audit">Safety Audit</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Onboarding">Onboarding</option>
                </select>
            </div>
        </div>

        <div class="row">
            ${checklists.map(checklist => `
                <div class="col-4">
                    <div class="card checklist-card h-100">
                        <div class="card-header">
                            <h3 class="card-title">${checklist.title}</h3>
                            <span class="badge badge-${getStatusBadgeClass(checklist.status)}">${checklist.status}</span>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-2">${checklist.category}</p>
                            <p class="text-sm">Created: ${new Date(checklist.createdDate).toLocaleDateString()}</p>
                            <div class="checklist-items-preview">
                                <strong>Items (${checklist.items.length}):</strong>
                                <ul>
                                    ${checklist.items.slice(0, 3).map(item => `
                                        <li>• ${item.text}</li>
                                    `).join('')}
                                    ${checklist.items.length > 3 ? `<li>+ ${checklist.items.length - 3} more...</li>` : ''}
                                </ul>
                            </div>
                        </div>
                        <div class="card-footer text-right">
                             <button class="btn btn-sm btn-outline view-btn" data-id="${checklist.id}">View/Edit</button>
                             <button class="btn btn-sm btn-secondary clone-btn" data-id="${checklist.id}">Clone</button>
                        </div>
                    </div>
                </div>
            `).join('')}
            ${checklists.length === 0 ? '<div class="col-12"><div class="empty-state"><p>No checklists found.</p></div></div>' : ''}
        </div>
    `;

    container.innerHTML = html;

    document.getElementById('create-checklist-btn').addEventListener('click', showCreateChecklistModal);
    document.getElementById('search-input').addEventListener('input', (e) => filterChecklists(e.target.value));
    document.getElementById('filter-category').addEventListener('change', () => filterChecklists());

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => showChecklistDetailModal(btn.dataset.id));
    });

     document.querySelectorAll('.clone-btn').forEach(btn => {
        btn.addEventListener('click', () => cloneChecklist(btn.dataset.id));
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Active': return 'success';
        case 'Draft': return 'warning';
        case 'Archived': return 'secondary';
        default: return 'info';
    }
}

function filterChecklists(searchTerm = '') {
    const searchInput = document.getElementById('search-input');
    const term = searchTerm || searchInput.value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;

    const cards = document.querySelectorAll('.checklist-card');

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const category = card.querySelector('.text-muted').innerText;

        const matchesSearch = text.includes(term);
        const matchesCategory = !categoryFilter || category === categoryFilter;

        if (matchesSearch && matchesCategory) {
            card.parentElement.style.display = '';
        } else {
            card.parentElement.style.display = 'none';
        }
    });
}

function showCreateChecklistModal() {
    const formHtml = `
        <form id="create-checklist-form">
            <div class="form-group">
                <label for="cl-title">Checklist Title *</label>
                <input type="text" id="cl-title" name="title" class="form-control" required placeholder="e.g., Monthly Fire Inspection">
            </div>
            <div class="form-group">
                <label for="cl-category">Category *</label>
                <select id="cl-category" name="category" class="form-control" required>
                    <option value="">Select Category</option>
                    <option value="Pre-Use">Pre-Use</option>
                    <option value="Safety Audit">Safety Audit</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Maintenance">Maintenance</option>
                </select>
            </div>
            <div class="form-group">
                <label>Items (one per line)</label>
                <textarea id="cl-items" name="items" class="form-control" rows="5" placeholder="Item 1\nItem 2\nItem 3"></textarea>
                <small class="text-muted">Enter questions or checkpoints, one per line.</small>
            </div>
             <div class="form-actions text-right">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Checklist</button>
            </div>
        </form>
    `;

    const modal = Modal.show(formHtml, { title: 'Create New Checklist' });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());

    document.getElementById('create-checklist-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const { isValid } = validateForm(form);

        if (isValid) {
            const formData = new FormData(form);
            const itemsText = formData.get('items');
            const items = itemsText.split('\n').filter(line => line.trim() !== '').map(text => ({ text: text.trim(), completed: false }));

            const newChecklist = {
                title: formData.get('title'),
                category: formData.get('category'),
                status: 'Active',
                items: items
            };

            addChecklist(newChecklist);
            Notification.show('Checklist created successfully', { type: 'success' });
            modal.close();
        }
    });
}

function showChecklistDetailModal(id) {
    const checklists = getChecklists();
    const cl = checklists.find(c => c.id == id);
    if (!cl) return;

    const html = `
        <div class="checklist-detail">
            <div class="detail-row">
                <label>Status:</label>
                <span class="badge badge-${getStatusBadgeClass(cl.status)}">${cl.status}</span>
            </div>
            <div class="detail-row">
                <label>Category:</label>
                <span>${cl.category}</span>
            </div>

            <hr>

            <h3>Items</h3>
            <div class="checklist-items-list">
                ${cl.items.map((item, index) => `
                    <div class="checklist-item-row" style="padding: 5px 0; border-bottom: 1px solid #eee;">
                        <span>${index + 1}. ${item.text}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="modal-footer text-right mt-4">
             <button class="btn btn-secondary">Edit</button>
             <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `;

    const modal = Modal.show(html, { title: cl.title });
    document.querySelector('.modal-close-btn').addEventListener('click', () => modal.close());
}

function cloneChecklist(id) {
     const checklists = getChecklists();
    const original = checklists.find(c => c.id == id);
    if (!original) return;

    const copy = {
        ...original,
        title: `${original.title} (Copy)`,
        status: 'Draft',
        createdDate: new Date()
    };

    addChecklist(copy);
    Notification.show('Checklist cloned', { type: 'success' });
}
