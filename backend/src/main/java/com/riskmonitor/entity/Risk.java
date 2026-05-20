package com.riskmonitor.entity;
import com.riskmonitor.dto.risk.RiskStruct.RiskPeriod;
import jakarta.persistence.*;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "risk")
@Getter
public class Risk {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "time_interval_val", nullable = false)
    private Long timeIntervalValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_interval_unit", nullable = false, length = 20)
    private RiskPeriod timeIntervalUnit;

    // user defined, can be entered without strict validation, as should be read-only value (e.g., 'km/h', 'incidents')
    @Column(name = "measurement_unit", nullable = false, length = 50)
    private String measurementUnit;

    @Column(name = "lower_min_threshold", precision = 19, scale = 4)
    private BigDecimal lowerMinThreshold;

    @Column(name = "lower_mid_threshold", precision = 19, scale = 4)
    private BigDecimal lowerMidThreshold;

    @Column(name = "upper_mid_threshold", precision = 19, scale = 4)
    private BigDecimal upperMidThreshold;

    @Column(name = "upper_max_threshold", precision = 19, scale = 4)
    private BigDecimal upperMaxThreshold;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_until")
    private Instant validUntil;

    @Embedded
    private ModifyDetails modifyDetails;

    protected Risk() {
        // JPA
    }

    public Risk(
            String name,
            String category,
            String description,
            Long timeIntervalValue,
            RiskPeriod timeIntervalUnit,
            String measurementUnit,
            BigDecimal lowerMinThreshold,
            BigDecimal lowerMidThreshold,
            BigDecimal upperMidThreshold,
            BigDecimal upperMaxThreshold,
            Instant validFrom,
            Instant validUntil
    ) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.category = category;
        this.description = description;
        this.timeIntervalValue = timeIntervalValue;
        this.timeIntervalUnit = timeIntervalUnit;
        this.measurementUnit = measurementUnit;
        this.lowerMinThreshold = lowerMinThreshold;
        this.lowerMidThreshold = lowerMidThreshold;
        this.upperMidThreshold = upperMidThreshold;
        this.upperMaxThreshold = upperMaxThreshold;
        this.validFrom = validFrom.truncatedTo(ChronoUnit.SECONDS);
        this.validUntil = validUntil == null ? null : validUntil.truncatedTo(ChronoUnit.SECONDS);
        this.modifyDetails = ModifyDetails.createDetails();
        validateThresholds();
        validateValidityPeriod();
    }

    public void update(UpdateRiskFields modifiedRisk) {
        this.name = modifiedRisk.name();
        this.category = modifiedRisk.category();
        this.description = modifiedRisk.description();
        this.timeIntervalValue = modifiedRisk.timeIntervalValue();
        this.timeIntervalUnit = modifiedRisk.timeIntervalUnit();
        this.measurementUnit = modifiedRisk.measurementUnit();
        this.lowerMinThreshold = modifiedRisk.lowerMinThreshold();
        this.lowerMidThreshold = modifiedRisk.lowerMidThreshold();
        this.upperMidThreshold = modifiedRisk.upperMidThreshold();
        this.upperMaxThreshold = modifiedRisk.upperMaxThreshold();
        this.validFrom = modifiedRisk.validFrom().truncatedTo(ChronoUnit.SECONDS);
        this.validUntil = modifiedRisk.validUntil() == null
                ? null
                : modifiedRisk.validUntil().truncatedTo(ChronoUnit.SECONDS);
        validateThresholds();
        validateValidityPeriod();
        this.modifyDetails.update();
    }

    public void validateThresholds() {
        boolean upperBandDefined = upperMidThreshold != null && upperMaxThreshold != null;
        boolean lowerBandDefined = lowerMidThreshold != null && lowerMinThreshold != null;
        boolean upperBandHalfSet = (upperMidThreshold == null) != (upperMaxThreshold == null);
        boolean lowerBandHalfSet = (lowerMidThreshold == null) != (lowerMinThreshold == null);

        if (upperBandHalfSet) {
            throw new IllegalArgumentException(
                    "Upper band is incomplete: both upperMidThreshold and " +
                            "upperMaxThreshold must be provided together");
        }
        if (lowerBandHalfSet) {
            throw new IllegalArgumentException(
                    "Lower band is incomplete: both lowerMidThreshold and " +
                            "lowerMinThreshold must be provided together");
        }
        if (!upperBandDefined && !lowerBandDefined) {
            throw new IllegalArgumentException(
                    "Risk must have at least one band defined (upper, lower, or both)");
        }

        if (upperBandDefined && upperMidThreshold.compareTo(upperMaxThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "upperMidThreshold must be less than upperMaxThreshold");
        }
        if (lowerBandDefined && lowerMinThreshold.compareTo(lowerMidThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "lowerMinThreshold must be less than lowerMidThreshold");
        }
        if (upperBandDefined && lowerBandDefined
                && lowerMidThreshold.compareTo(upperMidThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "lowerMidThreshold must be less than upperMidThreshold");
        }
    }

    public void validateValidityPeriod() {
        if (validFrom == null) {
            throw new IllegalArgumentException("validFrom is required");
        }
        if (validUntil != null && !validUntil.isAfter(validFrom)) {
            throw new IllegalArgumentException("validUntil must be after validFrom");
        }
    }

    public record UpdateRiskFields(
            String name,
            String category,
            String description,
            Long timeIntervalValue,
            RiskPeriod timeIntervalUnit,
            String measurementUnit,
            BigDecimal lowerMinThreshold,
            BigDecimal lowerMidThreshold,
            BigDecimal upperMidThreshold,
            BigDecimal upperMaxThreshold,
            Instant validFrom,
            Instant validUntil
    ) {}
}
