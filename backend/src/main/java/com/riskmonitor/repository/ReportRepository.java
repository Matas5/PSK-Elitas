package com.riskmonitor.repository;

import com.riskmonitor.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {

    List<Report> findAllByUserIdAndTeamIdOrderByCreatedAtDesc(String userId, UUID teamId);

    Optional<Report> findByIdAndUserId(UUID id, String userId);
}
