package com.riskmonitor.repository;

import com.riskmonitor.model.RiskIndicator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiskIndicatorRepository extends JpaRepository<RiskIndicator, Long> {
    RiskIndicator findByName(String name);
}
