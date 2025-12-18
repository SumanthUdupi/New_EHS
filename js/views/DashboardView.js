import { getIncidents, getRiskAssessments, getInspections, getComplianceRecords, getAuditRecords, getTrainingRecords, getContractors, getChecklists, getWorkPermits } from '../store.js';

/**
 * Renders the Dashboard view.
 * @returns {string} The HTML content for the dashboard.
 */
export function DashboardView() {
    const incidents = getIncidents();
    const risks = getRiskAssessments();
    const inspections = getInspections();
    const complianceRecords = getComplianceRecords();
    const audits = getAuditRecords();
    const training = getTrainingRecords();
    const contractors = getContractors();
    const checklists = getChecklists();
    const workPermits = getWorkPermits();

    // KPI Calculations
    const totalIncidents = incidents.length;
    const openRisks = risks.filter(r => r.residualScore >= 15).length;
    const completedInspections = inspections.filter(i => i.status === 'Completed').length;
    const complianceOverdue = complianceRecords.filter(c => c.status === 'Overdue').length;
    const complianceRate = Math.round(((complianceRecords.length - complianceOverdue) / complianceRecords.length) * 100) || 100;

    // Recent Activity: Get last 5 activities across modules
    const activities = [
        ...incidents.slice(-3).map(i => ({ type: 'incident', title: i.title, date: i.date, link: '#/incidents' })),
        ...risks.slice(-2).map(r => ({ type: 'risk', title: r.hazard, date: r.assessmentDate, link: '#/risks' })),
        ...inspections.slice(-2).map(i => ({ type: 'inspection', title: i.title, date: i.date, link: '#/inspections' })),
        ...audits.slice(-1).map(a => ({ type: 'audit', title: a.title, date: a.date, link: '#/audits' })),
        ...training.slice(-1).map(t => ({ type: 'training', title: t.courseName, date: t.completionDate, link: '#/training' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    return `
        <style>
            .dashboard-container { display: flex; flex-direction: column; gap: var(--space-lg); }
            .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-md); }
            .kpi-card { background: var(--surface-color); padding: var(--space-lg); border-radius: var(--border-radius-md); box-shadow: var(--shadow-sm); text-align: center; }
            .kpi-value { font-size: var(--font-size-xxl); font-weight: var(--font-weight-bold); color: var(--primary-color); display: block; margin-bottom: var(--space-xs); }
            .kpi-label { font-size: var(--font-size-sm); color: var(--text-color-light); }
            .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-lg); }
            .chart-container { background: var(--surface-color); padding: var(--space-lg); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); }
            .activity-feed { background: var(--surface-color); padding: var(--space-lg); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); }
            .activity-item { padding: var(--space-sm); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
            .activity-item:last-child { border-bottom: none; }
            .activity-link { color: var(--primary-color); text-decoration: none; font-weight: var(--font-weight-medium); }
            .activity-link:hover { text-decoration: underline; }
            .activity-date { font-size: var(--font-size-xs); color: var(--text-color-light); }
            @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } .kpi-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); } }
        </style>

        <div class="dashboard-container">
            <!-- KPI Summary Cards -->
            <section class="kpi-grid" aria-labelledby="kpi-heading">
                <h2 id="kpi-heading" class="sr-only">Key Performance Indicators</h2>
                <div class="kpi-card">
                    <span class="kpi-value">${totalIncidents}</span>
                    <span class="kpi-label">Total Incidents</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-value">${openRisks}</span>
                    <span class="kpi-label">Open High Risks</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-value">${completedInspections}</span>
                    <span class="kpi-label">Completed Inspections</span>
                </div>
                <div class="kpi-card">
                    <span class="kpi-value">${complianceRate}%</span>
                    <span class="kpi-label">Compliance Rate</span>
                </div>
            </section>

            <!-- Charts Section -->
            <section class="charts-grid" aria-labelledby="charts-heading">
                <h2 id="charts-heading" class="sr-only">Analytics Charts</h2>
                <div class="chart-container">
                    <h3>Incidents by Month</h3>
                    <canvas id="incident-chart" width="400" height="200" aria-label="Bar chart showing incidents by month"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Risk Level Distribution</h3>
                    <canvas id="risk-chart" width="200" height="200" aria-label="Doughnut chart showing risk level distribution"></canvas>
                </div>
            </section>

            <!-- Recent Activity Feed -->
            <section class="activity-feed" aria-labelledby="activity-heading">
                <h2 id="activity-heading">Recent Activity</h2>
                <div id="activity-list">
                    ${activities.map(activity => `
                        <div class="activity-item">
                            <div>
                                <a href="${activity.link}" class="activity-link">${activity.title}</a>
                                <span class="activity-type">(${activity.type})</span>
                            </div>
                            <span class="activity-date">${new Date(activity.date).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        </div>
    `;
}