# Data Access / Sessions and Transactions

Requirement: ORM/Data Mapper technology must be used where it makes sense, and DB transactions must not include user interaction. A database transaction must start and finish within one HTTP request.

---

## ORM / JPA Entities

### Risk Entity
**File:** [backend/src/main/java/com/riskmonitor/entity/Risk.java](backend/src/main/java/com/riskmonitor/entity/Risk.java)

```java
@Entity
@Table(name = "risk")
public class Risk {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_interval_unit", nullable = false, length = 20)
    private RiskPeriod timeIntervalUnit;

    @Column(name = "measurement_unit", nullable = false, length = 50)
    private String measurementUnit;

    @Embedded
    private ModifyDetails modifyDetails;

    @Version
    @Column(name = "version")
    private Long version;
}
```

**How it works:** `Risk` is mapped to the `risk` database table using JPA annotations. Hibernate manages persistence, object mapping and versioning.

---

### RiskValue Entity
**File:** [backend/src/main/java/com/riskmonitor/entity/RiskValue.java](backend/src/main/java/com/riskmonitor/entity/RiskValue.java)

```java
@Entity
@Table(
        name = "risk_value",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_risk_value_risk_id_recorded_at",
                columnNames = {"risk_id", "recorded_at"}
        )
)
public class RiskValue {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "risk_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Risk risk;

    @Column(name = "value", nullable = false, precision = 19, scale = 4)
    private BigDecimal value;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Embedded
    private ModifyDetails modifyDetails;

    @Version
    @Column(name = "version")
    private Long version;
}
```

**How it works:** `RiskValue` is mapped to `risk_value` and connected to `Risk` with a JPA `@ManyToOne` relationship.

---

## Repository Data Access

### Risk Repository
**File:** [backend/src/main/java/com/riskmonitor/repository/RiskRepository.java](backend/src/main/java/com/riskmonitor/repository/RiskRepository.java)

```java
public interface RiskRepository extends JpaRepository<Risk, UUID> {
    Optional<Risk> findByIdAndUserId(UUID id, String userId);
    List<Risk> findAllByUserId(String userId, Sort sort);
}
```

### RiskValue Repository
**File:** [backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java)

```java
public interface RiskValueRepository extends JpaRepository<RiskValue, UUID> {
    List<RiskValue> findByRiskIdOrderByRecordedAtAsc(UUID riskId);
    Page<RiskValue> findByRiskId(UUID riskId, Pageable pageable);
    Optional<RiskValue> findByIdAndRiskId(UUID id, UUID riskId);
}
```

**How it works:** Database access is performed through Spring Data JPA repositories instead of manual SQL. Query parameters are passed through typed repository methods.

---

## Transactions in Service Layer

### Risk Service
**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java)

```java
@Transactional(readOnly = true)
public Risk getRisk(UUID id, String userId) { ... }

@Async
@Transactional(readOnly = true)
public CompletableFuture<List<RiskResp>> listRisks(String userId, UUID teamId) { ... }

@Transactional
public Risk createRisk(RiskCreateReq req, String userId) { ... }

@Transactional
public Risk updateRisk(UUID id, RiskUpdateReq req, String userId) { ... }

@Transactional
public void deleteRisk(UUID id, String userId) { ... }
```

### Risk Value Service
**File:** [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](backend/src/main/java/com/riskmonitor/service/RiskValueService.java)

```java
@Transactional(readOnly = true)
public List<RiskValue> listValues(UUID riskId, String userId) { ... }

@Transactional(readOnly = true)
public Page<RiskValue> listValues(UUID riskId, String userId, Pageable pageable) { ... }

@Transactional
public List<RiskValue> createValues(UUID riskId, String userId, CreateBatchReq request) { ... }

@Transactional
public RiskValue updateValue(UUID riskId, String userId, UUID valueId, UpdateReq request) { ... }

@Transactional
public void deleteValue(UUID riskId, String userId, UUID valueId) { ... }
```

**How it works:** Transactions are opened only when a backend service method is called during an HTTP request. The user fills forms in React before the request is sent, so no DB transaction is kept open while waiting for user input.

---

## Verification

- ORM is implemented using JPA entities: `Risk` and `RiskValue`.
- Data access is isolated in Spring Data `JpaRepository` interfaces.
- DB transactions are defined in the service layer with `@Transactional`.
- Transactions start and finish inside one HTTP request.
- No transaction spans frontend form filling or other user interaction.
