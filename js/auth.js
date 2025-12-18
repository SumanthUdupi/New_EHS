// A simple auth simulation using localStorage
const MOCK_USER = {
    id: 'user-123',
    name: 'Alex Ray',
    role: 'Admin' // Can be 'Admin' or 'User'
};

/**
 * Gets the current user from localStorage or sets a default mock user.
 * @returns {{id: string, name: string, role: string}} The current user object.
 */
export function getCurrentUser() {
    let user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        // For demo purposes, automatically "log in" a default user on first visit.
        localStorage.setItem('currentUser', JSON.stringify(MOCK_USER));
        user = MOCK_USER;
    }
    return user;
}

/**
 * Logs the user out by clearing the user from localStorage and reloading the page.
 */
export function logout() {
    localStorage.removeItem('currentUser');
    window.location.hash = ''; // Clear hash
    window.location.reload();
}