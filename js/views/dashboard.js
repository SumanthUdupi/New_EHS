import {
    getIncidents,
    getRiskAssessments,
    getInspections,
    getComplianceRecords,
    getTrainingRecords,
    getWorkPermits,
    subscribe
} from '../store.js';

let unsubscribe;
let incidentChartInstance = null;
let riskChartInstance = null;
let complianceChartInstance = null;

// Remove the intermediate function and render immediately
export function DashboardView() {
    // Return a container that we will populate
    setTimeout(() => {
        const root = document.getElementById('app-root');
        if (root) renderDashboard(root);
    }, 0);
    return '<div id="dashboard-container"><div class="spinner-container"><div class="spinner"></div></div></div>';
}

function renderDashboard(root) {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribe(() => {
        if (window.location.hash === '' || window.location.hash === '#/dashboard') {
             renderDashboard(root);
        }
    });

    const incidents = getIncidents();
    const inspections = getInspections();
    const compliance = getComplianceRecords();
    const training = getTrainingRecords();
    const permits = getWorkPermits();

    // Calculations
    const totalRecordables = incidents.filter(i => i.severity === 'Recordable' || i.severity === 'Fatality/Serious').length;
    const nearMisses = incidents.filter(i => i.type === 'Near-miss').length;
    const openActions = incidents.flatMap(i => i.actions).filter(a => a.status !== 'Completed').length;
    const complianceRate = Math.round((compliance.filter(c => c.status === 'Completed').length / compliance.length) * 100) || 0;
    const activePermits = permits.filter(p => p.status === 'Active').length;
    const trainingCompliance = Math.round((training.filter(t => t.status === 'Active').length / training.length) * 100) || 0;

    root.innerHTML = `
        <div class="kpi-grid">
            <div class="card kpi-card border-left-danger">
                <div class="kpi-content">
                    <div class="kpi-value text-danger">${totalRecordables}</div>
                    <div class="kpi-label">Recordable Incidents</div>
                    <div class="kpi-trend">Last 12 Months</div>
                </div>
                <div class="kpi-icon">🚑</div>
            </div>
            <div class="card kpi-card border-left-warning">
                <div class="kpi-content">
                    <div class="kpi-value text-warning">${openActions}</div>
                    <div class="kpi-label">Open Actions</div>
                    <div class="kpi-trend">Requires Attention</div>
                </div>
                <div class="kpi-icon">⚡</div>
            </div>
            <div class="card kpi-card border-left-success">
                <div class="kpi-content">
                    <div class="kpi-value text-success">${complianceRate}%</div>
                    <div class="kpi-label">Compliance Score</div>
                    <div class="kpi-trend">Regulatory & Internal</div>
                </div>
                <div class="kpi-icon">✓</div>
            </div>
            <div class="card kpi-card border-left-info">
                <div class="kpi-content">
                    <div class="kpi-value text-info">${activePermits}</div>
                    <div class="kpi-label">Active Work Permits</div>
                    <div class="kpi-trend">Currently On-Site</div>
                </div>
                <div class="kpi-icon">🚧</div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="card chart-card">
                <div class="card-header">
                    <h3 class="card-title">Incident Trends (Last 12 Months)</h3>
                </div>
                <div class="card-body chart-container">
                    <canvas id="incident-chart"></canvas>
                </div>
            </div>
            <div class="card chart-card">
                <div class="card-header">
                    <h3 class="card-title">Risk Profile</h3>
                </div>
                <div class="card-body chart-container">
                    <canvas id="risk-chart"></canvas>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
             <div class="card col-span-1">
                <div class="card-header">
                    <h3 class="card-title">Training Compliance</h3>
                </div>
                <div class="card-body chart-container-small">
                    <canvas id="compliance-chart"></canvas>
                </div>
                <div class="card-footer text-center">
                    <strong>${trainingCompliance}%</strong> of staff fully trained
                </div>
            </div>

            <div class="card col-span-2">
                <div class="card-header">
                    <h3 class="card-title">Recent Activity</h3>
                </div>
                <div class="list-group list-group-flush">
                    ${incidents.slice(0, 3).map(i => `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between">
                                <strong>Incident Reported: ${i.title}</strong>
                                <span class="text-muted text-sm">${new Date(i.date).toLocaleDateString()}</span>
                            </div>
                            <p class="mb-0 text-sm text-muted">${i.type} - ${i.severity}</p>
                        </div>
                    `).join('')}
                    ${inspections.slice(0, 2).map(i => `
                         <div class="list-group-item">
                            <div class="d-flex justify-content-between">
                                <strong>Inspection Completed: ${i.title}</strong>
                                <span class="text-muted text-sm">${new Date(i.date).toLocaleDateString()}</span>
                            </div>
                            <p class="mb-0 text-sm text-muted">Inspector: ${i.inspectorName}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // Wait for the DOM to update before rendering charts
    setTimeout(() => {
        renderCharts();
    }, 0);
}

function renderCharts() {
    const ctx1 = document.getElementById('incident-chart');
    if (ctx1) renderIncidentChart(ctx1.getContext('2d'));

    const ctx2 = document.getElementById('risk-chart');
    if (ctx2) renderRiskChart(ctx2.getContext('2d'));

    const ctx3 = document.getElementById('compliance-chart');
    if (ctx3) renderComplianceChart(ctx3.getContext('2d'));
}


export function renderIncidentChart(ctx) {
    const incidents = getIncidents();
    // Sort by date to get last 12 months in order
    const now = new Date();
    const months = [];
    const counts = [];

    for(let i=11; i>=0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        months.push(monthLabel);

        const count = incidents.filter(inc => {
            const incDate = new Date(inc.date);
            return incDate.getMonth() === d.getMonth() && incDate.getFullYear() === d.getFullYear();
        }).length;
        counts.push(count);
    }

    if (incidentChartInstance) incidentChartInstance.destroy();

    incidentChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Total Incidents',
                data: counts,
                borderColor: '#0052cc',
                backgroundColor: 'rgba(0, 82, 204, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

export function renderRiskChart(ctx) {
    const risks = getRiskAssessments();
    const data = { 'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0 };

    risks.forEach(r => {
        if (r.residualScore >= 15) data['Critical']++;
        else if (r.residualScore >= 8) data['High']++;
        else if (r.residualScore >= 4) data['Medium']++;
        else data['Low']++;
    });

    if (riskChartInstance) riskChartInstance.destroy();

    riskChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#36b37e', '#ffab00', '#ff5630', '#6554c0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

export function renderComplianceChart(ctx) {
    const training = getTrainingRecords();
    const active = training.filter(t => t.status === 'Active').length;
    const expired = training.filter(t => t.status !== 'Active').length;

    if (complianceChartInstance) complianceChartInstance.destroy();

    complianceChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Compliant', 'Non-Compliant'],
            datasets: [{
                data: [active, expired],
                backgroundColor: ['#0065ff', '#dfe1e6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
