import { Modal, Notification } from '../utils/util.js';

export class FiveWhysModal {
    constructor(incidentId, existingData, onSave) {
        this.incidentId = incidentId;
        // Deep copy data to prevent modifying the original state object
        this.data = existingData ? JSON.parse(JSON.stringify(existingData)) : this.getDefaultData();
        // Ensure at least 3 initial slots for a better starting experience
        while (this.data.whys.length < 3) this.data.whys.push('');

        this.onSave = onSave;
        this.modal = null;
        this.container = null;
    }

    getDefaultData() {
        return {
            problemStatement: '',
            whys: ['', '', ''],
            rootCause: ''
        };
    }

    render() {
        const html = `
            <div class="five-whys-container" style="display: flex; flex-direction: column; height: 100%;">
                
                <div class="form-group">
                    <label for="fw-problem" class="font-weight-bold">Problem Statement</label>
                    <input type="text" id="fw-problem" class="form-control form-control-lg" value="${this.escapeHtml(this.data.problemStatement)}" placeholder="Start by describing the problem clearly...">
                </div>

                <div class="causal-chain-container" id="causal-chain" style="padding: 20px 0; overflow-x: auto;">
                    <!-- Visual chain will be rendered here -->
                </div>

                <div class="form-group" style="margin-top: 10px;">
                    <label for="fw-root-cause" class="font-weight-bold">Root Cause Conclusion</label>
                    <textarea id="fw-root-cause" class="form-control" rows="3" placeholder="After drilling down, what is the final root cause?">${this.escapeHtml(this.data.rootCause)}</textarea>
                </div>

                <div class="form-actions text-right" style="margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" id="fw-cancel-btn">Cancel</button>
                    <button type="button" class="btn btn-primary" id="fw-save-btn">Save Analysis</button>
                </div>
            </div>
        `;

        this.modal = Modal.show(html, { title: '5 Whys - Visual Causal Chain', size: 'large' });
        this.container = document.getElementById('causal-chain');
        this.drawChain();
        this.attachEvents();
    }
    
    drawChain() {
        if (!this.container) return;
        this.container.innerHTML = ''; // Clear previous content

        this.data.whys.forEach((why, index) => {
            // --- Node ---
            const node = document.createElement('div');
            node.className = 'why-node';
            node.innerHTML = `
                <div class="why-header">
                    <span class="why-label">Why #${index + 1}</span>
                    <button class="btn-icon btn-remove-why" title="Remove this step">&times;</button>
                </div>
                <div class="why-content">
                    <textarea class="why-input" rows="2" placeholder="Because...">${this.escapeHtml(why)}</textarea>
                </div>
            `;
            node.querySelector('.btn-remove-why').addEventListener('click', () => this.removeWhy(index));
            node.querySelector('.why-input').addEventListener('input', (e) => this.updateWhy(index, e.target.value));
            
            this.container.appendChild(node);

            // --- Arrow (except for the last one) ---
            const arrow = document.createElement('div');
            arrow.className = 'chain-arrow';
            arrow.innerHTML = `<span>&darr;</span>`; // Downwards arrow
            this.container.appendChild(arrow);
        });

        // --- Add Button ---
        const addBtnContainer = document.createElement('div');
        addBtnContainer.className = 'add-why-container';
        addBtnContainer.innerHTML = `<button id="add-why-btn" class="btn btn-secondary btn-circle" title="Add another 'Why'">+</button>`;
        addBtnContainer.querySelector('#add-why-btn').addEventListener('click', () => this.addWhy());

        this.container.appendChild(addBtnContainer);

        // --- Add some CSS for the visual chain ---
        this.applyStyles();
    }
    
    applyStyles() {
        const styleId = 'five-whys-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .causal-chain-container {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .why-node {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 10px;
                width: 80%;
                max-width: 500px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .why-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            .why-label {
                font-weight: bold;
                color: #495057;
            }
            .btn-remove-why {
                border: none;
                background: transparent;
                color: #adb5bd;
                font-size: 1.5rem;
                line-height: 1;
                padding: 0 5px;
                cursor: pointer;
            }
            .btn-remove-why:hover {
                color: #e53935;
            }
            .why-content textarea.why-input {
                width: 100%;
                border: 1px solid #ced4da;
                border-radius: 4px;
                padding: 5px;
                resize: vertical;
                font-size: 0.95rem;
            }
            .why-content textarea.why-input:focus {
                border-color: #80bdff;
                outline: 0;
                box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
            }
            .chain-arrow {
                font-size: 2rem;
                color: #adb5bd;
                margin: 5px 0;
            }
            .add-why-container {
                padding: 10px;
            }
            .btn-circle {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-size: 1.5rem;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(style);
    }

    attachEvents() {
        document.getElementById('fw-cancel-btn').addEventListener('click', () => this.modal.close());
        document.getElementById('fw-save-btn').addEventListener('click', () => this.save());

        document.getElementById('fw-problem').addEventListener('input', (e) => this.data.problemStatement = e.target.value);
        document.getElementById('fw-root-cause').addEventListener('input', (e) => this.data.rootCause = e.target.value);
    }

    addWhy() {
        this.data.whys.push('');
        this.drawChain();
        // Focus the new input
        const inputs = this.container.querySelectorAll('.why-input');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
        }
    }

    removeWhy(index) {
        if (this.data.whys.length <= 1) {
            Notification.show("You must have at least one 'Why' step.", { type: "warn" });
            return;
        }
        this.data.whys.splice(index, 1);
        this.drawChain();
    }

    updateWhy(index, value) {
        this.data.whys[index] = value;
    }

    save() {
        // Filter out empty 'why' steps before saving
        this.data.whys = this.data.whys.filter(why => why.trim() !== '');

        if (!this.data.problemStatement) {
            Notification.show('Please enter a problem statement.', { type: 'error' });
            document.getElementById('fw-problem').focus();
            return;
        }
        if (this.data.whys.length === 0) {
            Notification.show("Please provide at least one 'Why' cause.", { type: 'error' });
            return;
        }
        if (!this.data.rootCause) {
            Notification.show('Please summarize the root cause conclusion.', { type: 'error' });
            document.getElementById('fw-root-cause').focus();
            return;
        }

        if (this.onSave) {
            this.onSave(this.data);
        }
        this.modal.close();
        Notification.show('5 Whys Analysis saved.', { type: 'success' });
    }

    escapeHtml(text) {
        if (!text) return "";
        const p = document.createElement('p');
        p.textContent = text;
        return p.innerHTML;
    }
}
