import { getIncidents, getRiskAssessments, getInspections } from '../store.js';

// --- Chart Rendering ---
let incidentChartInstance = null;
let riskChartInstance = null;

export function renderIncidentChart(ctx) {
    const incidents = getIncidents();
    const monthlyData = incidents.reduce((acc, incident) => {
        const month = new Date(incident.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const [m1, y1] = a.split(' ');
        const [m2, y2] = b.split(' ');
        return new Date(`1 ${m1} ${y1}`) - new Date(`1 ${m2} ${y2}`);
    });

    if (incidentChartInstance) {
        incidentChartInstance.destroy();
    }
    incidentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Incidents per Month',
                data: sortedMonths.map(m => monthlyData[m]),
                backgroundColor: 'rgba(0, 82, 204, 0.6)',
                borderColor: 'rgba(0, 82, 204, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

export function renderRiskChart(ctx) {
    const risks = getRiskAssessments();
    const riskDistribution = risks.reduce((acc, risk) => {
        if (risk.residualScore > 15) acc['Critical'] = (acc['Critical'] || 0) + 1;
        else if (risk.residualScore > 9) acc['High'] = (acc['High'] || 0) + 1;
        else if (risk.residualScore > 4) acc['Medium'] = (acc['Medium'] || 0) + 1;
        else acc['Low'] = (acc['Low'] || 0) + 1;
        return acc;
    }, { 'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0 });

    if (riskChartInstance) {
        riskChartInstance.destroy();
    }
    riskChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(riskDistribution),
            datasets: [{
                label: 'Risk Level Distribution',
                data: Object.values(riskDistribution),
                backgroundColor: [
                    'rgba(54, 179, 126, 0.7)', // Success (Low)
                    'rgba(255, 171, 0, 0.7)',  // Warning (Medium)
                    'rgba(222, 53, 11, 0.7)',   // Danger (High)
                    'rgba(150, 50, 100, 0.7)', // Critical
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}


// --- Main View Renderer ---
export function renderDashboard(root) {
    const incidents = getIncidents();
    const inspections = getInspections();
    
    // Simplified KPI calculations
    const totalRecordables = incidents.filter(i => i.severity === 'Recordable' || i.severity === 'Fatality/Serious').length;
    const nearMisses = incidents.filter(i => i.type === 'Near-miss').length;
    const totalInspections = inspections.length;
    const openActions = incidents.flatMap(i => i.actions).filter(a => a.status !== 'Completed').length;

    root.innerHTML = `
        <style>
            .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-lg); margin-bottom: var(--space-lg); }
            .kpi-card { background: var(--surface-color); padding: var(--space-md); border-radius: var(--border-radius-md); box-shadow: var(--shadow-sm); }
            .kpi-value { font-size: var(--font-size-xxl); font-weight: var(--font-weight-bold); color: var(--primary-color); }
            .kpi-label { font-size: var(--font-size-base); color: var(--text-color-light); }
            .chart-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-lg); }
            .chart-container { background: var(--surface-color); padding: var(--space-lg); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); }
            h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin-bottom: var(--space-md); }
        </style>

        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${totalRecordables}</div>
                <div class="kpi-label">Total Recordable Incidents</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${nearMisses}</div>
                <div class="kpi-label">Near Misses Reported</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${totalInspections}</div>
                <div class="kpi-label">Inspections Completed</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${openActions}</div>
                <div class="kpi-label">Open Corrective Actions</div>
            </div>
        </div>

        <!-- Charts -->
        <div class="chart-grid">
            <div class="chart-container">
                <h3>Incidents by Month (Last 12 Months)</h3>
                <canvas id="incident-chart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Risk Level Distribution</h3>
                <canvas id="risk-chart"></canvas>
            </div>
        </div>
    `;

    const incidentChartCtx = document.getElementById('incident-chart')?.getContext('2d');
    if (incidentChartCtx) {
        renderIncidentChart(incidentChartCtx);
    }

    const riskChartCtx = document.getElementById('risk-chart')?.getContext('2d');
    if (riskChartCtx) {
        renderRiskChart(riskChartCtx);
    }
}