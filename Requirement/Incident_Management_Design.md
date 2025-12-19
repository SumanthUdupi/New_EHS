# EHS Incident Management System: Design Document

**Version:** 1.1
**Date:** December 19, 2025
**Author:** Gemini EHS Expert

---

## 1. Introduction

### 1.1. Purpose

This document provides a comprehensive technical design for the EHS Incident & Event Management System. It translates the business requirements outlined in the BRD into a detailed blueprint for developers, architects, and QA teams. The design incorporates industry best practices and compliance with major EHS standards, including **OSHA (29 CFR 1904)**, **ISO 45001**, and **EPA regulations**.

### 1.2. Scope

This design covers the full lifecycle of an incident, from initial reporting to investigation, corrective action, and final analysis. It includes:
- A unified intake form for Incidents, Near Misses, and Observations.
- Dynamic workflows based on incident severity and elements.
- Integrated modules for managing impacts on People, Assets, Materials, and Finances.
- A robust Investigation and Corrective and Preventive Action (CAPA) tracking system.
- An analytics dashboard for monitoring EHS performance and trends.

---

## 2. System Architecture

### 2.1. Architectural Style

A **microservices-based architecture** is recommended to ensure scalability, flexibility, and ease of maintenance. Each major function (e.g., Intake, Investigation, Notifications, Analytics) will be a separate service with its own database and API.

- **Frontend:** A Single Page Application (SPA) built with a modern framework like **React** or **Angular** for a responsive and dynamic user experience.
- **Backend Services:** Developed in **Node.js (TypeScript)** or **Python (FastAPI)**, deployed as containers (e.g., Docker).
- **API Gateway:** A central entry point (e.g., AWS API Gateway) to manage, secure, and route API requests to the appropriate microservice.
- **Database:** A combination of **PostgreSQL** (for relational data like incident records and users) and **MongoDB** (for flexible, unstructured data like RCA diagrams and investigation notes).
- **Message Bus:** An asynchronous messaging system like **RabbitMQ** or **AWS SQS** to decouple services for tasks like notifications and escalations.
- **Offline Capability:** The frontend will use **Service Workers** and **PouchDB/IndexedDB** to enable offline data entry, syncing with the server once connectivity is restored.

### 2.2. AI & Machine Learning

An AI service will be developed for:
- **Severity Suggestion:** A text classification model trained on historical incident descriptions to predict severity.
- **Risk Assessment:** Analyzes incident factors to predict potential for recurrence and suggest preventive measures.
- **CAPA Effectiveness:** Predicts the likelihood of a CAPA's success based on similar historical actions.

---

## 3. User Roles & Permissions

| Role | Description | Key Permissions |
| --- | --- | --- |
| **Employee** | Any user in the organization. | - Create Incident, Near Miss, Observation reports. <br>- View their own submitted reports. <br>- Anonymity option available. |
| **Manager / Supervisor** | Responsible for a team or area. | - Receive and review reports from their team. <br>- Manage the incident (configure elements, assign investigators). <br>- Complete impact analysis. <br>- Approve low-severity incident closures. |
| **EHS Specialist** | EHS team member. | - View all incidents across the organization. <br>- Act as Investigator or Investigation Lead. <br>- Define and manage CAPAs. <br>- Generate compliance reports (e.g., OSHA 300 logs). |
| **Investigator** | Assigned to an investigation. | - Access and edit the Investigation tab for assigned incidents. <br>- Manage RCA and CAPA creation. |
| **System Administrator** | IT or EHS Admin. | - Full CRUD access to all modules. <br>- Manage user roles, system configurations, and integration settings. <br>- Edit submitted reports (with full audit trail). |

---

## 4. Data Models (High-Level Schema)

*Primary keys are bolded. Foreign keys are italicized.*

### `incidents` Table
| Column Name | Data Type | Constraints / Notes |
| --- | --- | --- |
| **report_id** | VARCHAR(20) | PRIMARY KEY. Format: `INC-YYYYMMDD-XXXX`. |
| `report_type` | ENUM | ('Incident', 'Near Miss', 'Observation'). NOT NULL. |
| `report_datetime` | TIMESTAMP | NOT NULL. |
| `reporter_id` | VARCHAR(50) | *FK to `users.employee_id`*. Can be NULL if anonymous. |
| `is_anonymous` | BOOLEAN | Default `FALSE`. |
| `location_id` | INTEGER | *FK to `locations.location_id`*. |
| `specific_location` | VARCHAR(255) | e.g., "Near machine X". |
| `category` | VARCHAR(100) | e.g., 'Unsafe Act', 'Spill'. |
| `severity` | ENUM | ('Critical', 'High', 'Medium', 'Low'). |
| `ai_suggested_severity` | ENUM | Populated by the AI service. |
| `description` | TEXT | NOT NULL. |
| `immediate_actions` | TEXT | |
| `stop_work_applied` | BOOLEAN | Default `FALSE`. |
| `status` | ENUM | ('New', 'Under Review', 'Investigation', 'CAPA Pending', 'Closed', 'Archived'). |
| `incident_manager_id` | VARCHAR(50) | *FK to `users.employee_id`*. |
| `investigation_required` | BOOLEAN | Default `FALSE`. |
| `investigation_lead_id` | VARCHAR(50) | *FK to `users.employee_id`*. |
| ... | ... | (Other fields from config card) |

### `incident_people` Table
| Column Name | Data Type | Constraints / Notes |
| --- | --- | --- |
| **entry_id** | BIGINT (Auto-Inc) | PRIMARY KEY. |
| `_report_id` | VARCHAR(20) | *FK to `incidents.report_id`*. |
| `person_id` | VARCHAR(50) | Employee/Contractor ID. |
| `injury_nature` | VARCHAR(100) | |
| `body_part` | VARCHAR(100) | Aligned with OSHA 300 log categories. |
| `injury_severity` | ENUM | ('First Aid', 'Medical Treatment', 'Lost Time', 'Fatality'). **Drives OSHA recordability**. |
| `lost_time_days` | INTEGER | Auto-calculated for DART rate. |
| `restricted_days` | INTEGER | Auto-calculated for DART rate. |
| `return_to_work_date`| DATE | |

*(Similar tables `incident_assets`, `incident_materials`, `incident_violations`, `incident_financials` would be created.)*

### `capas` Table
| Column Name | Data Type | Constraints / Notes |
| --- | --- | --- |
| **capa_id** | BIGINT (Auto-Inc) | PRIMARY KEY. |
| `_report_id` | VARCHAR(20) | *FK to `incidents.report_id`*. |
| `description` | TEXT | NOT NULL. |
| `type` | ENUM | ('Corrective', 'Preventive'). |
| `responsible_id` | VARCHAR(50) | *FK to `users.employee_id`*. |
| `due_date` | DATE | |
| `status` | ENUM | ('Open', 'In Progress', 'Completed', 'Verified', 'Cancelled'). |
| `effectiveness_check_date` | DATE | |
| `effectiveness_notes` | TEXT | |

---

## 5. Module 1: Event Creation & Intake Form

### 5.1. UI/UX Design
- A single-page, multi-step wizard to guide the user.
- **Step 1: Core Details:** `Report Type`, `DateTime`, `Location`, `Description`.
- **Step 2: Context:** `Category`, `Severity`, `Immediate Actions`.
- **Step 3: People & Evidence:** `Witnesses`, `Attachments`.
- **Mobile-First:** Voice-to-text for description, GPS for location, camera access for attachments.
- **Anonymity:** If checked, reporter information is masked to all but System Admins. A unique token is provided to the reporter to view updates without logging in.

### 5.2. Logic Flow
1. User initiates a report. System generates `report_id`.
2. As the user fills the `Description`, the text is sent to the AI service. The service returns a suggested `Severity` and confidence score, which highlights the recommended option in the dropdown (e.g., "AI Suggests: High").
3. On submission, the system checks pre-configured rules based on `location` and `department` to auto-assign an `incident_manager_id`.
4. A notification is sent to the assigned manager.
5. The incident record is created with a status of `'New'`.

---

## 6. Module 2: Incident View & Management

### 6.1. UI/UX Design
- A tabbed interface: **Summary**, **Investigation**, **CAPA**, **Audit Trail**.
- The **Summary** tab contains "Cards" as described in the BRD.
- The **Configuration Card** acts as the incident's state machine controller. All changes are logged in the `Audit Trail`.

### 6.2. State Machine Logic
- **`New` -> `Under Review`:** When the `incident_manager_id` opens the incident for the first time.
- **`Under Review` -> `Investigation`:** When `Investigation Req?` is toggled ON. This transition locks the basic incident details and notifies the `Investigation Lead`.
- **`Investigation` -> `CAPA Pending`:** When the investigation is approved. This locks the Investigation tab.
- **`CAPA Pending` -> `Closed`:** When all assigned CAPAs are '`Completed`' or '`Verified`'.
- **Escalation Logic:** A cron job runs daily. If `Target Submission Date` is past and status is not `Closed`, it triggers an escalation notification based on rules (e.g., `manager's manager`).

---

## 7. Module 3: Dynamic Impact Analysis

Each "Element" corresponds to a separate microservice and UI component.

### 7.1. People (Health & Safety)
- **OSHA Compliance:** The `injury_severity` field determines recordability.
  - `'Medical Treatment'`, `'Lost Time'`, or `'Fatality'` automatically flags the case as **OSHA recordable**.
  - The system will have a dedicated "OSHA Log" view that dynamically generates **Form 300 (Log of Work-Related Injuries)**, **Form 301 (Injury and Illness Incident Report)**, and **Form 300A (Summary)** from the collected data.
- **Calculations:** The system will auto-calculate **LTIR** (Lost Time Incident Rate) and **TRIR** (Total Recordable Incident Rate) for the analytics dashboard.

### 7.2. Material (Environmental)
- **EPA Compliance:** The system will store reportable quantities (RQs) for hazardous materials.
- **Logic:** `IF material.quantity_released > material_master.reportable_quantity THEN` trigger a high-priority alert to the EHS team and display a "Regulatory Notification Required" banner with links to EPCRA/CERCLA reporting guidelines.

### 7.3. Financial Impact
- **Cost Engine:** This module will sum all `Actual Cost` entries.
- **Dashboard Integration:** The "Total Incident Cost" will be a key KPI, filterable by date, location, and incident type to demonstrate the financial benefits of safety programs.

---

## 8. Module 4: Investigation & Root Cause Analysis (RCA)

### 8.1. UI/UX Design
- **Method Selection:** User selects an RCA method.
- **5 Whys:** A simple, repeating input field component. Each "Why?" entry can be linked to evidence.
- **Fishbone (Ishikawa):** An interactive diagram builder with categories (Man, Machine, Method, Material, Measurement, Environment). Users can drag-and-drop text boxes onto the diagram's "bones". The final diagram is saved as an SVG or JSON object.
- **Conclusion:** A rich-text editor for the final summary, which auto-populates with the RCA findings.

### 8.2. Approval Workflow
1. Investigator submits the RCA for approval. Status moves to `Pending Approval`.
2. `Investigation Approver` receives a notification.
3. Approver can `Approve` or `Reject` with comments.
4. If `Rejected`, status returns to `Investigation` for rework.
5. If `Approved`, the Investigation tab is locked (read-only), and the system transitions to the CAPA phase.

---

## 9. Module 5: Corrective and Preventive Actions (CAPA)

### 9.1. Lifecycle Management
1. **Creation:** CAPAs are created from the Investigation conclusion. They can be linked to specific root causes.
2. **Execution:** The `responsible_id` receives notifications and updates progress.
3. **Closure:** Once `status` is set to `Completed`, the original creator is notified.
4. **Effectiveness Check:** After a pre-defined period (`effectiveness_check_date`), a new task is generated for the creator to verify the CAPA's effectiveness and add notes. This is a critical loop for **ISO 45001 continuous improvement**.

---

## 10. Reporting & Analytics

### 10.1. Dashboards
- **Lagging Indicators Dashboard:** LTIR, TRIR, DART Rate, Total Incident Cost, Number of Incidents by severity.
- **Leading Indicators Dashboard:** Number of Observations, Near Misses reported, `Stop Work Authority` usage, CAPAs closed on time, Safety Training completion rates.
- **Heat Maps:** Visual map of incident frequency by facility location.
- **Trend Analysis:** Line charts showing incident rates over time, filterable by department, category, and body part.

### 10.2. Exportable Reports
- **OSHA Forms:** 300, 300A, 301 in PDF/CSV format.
- **Incident Summary Report:** A comprehensive, printable summary of a single incident.
- **CAPA Status Report:** Track all open, overdue, and completed actions.

---

## 11. Integrations & API Layer

### 11.1. API Endpoints (Examples)
- **HRIS (e.g., Workday):**
  - `GET /api/users`: To sync employee data (name, ID, department, manager).
  - `GET /api/users/{id}/training`: To fetch training records for violation analysis.
- **CMMS (Asset Management):**
  - `GET /api/assets?location={loc}`: To look up assets.
  - `POST /api/workorders`: To create a repair work order from an `incident_asset` entry.
- **Chemical Inventory System:**
  - `GET /api/materials?search={name}`: To look up material details and SDS links.

---

## 12. Notifications & Alerts

The Notification service will subscribe to events from the message bus.

| Trigger Event | Recipient(s) | Message Content | Channel |
| --- | --- | --- | --- |
| New Incident Created | Incident Manager | "A new incident `[Report ID]` has been assigned to you." | Email, Push |
| Investigation Assigned | Investigation Lead | "You have been assigned to investigate `[Report ID]`." | Email |
| CAPA Assigned | CAPA Responsible Person | "A new action item has been assigned to you for `[Report ID]`." | Email |
| Due Date Approaching | Responsible Person | "Your task for `[Report ID]` is due in 3 days." | Email |
| Escalation Triggered | Manager's Manager | "Incident `[Report ID]` is overdue and requires your attention." | Email, SMS |

---

## 13. Audit & Compliance

- **Immutable Audit Log:** Every action (create, update, delete, status change) on `incidents`, `capas`, and other key tables will be recorded in an `audit_log` table. The log will store the `user_id`, `timestamp`, `action`, `table_name`, `record_id`, and a JSON object of the `changes` (before/after). This is non-negotiable for compliance.
- **Digital Signatures:** Approval workflows will use a secure method to record the user and timestamp, satisfying 21 CFR Part 11 requirements if applicable.
- **Data Archiving:** A policy will be implemented to move incidents with a `Closed` status older than a configurable period (e.g., 2 years) to an archival database to maintain system performance.
