package com.riskmonitor.service;

import com.riskmonitor.model.RiskIndicator;
import com.riskmonitor.repository.RiskIndicatorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RiskIndicatorService {

    @Autowired
    private RiskIndicatorRepository riskIndicatorRepository;

    public List<RiskIndicator> getAllRiskIndicators() {
        return riskIndicatorRepository.findAll();
    }

    public Optional<RiskIndicator> getRiskIndicatorById(Long id) {
        return riskIndicatorRepository.findById(id);
    }

    public RiskIndicator createRiskIndicator(RiskIndicator riskIndicator) {
        riskIndicator.setRiskLevel(riskIndicator.calculateRiskLevel());
        return riskIndicatorRepository.save(riskIndicator);
    }

    public RiskIndicator updateRiskIndicator(Long id, RiskIndicator riskIndicatorDetails) {
        Optional<RiskIndicator> optionalRiskIndicator = riskIndicatorRepository.findById(id);
        if (optionalRiskIndicator.isPresent()) {
            RiskIndicator riskIndicator = optionalRiskIndicator.get();
            riskIndicator.setName(riskIndicatorDetails.getName());
            riskIndicator.setDescription(riskIndicatorDetails.getDescription());
            riskIndicator.setCurrentValue(riskIndicatorDetails.getCurrentValue());
            riskIndicator.setYellowThreshold(riskIndicatorDetails.getYellowThreshold());
            riskIndicator.setRedThreshold(riskIndicatorDetails.getRedThreshold());
            riskIndicator.setRiskLevel(riskIndicator.calculateRiskLevel());
            return riskIndicatorRepository.save(riskIndicator);
        }
        return null;
    }

    public void deleteRiskIndicator(Long id) {
        riskIndicatorRepository.deleteById(id);
    }
}
