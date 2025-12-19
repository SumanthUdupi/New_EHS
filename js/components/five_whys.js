import { Modal, Notification } from '../utils/util.js';

export class FiveWhysModal {
    constructor(incidentId, existingData, onSave) {
        this.incidentId = incidentId;
        this.data = existingData || {
            problemStatement: '',
            whys: ['', '', '', '', ''],
            rootCause: ''
        };
        // Ensure at least 5 slots
        while (this.data.whys.length < 5) this.data.whys.push('');

        this.onSave = onSave;
        this.modal = null;
    }

    render() {
        const whysHtml = this.renderWhysList();

        const html = `
            <div class="five-whys-container">
                <div class="form-group">
                    <label for="fw-problem">Problem Statement</label>
                    <input type="text" id="fw-problem" class="form-control" value="${this.data.problemStatement}" placeholder="Describe the problem..." style="width: 100%;">
                </div>

                <div id="whys-list">
                    ${whysHtml}
                </div>

                <button type="button" class="btn btn-sm btn-secondary mb-3" id="add-why-btn" style="margin-top: 10px;">+ Add Another "Why"</button>

                <div class="form-group" style="margin-top: 20px;">
                    <label for="fw-root-cause">Root Cause Conclusion</label>
                    <textarea id="fw-root-cause" class="form-control" rows="3" placeholder="Summarize the root cause...">${this.data.rootCause}</textarea>
                </div>

                <div class="form-actions text-right" style="margin-top: 20px; text-align: right;">
                    <button type="button" class="btn btn-secondary" id="fw-cancel-btn">Cancel</button>
                    <button type="button" class="btn btn-primary" id="fw-save-btn">Save Analysis</button>
                </div>
            </div>
        `;

        this.modal = Modal.show(html, { title: '5 Whys Analysis', size: 'large' });
        this.attachEvents();
    }

    renderWhysList() {
        return this.data.whys.map((why, index) => `
            <div class="form-group" style="margin-bottom: 10px;">
                <label>Why ${index + 1}?</label>
                <div class="input-group" style="display: flex; gap: 8px;">
                    <input type="text" class="form-control why-input" data-index="${index}" value="${why}" placeholder="Enter cause..." style="flex: 1;">
                    ${this.data.whys.length > 5 ? `<button type="button" class="btn btn-danger remove-why-btn" data-index="${index}">X</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    attachEvents() {
        document.getElementById('fw-cancel-btn').addEventListener('click', () => this.modal.close());

        document.getElementById('fw-save-btn').addEventListener('click', () => {
            this.save();
        });

        document.getElementById('add-why-btn').addEventListener('click', () => {
            this.addWhy();
        });

        const listContainer = document.getElementById('whys-list');

        // Delegate event for remove buttons
        listContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-why-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.removeWhy(index);
            }
        });

        // Input binding for Problem Statement
        document.getElementById('fw-problem').addEventListener('input', (e) => {
            this.data.problemStatement = e.target.value;
        });

        // Input binding for Root Cause
        document.getElementById('fw-root-cause').addEventListener('input', (e) => {
            this.data.rootCause = e.target.value;
        });

        // Bind why inputs
        listContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('why-input')) {
                const index = parseInt(e.target.dataset.index);
                this.data.whys[index] = e.target.value;
            }
        });
    }

    addWhy() {
        this.data.whys.push('');
        this.refreshWhys();
    }

    removeWhy(index) {
        this.data.whys.splice(index, 1);
        this.refreshWhys();
    }

    refreshWhys() {
        document.getElementById('whys-list').innerHTML = this.renderWhysList();
        // Note: Event delegation on #whys-list handles the new elements.
    }

    save() {
        if (!this.data.problemStatement) {
            Notification.show('Please enter a problem statement.', { type: 'error' });
            return;
        }

        if (this.onSave) {
            this.onSave(this.data);
        }
        this.modal.close();
        Notification.show('5 Whys Analysis saved.', { type: 'success' });
    }
}
