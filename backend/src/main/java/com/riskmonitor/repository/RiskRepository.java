package com.riskmonitor.repository;

import com.riskmonitor.entity.Risk;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface RiskRepository extends JpaRepository<Risk, UUID> {
}