package com.riskmonitor.service;

import com.riskmonitor.dto.team.TeamStruct.CreateTeamRequest;
import com.riskmonitor.dto.team.TeamStruct.JoinTeamRequest;
import com.riskmonitor.entity.AppUser;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.entity.Team;
import com.riskmonitor.entity.TeamMember;
import com.riskmonitor.entity.TeamRole;
import com.riskmonitor.entity.UserProfile;
import com.riskmonitor.repository.AppUserRepository;
import com.riskmonitor.repository.TeamMemberRepository;
import com.riskmonitor.repository.TeamRepository;
import com.riskmonitor.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamService {

    private static final String CODE_PREFIX = "RM-";
    private static final char[] CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final AppUserRepository appUserRepository;
    private final UserProfileRepository userProfileRepository;

    // local accounts resolve to their AppUser username; otherwise (google users) use the
    // display name the client registered; only fall back to the raw id if nothing is known.
    @Transactional(readOnly = true)
    public String resolveDisplayName(String userId) {
        try {
            var local = appUserRepository.findById(UUID.fromString(userId)).map(AppUser::getUsername);
            if (local.isPresent()) {
                return local.get();
            }
        } catch (IllegalArgumentException ignored) {
            // userId is not a UUID (e.g. a google id); fall through to the profile lookup
        }
        return userProfileRepository.findById(userId)
                .map(UserProfile::getDisplayName)
                .filter(name -> name != null && !name.isBlank())
                .orElse(userId);
    }

    @Transactional
    public TeamMember createTeam(CreateTeamRequest request, String userId) {
        String inviteCode = generateUniqueInviteCode();
        Team team = teamRepository.save(new Team(request.name().trim(), inviteCode, userId));
        return teamMemberRepository.save(new TeamMember(team, userId, TeamRole.OWNER));
    }

    @Transactional
    public List<TeamMember> getMyTeams(String userId) {
        List<TeamMember> memberships = teamMemberRepository.findAllByUserIdOrderByTeam_NameAsc(userId);

        // make sure everyone has their own "My Risks" team
        boolean hasPersonal = memberships.stream().anyMatch(m -> m.getTeam().isPersonal());
        if (!hasPersonal) {
            Team personal = teamRepository.save(
                    new Team("My Risks", generateUniqueInviteCode(), userId, true));
            memberships = new ArrayList<>(memberships);
            memberships.add(teamMemberRepository.save(new TeamMember(personal, userId, TeamRole.OWNER)));
        }

        // personal team first, then the rest by name
        return memberships.stream()
                .sorted(Comparator
                        .comparing((TeamMember m) -> m.getTeam().isPersonal()).reversed()
                        .thenComparing(m -> m.getTeam().getName(), String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public TeamMember joinTeam(JoinTeamRequest request, String userId) {
        String inviteCode = normalizeInviteCode(request.inviteCode());
        Team team = teamRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite code."));

        if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), userId)) {
            throw new IllegalArgumentException("User already joined this team.");
        }

        return teamMemberRepository.save(new TeamMember(team, userId, TeamRole.MEMBER));
    }

    @Transactional(readOnly = true)
    public List<TeamMember> getTeamMembers(UUID teamId, String userId) {
        assertUserIsTeamMember(teamId, userId);
        return teamMemberRepository.findAllByTeamIdOrderByJoinedAtAsc(teamId);
    }

    @Transactional(readOnly = true)
    public Team getTeamForMember(UUID teamId, String userId) {
        if (teamId == null) {
            throw new IllegalArgumentException("No active team selected.");
        }
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));
        assertUserIsTeamMember(teamId, userId);
        return team;
    }

    @Transactional(readOnly = true)
    public void assertUserIsTeamMember(UUID teamId, String userId) {
        if (teamId == null) {
            throw new IllegalArgumentException("No active team selected.");
        }
        if (!teamRepository.existsById(teamId)) {
            throw new IllegalArgumentException("Team not found: " + teamId);
        }
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new IllegalArgumentException("You are not a member of this team.");
        }
    }

    @Transactional(readOnly = true)
    public void assertUserIsTeamOwner(UUID teamId, String userId) {
        assertUserIsTeamMember(teamId, userId);
        if (!teamMemberRepository.existsByTeamIdAndUserIdAndRole(teamId, userId, TeamRole.OWNER)) {
            throw new IllegalArgumentException("Only team owners can delete risks.");
        }
    }

    @Transactional(readOnly = true)
    public TeamRole getUserRoleInTeam(UUID teamId, String userId) {
        return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .map(TeamMember::getRole)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this team."));
    }

    @Transactional(readOnly = true)
    public void assertUserCanAccessRisk(Risk risk, String userId) {
        if (risk.getTeam() == null) {
            throw new IllegalArgumentException("Risk is not assigned to a team.");
        }
        assertUserIsTeamMember(risk.getTeam().getId(), userId);
    }

    @Transactional(readOnly = true)
    public void assertUserCanDeleteRisk(Risk risk, String userId) {
        if (risk.getTeam() == null) {
            throw new IllegalArgumentException("Risk is not assigned to a team.");
        }
        assertUserIsTeamOwner(risk.getTeam().getId(), userId);
    }

    private String generateUniqueInviteCode() {
        for (int attempt = 0; attempt < 20; attempt += 1) {
            String code = CODE_PREFIX + randomCodeSuffix();
            if (!teamRepository.existsByInviteCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate a unique invite code.");
    }

    private String randomCodeSuffix() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i += 1) {
            builder.append(CODE_ALPHABET[RANDOM.nextInt(CODE_ALPHABET.length)]);
        }
        return builder.toString();
    }

    private String normalizeInviteCode(String inviteCode) {
        return inviteCode.trim().toUpperCase(Locale.ROOT);
    }
}
