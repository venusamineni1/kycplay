package com.venus.kyc.viewer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;

    public UserController(UserRepository userRepository, PermissionRepository permissionRepository) {
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/role/{role}")
    public List<User> getUsersByRole(@PathVariable String role) {
        return userRepository.findByRole(role);
    }

    @PostMapping
    public ResponseEntity<Void> createUser(@RequestBody CreateUserRequest request) {
        // Ensure password is simple for this demo (prefixed with {noop} if missing)
        // In a real app, we would hash it here.
        String password = request.password();
        if (!password.startsWith("{noop}")) {
            password = "{noop}" + password;
        }

        User newUser = new User(null, request.username(), password, request.role(), true);
        userRepository.create(newUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/password")
    public ResponseEntity<String> updatePassword(
            @RequestBody PasswordChangeRequest request,
            java.security.Principal principal) {

        String currentUsername = principal.getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify old password (simple check for {noop} prefix)
        String storedPassword = currentUser.password();
        String oldPasswordToCheck = request.oldPassword();
        if (!oldPasswordToCheck.startsWith("{noop}")) {
            oldPasswordToCheck = "{noop}" + oldPasswordToCheck;
        }

        if (!storedPassword.equals(oldPasswordToCheck)) {
            return ResponseEntity.badRequest().body("Incorrect old password");
        }

        // Update to new password
        String newPassword = request.newPassword();
        if (!newPassword.startsWith("{noop}")) {
            newPassword = "{noop}" + newPassword;
        }

        userRepository.updatePassword(currentUsername, newPassword);
        return ResponseEntity.ok("Password updated");
    }

    @PutMapping("/{username}/role")
    public ResponseEntity<Void> updateRole(@PathVariable String username, @RequestBody RoleUpdateRequest request) {
        userRepository.updateRole(username, request.role());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfo> getCurrentUser(java.security.Principal principal) {
        String username = principal.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<String> permissions = permissionRepository.findPermissionsByRole(user.role());
        return ResponseEntity.ok(new UserInfo(user.username(), user.role(), permissions));
    }

    // Inner records for request bodies
    public record CreateUserRequest(String username, String password, String role) {
    }

    public record PasswordChangeRequest(String oldPassword, String newPassword) {
    }

    public record RoleUpdateRequest(String role) {
    }

    public record UserInfo(String username, String role, List<String> permissions) {
    }
}
