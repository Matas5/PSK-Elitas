package com.riskmonitor.controller;

import com.riskmonitor.dto.risk.RiskStruct.RiskResp;
import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.service.RiskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
@Slf4j
public class RiskController {

    private final RiskService riskService;

    @PostMapping
    public ResponseEntity<RiskResp> createRisk(@Valid @RequestBody RiskCreateReq request) {
        var created = riskService.createRisk(request);
        log.info("Created risk {} '{}'", created.getId(), created.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(RiskResp.from(created));
    }
}