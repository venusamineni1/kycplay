const API_URL = '/api/adhoc-tasks';

export const adHocTaskService = {
    createTask: async (payload) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to create task');
        return await response.text();
    },

    getMyTasks: async () => {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return await response.json();
    },

    getTask: async (id) => {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch task details');
        return await response.json();
    },

    respondTask: async (id, responseText) => {
        const response = await fetch(`${API_URL}/${id}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responseText })
        });
        if (!response.ok) throw new Error('Failed to respond to task');
    },

    reassignTask: async (id, assignee) => {
        const response = await fetch(`${API_URL}/${id}/reassign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignee })
        });
        if (!response.ok) throw new Error('Failed to reassign task');
    },

    completeTask: async (id) => {
        const response = await fetch(`${API_URL}/${id}/complete`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to complete task');
    }
};
