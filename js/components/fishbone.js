import { Modal, Notification } from '../utils/util.js';

/**
 * A more robust SVG element creation helper.
 * @param {string} tag - The SVG tag name (e.g., 'svg', 'line', 'g').
 * @param {object} attrs - An object of attributes to set on the element.
 * @returns {SVGElement} The created SVG element.
 */
function createSvgElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
    return el;
}

export class FishboneModal {
    constructor(incidentId, existingData, onSave) {
        this.incidentId = incidentId;
        // Deep copy the existing data to prevent modifying the original object
        this.data = existingData ? JSON.parse(JSON.stringify(existingData)) : this.getDefaultData();
        this.onSave = onSave;
        this.modal = null;
        this.svgContainer = null;
        this.svgWidth = 900;
        this.svgHeight = 500;
    }

    getDefaultData() {
        return {
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
    }

    render() {
        const html = `
            <div class="fishbone-container" style="display: flex; flex-direction: column; height: 100%;">
                <div class="controls" style="margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <div style="flex: 1;">
                         <label for="fb-problem">Problem Statement</label>
                         <input type="text" id="fb-problem" class="form-control" value="${this.escapeHtml(this.data.problemStatement)}">
                    </div>
                    <div style="display: flex; align-items: flex-end; gap: 5px;">
                        <button class="btn btn-secondary btn-sm" id="fb-add-cat" title="Add new category bone">Add Category</button>
                        <button class="btn btn-danger btn-sm" id="fb-reset" title="Reset diagram to default">Reset</button>
                    </div>
                </div>

                <div class="canvas-wrapper" style="border: 1px solid #ddd; background: #f9f9f9; overflow: auto; min-height: 400px; position: relative;">
                    <div id="fishbone-svg-container"></div>
                </div>

                 <div class="form-actions text-right" style="margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" id="fb-cancel-btn">Cancel</button>
                    <button type="button" class="btn btn-primary" id="fb-save-btn">Save Diagram</button>
                </div>
            </div>
        `;

        this.modal = Modal.show(html, { title: 'Fishbone (Ishikawa) Diagram', size: 'large' });
        this.svgContainer = document.getElementById('fishbone-svg-container');
        this.drawDiagram();
        this.attachEvents();
    }

    attachEvents() {
        document.getElementById('fb-cancel-btn').addEventListener('click', () => this.modal.close());
        document.getElementById('fb-save-btn').addEventListener('click', () => this.save());

        document.getElementById('fb-problem').addEventListener('input', (e) => {
            this.data.problemStatement = e.target.value;
            this.drawDiagram(); // Redraw to update the head
        });

        document.getElementById('fb-add-cat').addEventListener('click', () => this.addCategory());
        document.getElementById('fb-reset').addEventListener('click', () => this.resetDiagram());
    }

    save() {
        if (this.onSave) {
            this.onSave(this.data);
        }
        this.modal.close();
        Notification.show('Fishbone Diagram saved.', { type: 'success' });
    }

    addCategory() {
        // Use an inline form instead of prompt
        const tempId = 'new-cat-' + Date.now();
        const inputHtml = `<div class="form-group" style="margin-bottom: 0;">
            <input type="text" id="${tempId}" class="form-control form-control-sm" placeholder="Enter category name">
        </div>`;
        const notification = Notification.show(inputHtml, {
            title: "Add New Category",
            type: "form",
            duration: -1, // Persist until closed
            buttons: [{ text: "Add", action: (n) => {
                const input = document.getElementById(tempId);
                const title = input.value.trim();
                if (title) {
                    this.data.categories.push({ id: 'cat-' + Date.now(), title: title, causes: [] });
                    this.drawDiagram();
                    n.close();
                } else {
                    input.focus();
                    Notification.show("Category name cannot be empty.", { type: "error" });
                }
            }}]
        });
    }

    resetDiagram() {
        if (confirm("Are you sure you want to reset the entire diagram? This cannot be undone.")) {
            this.data = this.getDefaultData();
            document.getElementById('fb-problem').value = this.data.problemStatement;
            this.drawDiagram();
        }
    }

    drawDiagram() {
        if (!this.svgContainer) return;
        this.svgContainer.innerHTML = ''; // Clear previous SVG

        const startX = 50;
        const endX = this.svgWidth - 200;
        const spineY = this.svgHeight / 2;

        const numCats = this.data.categories.length;
        const spacing = 130;
        const requiredWidth = startX + (Math.ceil(numCats / 2) * spacing) + 250;
        this.svgWidth = Math.max(900, requiredWidth);

        const svg = createSvgElement('svg', { width: this.svgWidth, height: this.svgHeight, xmlns: 'http://www.w3.org/2000/svg' });

        // --- Spine ---
        svg.appendChild(createSvgElement('line', { x1: startX, y1: spineY, x2: endX, y2: spineY, stroke: '#333', 'stroke-width': 3 }));

        // --- Head (Problem Statement) ---
        const headGroup = createSvgElement('g', { class: 'fishbone-head' });
        headGroup.appendChild(createSvgElement('polygon', { points: `${endX},${spineY} ${endX + 20},${spineY - 20} ${endX + 20},${spineY + 20}`, fill: '#333' }));
        const foreignObject = createSvgElement('foreignObject', { x: endX + 25, y: spineY - 35, width: 160, height: 70 });
        const problemDiv = document.createElement('div');
        problemDiv.setAttribute('style', 'display: flex; align-items: center; justify-content: center; height: 100%; padding: 8px; text-align: center; font-size: 13px; font-weight: bold; overflow: hidden; word-break: break-word; background: #e0e0e0; border: 1px solid #999; border-radius: 5px;');
        problemDiv.textContent = this.data.problemStatement;
        foreignObject.appendChild(problemDiv);
        headGroup.appendChild(foreignObject);
        svg.appendChild(headGroup);

        // --- Categories (Bones) ---
        this.data.categories.forEach((cat, index) => {
            const isTop = index % 2 === 0;
            const col = Math.floor(index / 2);
            const x = startX + ((col + 1) * spacing);
            const boneY2 = isTop ? spineY - 150 : spineY + 150;

            const group = createSvgElement('g', { class: 'category-group', 'data-id': cat.id });

            // Bone line
            group.appendChild(createSvgElement('line', { x1: x, y1: spineY, x2: x, y2: boneY2, stroke: '#1976d2', 'stroke-width': 2 }));
            
            // Category Title Box
            const textGroup = createSvgElement('g', { style: 'cursor: pointer;' });
            textGroup.appendChild(createSvgElement('rect', { x: x - 60, y: isTop ? boneY2 - 25 : boneY2 + 5, width: 120, height: 20, fill: 'white', stroke: '#1976d2', rx: 3 }));
            const text = createSvgElement('text', { x: x, y: isTop ? boneY2 - 11 : boneY2 + 19, 'text-anchor': 'middle', 'font-size': '11', 'font-weight': 'bold', fill: '#333' });
            text.textContent = this.escapeHtml(cat.title);
            textGroup.appendChild(text);
            group.appendChild(textGroup);

            // Add Cause Button
            const addBtnGroup = createSvgElement('g', { class: 'add-cause-btn', style: 'cursor: pointer; opacity: 0.5;' });
            addBtnGroup.appendChild(createSvgElement('circle', { cx: x + 45, cy: isTop ? boneY2 - 15 : boneY2 + 15, r: 8, fill: '#4CAF50' }));
            const plus = createSvgElement('text', { x: x + 45, y: isTop ? boneY2 - 11 : boneY2 + 19, 'text-anchor': 'middle', fill: 'white', 'font-size': 16, 'font-weight': 'bold' });
            plus.textContent = '+';
            addBtnGroup.appendChild(plus);
            addBtnGroup.addEventListener('mouseenter', () => addBtnGroup.style.opacity = '1');
            addBtnGroup.addEventListener('mouseleave', () => addBtnGroup.style.opacity = '0.5');
            addBtnGroup.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addCause(cat.id, x, isTop ? boneY2 + 20 : boneY2 - 20);
            });
            group.appendChild(addBtnGroup);

            // Draw Causes
            this.drawCauses(group, cat, { x1: x, y1: spineY, x2: x, y2: boneY2 });

            svg.appendChild(group);
        });

        this.svgContainer.appendChild(svg);
    }

    drawCauses(categoryGroup, category, bone) {
        category.causes.forEach((cause, index) => {
            const t = (index + 0.75) / (category.causes.length + 0.5); // Better distribution
            const cX = bone.x1 + (bone.x2 - bone.x1) * t;
            const cY = bone.y1 + (bone.y2 - bone.y1) * t;
            const causeLen = 100;
            
            const causeGroup = createSvgElement('g', { class: 'cause-group' });
            causeGroup.appendChild(createSvgElement('line', { x1: cX, y1: cY, x2: cX + causeLen, y2: cY, stroke: '#666', 'stroke-width': 1 }));

            const causeFo = createSvgElement('foreignObject', { x: cX + 5, y: cY - 15, width: causeLen - 10, height: 30 });
            const causeInput = document.createElement('input');
            causeInput.setAttribute('type', 'text');
            causeInput.setAttribute('value', this.escapeHtml(cause.text));
            causeInput.setAttribute('style', 'width: 100%; border: none; background: transparent; font-size: 11px; padding: 2px;');
            causeInput.addEventListener('change', (e) => {
                cause.text = e.target.value;
            });
            causeFo.appendChild(causeInput);
            causeGroup.appendChild(causeFo);

            // Delete button for the cause
            const deleteBtn = createSvgElement('g', { class: 'delete-cause-btn', style: 'cursor: pointer; opacity: 0.2;' });
            deleteBtn.appendChild(createSvgElement('circle', { cx: cX + causeLen, cy: cY, r: 7, fill: '#E53935' }));
            const cross = createSvgElement('text', { x: cX + causeLen, y: cY + 4, 'text-anchor': 'middle', fill: 'white', 'font-size': 11, 'font-weight': 'bold' });
            cross.textContent = 'x';
            deleteBtn.appendChild(cross);
            deleteBtn.addEventListener('mouseenter', () => deleteBtn.style.opacity = '1');
            deleteBtn.addEventListener('mouseleave', () => deleteBtn.style.opacity = '0.2');
            deleteBtn.addEventListener('click', () => this.deleteCause(category.id, index));
            causeGroup.appendChild(deleteBtn);

            categoryGroup.appendChild(causeGroup);
        });
    }

    addCause(catId, posX, posY) {
        const cat = this.data.categories.find(c => c.id === catId);
        if (cat) {
            // Add a temporary input field for the new cause
            const tempFo = createSvgElement('foreignObject', { x: posX + 5, y: posY, width: 100, height: 30 });
            const tempInput = document.createElement('input');
            tempInput.setAttribute('type', 'text');
            tempInput.setAttribute('placeholder', 'New cause...');
            tempInput.setAttribute('style', 'width: 100%; border: 1px solid #999; background: white; font-size: 11px; padding: 2px;');
            
            const onBlur = () => {
                const text = tempInput.value.trim();
                if (text) {
                    cat.causes.push({ text: text });
                }
                this.drawDiagram(); // Redraw to finalize
            };

            tempInput.addEventListener('blur', onBlur);
            tempInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    tempInput.removeEventListener('blur', onBlur); // prevent double add
                    onBlur();
                } else if (e.key === 'Escape') {
                    this.drawDiagram();
                }
            });

            tempFo.appendChild(tempInput);
            this.svgContainer.querySelector('svg').appendChild(tempFo);
            tempInput.focus();
        }
    }

    deleteCause(catId, causeIndex) {
        const cat = this.data.categories.find(c => c.id === catId);
        if (cat && confirm(`Delete cause "${cat.causes[causeIndex].text}"?`)) {
            cat.causes.splice(causeIndex, 1);
            this.drawDiagram();
        }
    }

    escapeHtml(text) {
        if (!text) return "";
        const p = document.createElement('p');
        p.textContent = text;
        return p.innerHTML;
    }
}
