package com.venus.kyc.viewer.risk;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RiskAssessmentService {

    private final RiskAssessmentRepository repository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    // TODO: move validation URL to properties
    private static final String API_URL = "http://localhost:8080/api/risk/dummy-external-api";

    public RiskAssessmentService(RiskAssessmentRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public RiskDTOs.CalculateRiskResponse calculateRisk(RiskDTOs.CalculateRiskRequest request) {
        // 1. Prepare Log
        String requestJson = "";
        try {
            requestJson = objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            requestJson = "Error serializing request: " + e.getMessage();
        }

        RiskAssessmentLog log = new RiskAssessmentLog(null, requestJson, null, "PENDING", null);
        Long logId = repository.saveLog(log);

        // 2. Call External API
        RiskDTOs.CalculateRiskResponse response = null;
        String responseJson = "";
        String status = "SUCCESS";

        try {
            response = restClient.post()
                    .uri(API_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(RiskDTOs.CalculateRiskResponse.class);

            responseJson = objectMapper.writeValueAsString(response);

        } catch (Exception e) {
            status = "ERROR";
            responseJson = "Error calling external API: " + e.getMessage();
            updateLog(logId, requestJson, responseJson, status);
            throw new RuntimeException("External API Call failed", e);
        }

        // 3. Update Log
        updateLog(logId, requestJson, responseJson, status);

        // 4. Process Response and Save Data
        processResponse(logId, response);

        return response;
    }

    private void updateLog(Long logId, String requestJson, String responseJson, String status) {
        repository.updateLog(logId, responseJson, status);
    }

    private void processResponse(Long logId, RiskDTOs.CalculateRiskResponse response) {
        if (response == null || response.clientRiskRatingResponse() == null)
            return;

        for (RiskDTOs.ClientRiskRatingResponseItem item : response.clientRiskRatingResponse()) {
            // Save Assessment
            RiskAssessment assessment = new RiskAssessment(
                    null,
                    logId,
                    item.recordID(),
                    item.overallRiskAssessment() != null ? item.overallRiskAssessment().overallRiskScore() : 0,
                    item.overallRiskAssessment() != null ? item.overallRiskAssessment().initialRiskLevel() : null,
                    item.overallRiskAssessment() != null ? item.overallRiskAssessment().overallRiskLevel() : null,
                    item.overallRiskAssessment() != null ? item.overallRiskAssessment().typeOfLogicApplied() : null,
                    item.overallRiskAssessment() != null ? item.overallRiskAssessment().smeRiskAssessment() : null,
                    null);
            Long assessmentId = repository.saveAssessment(assessment);

            List<RiskAssessmentDetail> details = new ArrayList<>();

            // Entity Risk
            if (item.entityRiskType() != null && item.entityRiskType().riskClassification() != null) {
                for (RiskDTOs.RiskClassification rc : item.entityRiskType().riskClassification()) {
                    details.add(createDetail(assessmentId, "Entity", rc));
                }
            }
            // Industry Risk
            if (item.industryRiskType() != null && item.industryRiskType().riskClassification() != null) {
                for (RiskDTOs.RiskClassification rc : item.industryRiskType().riskClassification()) {
                    details.add(createDetail(assessmentId, "Industry", rc));
                }
            }
            // Geo Risk
            if (item.geoRiskType() != null && item.geoRiskType().riskClassification() != null) {
                for (RiskDTOs.RiskClassification rc : item.geoRiskType().riskClassification()) {
                    details.add(createDetail(assessmentId, "Geo", rc));
                }
            }
            // Product Risk
            if (item.productRiskType() != null && item.productRiskType().riskClassification() != null) {
                for (RiskDTOs.RiskClassification rc : item.productRiskType().riskClassification()) {
                    details.add(createDetail(assessmentId, "Product", rc));
                }
            }
            // Channel Risk
            if (item.channelRiskType() != null && item.channelRiskType().riskClassification() != null) {
                for (RiskDTOs.RiskClassification rc : item.channelRiskType().riskClassification()) {
                    details.add(createDetail(assessmentId, "Channel", rc));
                }
            }

            repository.saveDetails(details);
        }
    }

    private RiskAssessmentDetail createDetail(Long assessmentId, String type, RiskDTOs.RiskClassification rc) {
        return new RiskAssessmentDetail(
                null,
                assessmentId,
                type,
                rc.elementName(),
                rc.elementValue(),
                rc.riskScore(),
                rc.flag(),
                rc.localRuleApplied());
    }

    public List<RiskAssessmentLog> findAllLogs() {
        return repository.findAllLogs();
    }

    public List<RiskAssessment> findAllAssessments() {
        return repository.findAllAssessments();
    }

    public List<RiskAssessment> getAssessmentsByRecordId(String recordId) {
        return repository.findAssessmentsByRecordId(recordId);
    }

    public List<RiskAssessmentDetail> getAssessmentDetails(Long assessmentId) {
        return repository.findDetailsByAssessmentId(assessmentId);
    }
}
