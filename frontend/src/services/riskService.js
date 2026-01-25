const API_BASE_URL = '/api/risk';

export const riskService = {
    calculateRisk: async (clientData) => {
        console.log('Calculating Risk for client:', clientData);

        if (!clientData || !clientData.clientID) {
            console.error('Missing Client ID in data:', clientData);
            throw new Error('Client ID is missing in client data');
        }

        // Map client data to match RiskDTOs.CalculateRiskRequest structure
        const requestPayload = {
            header: {
                callerSystem: "173471-1",
                requestID: "ui-" + new Date().getTime(),
                requestTimeStamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                crrmVersion: "2.0",
                dbBusinessline: "DWS" // Defaulting as per example
            },
            clientRiskRatingRequest: [{
                clientDetails: {
                    recordID: clientData.clientID,
                    clientAdoptionCountry: clientData.countryOfTax || "DE", // Fallback
                    smeAssessment: "N", // Default
                    smeRiskAssessment: "",
                    additionalRule: [
                        {
                            ruleType: "SRF",
                            question: "ADVERSE_MEDIA",
                            response: "Y" // Hardcoded for demo/triggering high risk
                        }
                    ]
                },
                entityRiskType: {
                    typeKYCLegalEntityCode: "NP4" // Default dummy
                },
                industryRiskType: {
                    occupationCode: ["00101"] // Default dummy
                },
                geoRiskType: {
                    partyAccount: [{
                        countryOfNationality: [clientData.citizenship1 || "DE"],
                        originOfFunds: [clientData.sourceOfFundsCountry || "DE"],
                        addressType: {
                            clientDomicile: clientData.addresses?.[0]?.country || "DE"
                        }
                    }]
                },
                productRiskType: [{
                    productCode: "OAP1"
                }],
                channelRiskType: {
                    channelCode: "CHN05"
                }
            }]
        };

        console.log('Sending Risk Calculation Payload:', JSON.stringify(requestPayload));

        const response = await fetch(`${API_BASE_URL}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
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
