package com.riskmonitor.controller;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.riskmonitor.dto.riskvalue.RiskValueStruct.CreateBatchReq;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.PageResp;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.Resp;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.UpdateReq;
import com.riskmonitor.service.RiskValueService;
import com.riskmonitor.web.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/risks/{riskId}/values")
@RequiredArgsConstructor
public class RiskValueController {

    private static final Logger log = LoggerFactory.getLogger(RiskValueController.class);
    private final RiskValueService riskValueService;

    @GetMapping
    public PageResp<Resp> listValues(
            @PathVariable UUID riskId,
            @CurrentUserId String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "recordedAt,desc") String sort
    ) {
        return PageResp.from(riskValueService.listValues(riskId, userId, toPageable(page, size, sort)));
    }

    @PostMapping
    public ResponseEntity<List<Resp>> createValues(
            @PathVariable UUID riskId,
            @CurrentUserId String userId,
            @Valid @RequestBody CreateBatchReq request
    ) {
        var created = riskValueService.createValues(riskId, userId, request);
        log.info("Created {} risk values for risk {}", created.size(), riskId);
        var body = created.stream().map(Resp::from).toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PutMapping("/{valueId}")
    public Resp updateValue(
            @PathVariable UUID riskId,
            @PathVariable UUID valueId,
            @CurrentUserId String userId,
            @Valid @RequestBody UpdateReq request
    ) {
        var updated = riskValueService.updateValue(riskId, userId, valueId, request);
        log.info("Updated risk value {} for risk {}", valueId, riskId);
        return Resp.from(updated);
    }

    @DeleteMapping("/{valueId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteValue(
            @PathVariable UUID riskId,
            @PathVariable UUID valueId,
            @CurrentUserId String userId
    ) {
        riskValueService.deleteValue(riskId, userId, valueId);
        log.info("Deleted risk value {} for risk {}", valueId, riskId);
    }

    private Pageable toPageable(int page, int size, String sort) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        String[] parts = sort.split(",", 2);
        String property = switch (parts[0]) {
            case "date", "recordedAt" -> "recordedAt";
            case "value" -> "value";
            default -> throw new IllegalArgumentException("Unsupported sort field: " + parts[0]);
        };
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1])
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return PageRequest.of(safePage, safeSize, Sort.by(direction, property));
    }
}
