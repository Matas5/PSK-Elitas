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

    public record RiskCreateReq(

            @NotBlank @Size(min = 3, max = 100)
            String name,

            @Size(max = 1000)
            String description,

            @NotNull @Positive @Max(315_360_000L)
            Long intervalSeconds,

            @NotBlank @Size(max = 20)
            String unit,

            @NotNull
            Boolean hasUpperBounds,

            @NotNull
            Boolean hasLowerBounds,

            BigDecimal lowerMaxThreshold,
            BigDecimal lowerMediumThreshold,
            BigDecimal upperMediumThreshold,
            BigDecimal upperMaxThreshold,

            @NotNull
            Instant validFrom,

            Instant validUntil
    ) {}

    public record RiskUpdateReq(

            @NotBlank @Size(min = 3, max = 100)
            String name,

            @Size(max = 1000)
            String description,

            @NotNull @Positive @Max(315_360_000L)
            Long intervalSeconds,

            @NotBlank @Size(max = 20)
            String unit,

            @NotNull
            Boolean hasUpperBounds,

            @NotNull
            Boolean hasLowerBounds,

            BigDecimal lowerMaxThreshold,
            BigDecimal lowerMediumThreshold,
            BigDecimal upperMediumThreshold,
            BigDecimal upperMaxThreshold,

            Instant validUntil
    ) {}

    public record RiskResp(
            UUID id,
            String name,
            String description,
            Long intervalSeconds,
            String unit,
            BigDecimal lowerMaxThreshold,
            BigDecimal lowerMediumThreshold,
            BigDecimal upperMediumThreshold,
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
                    risk.getDescription(),
                    risk.getIntervalSeconds(),
                    risk.getUnit(),
                    risk.getLowerMaxThreshold(),
                    risk.getLowerMediumThreshold(),
                    risk.getUpperMediumThreshold(),
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