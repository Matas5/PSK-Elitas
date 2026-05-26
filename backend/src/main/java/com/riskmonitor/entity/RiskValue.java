package com.riskmonitor.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

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

    // Getters
    public UUID getId() { return id; }
    public Risk getRisk() { return risk; }
    public BigDecimal getValue() { return value; }
    public Instant getRecordedAt() { return recordedAt; }
    public ModifyDetails getModifyDetails() { return modifyDetails; }
    public Long getVersion() { return version; }
}
