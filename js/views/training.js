import { getState } from '../store.js';

function getStatusClass(status) {
    switch (status) {
        case 'Active': return 'status-completed'; // Green
        case 'Expiring Soon': return 'status-reported'; // Yellow
        case 'Expired': return 'status-critical'; // Red (using a new one)
        default: return 'status-pending'; // Grey
    }
}

export function renderTraining(root) {
    const { trainingRecords, users } = getState();
    const courses = [...new Set(trainingRecords.map(t => t.courseName))];

    // --- Training Records Table ---
    const recordsRows = trainingRecords.map(record => {
        const user = users.find(u => u.id === record.userId);
        return `
            <tr>
                <td>${user ? user.name : 'Unknown'}</td>
                <td>${record.courseName}</td>
                <td>${new Date(record.completionDate).toLocaleDateString()}</td>
                <td>${new Date(record.expiryDate).toLocaleDateString()}</td>
                <td><span class="status-badge ${getStatusClass(record.status)}">${record.status}</span></td>
            </tr>
        `;
    }).join('');

    // --- Competency Matrix ---
    const matrixHeader = courses.map(course => `<th>${course}</th>`).join('');
    const matrixRows = users.map(user => {
        const userRecords = trainingRecords.filter(r => r.userId === user.id);
        const cells = courses.map(course => {
            const record = userRecords.find(r => r.courseName === course);
            let cellContent = '';
            if (record) {
                if (record.status === 'Active') cellContent = '<span class="competency-check active">✔</span>';
                else if (record.status === 'Expiring Soon') cellContent = '<span class="competency-check expiring">!</span>';
                else if (record.status === 'Expired') cellContent = '<span class="competency-check expired">✖</span>';
            }
            return `<td>${cellContent}</td>`;
        }).join('');
        return `<tr><td>${user.name}</td>${cells}</tr>`;
    }).join('');

    root.innerHTML = `
        <div class="card">
            <div class="card-header">Competency Matrix</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        ${matrixHeader}
                    </tr>
                </thead>
                <tbody>
                    ${matrixRows}
                </tbody>
            </table>
        </div>
        <div class="card">
            <div class="card-header">Training Records</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Course</th>
                        <th>Completion Date</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recordsRows}
                </tbody>
            </table>
        </div>
    `;
}
