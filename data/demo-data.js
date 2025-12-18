// data/demo-data.js

// Helper function to get a random item from an array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to generate dates in the past year
const randomDate = (start = new Date(new Date().setFullYear(new Date().getFullYear() - 1)), end = new Date()) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const users = [
    { id: 1, name: 'Alice Smith', role: 'Admin', email: 'alice.smith@example.com' },
    { id: 2, name: 'Bob Johnson', role: 'Manager', email: 'bob.johnson@example.com' },
    { id: 3, name: 'Charlie Brown', role: 'Employee', email: 'charlie.brown@example.com' },
    { id: 4, name: 'Diana Prince', role: 'Employee', email: 'diana.prince@example.com' },
    { id: 5, name: 'Ethan Hunt', role: 'Employee', email: 'ethan.hunt@example.com' },
    { id: 6, name: 'Fiona Glenanne', role: 'Contractor', email: 'fiona.glenanne@example.com' }
];

const incidentTypes = ['Slip/Trip/Fall', 'Equipment', 'Chemical', 'Ergonomic', 'Near-miss', 'Fire', 'Vehicle'];
const severities = ['First Aid', 'Medical Treatment', 'Recordable', 'Fatality/Serious'];
const incidentStatuses = ['Reported', 'Under Investigation', 'Closed'];
const locations = ['Main Lobby', 'Workshop Area A', 'Workshop Area B', 'Warehouse Section C', 'Loading Bay', 'Office Floor 2', 'Parking Lot'];

const incidents = Array.from({ length: 18 }, (_, i) => {
    const status = getRandomItem(incidentStatuses);
    const severity = getRandomItem(severities);
    return {
        id: i + 1,
        title: `Incident #${i + 1}`,
        type: getRandomItem(incidentTypes),
        severity: severity === 'Near-miss' ? 'N/A' : severity,
        status: status,
        date: randomDate(),
        location: getRandomItem(locations),
        description: `This is a detailed description for incident #${i + 1}.`,
        involved: [getRandomItem(users).id],
        investigation: status !== 'Reported' ? {
            rootCause: 'A root cause has been identified.',
            actions: [i + 1]
        } : null,
    };
});

const correctiveActions = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    incidentId: i + 1,
    description: `Corrective action for incident #${i + 1}.`,
    assignee: getRandomItem(users.filter(u => u.role === 'Manager')).id,
    dueDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    status: getRandomItem(['Pending', 'In Progress', 'Completed'])
}));

const riskCategories = ['Physical', 'Chemical', 'Biological', 'Ergonomic', 'Psychosocial'];
const riskStatuses = ['Adequate', 'Needs Improvement', 'Inadequate'];
const riskAssessments = Array.from({ length: 12 }, (_, i) => {
    const initialLikelihood = Math.ceil(Math.random() * 5);
    const initialSeverity = Math.ceil(Math.random() * 5);
    const residualLikelihood = Math.max(1, Math.floor(initialLikelihood / 2));
    const residualSeverity = initialSeverity; // Assume controls reduce likelihood, not severity
    return {
        id: i + 1,
        hazard: `Hazard Example #${i + 1}`,
        category: getRandomItem(riskCategories),
        initialLikelihood: initialLikelihood,
        initialSeverity: initialSeverity,
        initialScore: initialLikelihood * initialSeverity,
        controls: 'Standard control measures are in place.',
        residualLikelihood: residualLikelihood,
        residualSeverity: residualSeverity,
        residualScore: residualLikelihood * residualSeverity,
        status: getRandomItem(riskStatuses),
        assessmentDate: randomDate()
    };
});

const trainingCourses = ['Safety Orientation', 'Equipment-specific: Forklift', 'Regulatory: COSHH', 'Emergency Response', 'Fire Safety'];
const trainingRecords = users.flatMap(user => 
    Array.from({ length: 3 }, (_, i) => {
        const completionDate = randomDate();
        const expiryDate = new Date(completionDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        let status = 'Active';
        const today = new Date();
        if (expiryDate < today) status = 'Expired';
        else if ((expiryDate - today) / (1000 * 60 * 60 * 24) < 30) status = 'Expiring Soon';

        return {
            id: user.id * 10 + i,
            userId: user.id,
            courseName: getRandomItem(trainingCourses),
            completionDate: completionDate,
            expiryDate: expiryDate,
            status: status
        };
    })
);

const permitTypes = ['Hot Work', 'Confined Space', 'LOTO', 'General'];
const workPermits = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    type: getRandomItem(permitTypes),
    location: getRandomItem(locations),
    applicantId: getRandomItem(users).id,
    validFrom: randomDate(),
    validTo: new Date(new Date().getTime() + 8 * 60 * 60 * 1000), // 8 hours from now
    status: getRandomItem(['Active', 'Completed', 'Expired/Cancelled'])
}));


export const demoData = {
    users,
    incidents,
    correctiveActions,
    riskAssessments,
    trainingRecords,
    workPermits,
    // Placeholders for other modules
    inspections: Array.from({ length: 22 }, (_, i) => ({
        id: i + 1,
        title: `Scheduled Safety Walk #${i+1}`,
        date: randomDate(),
        inspectorId: getRandomItem(users.filter(u => u.role === 'Manager')).id,
        findings: Math.floor(Math.random() * 10) + 5,
        status: getRandomItem(['Completed', 'In Progress'])
    })),
    contractors: [
        { id: 1, name: 'SecureBuild Inc.', trade: 'Construction', status: 'Approved', joinedDate: randomDate() },
        { id: 2, name: 'CleanSweep LLC', trade: 'Janitorial', status: 'Approved', joinedDate: randomDate() },
        { id: 3, name: 'VoltMasters', trade: 'Electrical', status: 'Pending', joinedDate: randomDate() },
    ],
    checklists: [
        {
            id: 1,
            title: 'Forklift Pre-Use Inspection',
            category: 'Pre-Use',
            status: 'Active',
            createdDate: randomDate(),
            items: [
                { text: 'Check tire pressure', completed: false },
                { text: 'Verify horn function', completed: true },
                { text: 'Inspect mast and forks', completed: true },
                { text: 'Check fluid levels', completed: false },
            ]
        },
        {
            id: 2,
            title: 'Weekly Safety Walkthrough',
            category: 'Weekly',
            status: 'Active',
            createdDate: randomDate(),
            items: [
                { text: 'Clear walkways', completed: true },
                { text: 'Inspect emergency exits', completed: true },
                { text: 'Check first aid stations', completed: false },
            ]
        },
        {
            id: 3,
            title: 'Confined Space Entry Checklist',
            category: 'Safety Audit',
            status: 'Active',
            createdDate: randomDate(),
            items: [
                { text: 'Atmospheric testing performed', completed: true },
                { text: 'Permit signed by supervisor', completed: true },
                { text: 'Rescue plan in place', completed: false },
            ]
        },
        {
            id: 4,
            title: 'New Employee Onboarding Safety',
            category: 'Onboarding',
            status: 'Archived',
            createdDate: randomDate(),
            items: [
                { text: 'General safety orientation', completed: true },
                { text: 'Emergency procedures reviewed', completed: true },
            ]
        },
        {
            id: 5,
            title: 'Machine Guarding Audit',
            category: 'Safety Audit',
            status: 'Draft',
            createdDate: randomDate(),
            items: [
                { text: 'All moving parts guarded', completed: false },
                { text: 'Interlocks functional', completed: false },
            ]
        },
    ],
    complianceRecords: [
        {
            id: 1,
            title: 'OSHA 300 Log Posting',
            jurisdiction: 'Federal OSHA',
            dueDate: new Date(new Date().setMonth(new Date().getMonth() - 2)), // 2 months ago
            status: 'Overdue',
            assignedTo: 2, // Bob Johnson
            description: 'Annual posting of OSHA 300A summary.',
        },
        {
            id: 2,
            title: 'EPA Air Quality Permit Renewal',
            jurisdiction: 'State EPA',
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month from now
            status: 'Due',
            assignedTo: 1, // Alice Smith
            description: 'Renewal of Title V air operating permit.',
        },
        {
            id: 3,
            title: 'Hazardous Waste Annual Report',
            jurisdiction: 'State Environmental',
            dueDate: new Date(new Date().setMonth(new Date().getMonth() - 15)), // 15 months ago
            status: 'Completed',
            assignedTo: 1, // Alice Smith
            description: 'Annual reporting for RCRA hazardous waste generation.',
        },
        {
            id: 4,
            title: 'Fire Extinguisher Inspection',
            jurisdiction: 'Local Fire Dept',
            dueDate: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
            status: 'Overdue',
            assignedTo: 3, // Charlie Brown
            description: 'Monthly inspection of all fire extinguishers on site.',
        },
        {
            id: 5,
            title: 'Emergency Evacuation Drill',
            jurisdiction: 'Internal Policy',
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
            status: 'Due',
            assignedTo: 2, // Bob Johnson
            description: 'Conduct and document semi-annual emergency evacuation drill.',
        },
        {
            id: 6,
            title: 'First Aid Kit Restock',
            jurisdiction: 'Internal Policy',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), // 10 days from now
            status: 'Due',
            assignedTo: 4, // Diana Prince
            description: 'Check and restock all first aid kits.',
        },
        {
            id: 7,
            title: 'Stormwater Permit Monitoring',
            jurisdiction: 'State Environmental',
            dueDate: new Date(new Date().setMonth(new Date().getMonth() - 3)), // 3 months ago
            status: 'Overdue',
            assignedTo: 5, // Ethan Hunt
            description: 'Quarterly stormwater discharge monitoring.',
        },
        {
            id: 8,
            title: 'Machine Guarding Inspection',
            jurisdiction: 'Internal Policy',
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + 2)), // 2 months from now
            status: 'Due',
            assignedTo: 2, // Bob Johnson
            description: 'Bi-annual inspection of machine guarding on all production equipment.',
        },
    ],
    auditRecords: [
        {
            id: 1,
            title: 'ISO 45001 Compliance Audit',
            auditorId: 1, // Alice Smith
            date: new Date(new Date().setMonth(new Date().getMonth() - 4)), // 4 months ago
            status: 'Completed',
            findings: 5,
            description: 'Annual external audit for ISO 45001 certification.',
        },
        {
            id: 2,
            title: 'Internal Safety System Audit',
            auditorId: 2, // Bob Johnson
            date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month from now
            status: 'Planned',
            findings: 0,
            description: 'Internal audit of safety management system processes.',
        },
        {
            id: 3,
            title: 'Environmental Impact Audit',
            auditorId: 1, // Alice Smith
            date: new Date(new Date().setMonth(new Date().getMonth() - 10)), // 10 months ago
            status: 'Completed',
            findings: 2,
            description: 'Review of environmental impacts of operations.',
        },
        {
            id: 4,
            title: 'Contractor Safety Audit - SecureBuild Inc.',
            auditorId: 2, // Bob Johnson
            date: new Date(new Date().setMonth(new Date().getMonth() - 1)), // 1 month ago
            status: 'In Progress',
            findings: 3,
            description: 'Audit of SecureBuild Inc. safety practices on site.',
        },
        {
            id: 5,
            title: 'Fire Safety Equipment Audit',
            auditorId: 3, // Charlie Brown
            date: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
            status: 'Planned',
            findings: 0,
            description: 'Comprehensive audit of all fire safety equipment.',
        },
    ],
};