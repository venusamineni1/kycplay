const API_URL = '/api/screening';

export const screeningService = {
    async initiateScreening(clientId) {
        const response = await fetch(`${API_URL}/initiate/${clientId}`, {
            method: 'POST',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed: ${response.status} ${errorText}`);
        }
        return response.json();
    },

    async getScreeningStatus(requestId) {
        const response = await fetch(`${API_URL}/status/${requestId}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch screening status: ${response.status} ${errorText}`);
        }
        return response.json();
    },

    async getHistory(clientId) {
        const response = await fetch(`${API_URL}/history/${clientId}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch screening history: ${response.status} ${errorText}`);
        }
        return response.json();
    }
};
