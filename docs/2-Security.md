# Security

**Description:**
Sistema turi būti apsaugota nuo SQL injection atakų:
- JPA queries with parameters
- JDBC prepared statements

**Implementation:**
All data access is parameterized JPA derived queries, no string-built SQL anywhere.

## Parameterized JPA queries

**File:** [backend/src/main/java/com/riskmonitor/repository/RiskRepository.java](../backend/src/main/java/com/riskmonitor/repository/RiskRepository.java)
**Lines:** 12-17

Method params are bound as query parameters by Hibernate/JDBC, never concatenated into SQL.

```java
public interface RiskRepository extends JpaRepository<Risk, UUID> {
    Optional<Risk> findByIdAndUserId(UUID id, String userId);
    List<Risk> findAllByUserId(String userId, Sort sort);
    List<Risk> findAllByTeamId(UUID teamId, Sort sort);
}
```

**File:** [backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java](../backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java)
**Lines:** 12-18

```java
public interface RiskValueRepository extends JpaRepository<RiskValue, UUID> {
    List<RiskValue> findByRiskIdOrderByRecordedAtAsc(UUID riskId);
    Page<RiskValue> findByRiskId(UUID riskId, Pageable pageable);
    Optional<RiskValue> findByIdAndRiskId(UUID id, UUID riskId);
}
```

Hibernate runs these as JDBC prepared statements (`... WHERE user_id = ?`). No `@Query` concatenation, no raw `EntityManager`/`Statement`. Identifiers are typed `UUID`, so malformed input is rejected before any query.
