package com.venus.kyc.viewer.screening;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.venus.kyc.viewer.Client;
import com.venus.kyc.viewer.ClientRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Random;

@Service
public class ScreeningService {

    private final ScreeningRepository repository;
    private final ClientRepository clientRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public ScreeningService(ScreeningRepository repository, ClientRepository clientRepository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.clientRepository = clientRepository;
        this.objectMapper = objectMapper;
    }

    public ScreeningDTOs.InitiateScreeningResponse initiateScreening(Long clientId) {
        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            throw new RuntimeException("Client not found for ID: " + clientId);
        }
        Client client = clientOpt.get();

        // 1. Construct Complex Backend Request (Mocked logic here)
        ScreeningDTOs.ExternalScreeningRequest externalRequest = new ScreeningDTOs.ExternalScreeningRequest(
                client.firstName() + " " + client.lastName(),
                client.dateOfBirth() != null ? client.dateOfBirth().toString() : null,
                client.citizenship1());

        String requestJson;
        try {
            requestJson = objectMapper.writeValueAsString(externalRequest);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize external request", e);
        }

        // 2. Call Mock External API (Simulated)
        // In a real scenario, this would be a RestClient call.
        String externalRequestId = UUID.randomUUID().toString();
        boolean isImmediateHit = false; // Initial synchronous check usually returns "Received" or "No Hit"

        // 3. Save Log
        ScreeningLog log = new ScreeningLog(null, clientId, requestJson, null, "IN_PROGRESS", externalRequestId,
                LocalDateTime.now());
        Long logId = repository.saveLog(log);

        // Initialize empty results as IN_PROGRESS
        saveInitialResults(logId);

        return new ScreeningDTOs.InitiateScreeningResponse(isImmediateHit, externalRequestId);
    }

    private void saveInitialResults(Long logId) {
        String[] contexts = { "PEP", "ADM", "INT", "SAN" };
        for (String ctx : contexts) {
            repository.saveResult(new ScreeningResult(null, logId, ctx, "IN_PROGRESS", null, null, null));
        }
    }

    public ScreeningDTOs.ScreeningStatusResponse checkStatus(String requestId) {
        ScreeningLog log = repository.findLogByExternalId(requestId);
        if (log == null) {
            throw new RuntimeException("Request ID not found: " + requestId);
        }

        // 1. Call Mock External API for Status (Simulated)
        // Simulate random processing time or hits
        // For demo purposes, we'll randomize results on every check if it's still in
        // progress

        List<ScreeningResult> currentResults = repository.findResultsByLogId(log.logID());
        boolean anyInProgress = currentResults.stream().anyMatch(r -> "IN_PROGRESS".equals(r.status()));

        if (anyInProgress) {
            // Update results (Mock logic: 20% chance of Hit in each context, 80% No Hit)
            repository.deleteResultsByLogId(log.logID()); // Clear old to re-insert updated

            List<ScreeningDTOs.ContextResult> dtoResults = new ArrayList<>();
            for (String ctx : new String[] { "PEP", "ADM", "INT", "SAN" }) {
                String status = "NO_HIT";
                String alertMsg = null;

                // Deterministic mock based on Client ID or random?
                // Let's make it random but bias towards NO_HIT.
                // However, user might want to see Hits. Let's make PEP a HIT often.
                if (random.nextInt(10) < 3) { // 30% chance hit
                    status = "HIT";
                    alertMsg = ctx + " Match found in WorldCheck";
                }

                ScreeningResult res = new ScreeningResult(null, log.logID(), ctx, status,
                        status.equals("HIT") ? "OPEN" : null, alertMsg,
                        status.equals("HIT") ? "ALT-" + random.nextInt(1000) : null);
                repository.saveResult(res);
                dtoResults.add(new ScreeningDTOs.ContextResult(ctx, status, alertMsg));
            }

            // Update Log Status
            repository.updateLog(log.logID(), "[Mock Full Response JSON]", "COMPLETED");

            return new ScreeningDTOs.ScreeningStatusResponse(requestId, dtoResults);
        } else {
            // Return existing from DB
            List<ScreeningDTOs.ContextResult> dtoResults = currentResults.stream()
                    .map(r -> new ScreeningDTOs.ContextResult(r.contextType(), r.status(), r.alertMessage()))
                    .toList();
            return new ScreeningDTOs.ScreeningStatusResponse(requestId, dtoResults);
        }
    }

    public List<ScreeningLog> getHistory(Long clientId) {
        return repository.findLogsByClientId(clientId);
    }
}
