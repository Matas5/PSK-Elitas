package com.riskmonitor.repository;

import com.riskmonitor.entity.TeamMember;
import com.riskmonitor.entity.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    List<TeamMember> findAllByUserIdOrderByTeam_NameAsc(String userId);

    List<TeamMember> findAllByTeamIdOrderByJoinedAtAsc(UUID teamId);

    Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, String userId);

    boolean existsByTeamIdAndUserId(UUID teamId, String userId);

    boolean existsByTeamIdAndUserIdAndRole(UUID teamId, String userId, TeamRole role);
}
