# Security: Protection Against SQL Injection Attacks

Requirement: The system must be protected against SQL injection attacks:

* JPA queries with parameters
* JDBC prepared statements

---

## JPA Queries With Parameters

### Backend: Spring Data JPA Repository Methods

**File:** [backend/src/main/java/com/riskmonitor/repository/RiskRepository.java](backend/src/main/java/com/riskmonitor/repository/RiskRepository.java)

The backend uses Spring Data JPA repository methods instead of dynamically concatenated SQL strings. Repository method parameters are automatically bound as query parameters by Hibernate and JDBC, which prevents SQL injection attacks.

Concrete source lines:

* parameterized ownership query:
  `findByIdAndGoogleUserId(UUID id, String googleUserId)`
* parameterized user-scoped list query:
  `findAllByGoogleUserId(String googleUserId, Sort sort)`

Example:

```java
public interface RiskRepository extends JpaRepository<Risk, UUID> {

    Optional<Risk> findByIdAndGoogleUserId(UUID id, String googleUserId);

    List<Risk> findAllByGoogleUserId(String googleUserId, Sort sort);
}
```

These repository methods are internally translated into parameterized SQL queries similar to:

```sql
SELECT *
FROM risk
WHERE id = ?
AND google_user_id = ?
```

Because parameters are bound separately from SQL syntax, malicious input is treated as plain data instead of executable SQL.

---

### Backend: Parameterized Risk Value Queries

**File:** [backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java)

Risk value lookups also use Spring Data JPA derived query methods with parameter binding.

Concrete source line:

* parameterized lookup:
  `findByRiskIdOrderByRecordedAtAsc(UUID riskId)`

Example:

```java
public interface RiskValueRepository extends JpaRepository<RiskValue, UUID> {

    List<RiskValue> findByRiskIdOrderByRecordedAtAsc(UUID riskId);
}
```

The `riskId` parameter is safely bound using JDBC prepared statement parameters rather than inserted into SQL text directly.

---

## JDBC Prepared Statements

### Hibernate and Spring Data JPA Prepared Statement Usage

Spring Data JPA internally uses Hibernate ORM and JDBC prepared statements for repository method execution.

Instead of dynamically constructing SQL such as:

```sql
SELECT * FROM risk WHERE google_user_id = 'userInput'
```

the framework generates prepared statements with placeholders:

```sql
SELECT * FROM risk WHERE google_user_id = ?
```

and safely binds values separately.

This ensures that user-provided values cannot alter SQL query structure or inject executable SQL fragments.

---

## Additional Input Safety

### Strongly Typed Request Parameters

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskController.java](backend/src/main/java/com/riskmonitor/controller/RiskController.java)

Path variables and request DTOs use strongly typed Java values and validation annotations.

Example:

```java
@GetMapping("/{id}")
public RiskResp getRisk(
        @PathVariable UUID id,
        @RequestHeader("X-Google-User-Id") String googleUserId
)
```

The `UUID` type prevents malformed identifier input from reaching database queries.
