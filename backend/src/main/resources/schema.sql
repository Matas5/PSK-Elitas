-- Create risk_indicators table
CREATE TABLE IF NOT EXISTS risk_indicators (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(500),
  current_value DOUBLE NOT NULL,
  yellow_threshold DOUBLE NOT NULL,
  red_threshold DOUBLE NOT NULL,
  risk_level VARCHAR(50)
);
