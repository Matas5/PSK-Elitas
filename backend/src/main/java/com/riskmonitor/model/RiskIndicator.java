package com.riskmonitor.model;

import jakarta.persistence.*;

@Entity
@Table(name = "risk_indicators")
public class RiskIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Double currentValue;

    @Column(nullable = false)
    private Double yellowThreshold;

    @Column(nullable = false)
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
