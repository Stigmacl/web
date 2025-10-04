/*
  # Create Player Rankings System

  1. New Tables
    - `player_rankings`
      - `id` (int, primary key, auto increment)
      - `player_name` (varchar, player's name)
      - `server_ip` (varchar, server IP address)
      - `server_port` (int, server port)
      - `total_kills` (int, total frags/kills)
      - `total_deaths` (int, total deaths)
      - `total_score` (int, total points)
      - `kd_ratio` (decimal, kill/death ratio calculated)
      - `games_played` (int, number of times seen on server)
      - `last_seen` (datetime, last time player was seen)
      - `created_at` (timestamp, first time recorded)
      - `updated_at` (timestamp, last update time)
    
    - `ranking_snapshots`
      - `id` (int, primary key, auto increment)
      - `server_ip` (varchar, server IP)
      - `server_port` (int, server port)
      - `player_name` (varchar, player name)
      - `kills` (int, kills in this snapshot)
      - `deaths` (int, deaths in this snapshot)
      - `score` (int, score in this snapshot)
      - `ping` (int, player ping)
      - `team` (int, player team)
      - `snapshot_time` (datetime, when snapshot was taken)

  2. Indexes
    - Add indexes for better query performance on server lookups and rankings
*/

-- Create player_rankings table
CREATE TABLE IF NOT EXISTS player_rankings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    server_ip VARCHAR(50) NOT NULL,
    server_port INT NOT NULL,
    total_kills INT DEFAULT 0,
    total_deaths INT DEFAULT 0,
    total_score INT DEFAULT 0,
    kd_ratio DECIMAL(10,2) DEFAULT 0.00,
    games_played INT DEFAULT 0,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_player_server (player_name, server_ip, server_port),
    INDEX idx_server (server_ip, server_port),
    INDEX idx_kd_ratio (kd_ratio DESC),
    INDEX idx_total_kills (total_kills DESC),
    INDEX idx_total_score (total_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ranking_snapshots table
CREATE TABLE IF NOT EXISTS ranking_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_ip VARCHAR(50) NOT NULL,
    server_port INT NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    score INT DEFAULT 0,
    ping INT DEFAULT 0,
    team INT DEFAULT 0,
    snapshot_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_snapshot_server (server_ip, server_port, snapshot_time),
    INDEX idx_snapshot_player (player_name, snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
