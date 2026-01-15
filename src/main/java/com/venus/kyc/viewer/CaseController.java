package com.venus.kyc.viewer;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseRepository caseRepository;
    private final UserRepository userRepository;

    public CaseController(CaseRepository caseRepository, UserRepository userRepository) {
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Case> getCases() {
        return caseRepository.findAll();
    }

    @GetMapping("/{id}")
    public Case getCase(@PathVariable Long id) {
        return caseRepository.findById(id).orElseThrow();
    }

    @GetMapping("/{id}/comments")
    public List<CaseComment> getComments(@PathVariable Long id) {
        return caseRepository.findCommentsByCaseId(id);
    }

    @GetMapping("/{id}/documents")
    public List<CaseDocument> getDocuments(@PathVariable Long id) {
        return caseRepository.findDocumentsByCaseId(id);
    }

    @PostMapping("/{id}/transition")
    public ResponseEntity<Void> transitionCase(@PathVariable Long id, @RequestBody Map<String, String> request,
            org.springframework.security.core.Authentication authentication) {
        String action = request.get("action"); // 'APPROVE' or 'REJECT'
        String comment = request.get("comment");
        Case kycCase = caseRepository.findById(id).orElseThrow();
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();

        // Determine required permission based on current status
        String requiredPermission = switch (kycCase.status()) {
            case "KYC_ANALYST" -> "APPROVE_CASES_STAGE1";
            case "KYC_REVIEWER" -> "APPROVE_CASES_STAGE2";
            case "AFC_REVIEWER" -> "APPROVE_CASES_STAGE3";
            case "ACO_REVIEWER" -> "APPROVE_CASES_STAGE4";
            default -> null;
        };

        boolean hasPermission = authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals(requiredPermission) || a.equals("ROLE_ADMIN"));

        if (!hasPermission) {
            return ResponseEntity.status(403).build();
        }

        String nextStatus;
        String nextAssignee = null;

        if ("APPROVE".equalsIgnoreCase(action)) {
            nextStatus = switch (kycCase.status()) {
                case "KYC_ANALYST" -> "KYC_REVIEWER";
                case "KYC_REVIEWER" -> "AFC_REVIEWER";
                case "AFC_REVIEWER" -> "ACO_REVIEWER";
                case "ACO_REVIEWER" -> "APPROVED";
                default -> kycCase.status();
            };
        } else {
            // REJECT always goes back to ANALYST
            nextStatus = "KYC_ANALYST";
        }

        caseRepository.updateStatus(id, nextStatus, nextAssignee);
        caseRepository.addComment(id, user.username(), comment, user.role());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/documents")
    public ResponseEntity<Void> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") String category,
            @RequestParam("comment") String comment,
            org.springframework.security.core.Authentication authentication) throws IOException {
        caseRepository.addDocument(
                id,
                file.getOriginalFilename(),
                category,
                file.getContentType(),
                authentication.getName(),
                comment,
                file.getBytes());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<Long> createCase(@RequestBody Map<String, Object> request,
            org.springframework.security.core.Authentication authentication) {
        Long clientID = Long.valueOf(request.get("clientID").toString());
        String reason = (String) request.get("reason");
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();

        // Check for MANAGE_CASES permission
        boolean canManage = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("MANAGE_CASES") || a.getAuthority().equals("ADMIN"));

        if (!canManage) {
            return ResponseEntity.status(403).build();
        }

        Long caseId = caseRepository.create(clientID, reason, "KYC_ANALYST", user.username());
        caseRepository.addComment(caseId, user.username(), "Case created: " + reason, user.role());

        return ResponseEntity.ok(caseId);
    }

    @GetMapping("/documents/{docId}")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long docId) {
        CaseDocument doc = caseRepository.findDocumentById(docId).orElseThrow();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.mimeType()))
                .header("Content-Disposition", "attachment; filename=\"" + doc.documentName() + "\"")
                .body(doc.data());
    }
}
