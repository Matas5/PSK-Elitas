package com.riskmonitor.controller;

import com.riskmonitor.dto.risk.RiskStruct.RiskResp;
import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.dto.risk.RiskStruct.RiskUpdateReq;
import com.riskmonitor.service.RiskService;
import com.riskmonitor.web.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    public RiskResp getRisk(@PathVariable UUID id, @CurrentUserId String userId) {
        return RiskResp.from(riskService.getRisk(id, userId));
    }

    @GetMapping
    public List<RiskResp> listRisks(@CurrentUserId String userId) {
        return riskService.listRisks(userId).stream()
                .map(RiskResp::from)
                .toList();
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
