package com.venus.kyc.viewer;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PermissionRepository {

    private final JdbcClient jdbcClient;

    public PermissionRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public List<String> findPermissionsByRole(String roleName) {
        return jdbcClient.sql("SELECT Permission FROM RolePermissions WHERE RoleName = :roleName")
                .param("roleName", roleName)
                .query(String.class)
                .list();
    }

    public List<String> findAllRoles() {
        return jdbcClient.sql("SELECT DISTINCT Role FROM AppUsers")
                .query(String.class)
                .list();
    }

    public List<String> findAllPermissions() {
        return List.of(
                "VIEW_CLIENTS",
                "EDIT_CLIENTS",
                "VIEW_SENSITIVE_DATA",
                "MANAGE_USERS",
                "VIEW_CHANGES",
                "MANAGE_PERMISSIONS");
    }

    public void addPermissionToRole(String roleName, String permission) {
        jdbcClient.sql("INSERT INTO RolePermissions (RoleName, Permission) VALUES (:roleName, :permission)")
                .param("roleName", roleName)
                .param("permission", permission)
                .update();
    }

    public void removePermissionFromRole(String roleName, String permission) {
        jdbcClient.sql("DELETE FROM RolePermissions WHERE RoleName = :roleName AND Permission = :permission")
                .param("roleName", roleName)
                .param("permission", permission)
                .update();
    }
}
