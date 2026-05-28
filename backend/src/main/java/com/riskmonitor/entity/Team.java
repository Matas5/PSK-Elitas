package com.riskmonitor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "team", uniqueConstraints = {
        @UniqueConstraint(name = "uk_team_invite_code", columnNames = "invite_code")
})
public class Team {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "invite_code", nullable = false, length = 20)
    private String inviteCode;

    @Column(name = "owner_user_id", nullable = false, length = 100)
    private String ownerUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Team() {
        // JPA
    }

    public Team(String name, String inviteCode, String ownerUserId) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.inviteCode = inviteCode;
        this.ownerUserId = ownerUserId;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getInviteCode() { return inviteCode; }
    public String getOwnerUserId() { return ownerUserId; }
    public Instant getCreatedAt() { return createdAt; }
}
