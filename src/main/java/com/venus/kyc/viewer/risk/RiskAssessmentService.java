package com.venus.kyc.viewer.risk;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.venus.kyc.viewer.CaseRepository;
import com.venus.kyc.viewer.Case;
import com.venus.kyc.viewer.EventService;
import com.venus.kyc.viewer.ClientRepository;
import com.venus.kyc.viewer.Client;
import java.util.Optional;
import com.venus.kyc.viewer.QuestionnaireRepository;
import com.venus.kyc.viewer.QuestionnaireSection;
import com.venus.kyc.viewer.QuestionnaireQuestion;
import com.venus.kyc.viewer.CaseQuestionnaireResponse;

@Service
public class RiskAssessmentService {

    private final RiskAssessmentRepository repository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final CaseRepository caseRepository;
    private final EventService eventService;

    private final ClientRepository clientRepository;
    private final QuestionnaireRepository questionnaireRepository;

    // TODO: move validation URL to properties
    private static final String API_URL = "http://localhost:8080/api/risk/dummy-external-api";

    public RiskAssessmentService(RiskAssessmentRepository repository, ObjectMapper objectMapper,
            CaseRepository caseRepository, EventService eventService, ClientRepository clientRepository,
            QuestionnaireRepository questionnaireRepository) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.caseRepository = caseRepository;
        this.eventService = eventService;
        this.clientRepository = clientRepository;
        this.questionnaireRepository = questionnaireRepository;
        this.restClient = RestClient.create();
    }

    public RiskDTOs.CalculateRiskResponse evaluateRiskForClient(Long clientId) {
        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (clientOpt.isEmpty()) {
            throw new RuntimeException("Client not found for ID: " + clientId);
        }
        Client client = clientOpt.get();

        // Build Request from Client Data
        String requestTimestamp = java.time.LocalDateTime.now().toString(); // simplified ISO format

        RiskDTOs.Header header = new RiskDTOs.Header(
                "173471-1",
                "DWS",
                "2.0",
                "sys-" + System.currentTimeMillis(),
                requestTimestamp,
                null, null, null, null);

        // Map Addresses
        String domicile = "DE";
        if (client.addresses() != null && !client.addresses().isEmpty()) {
            domicile = client.addresses().get(0).country();
        }

        RiskDTOs.AddressTypeRisk addressType = new RiskDTOs.AddressTypeRisk(
                null, // postalAddress
                domicile);

        RiskDTOs.PartyAccountRisk partyAccount = new RiskDTOs.PartyAccountRisk(
                java.util.List.of(client.citizenship1() != null ? client.citizenship1() : "DE"),
                java.util.List.of(client.sourceOfFundsCountry() != null ? client.sourceOfFundsCountry() : "DE"),
                null, // dateOfResidence
                addressType);

        RiskDTOs.GeoRiskType geoRisk = new RiskDTOs.GeoRiskType(
                null, // relatedParty
                java.util.List.of(partyAccount),
                null, null, null, null);

        // Client Details
        RiskDTOs.ClientDetails clientDetails = new RiskDTOs.ClientDetails(
                null,
                String.valueOf(client.clientID()),
                client.countryOfTax() != null ? client.countryOfTax() : "DE",
                "N",
                "",
                new ArrayList<>() // Initial empty rules, will be populated by calculateRisk logic if needed
        );

        // Dummy defaults for now to match JS behavior
        RiskDTOs.EntityRiskType entityRisk = new RiskDTOs.EntityRiskType("NP4", null, null, null, null);
        RiskDTOs.IndustryRiskType industryRisk = new RiskDTOs.IndustryRiskType(java.util.List.of("00101"), null, null,
                null, null);
        RiskDTOs.ProductRiskType productRisk = new RiskDTOs.ProductRiskType("OAP1", null, null, null, null);
        RiskDTOs.ChannelRiskType channel2 = new RiskDTOs.ChannelRiskType("CHN05", null, null, null, null);

        RiskDTOs.ClientRiskRatingRequestItem item = new RiskDTOs.ClientRiskRatingRequestItem(
                clientDetails, entityRisk, industryRisk, geoRisk, java.util.List.of(productRisk), channel2);

        RiskDTOs.CalculateRiskRequest request = new RiskDTOs.CalculateRiskRequest(
                header, java.util.List.of(item));

        return calculateRisk(request);
    }

    public RiskDTOs.CalculateRiskResponse calculateRisk(RiskDTOs.CalculateRiskRequest request) {
        // Enrich Request with Risk Factors from Questionnaire
        // 1. Find Client ID from request (assuming first item)
        if (request.clientRiskRatingRequest() != null && !request.clientRiskRatingRequest().isEmpty()) {
            RiskDTOs.ClientRiskRatingRequestItem item = request.clientRiskRatingRequest().get(0);
            try {
                Long clientId = Long.valueOf(item.clientDetails().recordID());
                // 2. Find Latest Case
                List<Case> cases = caseRepository.findByClientId(clientId);
                // Simple heuristic: get latest created case? Or just any active case.
                // Or maybe we should pass caseId in request?
                // For now, let's take the latest case (highest ID).
                Case latestCase = cases.stream().max((a, b) -> a.caseID().compareTo(b.caseID())).orElse(null);

                if (latestCase != null) {
                    // 3. Get Responses
                    List<CaseQuestionnaireResponse> responses = questionnaireRepository
                            .getResponsesForCase(latestCase.caseID());
                    // 4. Get Template to map Questions to Keys
                    List<QuestionnaireSection> template = questionnaireRepository.getTemplate();

                    // Flatten template questions
                    List<QuestionnaireQuestion> allQuestions = template.stream()
                            .flatMap(s -> s.questions().stream())
                            .toList();

                    List<RiskDTOs.AdditionalRule> rules = new ArrayList<>();
                    if (item.clientDetails().additionalRule() != null) {
                        rules.addAll(item.clientDetails().additionalRule());
                    }

                    for (CaseQuestionnaireResponse resp : responses) {
                        QuestionnaireQuestion q = allQuestions.stream()
                                .filter(question -> question.questionID().equals(resp.questionID()))
                                .findFirst()
                                .orElse(null);

                        if (q != null && q.riskFactorKey() != null && "YES".equalsIgnoreCase(resp.answerText())) {
                            rules.add(new RiskDTOs.AdditionalRule("RiskFactor", q.riskFactorKey(), "Y"));
                        }
                    }

                    // Update the request item with new rules. Since records are immutable, we must
                    // recreate the structure.
                    // This is verbose with Records.
                    RiskDTOs.ClientDetails oldDetails = item.clientDetails();
                    RiskDTOs.ClientDetails newDetails = new RiskDTOs.ClientDetails(
                            oldDetails.defenceRevenue(), oldDetails.recordID(), oldDetails.clientAdoptionCountry(),
                            oldDetails.smeAssessment(), oldDetails.smeRiskAssessment(), rules);

                    RiskDTOs.ClientRiskRatingRequestItem newItem = new RiskDTOs.ClientRiskRatingRequestItem(
                            newDetails, item.entityRiskType(), item.industryRiskType(), item.geoRiskType(),
                            item.productRiskType(), item.channelRiskType());

                    // Replace in list
                    List<RiskDTOs.ClientRiskRatingRequestItem> newList = new ArrayList<>(
                            request.clientRiskRatingRequest());
                    newList.set(0, newItem);
                    request = new RiskDTOs.CalculateRiskRequest(request.header(), newList);
                }
            } catch (Exception e) {
                System.err.println("Error processing questionnaire risk factors: " + e.getMessage());
                // Continue without enrichment
            }
        }

        // 1. Prepare Log
        String requestJson = "";
        try {
            requestJson = objectMapper.writeValueAsString(request);
            System.out.println(requestJson);
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

            // Log Event if linking to case
            try {
                Long clientId = Long.valueOf(item.recordID());
                List<Case> cases = caseRepository.findByClientId(clientId);
                for (Case c : cases) {
                    eventService.logEvent(c.caseID(), "RISK_CHANGED",
                            "Risk Score updated to " + assessment.overallRiskScore() + " ("
                                    + assessment.overallRiskLevel() + ")",
                            "SYSTEM");
                }
            } catch (NumberFormatException e) {
                // Ignore if recordID is not a Long
            }

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
