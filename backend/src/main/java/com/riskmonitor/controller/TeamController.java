package com.riskmonitor.controller;

import com.riskmonitor.dto.team.TeamStruct.CreateTeamRequest;
import com.riskmonitor.dto.team.TeamStruct.JoinTeamRequest;
import com.riskmonitor.dto.team.TeamStruct.TeamMemberResponse;
import com.riskmonitor.dto.team.TeamStruct.TeamResponse;
import com.riskmonitor.service.TeamService;
import com.riskmonitor.web.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(
            @CurrentUserId String userId,
            @Valid @RequestBody CreateTeamRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(TeamResponse.from(teamService.createTeam(request, userId)));
    }

    @GetMapping
    public List<TeamResponse> getMyTeams(@CurrentUserId String userId) {
        return teamService.getMyTeams(userId).stream()
                .map(TeamResponse::from)
                .toList();
    }

    @PostMapping("/join")
    public TeamResponse joinTeam(
            @CurrentUserId String userId,
            @Valid @RequestBody JoinTeamRequest request
    ) {
        return TeamResponse.from(teamService.joinTeam(request, userId));
    }

    @GetMapping("/{teamId}/members")
    public List<TeamMemberResponse> getTeamMembers(
            @CurrentUserId String userId,
            @PathVariable UUID teamId
    ) {
        return teamService.getTeamMembers(teamId, userId).stream()
                .map(m -> TeamMemberResponse.from(m, teamService.resolveDisplayName(m.getUserId())))
                .toList();
    }
}
