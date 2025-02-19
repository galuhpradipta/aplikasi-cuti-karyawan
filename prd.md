# Aplikasi Cuti Karyawan - PRD (Product Requirements Document)

## Notes & Updates

1. Bahasa yang digunakan dalam aplikasi adalah Bahasa Indonesia
2. Role/Peran dalam sistem:
   - Karyawan: Dapat mengajukan cuti
   - Kepala Divisi: Approval level 1
   - HRD: Approval level 2
   - Direktur: Approval level 3 (final)
3. Flow Approval:
   - Karyawan mengajukan cuti
   - Kepala Divisi menyetujui/menolak
   - Jika disetujui, lanjut ke HRD
   - Jika HRD setuju, lanjut ke Direktur
   - Keputusan final ada di Direktur
4. Status Cuti:
   - PENDING: Menunggu persetujuan
   - APPROVED: Disetujui
   - REJECTED: Ditolak
   - CANCELED: Dibatalkan

Below is a suggested planning and architectural structure for building a simple "Aplikasi Cuti Karyawan" using JavaScript (with Vite for the frontend) and MySQL as the database. This includes roles (Karyawan, Kepala Divisi, HRD, Direktur) and a multi-step approval flow.

1. Overview

Tujuan:
Membangun sistem manajemen cuti karyawan dimana karyawan dapat mengajukan permintaan cuti yang memerlukan persetujuan berurutan dari: 1. Kepala Divisi 2. HRD 3. Direktur

Fitur Utama:
• Manajemen Pengguna: Admin atau HRD dapat membuat akun pengguna baru dengan peran tertentu.
• Akses Berbasis Peran: Menerapkan tingkat izin berbeda untuk Karyawan, Kepala Divisi, HRD, dan Direktur.
• Alur Permintaan Cuti:

1. Karyawan mengajukan cuti
2. Permintaan diteruskan ke Kepala Divisi untuk persetujuan
3. Jika disetujui, permintaan diteruskan ke HRD
4. Jika disetujui HRD, permintaan diteruskan ke Direktur
5. Setelah Direktur menyetujui, cuti resmi diberikan
   • Notifikasi atau indikator status untuk setiap tahap persetujuan
   • Riwayat/Log: Melihat status dan riwayat setiap permintaan cuti

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

3.1. roles Table (Tabel Peran)

CREATE TABLE roles (
id INT AUTO_INCREMENT PRIMARY KEY,
role_name VARCHAR(50) NOT NULL -- contoh: Karyawan, Kepala Divisi, HRD, Direktur
);

3.2. users Table (Tabel Pengguna)

CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
role_id INT NOT NULL,
FOREIGN KEY (role_id) REFERENCES roles(id)
);

    •	You could also store hashed passwords in password.

3.3. leave_requests Table (Tabel Permintaan Cuti)

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
    •	Alternatively, you can track each level's approval with a separate table or columns.

3.4. approvals Table (Tabel Persetujuan)

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
      • If Kepala Divisi's approval was successful, HRD sees the next pending item (order = 2).
      • HRD can approve or reject.
      • The same flow continues.
   5. Direktur Approves / Rejects
      • Lastly, Direktur checks pending approvals (order = 3).
      • If approved, the entire request is considered APPROVED (or final status in leave_requests).
      • Otherwise, it's REJECTED.
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
• E.g., a Karyawan sees a "Request Leave" page but not an "Approval" page.
• A Kepala Divisi sees "Approval" for only order=1 approvals, etc.

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
      • Dashboard -> if Karyawan, show "Request Leave" button. If Approver, show "Pending Approvals" list.
      • Leave Request Form -> submit new request.
      • Approval List -> show requests that need current user's approval.
   5. Testing & Validation
      • Seed the DB with sample roles and users.
      • Test the flow end-to-end: Karyawan -> Kepala Divisi -> HRD -> Direktur.
   6. Deployment
      • Possibly deploy the Node.js server to a service like Heroku, Railway, or your own server.
      • Build the Vite frontend (npm run build) and serve statically or place behind a reverse proxy.

9. Possible Enhancements (Pengembangan Lanjutan)
   • Notifikasi Email: Kirim email ke approver berikutnya ketika permintaan diajukan atau disetujui
   • Pelaporan: Menghasilkan laporan bulanan atau tahunan penggunaan cuti
   • Integrasi Kalender: Menampilkan kalender siapa yang sedang cuti pada hari tertentu
   • Keamanan: Menambahkan perlindungan CSRF, validasi yang lebih ketat, log, dll.

Kesimpulan

Dokumen ini memberikan struktur perencanaan untuk mengembangkan sistem persetujuan cuti bertingkat dengan JavaScript (Vite) di frontend dan Node.js + MySQL di backend. Intinya adalah: 1. Mendefinisikan model data (pengguna, peran, permintaan cuti, persetujuan). 2. Mengimplementasikan endpoint API untuk CRUD dan logika persetujuan. 3. Membuat antarmuka frontend sederhana dengan halaman berbeda untuk meminta cuti dan menyetujui permintaan berdasarkan peran pengguna.

Dengan rencana ini, Anda dapat membangun setiap bagian secara bertahap (tabel database, rute API, UI frontend) dan memastikan alur yang jelas dari permintaan cuti karyawan hingga persetujuan akhir oleh direktur.
