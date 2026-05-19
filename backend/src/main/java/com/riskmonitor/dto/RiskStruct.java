package com.riskmonitor.dto.risk;

import com.riskmonitor.entity.Risk;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class RiskStruct {

    private RiskStruct() {
    }

    public enum RiskPeriod {
        SECOND, MINUTE, HOUR, DAY, MONTH, QUARTER, YEAR
    }

    public record RiskCreateReq(
            @NotBlank @Size(min = 3, max = 100)
            String name,

            @NotBlank @Size(max = 100)
            String category,

            @Size(max = 1000)
            String description,

            @NotNull @Positive @Max(999L)
            Long timeIntervalValue,

            @NotNull
            RiskPeriod timeIntervalUnit,

            @NotBlank @Size(max = 50)
            String measurementUnit,

            @NotNull
            Boolean hasUpperBounds,

            @NotNull
            Boolean hasLowerBounds,

            BigDecimal lowerMinThreshold,
            BigDecimal lowerMidThreshold,
            BigDecimal upperMidThreshold,
            BigDecimal upperMaxThreshold,

            @NotNull
            Instant validFrom,

            Instant validUntil
    ) {}

    public record RiskUpdateReq(
            @NotBlank @Size(min = 3, max = 100)
            String name,

            @NotBlank @Size(max = 100)
            String category,

            @Size(max = 1000)
            String description,

            @NotNull @Positive @Max(999L)
            Long timeIntervalValue,

            @NotNull
            RiskPeriod timeIntervalUnit,

            @NotBlank @Size(max = 50)
            String measurementUnit,

            @NotNull
            Boolean hasUpperBounds,

            @NotNull
            Boolean hasLowerBounds,

            BigDecimal lowerMinThreshold,
            BigDecimal lowerMidThreshold,
            BigDecimal upperMidThreshold,
            BigDecimal upperMaxThreshold,

            @NotNull
            Instant validFrom,

            Instant validUntil
    ) {}

    public record RiskResp(
            UUID id,
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
            Instant validUntil,
            String createdBy,
            Instant createdAt,
            String modifiedBy,
            Instant modifiedAt
    ) {
        public static RiskResp from(Risk risk) {
            var modifyDetails = risk.getModifyDetails();
            return new RiskResp(
                    risk.getId(),
                    risk.getName(),
                    risk.getCategory(),
                    risk.getDescription(),
                    risk.getTimeIntervalValue(),
                    risk.getTimeIntervalUnit(),
                    risk.getMeasurementUnit(),
                    risk.getLowerMinThreshold(),
                    risk.getLowerMidThreshold(),
                    risk.getUpperMidThreshold(),
                    risk.getUpperMaxThreshold(),
                    risk.getValidFrom(),
                    risk.getValidUntil(),
                    modifyDetails.getCreatedBy(),
                    modifyDetails.getCreatedAt(),
                    modifyDetails.getModifiedBy(),
                    modifyDetails.getModifiedAt()
            );
        }
    }
}
