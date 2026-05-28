package com.riskmonitor.repository;

import com.riskmonitor.entity.Risk;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RiskRepository extends JpaRepository<Risk, UUID> {
    Optional<Risk> findByIdAndUserId(UUID id, String userId);

    List<Risk> findAllByUserId(String userId, Sort sort);

    List<Risk> findAllByTeamId(UUID teamId, Sort sort);
}
