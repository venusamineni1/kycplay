const API_BASE_URL = '/api/cases';

export const caseService = {
    getCases: async (page = 0) => {
        const response = await fetch(`${API_BASE_URL}`);
        if (response.status === 401) {
            window.location.href = '/login?message=Session expired';
            throw new Error('Session expired');
        }
        if (!response.ok) throw new Error('Failed to fetch cases');
        const data = await response.json();
        // Backend returns a plain list, wrap it to match expected pagination structure
        return {
            content: data,
            totalPages: 1,
            totalElements: data.length,
            size: data.length,
            number: 0
        };
    },

    getCasesByClient: async (clientID) => {
        const response = await fetch(`${API_BASE_URL}/client/${clientID}`);
        if (!response.ok) throw new Error('Failed to fetch client cases');
        return response.json();
    },

    getCaseDetails: async (id) => {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch case details');
        return response.json();
    },

    getCaseComments: async (id) => {
        const response = await fetch(`${API_BASE_URL}/${id}/comments`);
        if (!response.ok) throw new Error('Failed to fetch case comments');
        return response.json();
    },

    getCaseDocuments: async (id) => {
        const response = await fetch(`${API_BASE_URL}/${id}/documents`);
        if (!response.ok) throw new Error('Failed to fetch case documents');
        return response.json();
    },

    transitionCase: async (id, action, comment) => {
        const response = await fetch(`${API_BASE_URL}/${id}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, comment })
        });
        console.log('Transition Response:', response.status, response.statusText);
        if (!response.ok) {
            // Check if it's a validation error (400)
            if (response.status === 400) {
                // For now, hardcode message or try to read body if we implemented it.
                // Since controller returns build(), generic message.
                // Enhancement: Controller should return body(e.getMessage())
                throw new Error('Case validation failed. Ensure all mandatory requirements (e.g., Questionnaire) are met.');
            }
            throw new Error('Failed to transition case');
        }
    },

    createCase: async (clientID, reason) => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientID, reason })
        });
        if (!response.ok) throw new Error('Failed to create case');
        return response.json();
    },

    uploadDocument: async (caseId, formData) => {
        const response = await fetch(`${API_BASE_URL}/${caseId}/documents`, {
            method: 'POST',
            body: formData // Should be FormData containing file, category, and comment
        });
        if (!response.ok) throw new Error('Failed to upload document');
    },

    getUserTasks: async () => {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    assignCase: async (id, assignee) => {
        const response = await fetch(`${API_BASE_URL}/${id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignee })
        });
        if (!response.ok) throw new Error('Failed to assign case');
    },

    getUsersByRole: async (role) => {
        const response = await fetch(`/api/users/role/${role}`);
        if (!response.ok) throw new Error('Failed to fetch users by role');
        return response.json();
    }
};
