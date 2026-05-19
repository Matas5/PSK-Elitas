package com.riskmonitor.entity;
import com.riskmonitor.dto.risk.RiskStruct.RiskPeriod;
import jakarta.persistence.*;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.Instant;
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

    @Column(name = "lower_max_threshold", precision = 19, scale = 4)
    private BigDecimal lowerMaxThreshold;

    @Column(name = "lower_medium_threshold", precision = 19, scale = 4)
    private BigDecimal lowerMediumThreshold;

    @Column(name = "upper_medium_threshold", precision = 19, scale = 4)
    private BigDecimal upperMediumThreshold;

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
            BigDecimal lowerMaxThreshold,
            BigDecimal lowerMediumThreshold,
            BigDecimal upperMediumThreshold,
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
        this.lowerMaxThreshold = lowerMaxThreshold;
        this.lowerMediumThreshold = lowerMediumThreshold;
        this.upperMediumThreshold = upperMediumThreshold;
        this.upperMaxThreshold = upperMaxThreshold;
        this.validFrom = validFrom;
        this.validUntil = validUntil;
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
        this.lowerMaxThreshold = modifiedRisk.lowerMaxThreshold();
        this.lowerMediumThreshold = modifiedRisk.lowerMediumThreshold();
        this.upperMediumThreshold = modifiedRisk.upperMediumThreshold();
        this.upperMaxThreshold = modifiedRisk.upperMaxThreshold();
        this.validFrom = modifiedRisk.validFrom();
        this.validUntil = modifiedRisk.validUntil();
        validateThresholds();
        validateValidityPeriod();
        this.modifyDetails.update();
    }

    public void validateThresholds() {
        boolean upperBandDefined = upperMediumThreshold != null && upperMaxThreshold != null;
        boolean lowerBandDefined = lowerMediumThreshold != null && lowerMaxThreshold != null;
        boolean upperBandHalfSet = (upperMediumThreshold == null) != (upperMaxThreshold == null);
        boolean lowerBandHalfSet = (lowerMediumThreshold == null) != (lowerMaxThreshold == null);

        if (upperBandHalfSet) {
            throw new IllegalArgumentException(
                    "Upper band is incomplete: both upperMediumThreshold and " +
                            "upperMaxThreshold must be provided together");
        }
        if (lowerBandHalfSet) {
            throw new IllegalArgumentException(
                    "Lower band is incomplete: both lowerMediumThreshold and " +
                            "lowerMaxThreshold must be provided together");
        }
        if (!upperBandDefined && !lowerBandDefined) {
            throw new IllegalArgumentException(
                    "Risk must have at least one band defined (upper, lower, or both)");
        }

        if (upperBandDefined && upperMediumThreshold.compareTo(upperMaxThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "upperMediumThreshold must be less than upperMaxThreshold");
        }
        if (lowerBandDefined && lowerMaxThreshold.compareTo(lowerMediumThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "lowerMaxThreshold must be less than lowerMediumThreshold");
        }
        if (upperBandDefined && lowerBandDefined
                && lowerMediumThreshold.compareTo(upperMediumThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "lowerMediumThreshold must be less than upperMediumThreshold");
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
            BigDecimal lowerMaxThreshold,
            BigDecimal lowerMediumThreshold,
            BigDecimal upperMediumThreshold,
            BigDecimal upperMaxThreshold,
            Instant validFrom,
            Instant validUntil
    ) {}
}
