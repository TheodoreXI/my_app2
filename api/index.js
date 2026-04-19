import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import serverless from "serverless-http";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import Doctor from "./models/Doctor.js";
import Appointment from "./models/Appointment.js";

dotenv.config();

/* ================= APP ================= */

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());

/* ================= STATIC FRONTEND ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});

/* ================= DB ================= */

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log("MongoDB connected");
    } catch (err) {
        console.log(err);
    }
};

/* ================= AUTH ================= */

app.post("/signup", async (req, res) => {
    await connectDB();

    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User exists" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({ email, password: hashed });

    res.json({ message: "User created" });
});

app.post("/login", async (req, res) => {
    await connectDB();

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({ token, userId: user._id });
});

/* ================= PROFILE ================= */

app.get("/profile", (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "No token" });

    const token = auth.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json(decoded);
    } catch {
        res.status(403).json({ message: "Invalid token" });
    }
});

/* ================= DOCTORS ================= */

app.get("/doctors", async (req, res) => {
    await connectDB();

    const doctors = await Doctor.find();
    res.json(doctors);
});

/* ================= APPOINTMENTS ================= */

app.post("/appointments", async (req, res) => {
    await connectDB();

    const { userId, doctorId, date, time, type } = req.body;

    const appointment = await Appointment.create({
        userId,
        doctorId,
        date,
        time,
        type
    });

    res.json(appointment);
});

app.get("/appointments/:userId", async (req, res) => {
    await connectDB();

    const appointments = await Appointment.find({
        userId: req.params.userId
    });

    res.json(appointments);
});

/* ================= EXPORT ================= */

const handler = serverless(app);
export default handler;

/* ================= LOCAL SERVER ================= */

if (process.env.LOCAL === "true") {
    app.listen(3000, () => {
        console.log("Server running on http://localhost:3000");
    });
}