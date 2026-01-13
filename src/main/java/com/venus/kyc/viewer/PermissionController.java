package com.venus.kyc.viewer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionRepository permissionRepository;

    public PermissionController(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @GetMapping("/roles")
    public List<String> getRoles() {
        return permissionRepository.findAllRoles();
    }

    @GetMapping("/all")
    public List<String> getAllPermissions() {
        return permissionRepository.findAllPermissions();
    }

    @GetMapping("/role/{roleName}")
    public List<String> getPermissionsForRole(@PathVariable String roleName) {
        return permissionRepository.findPermissionsByRole(roleName);
    }

    @PostMapping("/role/{roleName}")
    public ResponseEntity<Void> updatePermissions(@PathVariable String roleName,
            @RequestBody Map<String, List<String>> request) {
        List<String> newPermissions = request.get("permissions");
        List<String> currentPermissions = permissionRepository.findPermissionsByRole(roleName);

        // Remove old ones not in new list
        for (String p : currentPermissions) {
            if (!newPermissions.contains(p)) {
                permissionRepository.removePermissionFromRole(roleName, p);
            }
        }

        // Add new ones not in current list
        for (String p : newPermissions) {
            if (!currentPermissions.contains(p)) {
                permissionRepository.addPermissionToRole(roleName, p);
            }
        }

        return ResponseEntity.ok().build();
    }
}
