import { Modal, Notification } from '../utils/util.js';

export class FishboneModal {
    constructor(incidentId, existingData, onSave) {
        this.incidentId = incidentId;
        this.data = existingData || {
            problemStatement: 'Problem Statement',
            categories: [
                { id: 'cat1', title: 'People', causes: [] },
                { id: 'cat2', title: 'Methods', causes: [] },
                { id: 'cat3', title: 'Machines', causes: [] },
                { id: 'cat4', title: 'Materials', causes: [] },
                { id: 'cat5', title: 'Environment', causes: [] },
                { id: 'cat6', title: 'Measurements', causes: [] }
            ]
        };
        this.onSave = onSave;
        this.modal = null;
        this.svgWidth = 900;
        this.svgHeight = 500;
    }

    render() {
        const html = `
            <div class="fishbone-container" style="display: flex; flex-direction: column; height: 100%;">
                <div class="controls" style="margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <div style="flex: 1;">
                         <label>Problem Statement</label>
                         <input type="text" id="fb-problem" class="form-control" value="${this.data.problemStatement}">
                    </div>
                    <div style="display: flex; align-items: flex-end; gap: 5px;">
                        <button class="btn btn-secondary btn-sm" id="fb-add-cat">Add Category</button>
                        <button class="btn btn-secondary btn-sm" id="fb-reset">Reset</button>
                    </div>
                </div>

                <div class="canvas-wrapper" style="border: 1px solid #ddd; background: #fff; overflow: auto; min-height: 400px; position: relative;">
                    <div id="fishbone-svg-container"></div>
                </div>

                <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    Click on a category bone to add a cause. Click on a cause to delete it.
                </div>

                <div class="form-actions text-right" style="margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" id="fb-cancel-btn">Cancel</button>
                    <button type="button" class="btn btn-primary" id="fb-save-btn">Save Diagram</button>
                </div>
            </div>
        `;

        this.modal = Modal.show(html, { title: 'Fishbone (Ishikawa) Diagram', size: 'large' });
        this.drawDiagram();
        this.attachEvents();
    }

    attachEvents() {
        document.getElementById('fb-cancel-btn').addEventListener('click', () => this.modal.close());
        document.getElementById('fb-save-btn').addEventListener('click', () => this.save());

        document.getElementById('fb-problem').addEventListener('input', (e) => {
            this.data.problemStatement = e.target.value;
            this.drawDiagram();
        });

        document.getElementById('fb-add-cat').addEventListener('click', () => {
            const title = prompt('Category Name:');
            if (title) {
                this.data.categories.push({
                    id: 'cat-' + Date.now(),
                    title: title,
                    causes: []
                });
                this.drawDiagram();
            }
        });

        document.getElementById('fb-reset').addEventListener('click', () => {
             if(confirm("Reset diagram?")) {
                 this.data.problemStatement = "Problem Statement";
                 this.data.categories = [
                    { id: 'cat1', title: 'People', causes: [] },
                    { id: 'cat2', title: 'Methods', causes: [] },
                    { id: 'cat3', title: 'Machines', causes: [] },
                    { id: 'cat4', title: 'Materials', causes: [] },
                    { id: 'cat5', title: 'Environment', causes: [] },
                    { id: 'cat6', title: 'Measurements', causes: [] }
                ];
                document.getElementById('fb-problem').value = this.data.problemStatement;
                this.drawDiagram();
             }
        });
    }

    save() {
        if (this.onSave) {
            this.onSave(this.data);
        }
        this.modal.close();
        Notification.show('Fishbone Diagram saved.', { type: 'success' });
    }

    drawDiagram() {
        const container = document.getElementById('fishbone-svg-container');
        if (!container) return;

        // Simple Layout Calculation
        const startX = 50;
        const endX = this.svgWidth - 150;
        const spineY = this.svgHeight / 2;

        const categories = this.data.categories;
        const numCats = categories.length;
        const spacing = 120; // Fixed spacing

        // Adjust width if needed
        const requiredWidth = startX + (Math.ceil(numCats/2) * spacing) + 200;
        this.svgWidth = Math.max(900, requiredWidth);

        let svgHtml = `
            <svg width="${this.svgWidth}" height="${this.svgHeight}" xmlns="http://www.w3.org/2000/svg">
                <!-- Spine -->
                <line x1="${startX}" y1="${spineY}" x2="${endX}" y2="${spineY}" stroke="#333" stroke-width="3" />

                <!-- Head (Problem) -->
                <polygon points="${endX},${spineY} ${endX+20},${spineY-15} ${endX+20},${spineY+15}" fill="#333" />
                <rect x="${endX+25}" y="${spineY-30}" width="150" height="60" rx="5" fill="#f0f0f0" stroke="#333" />
                <foreignObject x="${endX+25}" y="${spineY-30}" width="150" height="60">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 5px; text-align: center; font-size: 12px; font-weight: bold; overflow: hidden;">
                        ${this.escapeHtml(this.data.problemStatement)}
                    </div>
                </foreignObject>
        `;

        categories.forEach((cat, index) => {
            const isTop = index % 2 === 0;
            const col = Math.floor(index / 2);
            // Draw from left to right, starting after startX
            const x = startX + ((col + 1) * spacing);

            const boneX1 = x;
            const boneY1 = spineY;
            const boneX2 = x - 30; // Slant back
            const boneY2 = isTop ? spineY - 140 : spineY + 140;

            const color = '#1976d2';

            svgHtml += `
                <!-- Category Bone for ${cat.title} -->
                <g class="category-group" data-id="${cat.id}" style="cursor: pointer;">
                    <line x1="${boneX1}" y1="${boneY1}" x2="${boneX2}" y2="${boneY2}" stroke="${color}" stroke-width="2" />
                    <rect x="${boneX2 - 50}" y="${isTop ? boneY2 - 25 : boneY2 + 5}" width="100" height="20" fill="white" stroke="${color}" rx="3"/>
                    <text x="${boneX2}" y="${isTop ? boneY2 - 11 : boneY2 + 19}" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">${this.escapeHtml(cat.title)}</text>

                    <!-- Click target -->
                    <rect x="${Math.min(boneX1, boneX2)-10}" y="${Math.min(boneY1, boneY2)}" width="${Math.abs(boneX1-boneX2)+20}" height="${Math.abs(boneY1-boneY2)}" fill="transparent" />
                </g>
            `;

            // Draw Causes
            cat.causes.forEach((cause, cIndex) => {
                const t = (cIndex + 1) / (cat.causes.length + 1);
                const cx = boneX1 + (boneX2 - boneX1) * t;
                const cy = boneY1 + (boneY2 - boneY1) * t;

                const causeDir = 1; // 1 = right
                const causeLen = 80;

                const cX1 = cx;
                const cY1 = cy;
                const cX2 = cx + (causeLen * causeDir);
                const cY2 = cy;

                svgHtml += `
                    <g class="cause-group" data-cat="${cat.id}" data-cause="${cIndex}" style="cursor: pointer;">
                        <line x1="${cX1}" y1="${cY1}" x2="${cX2}" y2="${cY2}" stroke="#666" stroke-width="1" />
                        <text x="${cX1 + 5}" y="${cY1 - 3}" font-size="9" fill="#333">${this.escapeHtml(cause.text)}</text>
                        <title>Click to delete</title>
                    </g>
                `;
            });
        });

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;

        container.querySelectorAll('.category-group').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const catId = el.dataset.id;
                this.addCause(catId);
            });
        });

        container.querySelectorAll('.cause-group').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const catId = el.dataset.cat;
                const causeIndex = parseInt(el.dataset.cause);
                this.deleteCause(catId, causeIndex);
            });
        });
    }

    addCause(catId) {
        const cat = this.data.categories.find(c => c.id === catId);
        if (cat) {
            const text = prompt(`Add cause to ${cat.title}:`);
            if (text) {
                cat.causes.push({ text: text });
                this.drawDiagram();
            }
        }
    }

    deleteCause(catId, causeIndex) {
        const cat = this.data.categories.find(c => c.id === catId);
        if (cat) {
            if(confirm(`Delete cause "${cat.causes[causeIndex].text}"?`)) {
                cat.causes.splice(causeIndex, 1);
                this.drawDiagram();
            }
        }
    }

    escapeHtml(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
