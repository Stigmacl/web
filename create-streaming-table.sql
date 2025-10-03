-- Create streaming_config table for live streaming management
CREATE TABLE IF NOT EXISTS streaming_config (
    id INT PRIMARY KEY DEFAULT 1,
    stream_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    CONSTRAINT single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration row
INSERT INTO streaming_config (id, stream_url, is_active, updated_at)
VALUES (1, '', FALSE, NOW())
ON DUPLICATE KEY UPDATE id = 1;
