-- Sample Risk Indicators for demonstration
INSERT INTO risk_indicators (name, description, current_value, yellow_threshold, red_threshold, risk_level) 
VALUES ('Employee Turnover Rate', 'Percentage of employees leaving annually', 25, 50, 100, 'GREEN');

INSERT INTO risk_indicators (name, description, current_value, yellow_threshold, red_threshold, risk_level) 
VALUES ('System Uptime', 'Percentage of system availability', 98.5, 95, 90, 'GREEN');

INSERT INTO risk_indicators (name, description, current_value, yellow_threshold, red_threshold, risk_level) 
VALUES ('Budget Overrun', 'Project budget usage percentage', 65, 80, 100, 'YELLOW');

INSERT INTO risk_indicators (name, description, current_value, yellow_threshold, red_threshold, risk_level) 
VALUES ('Security Incidents', 'Number of security incidents per month', 15, 10, 25, 'RED');

INSERT INTO risk_indicators (name, description, current_value, yellow_threshold, red_threshold, risk_level) 
VALUES ('Customer Satisfaction Score', 'CSAT score out of 100', 82, 70, 50, 'GREEN');
