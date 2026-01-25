package com.venus.kyc.viewer.risk;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/risk")
public class RiskAssessmentController {

  private final RiskAssessmentService service;

  public RiskAssessmentController(RiskAssessmentService service) {
    this.service = service;
  }

  @PostMapping("/calculate")
  public ResponseEntity<RiskDTOs.CalculateRiskResponse> calculateRisk(
      @RequestBody RiskDTOs.CalculateRiskRequest request) {
    RiskDTOs.CalculateRiskResponse response = service.calculateRisk(request);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/dummy-external-api")
  public ResponseEntity<String> mockExternalApi(@RequestBody String request) {
    String recordId = "00001497165";
    try {
      com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
      com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(request);
      if (root.has("clientRiskRatingRequest") && root.get("clientRiskRatingRequest").isArray()
          && root.get("clientRiskRatingRequest").size() > 0) {
        com.fasterxml.jackson.databind.JsonNode firstItem = root.get("clientRiskRatingRequest").get(0);
        if (firstItem.has("clientDetails") && firstItem.get("clientDetails").has("recordID")) {
          recordId = firstItem.get("clientDetails").get("recordID").asText();
        }
      }
    } catch (Exception e) {
      // ignore parsing errors, use default
    }

    String jsonResponse = """
            {
              "header": {
                "requestID": "test",
                "callerSystem": "173471-1",
                "responseTimeStamp": "2026-01-25T05:40:10+01:00",
                "eventModelRunInstance": "114654-1",
                "eventModelVersion": "CRRE 22.2",
                "eventCalibrationVersion": "122",
                "crrmVersion": "2.0"
              },
              "processStatus": {
                "crreStatus": "Success",
                "successfulRecords": 1,
                "errorRecords": 0,
                "warningRecords": 0
              },
              "clientRiskRatingResponse": [
                {
                  "recordID": "%s",
                  "riskRatingType": null,
                  "clientAdoptionCountry": "DE",
                  "error": null,
                  "overallRiskAssessment": {
                    "riskScoreDetails": null,
                    "overallRiskScore": 1,
                    "initialRiskLevel": "LOW",
                    "riskRatingPreSMEAssessment": "HIGH",
                    "overallRiskLevel": "HIGH",
                    "typeOfLogicApplied": "Adverse Media",
                    "smeRiskAssessment": ""
                  },
                  "entityRiskType": {
                    "pillarScore": 0,
                    "pillarRiskCategory": "LOW",
                    "typeOfLogicApplied": "",
                    "riskClassification": [
                      {
                        "elementName": "typeKYCLegalEntityCode",
                        "elementValue": "NP4",
                        "riskScore": 0,
                        "flag": null,
                        "regulatoryCRROverride": null,
                        "localRuleApplied": "N"
                      }
                    ]
                  },
                  "industryRiskType": {
                    "pillarScore": 0,
                    "pillarRiskCategory": "LOW",
                    "typeOfLogicApplied": null,
                    "riskClassification": [
                      {
                        "elementName": "occupationCode",
                        "elementValue": "00101",
                        "riskScore": 0,
                        "flag": null,
                        "regulatoryCRROverride": null,
                        "localRuleApplied": "N"
                      }
                    ]
                  },
                  "geoRiskType": {
                    "pillarScore": 0,
                    "pillarRiskCategory": "LOW",
                    "typeOfLogicApplied": null,
                    "riskClassification": [
                      {
                        "elementName": "countryOfNationality",
                        "elementValue": "DE",
                        "riskScore": 0,
                        "flag": null,
                        "regulatoryCRROverride": null,
                        "localRuleApplied": "N"
                      },
                      {
                        "elementName": "originOfFunds",
                        "elementValue": "DE",
                        "riskScore": 0,
                        "flag": null,
                        "regulatoryCRROverride": null,
                        "localRuleApplied": "N"
                      },
                      {
                        "elementName": "clientDomicile",
                        "elementValue": "DE",
                        "riskScore": 0,
                        "flag": null,
                        "regulatoryCRROverride": null,
                        "localRuleApplied": "N"
                      }
                    ]
                  },
                  "productRiskType": {
                    "pillarScore": 0,
                    "pillarRiskCategory": "LOW",
                    "typeOfLogicApplied": null,
                    "riskClassification": [
                      {
                        "elementName": "productCode",
                        "elementValue": "OAP1",
                        "riskScore": 0,
                        "flag": null,
                        "regulatoryCRROverride": null,
                        "localRuleApplied": "N"
                      }
                    ]
                  },
                  "channelRiskType": {
                    "pillarScore": 1,
                    "pillarRiskCategory": "MEDIUM",
                    "typeOfLogicApplied": null,
                    "riskClassification": [
                      {
                        "elementName": "channelCode",
                        "elementValue": "CHN05",
                        "riskScore": 1,
                        "flag": null,
                        "regulatoryCRROverride": null,
                        "localRuleApplied": "N"
                      }
                    ]
                  }
                }
              ]
            }
        """.formatted(recordId);
    return ResponseEntity.ok()
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .body(jsonResponse);
  }

  @org.springframework.web.bind.annotation.GetMapping("/logs")
  public java.util.List<RiskAssessmentLog> getAllLogs() {
    return service.findAllLogs();
  }

  @org.springframework.web.bind.annotation.GetMapping("/assessments")
  public java.util.List<RiskAssessment> getAllAssessments() {
    return service.findAllAssessments();
  }

  @org.springframework.web.bind.annotation.GetMapping("/assessments/{recordId}")
  public java.util.List<RiskAssessment> getAssessmentsByRecordId(
      @org.springframework.web.bind.annotation.PathVariable String recordId) {
    return service.getAssessmentsByRecordId(recordId);
  }

  @org.springframework.web.bind.annotation.GetMapping("/assessment-details/{assessmentId}")
  public java.util.List<RiskAssessmentDetail> getAssessmentDetails(
      @org.springframework.web.bind.annotation.PathVariable Long assessmentId) {
    return service.getAssessmentDetails(assessmentId);
  }
}
