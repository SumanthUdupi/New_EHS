import { demoData } from '../data/demo-data.js';

// A simple in-memory store with observer pattern for state management

const STORAGE_KEY = 'ehs-app-data';
let state = loadState();

const listeners = [];

function notifyListeners() {
    for (const listener of listeners) {
        listener();
    }
}

/**
 * Load state from localStorage or use demo data
 */
function loadState() {
    try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            // Merge with demo data to ensure all required properties exist
            return { ...demoData, ...parsedState };
        }
    } catch (error) {
        console.warn('Error loading state from localStorage:', error);
    }
    return { ...demoData };
}

/**
 * Save state to localStorage
 */
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn('Error saving state to localStorage:', error);
    }
}

// Function to subscribe to store changes
export function subscribe(listener) {
    listeners.push(listener);
    // Return an unsubscribe function
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

// --- Data Getter Functions ---

export function getState() {
    return { ...state };
}

export function getIncidents() {
    // In a real app, you might do some processing/joining here
    return state.incidents.map(incident => {
        const actions = state.correctiveActions.filter(a => a.incidentId === incident.id);
        return { ...incident, actions };
    });
}

export function getIncidentById(id) {
    const incident = state.incidents.find(i => i.id === parseInt(id));
    if (!incident) return null;

    const actions = state.correctiveActions.filter(a => a.incidentId === incident.id).map(action => {
        const assignee = state.users.find(u => u.id === action.assignee);
        return { ...action, assigneeName: assignee ? assignee.name : 'Unknown' };
    });
    const involved = incident.involved.map(userId => {
        const user = state.users.find(u => u.id === userId);
        return user ? user.name : 'Unknown';
    });

    return { ...incident, actions, involvedNames: involved };
}

export function getRiskAssessments() {
    return state.riskAssessments;
}

export function getTrainingRecords() {
    return state.trainingRecords.map(record => {
        const user = state.users.find(u => u.id === record.userId);
        return { ...record, userName: user ? user.name : 'Unknown User' };
    });
}

export function getWorkPermits() {
    return state.workPermits.map(permit => {
        const applicant = state.users.find(u => u.id === permit.applicantId);
        return { ...permit, applicantName: applicant ? applicant.name : 'Unknown User' };
    });
}

export function getInspections() {
    return state.inspections.map(inspection => {
        const inspector = state.users.find(u => u.id === inspection.inspectorId);
        return { ...inspection, inspectorName: inspector ? inspector.name : 'Unknown User' };
    });
}

export function getContractors() {
    return state.contractors;
}

export function getComplianceRecords() {
    return state.complianceRecords;
}

export function getAuditRecords() {
    return state.auditRecords;
}

export function getChecklists() {
    return state.checklists;
}

export function addChecklist(checklist) {
    const newId = Math.max(0, ...state.checklists.map(c => c.id)) + 1; // Handle empty array
    const newChecklist = { ...checklist, id: newId, createdDate: new Date() };
    state.checklists.push(newChecklist);
    saveState();
    notifyListeners();
}


export function addAuditRecord(record) {
    const newId = Math.max(0, ...state.auditRecords.map(ar => ar.id)) + 1; // Handle empty array
    const newRecord = { ...record, id: newId, createdDate: new Date() };
    state.auditRecords.push(newRecord);
    saveState();
    notifyListeners();
}


export function addComplianceRecord(record) {
    const newId = Math.max(0, ...state.complianceRecords.map(cr => cr.id)) + 1; // Handle empty array
    const newRecord = { ...record, id: newId, createdDate: new Date() };
    state.complianceRecords.push(newRecord);
    saveState();
    notifyListeners();
}


export function addInspection(inspection) {
    const newId = Math.max(...state.inspections.map(i => i.id)) + 1;
    const newInspection = { ...inspection, id: newId, date: new Date() };
    state.inspections.push(newInspection);
    saveState();
    notifyListeners();
}

// Example of a function that modifies state
export function addContractor(contractor) {
    const newId = Math.max(...state.contractors.map(c => c.id)) + 1;
    const newContractor = { ...contractor, id: newId, joinedDate: new Date() };
    state.contractors.push(newContractor);
    saveState();
    notifyListeners();
}


// Example of a function that modifies state
export function addIncident(incident) {
    const newId = Math.max(...state.incidents.map(i => i.id)) + 1;
    const newIncident = { ...incident, id: newId };
    state.incidents.push(newIncident);
    saveState();
    notifyListeners(); // Notify all subscribers that state has changed
}

export function updateIncident(id, updates) {
    const index = state.incidents.findIndex(i => i.id === parseInt(id));
    if (index !== -1) {
        state.incidents[index] = { ...state.incidents[index], ...updates };
        saveState();
        notifyListeners();
    }
}

export function addCorrectiveAction(action) {
    const newId = Math.max(0, ...state.correctiveActions.map(a => a.id)) + 1;
    const newAction = { ...action, id: newId };
    state.correctiveActions.push(newAction);
    saveState();
    notifyListeners();
}

export function getRiskAssessmentById(id) {
    return state.riskAssessments.find(r => r.id === parseInt(id));
}

export function addRiskAssessment(assessment) {
    const newId = Math.max(0, ...state.riskAssessments.map(r => r.id)) + 1;
    const newAssessment = { ...assessment, id: newId, assessmentDate: new Date() };
    state.riskAssessments.push(newAssessment);
    saveState();
    notifyListeners();
}

export function updateRiskAssessment(id, updates) {
    const index = state.riskAssessments.findIndex(r => r.id === parseInt(id));
    if (index !== -1) {
        state.riskAssessments[index] = { ...state.riskAssessments[index], ...updates };
        saveState();
        notifyListeners();
    }
}

export function updateIncidentInvestigation(id, type, data) {
    const incident = state.incidents.find(i => i.id === parseInt(id));
    if (incident) {
        if (!incident.investigation) {
            incident.investigation = {};
        }
        incident.investigation[type] = data;

        // If Root Cause is derived from these tools, update the main rootCause field too
        if (type === 'fiveWhys' && data.rootCause) {
             incident.investigation.rootCause = data.rootCause;
        }

        saveState();
        notifyListeners();
    }
}

// TODO: Add functions for updating, deleting data
