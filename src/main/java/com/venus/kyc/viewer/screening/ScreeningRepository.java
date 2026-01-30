package com.venus.kyc.viewer.screening;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public class ScreeningRepository {

    private final JdbcClient jdbcClient;

    public ScreeningRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public Long saveLog(ScreeningLog log) {
        String sql = "INSERT INTO ScreeningLogs (ClientID, RequestPayload, ResponsePayload, OverallStatus, ExternalRequestID, CreatedAt) VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcClient.sql(sql)
                .params(log.clientID(), log.requestPayload(), log.responsePayload(), log.overallStatus(),
                        log.externalRequestID(), log.createdAt() != null ? log.createdAt() : LocalDateTime.now())
                .update(keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        if (keys == null || keys.isEmpty()) {
            throw new RuntimeException("No keys generated for ScreeningLog");
        }
        // Handle case-insensitivity if needed, but error showed LOGID
        Object key = keys.get("LOGID");
        if (key == null)
            key = keys.get("LogID"); // Fallback
        if (key == null)
            key = keys.get("logid"); // Fallback
        if (key == null)
            throw new RuntimeException("Could not retrieve LOGID from generated keys: " + keys.keySet());

        return ((Number) key).longValue();
    }

    public void updateLog(Long logId, String responsePayload, String overallStatus) {
        String sql = "UPDATE ScreeningLogs SET ResponsePayload = ?, OverallStatus = ? WHERE LogID = ?";
        jdbcClient.sql(sql)
                .params(responsePayload, overallStatus, logId)
                .update();
    }

    public Long saveResult(ScreeningResult result) {
        String sql = "INSERT INTO ScreeningResults (ScreeningLogID, ContextType, Status, AlertStatus, AlertMessage, AlertID) VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcClient.sql(sql)
                .params(result.screeningLogID(), result.contextType(), result.status(), result.alertStatus(),
                        result.alertMessage(), result.alertID())
                .update(keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        Object key = keys != null ? keys.get("RESULTID") : null;
        if (key == null && keys != null)
            key = keys.get("ResultID");
        if (key == null && keys != null)
            key = keys.get("resultid");
        if (key == null)
            throw new RuntimeException(
                    "Could not retrieve RESULTID from generated keys: " + (keys != null ? keys.keySet() : "null"));

        return ((Number) key).longValue();
    }

    public void deleteResultsByLogId(Long logId) {
        String sql = "DELETE FROM ScreeningResults WHERE ScreeningLogID = ?";
        jdbcClient.sql(sql).params(logId).update();
    }

    public List<ScreeningLog> findLogsByClientId(Long clientId) {
        return jdbcClient.sql("SELECT * FROM ScreeningLogs WHERE ClientID = ? ORDER BY CreatedAt DESC")
                .params(clientId)
                .query(ScreeningLog.class)
                .list();
    }

    public ScreeningLog findLogByExternalId(String externalId) {
        return jdbcClient.sql("SELECT * FROM ScreeningLogs WHERE ExternalRequestID = ?")
                .params(externalId)
                .query(ScreeningLog.class)
                .optional().orElse(null);
    }

    public List<ScreeningResult> findResultsByLogId(Long logId) {
        return jdbcClient.sql("SELECT * FROM ScreeningResults WHERE ScreeningLogID = ?")
                .params(logId)
                .query(ScreeningResult.class)
                .list();
    }
}
