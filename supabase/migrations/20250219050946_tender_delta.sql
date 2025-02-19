/*
  # Employee Leave Application Database Schema

  1. Tables
    - `users`
      - Basic user information and authentication
      - Stores role and division information
    
    - `leave_requests`
      - Store leave request details
      - Tracks approval status
    
    - `approval_history`
      - Records each approval/rejection
      - Maintains audit trail

  2. Relationships
    - Each leave request belongs to a user
    - Each approval history entry belongs to a leave request and approver
*/

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('karyawan', 'kepala_divisi', 'hrd', 'direktur') NOT NULL,
  division VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE leave_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved_division', 'approved_hrd', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE approval_history (
  id VARCHAR(36) PRIMARY KEY,
  leave_request_id VARCHAR(36) NOT NULL,
  approver_id VARCHAR(36) NOT NULL,
  status ENUM('approved', 'rejected') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);