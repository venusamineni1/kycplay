const API_BASE_URL = '/api/clients';

export const clientService = {
    getClients: async (page = 0, query = '') => {
        const url = query
            ? `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}`
            : `${API_BASE_URL}?page=${page}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch clients');
        return response.json();
    },

    getClientDetails: async (id) => {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch client details');
        return response.json();
    },

    exportClients: async (startDate, endDate) => {
        let url = `${API_BASE_URL}/changes/export`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to export clients');
        return response.json();
    },

    addRelatedParty: async (id, partyData) => {
        const response = await fetch(`${API_BASE_URL}/${id}/related-parties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partyData)
        });
        if (!response.ok) throw new Error('Failed to add related party');
    },

    getRelatedPartyDetails: async (partyId) => {
        const response = await fetch(`${API_BASE_URL}/related-parties/${partyId}`);
        if (!response.ok) throw new Error('Failed to fetch related party details');
        return response.json();
    }
};
