import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import serverless from "serverless-http";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Local Static Serving ----------
if (process.env.LOCAL === "true") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.join(__dirname, "../")));
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
  });
}

// ---------- MySQL Connection Pool ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "docpocuser",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_NAME || "docpoc",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---------- Auth Middleware ----------
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ---------- API Routes ----------
const apiRouter = express.Router();

// Signup
apiRouter.post("/signup", async (req, res) => {
  const { email, password, firstName, lastName, phone, dob, bloodType } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, dob, blood_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hashed, firstName || null, lastName || null, phone || null, dob || null, bloodType || null]
    );

    res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
apiRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const [rows] = await pool.query("SELECT id, email, password FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Profile (protected)
apiRouter.get("/profile", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, first_name, last_name, phone, dob, blood_type FROM users WHERE id = ?",
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all doctors
apiRouter.get("/doctors", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM doctors");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create appointment (protected)
apiRouter.post("/appointments", verifyToken, async (req, res) => {
  const { doctorId, date, time, type } = req.body;
  if (!doctorId || !date || !time) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Verify doctor exists
    const [docRows] = await pool.query("SELECT id FROM doctors WHERE id = ?", [doctorId]);
    if (docRows.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const [result] = await pool.query(
      "INSERT INTO appointments (user_id, doctor_id, date, time, type) VALUES (?, ?, ?, ?, ?)",
      [req.userId, doctorId, date, time, type || "in-person"]
    );

    res.status(201).json({
      message: "Appointment created",
      appointment: { id: result.insertId, userId: req.userId, doctorId, date, time, type }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's appointments (protected)
apiRouter.get("/appointments", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.date, a.time, a.type, a.status,
              d.id AS doctor_id, d.name AS doctor_name, d.specialty
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.user_id = ?`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mount API routes under /api
app.use("/api", apiRouter);

// ---------- Export for Vercel ----------
export default serverless(app);

// ---------- Local Development ----------
if (process.env.LOCAL === "true") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}