package com.riskmonitor.controller;

import com.riskmonitor.model.RiskIndicator;
import com.riskmonitor.service.RiskIndicatorService;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/risk-indicators")
@CrossOrigin(origins = "http://localhost:3000")
public class RiskIndicatorController {

    @Autowired
    private RiskIndicatorService riskIndicatorService;

    @GetMapping
    public ResponseEntity<List<RiskIndicator>> getAllRiskIndicators() {
        List<RiskIndicator> indicators = riskIndicatorService.getAllRiskIndicators();
        return ResponseEntity.ok(indicators);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RiskIndicator> getRiskIndicatorById(@PathVariable Long id) {
        Optional<RiskIndicator> indicator = riskIndicatorService.getRiskIndicatorById(id);
        return indicator.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequestBody(description = "Risk Indicator to create", 
                 content = @Content(mediaType = "application/json",
                                   examples = @ExampleObject(
                                       name = "Create New Risk Indicator",
                                       value = "{\"name\": \"Data Breach Risk\", \"description\": \"Failed authentication attempts\", \"currentValue\": 3, \"yellowThreshold\": 5, \"redThreshold\": 10}"
                                   )))
    public ResponseEntity<RiskIndicator> createRiskIndicator(@Valid @org.springframework.web.bind.annotation.RequestBody RiskIndicator riskIndicator) {
        RiskIndicator createdIndicator = riskIndicatorService.createRiskIndicator(riskIndicator);
        return ResponseEntity.ok(createdIndicator);
    }

    @PutMapping("/{id}")
    @RequestBody(description = "Updated Risk Indicator data", 
                 content = @Content(mediaType = "application/json",
                                   examples = @ExampleObject(
                                       name = "Update Risk Indicator",
                                       value = "{\"name\": \"Data Breach Risk\", \"description\": \"Failed authentication attempts\", \"currentValue\": 8, \"yellowThreshold\": 5, \"redThreshold\": 10}"
                                   )))
    public ResponseEntity<RiskIndicator> updateRiskIndicator(@PathVariable Long id, 
                                                               @Valid @org.springframework.web.bind.annotation.RequestBody RiskIndicator riskIndicatorDetails) {
        RiskIndicator updatedIndicator = riskIndicatorService.updateRiskIndicator(id, riskIndicatorDetails);
        if (updatedIndicator != null) {
            return ResponseEntity.ok(updatedIndicator);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRiskIndicator(@PathVariable Long id) {
        riskIndicatorService.deleteRiskIndicator(id);
        return ResponseEntity.noContent().build();
    }
}
