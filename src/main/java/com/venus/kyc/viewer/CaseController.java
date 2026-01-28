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
    private final CaseService caseService;
    private final EventService eventService;

    public CaseController(CaseRepository caseRepository, UserRepository userRepository, CaseService caseService,
            EventService eventService) {
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
        this.caseService = caseService;
        this.eventService = eventService;
    }

    @GetMapping
    public List<Case> getCases() {
        return caseRepository.findAll();
    }

    @GetMapping("/{id}")
    public Case getCase(@PathVariable Long id) {
        return caseRepository.findById(id).orElseThrow();
    }

    @GetMapping("/client/{clientID}")
    public List<Case> getCasesByClient(@PathVariable Long clientID) {
        return caseRepository.findByClientId(clientID);
    }

    @GetMapping("/{id}/comments")
    public List<CaseComment> getComments(@PathVariable Long id) {
        return caseRepository.findCommentsByCaseId(id);
    }

    @GetMapping("/{id}/documents")
    public List<CaseDocument> getDocuments(@PathVariable Long id) {
        return caseRepository.findDocumentsByCaseId(id);
    }

    @PostMapping("/migrate")
    public ResponseEntity<Void> migrateCases(org.springframework.security.core.Authentication authentication) {
        // One-time manual helper: Migrate explicit cases 1 and 2 from data.sql
        // In real app, querying db for all cases without process ID.
        // Assuming IDs 1 and 2 exist.
        try {
            caseService.migrateLegacyCase(1L, 1L, authentication.getName());
            caseService.migrateLegacyCase(2L, 2L, authentication.getName());
        } catch (Exception e) {
            // ignore if duplicate or failed, for demo robustness
        }
        return ResponseEntity.ok().build();
    }

    // New Endpoint for Workflow Tasks
    @GetMapping("/tasks")
    public List<Map<String, Object>> getMyTasks(org.springframework.security.core.Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        // Determine groups based on Role.
        // Simple mapping: ROLE_KYC_ANALYST -> KYC_ANALYST group
        // Assuming role string matches BPMN candidate group or we map it.
        // Role in DB: KYC_ANALYST, etc.
        List<String> groups = List.of(user.role());
        return caseService.getUserTasks(user.username(), groups);
    }

    @DeleteMapping("/tasks")
    public ResponseEntity<Void> deleteAllTasks() {
        caseService.deleteAllTasks();
        return ResponseEntity.ok().build();
    }

    // Admin Endpoints

    @GetMapping("/admin/tasks")
    public List<Map<String, Object>> getAllTasks(org.springframework.security.core.Authentication authentication) {
        // In real app, check for ADMIN role
        return caseService.getAllTasks();
    }

    @GetMapping("/admin/processes")
    public List<Map<String, Object>> getAllProcesses(org.springframework.security.core.Authentication authentication) {
        return caseService.getAllProcessInstances();
    }

    @DeleteMapping("/admin/processes/{id}")
    public ResponseEntity<Void> terminateProcess(@PathVariable String id,
            org.springframework.security.core.Authentication authentication) {
        caseService.terminateProcessInstance(id);
        return ResponseEntity.ok().build();
    }

    // Updated to use Workflow
    @PostMapping("/{id}/transition")
    public ResponseEntity<Void> transitionCase(@PathVariable Long id, @RequestBody Map<String, String> request,
            org.springframework.security.core.Authentication authentication) {
        // We expect 'taskId' now instead of just generic action, but for backward
        // compatibility/hybrid:
        // If the UI sends 'taskId', we use completeTask.
        // If not, we might need to find the task for this user and case.

        // For this upgrade, let's assume we find the task for this 'id' (CaseID).
        // WARNING: This assumes one active task per case, which is true for our
        // sequential process.

        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        boolean isAdmin = "ADMIN".equals(user.role());

        List<String> groups;
        if (isAdmin) {
            groups = List.of("KYC_ANALYST", "KYC_REVIEWER", "AFC_REVIEWER", "ACO_REVIEWER");
        } else {
            groups = List.of(user.role());
        }

        List<Map<String, Object>> tasks = caseService.getUserTasks(authentication.getName(), groups);

        // Filter for this case
        String taskId = tasks.stream()
                .filter(t -> {
                    Object cId = t.get("caseId");
                    boolean match = cId != null && String.valueOf(id).equals(String.valueOf(cId));
                    return match;
                })
                .map(t -> (String) t.get("taskId"))
                .findFirst()
                .orElse(null);

        if (taskId == null) {
            // Fallback or error if no task found for this user on this case
            return ResponseEntity.status(404).build();
        }

        String comment = request.get("comment");
        // We could pass comment to process variables or add to case comments
        if (comment != null) {
            caseRepository.addComment(id, authentication.getName(), comment,
                    userRepository.findByUsername(authentication.getName()).get().role());
        }

        try {
            caseService.completeTask(taskId, authentication.getName());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build(); // Simplified, ideally return body
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build(); // Simplified, ideally return body
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<Void> assignCase(@PathVariable Long id, @RequestBody Map<String, String> request,
            org.springframework.security.core.Authentication authentication) {
        String assignee = request.get("assignee");
        try {
            caseService.assignTask(id, assignee, authentication.getName());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
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

        // Use new Service to start process
        Long caseId = caseService.createCase(clientID, reason, user.username());
        caseRepository.addComment(caseId, user.username(), "Case created via Workflow: " + reason, user.role());

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

    @GetMapping("/{id}/events")
    public List<CaseEvent> getCaseEvents(@PathVariable Long id) {
        return eventService.getEventsForCase(id);
    }
}
