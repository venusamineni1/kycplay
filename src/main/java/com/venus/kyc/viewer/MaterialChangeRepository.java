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
        return findAllPaginated(0, Integer.MAX_VALUE, null, null).content();
    }

    public long countChanges(String startDate, String endDate) {
        String sql = "SELECT COUNT(*) FROM MaterialChanges WHERE 1=1";
        if (startDate != null && !startDate.isEmpty()) {
            sql += " AND ChangeDate >= :startDate";
        }
        if (endDate != null && !endDate.isEmpty()) {
            sql += " AND ChangeDate <= :endDate";
        }

        var query = jdbcClient.sql(sql);
        if (startDate != null && !startDate.isEmpty())
            query.param("startDate", startDate + " 00:00:00");
        if (endDate != null && !endDate.isEmpty())
            query.param("endDate", endDate + " 23:59:59");

        return query.query(Long.class).single();
    }

    public PaginatedResponse<MaterialChange> findAllPaginated(int page, int size, String startDate, String endDate) {
        long totalElements = countChanges(startDate, endDate);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        String sql = "SELECT * FROM MaterialChanges WHERE 1=1";
        if (startDate != null && !startDate.isEmpty()) {
            sql += " AND ChangeDate >= :startDate";
        }
        if (endDate != null && !endDate.isEmpty()) {
            sql += " AND ChangeDate <= :endDate";
        }
        sql += " ORDER BY ChangeDate DESC LIMIT :limit OFFSET :offset";

        var query = jdbcClient.sql(sql)
                .param("limit", size)
                .param("offset", page * size);

        if (startDate != null && !startDate.isEmpty())
            query.param("startDate", startDate + " 00:00:00");
        if (endDate != null && !endDate.isEmpty())
            query.param("endDate", endDate + " 23:59:59");

        List<MaterialChange> changes = query.query((rs, rowNum) -> new MaterialChange(
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

        return new PaginatedResponse<>(changes, page, size, totalElements, totalPages);
    }
}
