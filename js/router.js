import { DashboardView } from './views/DashboardView.js';
import { Modal, Notification } from './utils/util.js';
import { renderIncidentChart, renderRiskChart } from './views/dashboard.js';
import { renderRisks } from './views/risks.js';
import { renderIncidents } from './views/incidents.js';

// --- Route Definitions ---
// Maps URL hash to a view function and a page title.
const routes = {
    'dashboard': { view: DashboardView, title: 'Dashboard' },
    'incidents': { view: (params) => renderIncidents(document.getElementById('app-root'), params), title: 'Incident Management' },
    'risks': { view: (params) => renderRisks(document.getElementById('app-root'), params), title: 'Risk Assessment' },
    'inspections': { view: () => renderInspectionsView(), title: 'Inspections' },
    'audits': { view: () => renderAuditsView(), title: 'Audits' },
    'checklists': { view: () => renderChecklistsView(), title: 'Checklist Management' },
    'compliance': { view: () => renderComplianceView(), title: 'Compliance Management' },
    'contractors': { view: () => renderContractorsView(), title: 'Contractor Management' },
    'ewp': { view: () => renderEWPView(), title: 'Electronic Work Permits' },
    'training': { view: () => renderTrainingView(), title: 'Training & Compliance' },
    'configuration': { view: () => renderConfigurationView(), title: 'Configuration' },
};

const appRoot = document.getElementById('app-root');
const pageTitle = document.getElementById('page-title');

// Store current route for navigation
let currentRoute = '/dashboard';

/**
 * Main router function. Parses the URL hash and renders the corresponding view.
 */
export function router() {
    // Get the hash from the URL, default to '/dashboard'
    const hash = window.location.hash.slice(1) || '/dashboard';
    const [path, ...paramParts] = hash.split('/');
    const params = {};

    // Parse parameters for routes like /risks/123
    if (paramParts.length > 0 && /^\d+$/.test(paramParts[0])) {
        params.id = paramParts[0];
    }

    // Prevent unnecessary re-renders
    if (hash === currentRoute) return;
    currentRoute = hash;

    // Find the route definition, or a 404 handler
    const route = routes[path] || {
        view: () => render404View(),
        title: 'Not Found'
    };

    try {
        // Render the view into the app-root element
        const content = route.view(params);
        appRoot.innerHTML = content;

        // Update the page title in the header
        pageTitle.textContent = route.title;

        // Update active state on nav links
        updateNavLinks(path);

        // Initialize any view-specific functionality
        initializeView(path);

    } catch (error) {
        console.error('Error rendering view:', error);
        appRoot.innerHTML = '<div class="card"><div class="card-body"><p class="text-error">Error loading page. Please try again.</p></div></div>';
        Notification.show('Error loading page', { type: 'error' });
    }
}

/**
 * Update navigation link active states
 */
function updateNavLinks(activePath) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = link.getAttribute('href').slice(1).split('/')[0]; // Get base path without params
        link.classList.toggle('active', linkPath === activePath);
        link.setAttribute('aria-current', linkPath === activePath ? 'page' : 'false');
    });
}

/**
 * Initialize view-specific functionality
 */
function initializeView(path) {
    if (path === '/dashboard') {
        // Initialize dashboard charts
        const incidentChartCtx = document.getElementById('incident-chart')?.getContext('2d');
        if (incidentChartCtx) {
            renderIncidentChart(incidentChartCtx);
        }

        const riskChartCtx = document.getElementById('risk-chart')?.getContext('2d');
        if (riskChartCtx) {
            renderRiskChart(riskChartCtx);
        }
    }
    // Add any other view-specific initialization here
}

/**
 * Navigate to a new route programmatically
 */
export function navigate(path, options = {}) {
    const { replace = false } = options;

    if (replace) {
        window.location.replace(`#${path}`);
    } else {
        window.location.hash = path;
    }
}

/**
 * Get current route
 */
export function getCurrentRoute() {
    return currentRoute;
}

// --- View Rendering Functions ---

function renderIncidentsView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-incident-btn">Add New Incident</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Incidents</h2>
            </div>
            <div class="card-body">
                <p>Incident management functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderRisksView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-risk-btn">Add New Risk Assessment</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Risk Assessments</h2>
            </div>
            <div class="card-body">
                <p>Risk assessment functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderInspectionsView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-inspection-btn">Schedule Inspection</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Inspections</h2>
            </div>
            <div class="card-body">
                <p>Inspection management functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderAuditsView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-audit-btn">Create New Audit</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Audits</h2>
            </div>
            <div class="card-body">
                <p>Audit management functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderChecklistsView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-checklist-btn">Create Checklist</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Checklists</h2>
            </div>
            <div class="card-body">
                <p>Checklist management functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderComplianceView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-compliance-btn">Add Compliance Record</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Compliance Management</h2>
            </div>
            <div class="card-body">
                <p>Compliance management functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderContractorsView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-contractor-btn">Add Contractor</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Contractors</h2>
            </div>
            <div class="card-body">
                <p>Contractor management functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderEWPView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-ewp-btn">Create Work Permit</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Electronic Work Permits</h2>
            </div>
            <div class="card-body">
                <p>Work permit management functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderTrainingView() {
    return `
        <div class="page-header">
            <button class="btn btn-primary" id="add-training-btn">Schedule Training</button>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Training & Compliance</h2>
            </div>
            <div class="card-body">
                <p>Training management functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

function renderConfigurationView() {
    return `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">System Configuration</h2>
            </div>
            <div class="card-body">
                <p>System configuration options will be implemented here.</p>
            </div>
        </div>
    `;
}

function render404View() {
    return `
        <div class="card">
            <div class="card-body" style="text-align: center;">
                <h2>404 - Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <button class="btn btn-primary" onclick="window.location.hash = '/dashboard'">Go to Dashboard</button>
            </div>
        </div>
    `;
}