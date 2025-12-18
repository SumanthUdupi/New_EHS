# EHS Pro - Professional Prototype

This project is a high-fidelity, interactive prototype of an Environment, Health & Safety (EHS) management system, built with Vanilla JavaScript, HTML5, and CSS3.

## Features

- **Dynamic Dashboard:** KPIs and charts for a high-level overview of EHS metrics.
- **Incident Management:** Report, track, and view details of incidents.
- **Risk Assessment:** A visual risk matrix and a register of assessed risks.
- **Training Management:** A training records database and a visual competency matrix.
- **Contractor Management:** A directory of contractors.
- **Inspections:** A log of inspections and a form to create new ones.
- **Role-Based Access Control (RBAC):** A simulated login system that demonstrates how different roles (Admin, Manager, Employee) have different permissions across the application.

## How to Run

This is a pure front-end application with no build step required.

1.  **Clone the repository** (or download the files).
2.  **Open the `index.html` file** in your web browser.

That's it! The application is fully functional from the local file system.

## How to Use the Simulated Login

1.  Navigate to the **Configuration** page from the sidebar. (Note: You must be logged in as an 'Admin' to see this link).
2.  The default user is **Alice Smith (Admin)**.
3.  Use the **"Simulated Login"** dropdown to switch to another user (e.g., 'Bob Johnson (Manager)' or 'Charlie Brown (Employee)').
4.  The page will reload, and you will be logged in as the selected user.
5.  Navigate through the application to see how the UI and available actions change based on the user's role. For example, non-admins cannot see the Configuration page link, and non-managers cannot create new Risk Assessments.

## Data Persistence

The application uses the browser's `localStorage` to persist the currently logged-in user. All other data is loaded in-memory from `data/demo-data.js` each time the page loads and is not persisted across sessions. This ensures the prototype is always in a consistent, predictable state for demonstration purposes.
