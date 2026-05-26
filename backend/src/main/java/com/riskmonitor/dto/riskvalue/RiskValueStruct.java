package com.riskmonitor.dto.riskvalue;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.riskmonitor.entity.RiskValue;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class RiskValueStruct {

    private RiskValueStruct() {
    }

    public record EntryReq(
            @NotNull
            BigDecimal value,

            @NotNull
            Instant recordedAt
    ) {}

    public record CreateBatchReq(
            @NotEmpty
            @Size(max = 500)
            @Valid
            List<EntryReq> entries
    ) {}

    public record UpdateReq(
            @NotNull
            BigDecimal value,

            @NotNull
            Instant recordedAt
    ) {}

    public record Resp(
            UUID id,
            UUID riskId,
            BigDecimal value,
            Instant recordedAt,
            String createdBy,
            Instant createdAt,
            Long version
    ) {
        public static Resp from(RiskValue riskValue) {
            var modifyDetails = riskValue.getModifyDetails();
            return new Resp(
                    riskValue.getId(),
                    riskValue.getRisk().getId(),
                    riskValue.getValue(),
                    riskValue.getRecordedAt(),
                    modifyDetails.getCreatedBy(),
                    modifyDetails.getCreatedAt(),
                    riskValue.getVersion()
            );
        }
    }
}
