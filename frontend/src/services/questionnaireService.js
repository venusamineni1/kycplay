const API_BASE_URL = '/api/questionnaire';

export const questionnaireService = {
    getTemplate: async () => {
        const response = await fetch(`${API_BASE_URL}/template`);
        if (!response.ok) throw new Error('Failed to fetch questionnaire template');
        return response.json();
    },

    getResponses: async (caseId) => {
        const response = await fetch(`${API_BASE_URL}/case/${caseId}`);
        if (!response.ok) throw new Error('Failed to fetch questionnaire responses');
        return response.json();
    },

    saveResponses: async (caseId, responses) => {
        const response = await fetch(`${API_BASE_URL}/case/${caseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responses)
        });
        if (!response.ok) throw new Error('Failed to save questionnaire responses');
    }
};
