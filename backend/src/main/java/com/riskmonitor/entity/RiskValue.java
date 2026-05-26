package com.riskmonitor.entity;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "risk_value",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_risk_value_risk_id_recorded_at",
                columnNames = {"risk_id", "recorded_at"}
        )
)
@Getter
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

    protected RiskValue() {
        // JPA
    }

    public RiskValue(Risk risk, BigDecimal value, Instant recordedAt) {
        this.id = UUID.randomUUID();
        this.risk = risk;
        this.value = value;
        this.recordedAt = recordedAt;
        this.modifyDetails = ModifyDetails.createDetails();
    }

    public void update(BigDecimal value, Instant recordedAt) {
        this.value = value;
        this.recordedAt = recordedAt;
        this.modifyDetails.update();
    }
}
