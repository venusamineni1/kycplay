const API_BASE_URL = '/api/risk';

export const riskService = {
    calculateRisk: async (clientId) => {
        console.log('Requesting Risk Evaluation for client:', clientId);

        if (!clientId) {
            console.error('Missing Client ID');
            throw new Error('Client ID is missing');
        }

        const response = await fetch(`${API_BASE_URL}/evaluate/${clientId}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Risk Calc API Error:', response.status, errorText);
            throw new Error(`Failed to calculate risk: ${response.status} ${errorText}`);
        }
        return response.json();
    },

    getRiskHistory: async (clientId) => {
        const response = await fetch(`${API_BASE_URL}/assessments/${clientId}`);
        if (!response.ok) throw new Error('Failed to fetch risk history');
        return response.json();
    },

    getAssessmentDetails: async (assessmentId) => {
        const response = await fetch(`${API_BASE_URL}/assessment-details/${assessmentId}`);
        if (!response.ok) throw new Error('Failed to fetch assessment details');
        return response.json();
    }
};
