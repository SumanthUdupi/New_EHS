import { DashboardView } from './views/dashboard.js';
import { Modal, Notification } from './utils/util.js';
import { renderIncidents } from './views/incidents.js';
import { renderRisks } from './views/risks.js';
import { renderInspectionsView } from './views/inspections.js';
import { renderAuditsView } from './views/audits.js';
import { renderChecklistsView } from './views/checklists.js';
import { renderComplianceView } from './views/compliance.js';
import { renderContractorsView } from './views/contractors.js';
import { renderEWPView } from './views/ewp.js';
import { renderTrainingView } from './views/training.js';
import { renderConfigurationView } from './views/configuration.js';

// --- Route Definitions ---
// Maps URL hash to a view function and a page title.
const routes = {
    'dashboard': { view: DashboardView, title: 'Dashboard' },
    'incidents': { view: (params) => renderIncidents(params), title: 'Incident Management' },
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
let currentRoute = null;

/**
 * Main router function. Parses the URL hash and renders the corresponding view.
 */
export function router() {
    // Get the hash from the URL, default to '/dashboard'
    const hash = window.location.hash.slice(1) || '/dashboard';

    // Parse paths: Remove leading slashes and empty strings
    // e.g., '/dashboard' -> ['dashboard']
    // e.g., '/incidents/1' -> ['incidents', '1']
    const parts = hash.split('/').filter(p => p);

    const path = parts[0] || 'dashboard'; // Default to dashboard if empty
    const params = {};

    // Parse parameters for routes like /risks/123
    if (parts.length > 1 && /^\d+$/.test(parts[1])) {
        params.id = parts[1];
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
        // Clear previous content slightly before rendering new to allow event loop tick
        appRoot.innerHTML = '';

        // Render the view into the app-root element
        // Some views return HTML string, others might render directly.
        // We support both patterns here.
        const result = route.view(params);
        if (typeof result === 'string') {
            appRoot.innerHTML = result;
        }

        // Update the page title in the header
        pageTitle.textContent = route.title;

        // Update active state on nav links
        updateNavLinks(path);

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
        // Parse link href: e.g., '#/incidents' -> 'incidents'
        const linkHref = link.getAttribute('href').slice(1);
        const linkParts = linkHref.split('/').filter(p => p);
        const linkPath = linkParts[0] || 'dashboard';

        link.classList.toggle('active', linkPath === activePath);
        link.setAttribute('aria-current', linkPath === activePath ? 'page' : 'false');
    });
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
