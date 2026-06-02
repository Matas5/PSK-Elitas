# Data Access

**Description:**
ORM (pvz.: JPA, Entity Framework) ir Data Mapper (pvz. MyBatis, LINQ) technologijos turi būti naudojamos ten, kur prasminga (nekenkia našumui, gerina plečiamumą/lankstumą). Jokia duomenų bazės transakcija (taip pat ir lentelės įrašų rakinimas – locking) neturi apimti interakcijos su naudotoju (pvz.: pradedame transakciją, laukiame kol naudotojas užpildys Web formą, pabaigiame transakciją – labai blogai!). DB transakcija turi prasidėti ir pasibaigti vienos ir tos pačios HTTP užklausos (request) metu (nesvarbu, ar tai AJAX užklausa, ar ne):
- Sessions And Transactions

**Implementation:**
JPA entities via Spring Data, and every transaction opens and closes inside one HTTP request.

## JPA entities

**File:** [backend/src/main/java/com/riskmonitor/entity/Risk.java](../backend/src/main/java/com/riskmonitor/entity/Risk.java)
**Lines:** 21-27, 77-79

```java
@Entity
@Table(name = "risk")
public class Risk {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;
    ...
    @Version
    @Column(name = "version")
    private Long version;
}
```

**File:** [backend/src/main/java/com/riskmonitor/entity/RiskValue.java](../backend/src/main/java/com/riskmonitor/entity/RiskValue.java)
**Lines:** 29-38, 49-51

`RiskValue` maps to `risk_value`, linked to `Risk` with `@ManyToOne`.

```java
public class RiskValue {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "risk_id", nullable = false)
    private Risk risk;
    ...
    @Version
    private Long version;
}
```

## Short transactions in the service layer

**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](../backend/src/main/java/com/riskmonitor/service/RiskService.java)
**Lines:** 35-41, 103-155

`@Transactional` is on the service method, so the tx opens and closes within one request, never waiting on user input.

```java
@Transactional(readOnly = true)
public Risk getRisk(UUID id, String userId) { ... }

@Transactional
public Risk updateRisk(UUID id, RiskUpdateReq req, String userId) { ... }
```

**File:** [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](../backend/src/main/java/com/riskmonitor/service/RiskValueService.java)
**Lines:** 33-37, 68-80

```java
@Transactional(readOnly = true)
public List<RiskValue> listValues(UUID riskId, String userId) { ... }

@Transactional
public RiskValue updateValue(UUID riskId, String userId, UUID valueId, UpdateReq request) { ... }
```
