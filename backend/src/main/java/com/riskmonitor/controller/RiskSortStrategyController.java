package com.riskmonitor.controller;

import java.util.Collection;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.riskmonitor.service.ranking.RiskSortStrategySelector;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// read and hot-swap the active ranking strategy at runtime.
// literal path /api/risks/strategy wins over /api/risks/{id}, so no clash with risk lookup.
@RestController
@RequestMapping("/api/risks/strategy")
@RequiredArgsConstructor
@Slf4j
public class RiskSortStrategyController {

    private final RiskSortStrategySelector selector;

    @GetMapping
    public StrategyResp get() {
        return new StrategyResp(selector.getActive(), selector.available());
    }

    @PutMapping
    public StrategyResp set(@RequestParam String name) {
        selector.setActive(name);
        log.info("Risk sort strategy switched to '{}' via API", name);
        return new StrategyResp(selector.getActive(), selector.available());
    }

    public record StrategyResp(String active, Collection<String> available) {
    }
}
