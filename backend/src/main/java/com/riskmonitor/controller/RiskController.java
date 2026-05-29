package com.riskmonitor.controller;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.dto.risk.RiskStruct.RiskResp;
import com.riskmonitor.dto.risk.RiskStruct.RiskUpdateReq;
import com.riskmonitor.service.RiskService;
import com.riskmonitor.web.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
public class RiskController {

    private static final Logger log = LoggerFactory.getLogger(RiskController.class);
    private final RiskService riskService;

    @GetMapping("/{id}")
    public RiskResp getRisk(@PathVariable UUID id, @CurrentUserId String userId) {
        return RiskResp.from(riskService.getRisk(id, userId));
    }

    @GetMapping
    public CompletableFuture<List<RiskResp>> listRisks(
            @CurrentUserId String userId,
            @RequestParam(required = false) UUID teamId
    ) {
        return riskService.listRisks(userId, teamId);
    }

    @PostMapping
    public ResponseEntity<RiskResp> createRisk(@Valid @RequestBody RiskCreateReq request, @CurrentUserId String userId) {
        var created = riskService.createRisk(request, userId);
        log.info("Created risk {} '{}'", created.getId(), created.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(RiskResp.from(created));
    }

    @PutMapping("/{id}")
    public RiskResp updateRisk(@PathVariable UUID id, @Valid @RequestBody RiskUpdateReq request, @CurrentUserId String userId) {
        var updated = riskService.updateRisk(id, request, userId);
        log.info("Updated risk {} '{}'", updated.getId(), updated.getName());
        return RiskResp.from(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRisk(@PathVariable UUID id, @CurrentUserId String userId) {
        riskService.deleteRisk(id, userId);
        log.info("Deleted risk {}", id);
    }


}
