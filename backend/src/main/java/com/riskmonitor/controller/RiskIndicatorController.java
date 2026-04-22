package com.riskmonitor.controller;

import com.riskmonitor.model.RiskIndicator;
import com.riskmonitor.service.RiskIndicatorService;
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

    @GetMapping("/hello")
    public ResponseEntity<String> sayHello() {
        return ResponseEntity.ok(riskIndicatorService.getHelloMessage());
    }

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
    public ResponseEntity<RiskIndicator> createRiskIndicator(@RequestBody RiskIndicator riskIndicator) {
        RiskIndicator createdIndicator = riskIndicatorService.createRiskIndicator(riskIndicator);
        return ResponseEntity.ok(createdIndicator);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RiskIndicator> updateRiskIndicator(@PathVariable Long id, 
                                                               @RequestBody RiskIndicator riskIndicatorDetails) {
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
