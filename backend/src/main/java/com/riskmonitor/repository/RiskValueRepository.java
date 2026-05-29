package com.riskmonitor.repository;

import com.riskmonitor.entity.RiskValue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RiskValueRepository extends JpaRepository<RiskValue, UUID> {

    List<RiskValue> findByRiskIdOrderByRecordedAtAsc(UUID riskId);

    Page<RiskValue> findByRiskId(UUID riskId, Pageable pageable);

    Optional<RiskValue> findByIdAndRiskId(UUID id, UUID riskId);
}
