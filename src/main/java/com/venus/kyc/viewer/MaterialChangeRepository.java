package com.venus.kyc.viewer;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MaterialChangeRepository {

    private final JdbcClient jdbcClient;

    public MaterialChangeRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public List<MaterialChange> findAll() {
        return jdbcClient.sql("SELECT * FROM MaterialChanges ORDER BY ChangeDate DESC")
                .query((rs, rowNum) -> new MaterialChange(
                        rs.getLong("ChangeID"),
                        rs.getTimestamp("ChangeDate").toLocalDateTime(),
                        rs.getLong("ClientID"),
                        rs.getLong("EntityID"),
                        rs.getString("EntityName"),
                        rs.getString("ColumnName"),
                        rs.getString("OperationType"),
                        rs.getString("OldValue"),
                        rs.getString("NewValue")))
                .list();
    }
}
