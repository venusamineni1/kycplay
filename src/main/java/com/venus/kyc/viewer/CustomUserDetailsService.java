package com.venus.kyc.viewer;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;

    public CustomUserDetailsService(UserRepository userRepository, PermissionRepository permissionRepository) {
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        java.util.List<String> permissions = permissionRepository.findPermissionsByRole(user.role());
        String[] authorities = new String[permissions.size() + 1];
        authorities[0] = "ROLE_" + user.role();
        for (int i = 0; i < permissions.size(); i++) {
            authorities[i + 1] = permissions.get(i);
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.username())
                .password(user.password())
                .authorities(authorities)
                .disabled(!user.enabled())
                .build();
    }
}
