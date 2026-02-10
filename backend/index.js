const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || "tradielink_dev_secret";
const BCRYPT_ROUNDS = 10;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in backend/.env");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const app = express();
app.use(cors());
app.use(express.json());

function normalizeRole(input) {
  const role = String(input || "").trim().toLowerCase();
  if (role === "builder") return "builder";
  if (role === "tradie" || role === "labourer") return "tradie";
  return null;
}

function asNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitCertifications(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function mapUserRow(row) {
  return {
    id: row.id,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    about: row.about,
    companyName: row.company_name,
    address: row.address,
    occupation: row.occupation,
    pricePerHour: row.price_per_hour === null ? null : Number(row.price_per_hour),
    experienceYears: row.experience_years,
    certifications: row.certifications || [],
    photoUrl: row.photo_url,
    email: row.email,
    createdAt: row.created_at,
  };
}

async function initDb() {
  const initSqlPath = path.join(__dirname, "sql.init.sql");
  const initSql = fs.readFileSync(initSqlPath, "utf8");
  await pool.query(initSql);
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Database connection failed." });
  }
});

app.post("/auth/register", async (req, res) => {
  try {
    const role = normalizeRole(req.body.role);
    if (!role) return res.status(400).json({ ok: false, error: "Invalid role." });

    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const about = String(req.body.about || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!firstName || !lastName || !about) {
      return res.status(400).json({ ok: false, error: "Missing required profile fields." });
    }
    if (!email) return res.status(400).json({ ok: false, error: "Email is required." });
    if (!password || password.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    }

    let companyName = null;
    let address = null;
    let occupation = null;
    let pricePerHour = null;
    let experienceYears = null;
    let certifications = [];
    let photoUrl = null;

    if (role === "builder") {
      companyName = String(req.body.companyName || "").trim();
      address = String(req.body.address || "").trim();
      if (!companyName || !address) {
        return res.status(400).json({ ok: false, error: "Builder requires company name and address." });
      }
    } else {
      occupation = String(req.body.occupation || "").trim();
      pricePerHour = asNumberOrNull(req.body.pricePerHour);
      experienceYears = asNumberOrNull(req.body.experienceYears);
      certifications = splitCertifications(req.body.certifications);
      photoUrl = String(req.body.photoUrl || "").trim() || null;

      if (!occupation) return res.status(400).json({ ok: false, error: "Tradie occupation is required." });
      if (pricePerHour === null || pricePerHour <= 0) {
        return res.status(400).json({ ok: false, error: "Tradie pricePerHour must be greater than 0." });
      }
      if (experienceYears === null || experienceYears < 0) {
        return res.status(400).json({ ok: false, error: "Tradie experienceYears must be 0 or more." });
      }
      if (!certifications.length) {
        return res.status(400).json({ ok: false, error: "At least one certification is required." });
      }
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ ok: false, error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insertResult = await pool.query(
      `INSERT INTO users (
        role, first_name, last_name, about,
        company_name, address, occupation, price_per_hour,
        experience_years, certifications, photo_url,
        email, password_hash
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING *`,
      [
        role,
        firstName,
        lastName,
        about,
        companyName,
        address,
        occupation,
        pricePerHour,
        experienceYears,
        certifications,
        photoUrl,
        email,
        passwordHash,
      ]
    );

    const user = mapUserRow(insertResult.rows[0]);
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({ ok: true, token, user });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({ ok: false, error: "Failed to register user." });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required." });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    if (!result.rowCount) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }

    const row = result.rows[0];
    const passwordOk = await bcrypt.compare(password, row.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }

    const user = mapUserRow(row);
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ ok: true, token, user });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ ok: false, error: "Login failed." });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TradieLink API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
