package com.riskmonitor.controller;

import com.riskmonitor.dto.risk.RiskStruct.RiskResp;
import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.dto.risk.RiskStruct.RiskUpdateReq;
import com.riskmonitor.service.RiskService;
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
    public RiskResp getRisk(@PathVariable UUID id) {
        return RiskResp.from(riskService.getRisk(id));
    }

    @GetMapping
    public List<RiskResp> listRisks() {
        return riskService.listRisks().stream()
                .map(RiskResp::from)
                .toList();
    }

    @PostMapping
    public ResponseEntity<RiskResp> createRisk(@Valid @RequestBody RiskCreateReq request) {
        var created = riskService.createRisk(request);
        log.info("Created risk {} '{}'", created.getId(), created.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(RiskResp.from(created));
    }

    @PutMapping("/{id}")
    public RiskResp updateRisk(@PathVariable UUID id, @Valid @RequestBody RiskUpdateReq request) {
        var updated = riskService.updateRisk(id, request);
        log.info("Updated risk {} '{}'", updated.getId(), updated.getName());
        return RiskResp.from(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRisk(@PathVariable UUID id) {
        riskService.deleteRisk(id);
        log.info("Deleted risk {}", id);
    }
}
