package com.riskmonitor.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "risk_indicators")
public class RiskIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Risk indicator name is required")
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    @NotNull(message = "Current value is required")
    @PositiveOrZero(message = "Current value must be positive or zero")
    private Double currentValue;

    @Column(nullable = false)
    @NotNull(message = "Yellow threshold is required")
    @PositiveOrZero(message = "Yellow threshold must be positive or zero")
    private Double yellowThreshold;

    @Column(nullable = false)
    @NotNull(message = "Red threshold is required")
    @PositiveOrZero(message = "Red threshold must be positive or zero")
    private Double redThreshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel riskLevel;

    public RiskIndicator() {}

    public RiskIndicator(String name, String description, Double currentValue, 
                         Double yellowThreshold, Double redThreshold) {
        this.name = name;
        this.description = description;
        this.currentValue = currentValue;
        this.yellowThreshold = yellowThreshold;
        this.redThreshold = redThreshold;
        this.riskLevel = calculateRiskLevel();
    }

    public RiskLevel calculateRiskLevel() {
        if (currentValue == null || redThreshold == null || yellowThreshold == null) {
            return RiskLevel.GREEN;
        }
        if (currentValue >= redThreshold) {
            return RiskLevel.RED;
        } else if (currentValue >= yellowThreshold) {
            return RiskLevel.YELLOW;
        } else {
            return RiskLevel.GREEN;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(Double currentValue) {
        this.currentValue = currentValue;
        this.riskLevel = calculateRiskLevel();
    }

    public Double getYellowThreshold() {
        return yellowThreshold;
    }

    public void setYellowThreshold(Double yellowThreshold) {
        this.yellowThreshold = yellowThreshold;
    }

    public Double getRedThreshold() {
        return redThreshold;
    }

    public void setRedThreshold(Double redThreshold) {
        this.redThreshold = redThreshold;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(RiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public enum RiskLevel {
        GREEN, YELLOW, RED
    }
}
