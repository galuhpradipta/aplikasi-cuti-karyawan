Below is a suggested planning and architectural structure for building a simple “Aplikasi Cuti Karyawan” using JavaScript (with Vite for the frontend) and MySQL as the database. This includes roles (Karyawan, Kepala Divisi, HRD, Direktur) and a multi-step approval flow.

1. Overview

Objective:
Build a leave management system where employees (Karyawan) can submit leave requests which require sequential approvals from: 1. Kepala Divisi 2. HRD 3. Direktur

Key Features:
• User Management: Admin or HRD can create new user accounts with specific roles.
• Role-Based Access: Enforce different permission levels for Karyawan, Kepala Divisi, HRD, and Direktur.
• Leave Request Flow: 1. Karyawan requests leave. 2. Request goes to Kepala Divisi for approval. 3. If approved, request goes to HRD for approval. 4. If approved by HRD, request goes to Direktur for final approval. 5. Once Direktur approves, the leave is officially granted.
• Notifications or status indicators for each step of approval.
• History/Log: View the status and history of each leave request.

Tech Stack:
• Frontend:
• Vite with simple JavaScript (or TypeScript if you prefer).
• Basic UI with HTML/CSS or a lightweight UI framework (e.g., Tailwind, Bootstrap).
• Backend:
• Node.js (using Express or another framework).
• MySQL for the database.
• Deployment:
• The frontend (Vite build) can be served either separately (static hosting) or via the same Node.js server (for smaller apps).

2. Project Structure

Below is one way you could organize your files and folders:

app-cuti-karyawan/
│
├── backend/
│ ├── package.json
│ ├── src/
│ │ ├── config/
│ │ │ └── db.js # MySQL connection setup
│ │ ├── models/
│ │ │ ├── UserModel.js
│ │ │ ├── RoleModel.js
│ │ │ ├── LeaveRequestModel.js
│ │ │ └── ApprovalModel.js
│ │ ├── routes/
│ │ │ ├── userRoutes.js
│ │ │ ├── leaveRoutes.js
│ │ │ └── authRoutes.js
│ │ ├── controllers/
│ │ │ ├── userController.js
│ │ │ ├── leaveController.js
│ │ │ └── authController.js
│ │ ├── middlewares/
│ │ │ └── authMiddleware.js
│ │ └── server.js
│ └── .env
│
├── frontend/
│ ├── index.html
│ ├── package.json
│ ├── vite.config.js
│ └── src/
│ ├── main.js
│ ├── components/
│ │ ├── LoginForm.js
│ │ ├── LeaveRequestForm.js
│ │ └── Dashboard.js
│ ├── pages/
│ │ ├── HomePage.js
│ │ ├── RequestsPage.js
│ │ ├── ApprovalPage.js
│ │ └── UserManagementPage.js
│ └── services/
│ └── api.js # Axios (or fetch) calls to backend
│
└── README.md

3. Database Design

Here is a simple schema to handle user roles, leave requests, and approvals:

3.1. roles Table

CREATE TABLE roles (
id INT AUTO_INCREMENT PRIMARY KEY,
role_name VARCHAR(50) NOT NULL -- e.g. Karyawan, Kepala Divisi, HRD, Direktur
);

3.2. users Table

CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
role_id INT NOT NULL,
FOREIGN KEY (role_id) REFERENCES roles(id)
);

    •	You could also store hashed passwords in password.

3.3. leave_requests Table

CREATE TABLE leave_requests (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
start_date DATE NOT NULL,
end_date DATE NOT NULL,
reason TEXT NOT NULL,
status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELED
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id)
);

    •	status at the high level can be PENDING, APPROVED, REJECTED, etc.
    •	Alternatively, you can track each level’s approval with a separate table or columns.

3.4. approvals Table

This table stores the sequential approval flow.

CREATE TABLE approvals (
id INT AUTO_INCREMENT PRIMARY KEY,
leave_request_id INT NOT NULL,
approver_id INT NOT NULL, -- e.g. the user ID of Kepala Divisi / HRD / Direktur
approval_order INT NOT NULL, -- e.g. 1 (Kepala Divisi), 2 (HRD), 3 (Direktur)
status VARCHAR(20) DEFAULT 'PENDING',
remarks TEXT,
approved_at DATETIME,
FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id),
FOREIGN KEY (approver_id) REFERENCES users(id)
);

    •	This structure makes it flexible to add more approval levels if needed.
    •	For each leave request, three records in approvals could be inserted: one for each role (Kepala Divisi, HRD, Direktur).

4. Application Flow (High-Level)

   1. Login / Authentication
      • Karyawan, Kepala Divisi, HRD, or Direktur logs in.
      • System verifies credentials and sets a session or JWT token.
   2. Karyawan Submits Leave Request
      • Frontend: Karyawan fills out a form (start_date, end_date, reason).
      • Backend: Insert into leave_requests table with status = PENDING.
      • Create corresponding approvals rows for each role in the sequence (Kepala Divisi -> HRD -> Direktur).
   3. Kepala Divisi Approves / Rejects
      • Kepala Divisi sees a list of pending approvals (where approval_order = 1 and status = 'PENDING').
      • If approved, update approvals.status = 'APPROVED' for that record.
      • If rejected, update approvals.status = 'REJECTED'. The leave request can be considered closed or rejected.
   4. HRD Approves / Rejects
      • If Kepala Divisi’s approval was successful, HRD sees the next pending item (order = 2).
      • HRD can approve or reject.
      • The same flow continues.
   5. Direktur Approves / Rejects
      • Lastly, Direktur checks pending approvals (order = 3).
      • If approved, the entire request is considered APPROVED (or final status in leave_requests).
      • Otherwise, it’s REJECTED.
   6. Leave Request Status
      • If any level rejects, the request is rejected.
      • If all levels approve in sequence, the request is fully approved.
   7. User Management
      • HRD or an Admin can create new users with roles (Karyawan, Kepala Divisi, etc.).
      • The system stores user info in the users table.

5. Backend (Node.js + Express) Outline

5.1. Dependencies
• Express for routing
• mysql2 or mysql for MySQL driver
• dotenv for environment variables
• bcrypt (optional) for password hashing
• jsonwebtoken (JWT) or express-session for authentication

cd backend
npm init -y
npm install express mysql2 dotenv bcrypt jsonwebtoken

5.2. db.js (Database Connection)

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASS,
database: process.env.DB_NAME,
});

export default db;

5.3. server.js (Main Entry)

import express from 'express';
import userRoutes from './routes/userRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

5.4. Example Controller: userController.js

import db from '../config/db.js';
import bcrypt from 'bcrypt';

// Create User
export const createUser = async (req, res) => {
try {
const { name, email, password, role_id } = req.body;
const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(`
      INSERT INTO users (name, email, password, role_id)
      VALUES (?, ?, ?, ?)
    `, [name, email, hashedPassword, role_id]);

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });

} catch (error) {
console.error(error);
res.status(500).json({ message: 'Error creating user' });
}
};

5.5. Example Controller: leaveController.js

import db from '../config/db.js';

// Request Leave
export const requestLeave = async (req, res) => {
const { userId, startDate, endDate, reason } = req.body;
try {
const [result] = await db.query(`       INSERT INTO leave_requests (user_id, start_date, end_date, reason)
      VALUES (?, ?, ?, ?)
    `, [userId, startDate, endDate, reason]);

    const leaveRequestId = result.insertId;

    // Insert approvals flow (example with 3 roles: Kepala Divisi=2, HRD=3, Direktur=4)
    const approvalsData = [
      [leaveRequestId, /*approverId*/ 2, 1], // Kepala Divisi
      [leaveRequestId, /*approverId*/ 3, 2], // HRD
      [leaveRequestId, /*approverId*/ 4, 3], // Direktur
    ];

    // For simplicity, put static user IDs for roles or retrieve them dynamically from the DB
    await Promise.all(approvalsData.map(async ([lrId, aId, order]) => {
      await db.query(`
        INSERT INTO approvals (leave_request_id, approver_id, approval_order)
        VALUES (?, ?, ?)
      `, [lrId, aId, order]);
    }));

    res.status(201).json({ message: 'Leave requested', leaveRequestId });

} catch (error) {
console.error(error);
res.status(500).json({ message: 'Error requesting leave' });
}
};

// Approve/Reject
export const approveLeave = async (req, res) => {
const { approvalId, status, remarks } = req.body; // status can be 'APPROVED' or 'REJECTED'
try {
const [result] = await db.query(`       UPDATE approvals 
      SET status = ?, remarks = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, remarks, approvalId]);

    // If REJECTED, the entire request is considered rejected, update leave_requests status
    // If APPROVED, check if all approvals are done -> update leave_requests if fully approved

    res.status(200).json({ message: 'Approval updated' });

} catch (error) {
console.error(error);
res.status(500).json({ message: 'Error updating approval' });
}
};

6. Frontend (Vite + JavaScript) Outline

6.1. Initial Setup

npm create vite@latest frontend -- --template vanilla
cd frontend
npm install

6.2. vite.config.js

export default {
server: {
port: 5173,
},
};

6.3. src/main.js
• Main entry point that renders the initial page or navigates between views.

import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
initRouter();
});

6.4. Example UI Flow
• LoginForm.js
• Provides form to login. On submit, call /api/auth/login and store token (if using JWT) or session ID.
• Dashboard.js
• Displays user role, pending requests for approver, or request history for employees.
• LeaveRequestForm.js
• A simple form to request leave (start date, end date, reason).
• RequestsPage.js
• Lists all requests for the logged-in user.
• If role is an approver, shows approvals needed.

6.5. services/api.js (Example using fetch)

const API_URL = 'http://localhost:3000/api';

export async function login(email, password) {
const res = await fetch(`${API_URL}/auth/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password })
});
return res.json();
}

export async function requestLeave(data) {
const res = await fetch(`${API_URL}/leaves/request`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(data)
});
return res.json();
}

7. Role-Based Access Control

To enforce roles:
• Backend:
• Use a middleware (e.g., authMiddleware.js) to check the JWT or session.
• Decode the token or read the session to get user.role_id.
• Compare with required role or check if the user is authorized to approve.
• Frontend:
• Hide or disable certain UI elements for roles without permission.
• E.g., a Karyawan sees a “Request Leave” page but not an “Approval” page.
• A Kepala Divisi sees “Approval” for only order=1 approvals, etc.

8. Step-by-Step Implementation Plan

   1. Initialize Repository
      • Create a Git repository and push the initial Vite + Node.js setup.
   2. Database Setup
      • Create MySQL database and run initial migrations (the CREATE TABLE queries).
   3. Backend
      • Implement user creation, login, authentication, and authorization.
      • Implement endpoints for handling leave requests:
      • POST /api/leaves/request (Karyawan creates a request)
      • GET /api/leaves (List requests; filter by user or by pending approvals)
      • POST /api/leaves/approve or PUT /api/leaves/:id/approve (Approvers update the status)
   4. Frontend
      • Build basic pages/components:
      • Login -> on success store JWT or session.
      • Dashboard -> if Karyawan, show “Request Leave” button. If Approver, show “Pending Approvals” list.
      • Leave Request Form -> submit new request.
      • Approval List -> show requests that need current user’s approval.
   5. Testing & Validation
      • Seed the DB with sample roles and users.
      • Test the flow end-to-end: Karyawan -> Kepala Divisi -> HRD -> Direktur.
   6. Deployment
      • Possibly deploy the Node.js server to a service like Heroku, Railway, or your own server.
      • Build the Vite frontend (npm run build) and serve statically or place behind a reverse proxy.

9. Possible Enhancements
   • Email Notifications: Send email to the next approver when a request is submitted or approved.
   • Reporting: Generate monthly or yearly reports of leave usage.
   • Calendar Integration: Show a calendar of who is on leave on particular days.
   • Security: Add CSRF protection, stricter validations, logs, etc.

Conclusion

This outline provides a planning structure for developing a simple multi-step leave approval system with JavaScript (Vite) on the frontend and Node.js + MySQL on the backend. The core is: 1. Defining data models (users, roles, leave requests, approvals). 2. Implementing API endpoints for CRUD and approval logic. 3. Creating a simple frontend with distinct pages for requesting leave and approving requests based on user role.

With this plan, you can incrementally build out each part (database tables, API routes, frontend UI) and ensure a clear flow from employee leave request to final approval by the director.
