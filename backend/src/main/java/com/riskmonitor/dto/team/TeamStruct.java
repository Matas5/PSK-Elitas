package com.riskmonitor.dto.team;

import com.riskmonitor.entity.Team;
import com.riskmonitor.entity.TeamMember;
import com.riskmonitor.entity.TeamRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class TeamStruct {

    private TeamStruct() {
    }

    public record CreateTeamRequest(
            @NotBlank @Size(min = 2, max = 100)
            String name
    ) {}

    public record JoinTeamRequest(
            @NotBlank @Size(max = 20)
            String inviteCode
    ) {}

    public record TeamResponse(
            UUID id,
            String name,
            String inviteCode,
            TeamRole role,
            String ownerUserId,
            Instant createdAt,
            boolean personal
    ) {
        public static TeamResponse from(TeamMember member) {
            Team team = member.getTeam();
            return new TeamResponse(
                    team.getId(),
                    team.getName(),
                    team.getInviteCode(),
                    member.getRole(),
                    team.getOwnerUserId(),
                    team.getCreatedAt(),
                    team.isPersonal()
            );
        }
    }

    public record TeamMemberResponse(
            UUID id,
            String userId,
            String displayName,
            TeamRole role,
            Instant joinedAt
    ) {
        public static TeamMemberResponse from(TeamMember member, String displayName) {
            return new TeamMemberResponse(
                    member.getId(),
                    member.getUserId(),
                    displayName,
                    member.getRole(),
                    member.getJoinedAt()
            );
        }
    }
}
