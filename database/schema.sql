-- Graph Builder Database Schema
-- MySQL 5.6 compatible (no JSON columns)
-- Table prefix: graph_builder_
-- Naming conventions: gbc_id, gbds_id, gbc_sid (state id), created_ts, updated_ts

-- Data sources table (stores how to fetch data for graphs)
CREATE TABLE IF NOT EXISTS graph_builder_data_sources (
    gbds_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    source_type ENUM('sql', 'api', 'callback', 'static') NOT NULL,

    -- SQL source
    sql_query TEXT NULL,

    -- API source
    api_url VARCHAR(2048) NULL,
    api_method ENUM('GET', 'POST') NULL DEFAULT 'GET',
    api_headers TEXT NULL,              -- JSON string
    api_body TEXT NULL,
    api_data_path VARCHAR(255) NULL,    -- Dot notation path to data in response

    -- Callback source (PHP class/method reference)
    callback_class VARCHAR(255) NULL,
    callback_method VARCHAR(100) NULL,
    callback_params TEXT NULL,          -- JSON string

    -- Static data
    static_data LONGTEXT NULL,          -- JSON string (can be large)

    -- Optional data transformer (to modify data before charting)
    transformer_class VARCHAR(255) NULL,
    transformer_method VARCHAR(100) NULL,

    cache_ttl INT UNSIGNED DEFAULT 0,
    created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Main graph configurations table
CREATE TABLE IF NOT EXISTS graph_builder_configs (
    gbc_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    chart_type ENUM('line', 'bar', 'pie') NOT NULL,

    config_base TEXT NOT NULL,          -- JSON string: title, legend, colors, animation
    config_type TEXT NOT NULL,          -- JSON string: type-specific settings
    data_mapping TEXT NOT NULL,         -- JSON string: xAxis, yAxis[], nameField, valueField

    gbds_id INT UNSIGNED NOT NULL,      -- FK to data sources

    gbc_sid TINYINT(1) DEFAULT 1,       -- state id (1=active, 0=inactive)
    created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_ts TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY idx_slug (slug),
    INDEX idx_state (gbc_sid),
    FOREIGN KEY (gbds_id) REFERENCES graph_builder_data_sources(gbds_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
