package com.riskmonitor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.Instant;

// user id -> display name, so google users (no AppUser row) show a name not a raw id.
// keyed by the id string so it fits both UUIDs and google ids.
@Entity
@Table(name = "user_profile")
@Getter
public class UserProfile {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private String userId;

    @Column(name = "display_name", length = 200)
    private String displayName;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserProfile() {
        // JPA
    }

    public UserProfile(String userId, String displayName, String email) {
        this.userId = userId;
        this.displayName = displayName;
        this.email = email;
        this.updatedAt = Instant.now();
    }

    public void update(String displayName, String email) {
        this.displayName = displayName;
        this.email = email;
        this.updatedAt = Instant.now();
    }
}
