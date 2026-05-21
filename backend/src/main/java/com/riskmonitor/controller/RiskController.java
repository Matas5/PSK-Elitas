package com.riskmonitor.controller;

import com.riskmonitor.dto.risk.RiskStruct.RiskResp;
import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.dto.risk.RiskStruct.RiskUpdateReq;
import com.riskmonitor.service.RiskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
@Slf4j
public class RiskController {

    private final RiskService riskService;

    @GetMapping("/{id}")
    public RiskResp getRisk(@PathVariable UUID id, @RequestHeader("X-Google-User-Id") String googleUserId) {
        return RiskResp.from(riskService.getRisk(id, googleUserId));
    }

    @GetMapping
    public List<RiskResp> listRisks(@RequestHeader("X-Google-User-Id") String googleUserId) {
        return riskService.listRisks(googleUserId).stream()
                .map(RiskResp::from)
                .toList();
    }

    @PostMapping
    public ResponseEntity<RiskResp> createRisk(@Valid @RequestBody RiskCreateReq request, @RequestHeader("X-Google-User-Id") String googleUserId) {
        var created = riskService.createRisk(request, googleUserId);
        log.info("Created risk {} '{}'", created.getId(), created.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(RiskResp.from(created));
    }

    @PutMapping("/{id}")
    public RiskResp updateRisk(@PathVariable UUID id, @Valid @RequestBody RiskUpdateReq request, @RequestHeader("X-Google-User-Id") String googleUserId) {
        var updated = riskService.updateRisk(id, request, googleUserId);
        log.info("Updated risk {} '{}'", updated.getId(), updated.getName());
        return RiskResp.from(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRisk(@PathVariable UUID id, @RequestHeader("X-Google-User-Id") String googleUserId) {
        riskService.deleteRisk(id, googleUserId);
        log.info("Deleted risk {}", id);
    }

    
}
