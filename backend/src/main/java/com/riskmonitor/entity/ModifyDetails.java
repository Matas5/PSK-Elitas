package com.riskmonitor.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ModifyDetails {

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "modified_by", nullable = false, length = 100)
    private String modifiedBy;

    @Column(name = "modified_at", nullable = false)
    private Instant modifiedAt;

    protected ModifyDetails() {
        // JPA
    }

    public static ModifyDetails createDetails() {
        ModifyDetails modifyDetails = new ModifyDetails();
        Instant now = Instant.now();
        String user = AuditContext.currentUser();
        modifyDetails.createdBy = user;
        modifyDetails.createdAt = now;
        modifyDetails.modifiedBy = user;
        modifyDetails.modifiedAt = now;
        return modifyDetails;
    }

    public void update() {
        this.modifiedBy = AuditContext.currentUser();
        this.modifiedAt = Instant.now();
    }

    // Getters
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public String getModifiedBy() { return modifiedBy; }
    public Instant getModifiedAt() { return modifiedAt; }
}