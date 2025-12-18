import { router } from './router.js';
import { getCurrentUser, logout } from './auth.js';

/**
 * Main application entry point.
 */
function App() {
    // --- Initial Setup ---
    function initialize() {
        // 1. Setup Auth Display & RBAC
        const currentUser = getCurrentUser();
        if (currentUser) {
            document.getElementById('current-user-name').textContent = currentUser.name;
            // Simple Role-Based Access Control (RBAC)
            if (currentUser.role !== 'Admin') {
                const configLink = document.querySelector('a[href="#/configuration"]');
                if (configLink) configLink.parentElement.style.display = 'none';
            }
        }
        document.getElementById('logout-btn').addEventListener('click', logout);

        // 2. Setup Mobile Menu Toggle & Sidebar Collapse & Theme Toggle
        setupMobileMenu();
        setupSidebarCollapse();
        setupThemeToggle();

        // 3. Setup Router
        window.addEventListener('hashchange', router);
        window.addEventListener('load', router); // Render initial route
    }

    /**
     * Setup mobile menu toggle functionality
     */
    function setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (menuToggle && sidebar && sidebarOverlay) {
            const toggleMenu = () => {
                const isOpen = sidebar.classList.contains('open');
                sidebar.classList.toggle('open');
                sidebarOverlay.classList.toggle('active');
                menuToggle.setAttribute('aria-expanded', !isOpen);
            };

            menuToggle.addEventListener('click', toggleMenu);
            sidebarOverlay.addEventListener('click', toggleMenu);

            // Close menu when clicking nav links on mobile
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('open');
                        sidebarOverlay.classList.remove('active');
                        menuToggle.setAttribute('aria-expanded', 'false');
                    }
                });
            });

            // Close menu on window resize if desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    sidebar.classList.remove('open');
                    sidebarOverlay.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    /**
     * Setup sidebar collapse functionality
     */
    function setupSidebarCollapse() {
        const collapseBtn = document.getElementById('sidebar-collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-collapsed');
            });
        }
    }

    /**
     * Setup theme toggle functionality (Dark Mode)
     */
    function setupThemeToggle() {
        const themeBtn = document.getElementById('theme-toggle-btn');
        const savedTheme = localStorage.getItem('theme');

        // Apply saved theme
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeBtn) themeBtn.textContent = '☀️';
        }

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const isDark = document.body.classList.contains('dark-mode');

                themeBtn.textContent = isDark ? '☀️' : '🌙';
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }
    }

    initialize();
}

App();
