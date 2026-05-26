package com.riskmonitor.controller;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.riskmonitor.dto.riskvalue.RiskValueStruct.CreateBatchReq;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.Resp;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.UpdateReq;
import com.riskmonitor.service.RiskValueService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/risks/{riskId}/values")
@RequiredArgsConstructor
public class RiskValueController {

    private static final Logger log = LoggerFactory.getLogger(RiskValueController.class);
    private final RiskValueService riskValueService;

    @GetMapping
    public List<Resp> listValues(@PathVariable UUID riskId) {
        return riskValueService.listValues(riskId).stream()
                .map(Resp::from)
                .toList();
    }

    @PostMapping
    public ResponseEntity<List<Resp>> createValues(
            @PathVariable UUID riskId,
            @Valid @RequestBody CreateBatchReq request
    ) {
        var created = riskValueService.createValues(riskId, request);
        log.info("Created {} risk values for risk {}", created.size(), riskId);
        var body = created.stream().map(Resp::from).toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PutMapping("/{valueId}")
    public Resp updateValue(
            @PathVariable UUID riskId,
            @PathVariable UUID valueId,
            @Valid @RequestBody UpdateReq request
    ) {
        var updated = riskValueService.updateValue(riskId, valueId, request);
        log.info("Updated risk value {} for risk {}", valueId, riskId);
        return Resp.from(updated);
    }

    @DeleteMapping("/{valueId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteValue(@PathVariable UUID riskId, @PathVariable UUID valueId) {
        riskValueService.deleteValue(riskId, valueId);
        log.info("Deleted risk value {} for risk {}", valueId, riskId);
    }
}
